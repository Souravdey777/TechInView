import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { captureServerEvent } from "@/lib/posthog/server";
import {
  executeProblemCode,
  type ExecutableTestCase,
} from "@/lib/code-execution";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, language, problemSlug, testCases: bodyTestCases } = body;

    if (!code || !language) {
      return NextResponse.json(
        { success: false, error: "code and language are required" },
        { status: 400 }
      );
    }

    let testCases: ExecutableTestCase[] = [];

    if (problemSlug) {
      const { getProblemBySlug } = await import("@/lib/db/queries");
      const problem = await getProblemBySlug(problemSlug);
      if (problem?.test_cases) {
        testCases = problem.test_cases as ExecutableTestCase[];
      }
    } else if (bodyTestCases && Array.isArray(bodyTestCases)) {
      testCases = bodyTestCases as ExecutableTestCase[];
    }

    const result = await executeProblemCode({
      language,
      code,
      testCases,
      problemSlug,
    });

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const passed = result.test_results.filter((test) => test.passed).length;
        captureServerEvent(user.id, "code_executed", {
          language,
          tests_passed: passed,
          tests_total: result.test_results.length,
        });
      }
    } catch {
      // analytics should never block the response
    }

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
