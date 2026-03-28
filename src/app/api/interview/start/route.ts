import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { captureServerEvent } from "@/lib/posthog/server";

const FREE_TRIAL_MAX_DURATION = 1200; // 20 minutes

type StartInterviewBody = {
  difficulty?: string;
  category?: string;
  language: string;
  maxDurationSeconds?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StartInterviewBody;
    const { language } = body;

    if (!language) {
      return NextResponse.json(
        { success: false, error: "language is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const {
      getProfile,
      getRandomProblem,
      createInterview,
      decrementCredits,
      updateProfile,
    } = await import("@/lib/db/queries");

    let isFreeInterview = false;
    let maxDuration = body.maxDurationSeconds ?? 2700;
    let difficulty = body.difficulty as "easy" | "medium" | "hard" | undefined;
    const category = body.category;

    if (user) {
      const profile = await getProfile(user.id);

      if (!profile || profile.interview_credits <= 0) {
        return NextResponse.json(
          { success: false, error: "No interview credits remaining. Purchase credits to continue." },
          { status: 403 }
        );
      }

      isFreeInterview = !profile.has_used_free_trial;

      if (isFreeInterview) {
        difficulty = "easy";
        maxDuration = FREE_TRIAL_MAX_DURATION;
      }
    }

    const problem = await getRandomProblem(difficulty, category);

    if (!problem) {
      return NextResponse.json(
        { success: false, error: "No matching problem found for the given filters" },
        { status: 404 }
      );
    }

    let interviewId: string;
    if (user) {
      const interview = await createInterview(
        user.id,
        problem.id,
        language,
        maxDuration,
        isFreeInterview
      );
      interviewId = interview.id;

      await decrementCredits(user.id);

      if (isFreeInterview) {
        await updateProfile(user.id, { has_used_free_trial: true });
      }
    } else {
      interviewId = `demo-${Date.now()}`;
    }

    if (user) {
      captureServerEvent(user.id, "interview_started", {
        difficulty: problem.difficulty,
        category: problem.category,
        language,
        is_free_trial: isFreeInterview,
        problem_title: problem.title,
        interview_id: interviewId,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        interviewId,
        isFreeInterview,
        problem: {
          id: problem.id,
          title: problem.title,
          slug: problem.slug,
          difficulty: problem.difficulty,
          category: problem.category,
          description: problem.description,
          examples: problem.examples,
          constraints: problem.constraints,
          starter_code: problem.starter_code,
          hints: problem.hints,
          test_cases: problem.test_cases,
          solution_approach: problem.solution_approach,
          optimal_complexity: problem.optimal_complexity,
          follow_up_questions: problem.follow_up_questions,
        },
        language,
        maxDuration,
        startedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to start interview";
    console.error("Start interview error:", error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
