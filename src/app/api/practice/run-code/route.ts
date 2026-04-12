import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { captureServerEvent } from "@/lib/posthog/server";
import {
  executeProblemCode,
  type ExecutableTestCase,
} from "@/lib/code-execution";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { code, language, problemSlug } = body;

    if (!code || !language || !problemSlug) {
      return NextResponse.json(
        { success: false, error: "code, language, and problemSlug are required" },
        { status: 400 }
      );
    }

    const { getProblemBySlug } = await import("@/lib/db/queries");
    const problem = await getProblemBySlug(problemSlug);

    if (!problem) {
      return NextResponse.json(
        { success: false, error: "Problem not found" },
        { status: 404 }
      );
    }

    if (!problem.is_free_solver_enabled) {
      return NextResponse.json(
        { success: false, error: "This problem is not available in Practice Mode" },
        { status: 403 }
      );
    }

    const result = await executeProblemCode({
      language,
      code,
      testCases: (problem.test_cases ?? []) as ExecutableTestCase[],
    });

    const passed = result.test_results.filter((test) => test.passed).length;
    captureServerEvent(user.id, "practice_code_run", {
      problem_slug: problemSlug,
      language,
      tests_passed: passed,
      tests_total: result.test_results.length,
      is_solved: result.test_results.length > 0 && passed === result.test_results.length,
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

