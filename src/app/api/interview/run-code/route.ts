import { NextRequest, NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/posthog/server";
import {
  enforceApiRateLimit,
  getAuthenticatedApiUser,
  unauthorizedResponse,
} from "@/lib/api-security";
import {
  executeProblemCode,
  type ExecutableTestCase,
} from "@/lib/code-execution";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedApiUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const rateLimited = await enforceApiRateLimit({
      userId: user.id,
      action: "interview_code_execution",
      limit: 10,
      windowSeconds: 60,
    });
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { code, language, interviewId } = body;

    if (
      typeof code !== "string" ||
      code.length === 0 ||
      code.length > 100_000 ||
      !SUPPORTED_LANGUAGES.includes(language as (typeof SUPPORTED_LANGUAGES)[number]) ||
      typeof interviewId !== "string" ||
      !interviewId
    ) {
      return NextResponse.json(
        { success: false, error: "code, language, and interviewId are required" },
        { status: 400 }
      );
    }

    const { getInterview, getProblemById } = await import("@/lib/db/queries");
    const interview = await getInterview(interviewId);
    if (!interview || interview.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      );
    }
    if (interview.status !== "in_progress") {
      return NextResponse.json(
        { success: false, error: "Interview is no longer active" },
        { status: 409 }
      );
    }

    const problem = interview.problem_id
      ? await getProblemById(interview.problem_id)
      : undefined;
    const testCases = (problem?.test_cases ?? []) as ExecutableTestCase[];

    const result = await executeProblemCode({
      language,
      code,
      testCases,
      problemSlug: problem?.slug,
    });

    const passed = result.test_results.filter((test) => test.passed).length;
    captureServerEvent(user.id, "code_executed", {
      language,
      tests_passed: passed,
      tests_total: result.test_results.length,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to execute code";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
