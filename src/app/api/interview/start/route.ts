import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const maxDuration = body.maxDurationSeconds ?? 2700;

    if (!language) {
      return NextResponse.json(
        { success: false, error: "language is required" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Lazy import DB queries
    const { getRandomProblem, createInterview } = await import("@/lib/db/queries");

    const difficulty = body.difficulty as "easy" | "medium" | "hard" | undefined;
    const category = body.category;

    const problem = await getRandomProblem(difficulty, category);

    if (!problem) {
      return NextResponse.json(
        { success: false, error: "No matching problem found for the given filters" },
        { status: 404 }
      );
    }

    // Create interview record in DB if user is authenticated
    let interviewId: string;
    if (user) {
      const interview = await createInterview(user.id, problem.id, language, maxDuration);
      interviewId = interview.id;
    } else {
      // Fallback for unauthenticated (demo mode)
      interviewId = `demo-${Date.now()}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        interviewId,
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
    console.error("Start interview error:", msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
