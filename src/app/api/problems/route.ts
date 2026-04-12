import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DIFFICULTY_LEVELS,
  PROBLEM_CATEGORIES,
  type DifficultyLevel,
  type ProblemCategory,
} from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const difficulty = searchParams.get("difficulty") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const freeOnly = searchParams.get("freeOnly") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    // Validate difficulty if provided
    if (difficulty && !DIFFICULTY_LEVELS.includes(difficulty as DifficultyLevel)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid difficulty. Must be one of: ${DIFFICULTY_LEVELS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category && !PROBLEM_CATEGORIES.includes(category as ProblemCategory)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid category. Must be one of: ${PROBLEM_CATEGORIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const { getProblems } = await import("@/lib/db/queries");

    const rows = await getProblems({
      difficulty: difficulty as DifficultyLevel | undefined,
      category,
      search,
      freeOnly,
    });

    // Strip fields that could reveal solutions or hidden test cases
    const safeProblems = rows.slice((page - 1) * limit, (page - 1) * limit + limit).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      category: p.category,
      company_tags: p.company_tags,
      description: p.description,
      examples: p.examples,
      constraints: p.constraints,
      starter_code: p.starter_code,
      optimal_complexity: p.optimal_complexity,
      follow_up_questions: p.follow_up_questions,
      hints: p.hints,
      is_free_solver_enabled: p.is_free_solver_enabled,
      // solution_approach and test_cases intentionally excluded
    }));

    return NextResponse.json({
      success: true,
      data: {
        problems: safeProblems,
        total: rows.length,
        page,
        limit,
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch problems" },
      { status: 500 }
    );
  }
}
