import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBankProblems, pageProblems, parseProblemListParams } from "@/lib/problem-list";

/**
 * One page of the problem list plus facet counts. Public, so the /practice
 * index can page through it; signed-in callers also get their own progress.
 * Rows carry list metadata only, never statements, tests or solutions.
 */
export async function GET(req: NextRequest) {
  try {
    const { facets, sort, offset, limit } = parseProblemListParams(req.nextUrl.searchParams);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Progress is per-user; anonymous callers can't filter on it.
    const bank = await getBankProblems(user?.id);
    return NextResponse.json(
      pageProblems(bank, user ? facets : { ...facets, progress: "all" }, sort, offset, limit)
    );
  } catch (error) {
    console.error("[GET /api/problems/list]", error);
    return NextResponse.json({ error: "Could not load problems" }, { status: 500 });
  }
}
