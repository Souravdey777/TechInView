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

    // TODO: Replace with real DB query once problems are seeded:
    // const offset = (page - 1) * limit;
    // let query = db
    //   .select()
    //   .from(problems)
    //   .limit(limit)
    //   .offset(offset)
    //   .orderBy(asc(problems.difficulty), asc(problems.title));
    //
    // if (difficulty) query = query.where(eq(problems.difficulty, difficulty));
    // if (category)   query = query.where(eq(problems.category, category));
    // if (search)     query = query.where(ilike(problems.title, `%${search}%`));
    //
    // const [rows, [{ count }]] = await Promise.all([
    //   query,
    //   db.select({ count: sql<number>`count(*)` }).from(problems),
    // ]);

    void difficulty;
    void category;
    void search;
    void page;
    void limit;

    return NextResponse.json({
      success: true,
      data: {
        problems: [],
        total: 0,
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
