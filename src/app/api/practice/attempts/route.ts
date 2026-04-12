import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { captureServerEvent } from "@/lib/posthog/server";
import type { SupportedLanguage } from "@/lib/constants";

type UpsertPracticeAttemptBody = {
  problemSlug?: string;
  language?: SupportedLanguage;
  code?: string;
  testsPassed?: number | null;
  testsTotal?: number | null;
  isSolved?: boolean;
};

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

    const body = (await req.json()) as UpsertPracticeAttemptBody;

    if (!body.problemSlug || !body.language) {
      return NextResponse.json(
        { success: false, error: "problemSlug and language are required" },
        { status: 400 }
      );
    }

    const {
      getProblemBySlug,
      getPracticeAttempt,
      upsertPracticeAttempt,
    } = await import("@/lib/db/queries");

    const problem = await getProblemBySlug(body.problemSlug);
    if (!problem || !problem.is_free_solver_enabled) {
      return NextResponse.json(
        { success: false, error: "Problem not available in Practice Mode" },
        { status: 403 }
      );
    }

    const previousAttempt = await getPracticeAttempt(user.id, problem.id);
    const attempt = await upsertPracticeAttempt({
      userId: user.id,
      problemId: problem.id,
      language: body.language,
      lastCode: body.code ?? previousAttempt?.last_code ?? null,
      testsPassed: body.testsPassed ?? previousAttempt?.tests_passed ?? null,
      testsTotal: body.testsTotal ?? previousAttempt?.tests_total ?? null,
      isSolved: body.isSolved ?? previousAttempt?.is_solved ?? false,
      lastRunAt:
        typeof body.testsTotal === "number" ? new Date() : previousAttempt?.last_run_at ?? null,
    });

    if (!previousAttempt) {
      captureServerEvent(user.id, "practice_started", {
        problem_slug: problem.slug,
        language: body.language,
      });
    } else if (typeof body.testsTotal === "number") {
      captureServerEvent(user.id, "practice_resumed", {
        problem_slug: problem.slug,
        language: body.language,
      });
    }

    return NextResponse.json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save practice attempt",
      },
      { status: 500 }
    );
  }
}
