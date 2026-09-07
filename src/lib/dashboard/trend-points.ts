import { HIRE_RECOMMENDATION_CONFIG } from "@/lib/constants";
import type { HireRecommendation } from "@/lib/constants";
import {
  DASHBOARD_FILTER_LABELS,
  getPracticeResultsHref,
  mapInterviewToKind,
} from "@/lib/dashboard/models";
import type { TrendPoint } from "@/lib/dashboard/home-metrics";
// Type-only, so the server client's runtime never reaches a client bundle.
import type { createClient } from "@/lib/supabase/server";

/**
 * The score trend is rendered by `ScoreTrendPanel` on both the dashboard and
 * the progress page. These helpers were page-local to the dashboard; they live
 * here so the two surfaces cannot drift on round titles, take numbering, or
 * which results route a point links to.
 */

export type TrendRoundStatus = "completed" | "abandoned" | "in_progress";

/** Supabase returns a to-one embed as an object, but older clients send an array. */
export function problemOf<T>(problems: T | T[] | null): T | null {
  if (!problems) return null;
  return Array.isArray(problems) ? problems[0] ?? null : problems;
}

/** Round title falls back to the problem, then to a generic label. */
export function roundTitle(interview: {
  round_title?: string | null;
  problems?: { title: string }[] | { title: string } | null;
}) {
  return interview.round_title ?? problemOf(interview.problems)?.title ?? "Interview";
}

export function normalizeRoundStatus(status: string): TrendRoundStatus {
  return status === "completed" || status === "abandoned" ? status : "in_progress";
}

/**
 * A missing column means the deployed schema predates the round fields, which
 * is a fallback case rather than a failure.
 */
export function isMissingColumn(
  error: { code?: string; message?: string } | null,
  column: string
) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    (error.message?.toLowerCase().includes(column.toLowerCase()) ?? false)
  );
}

export type TrendInterviewRow = {
  id: string;
  status: string;
  overall_score: number | null;
  hire_recommendation: string | null;
  started_at: string;
  completed_at: string | null;
  mode: string | null;
  round_type: string | null;
  round_title: string | null;
  problems: { title: string }[] | { title: string } | null;
};

/**
 * Scored rounds oldest-first, ready for `ScoreTrendPanel`.
 *
 * `rows` are expected newest-first (the order both pages query in). Take
 * numbers count up from the user's first scored round so the trend agrees with
 * the session log; without `completedCount` they fall back to the position
 * within the window, which is right whenever the window covers every round.
 */
export function buildTrendPoints(
  rows: readonly TrendInterviewRow[],
  completedCount?: number
): TrendPoint[] {
  const scored = rows.filter(
    (row) =>
      normalizeRoundStatus(row.status) === "completed" && row.overall_score !== null
  );

  let nextTake = completedCount ?? scored.length;
  const takes = scored.map(() => nextTake--);

  return scored
    .map((row, index) => {
      const kind = mapInterviewToKind(row.mode, row.round_type);
      const verdict = row.hire_recommendation as HireRecommendation | null;

      return {
        take: takes[index],
        score: row.overall_score as number,
        title: roundTitle(row),
        typeLabel: DASHBOARD_FILTER_LABELS[kind],
        verdictLabel: verdict ? HIRE_RECOMMENDATION_CONFIG[verdict].label : null,
        href: getPracticeResultsHref(kind, row.id),
        timestamp: row.completed_at ?? row.started_at,
      };
    })
    .reverse();
}

const TREND_SELECT =
  "id, status, overall_score, hire_recommendation, started_at, completed_at, problems(title)";
const TREND_SELECT_WITH_ROUNDS = `${TREND_SELECT}, mode, round_type, round_title`;

/**
 * Newest-first scored rounds for the trend, degrading to the pre-round-fields
 * schema the same way the dashboard's own fetch does.
 */
export async function fetchTrendInterviews(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  limit: number
): Promise<TrendInterviewRow[]> {
  const query = (columns: string) =>
    supabase
      .from("interviews")
      .select(columns)
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);

  const withRoundFields = await query(TREND_SELECT_WITH_ROUNDS);

  if (!withRoundFields.error) {
    return (withRoundFields.data ?? []) as unknown as TrendInterviewRow[];
  }

  const shouldFallback = ["mode", "round_type", "round_title"].some((column) =>
    isMissingColumn(withRoundFields.error, column)
  );

  if (!shouldFallback) {
    throw withRoundFields.error;
  }

  const legacy = await query(TREND_SELECT);

  if (legacy.error) {
    throw legacy.error;
  }

  return ((legacy.data ?? []) as unknown as Omit<
    TrendInterviewRow,
    "mode" | "round_type" | "round_title"
  >[]).map((row) => ({
    ...row,
    mode: null,
    round_type: null,
    round_title: null,
  }));
}
