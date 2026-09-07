import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import {
  buildDashboardSummary,
  type DashboardRound,
} from "@/lib/dashboard/home-metrics";
import {
  buildPracticeLogRow,
  buildRoundLogRow,
  type SessionLogRow,
} from "@/lib/dashboard/session-log";
import { mapInterviewToKind } from "@/lib/dashboard/models";
import {
  isMissingColumn,
  normalizeRoundStatus as normalizeStatus,
  roundTitle,
} from "@/lib/dashboard/trend-points";
import { getRecentPracticeAttempts } from "@/lib/db/queries";
import type { HireRecommendation } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** Rounds kept for metrics; the log itself shows the most recent slice. */
const METRICS_WINDOW = 200;
const LOG_ROUNDS = 12;
const LOG_ATTEMPTS = 6;

type DashboardInterview = {
  id: string;
  status: string;
  language: string | null;
  interviewer_persona: string | null;
  mode: string | null;
  round_type: string | null;
  round_title: string | null;
  overall_score: number | null;
  scores: unknown;
  duration_seconds: number | null;
  started_at: string;
  completed_at: string | null;
  hire_recommendation: string | null;
  problems:
    | { title: string; difficulty: string; category: string }
    | { title: string; difficulty: string; category: string }[]
    | null;
};

async function getDashboardInterviews(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<DashboardInterview[]> {
  const sharedSelect =
    "id, status, language, overall_score, scores, duration_seconds, started_at, completed_at, hire_recommendation, problems(title, difficulty, category)";
  const fullSelect = `${sharedSelect}, interviewer_persona, mode, round_type, round_title`;

  const withRoundFields = await supabase
    .from("interviews")
    .select(fullSelect)
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(METRICS_WINDOW);

  if (!withRoundFields.error) {
    return (withRoundFields.data ?? []) as unknown as DashboardInterview[];
  }

  const shouldFallback =
    isMissingColumn(withRoundFields.error, "interviewer_persona") ||
    isMissingColumn(withRoundFields.error, "mode") ||
    isMissingColumn(withRoundFields.error, "round_type") ||
    isMissingColumn(withRoundFields.error, "round_title");

  if (!shouldFallback) {
    throw withRoundFields.error;
  }

  const legacy = await supabase
    .from("interviews")
    .select(sharedSelect)
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(METRICS_WINDOW);

  if (legacy.error) {
    throw legacy.error;
  }

  return ((legacy.data ?? []) as unknown as DashboardInterview[]).map((interview) => ({
    ...interview,
    interviewer_persona: null,
    mode: null,
    round_type: null,
    round_title: null,
  }));
}

/** `scores` is stored as { dimension: { dimension, score, feedback } }. */
function toDimensionScores(scores: unknown): Record<string, number> | null {
  if (!scores || typeof scores !== "object") return null;

  const entries = Object.entries(scores as Record<string, unknown>)
    .map(([key, value]) => {
      if (typeof value === "number") return [key, value] as const;
      if (value && typeof value === "object" && typeof (value as { score?: unknown }).score === "number") {
        return [key, (value as { score: number }).score] as const;
      }
      return null;
    })
    .filter((entry): entry is readonly [string, number] => entry !== null);

  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

/** Distinct problems the user has actually solved, in practice or in a round. */
async function getSolvedCoverage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
) {
  const [solvedAttempts, passedRounds, problemCount] = await Promise.all([
    supabase
      .from("practice_attempts")
      .select("problem_id")
      .eq("user_id", userId)
      .eq("is_solved", true),
    supabase
      .from("interviews")
      .select("problem_id")
      .eq("user_id", userId)
      .eq("code_passed_tests", true),
    supabase.from("problems").select("id", { count: "exact", head: true }),
  ]);

  const solved = new Set<string>();
  for (const row of solvedAttempts.data ?? []) {
    if (row.problem_id) solved.add(row.problem_id as string);
  }
  for (const row of passedRounds.data ?? []) {
    if (row.problem_id) solved.add(row.problem_id as string);
  }

  return { solved: solved.size, total: problemCount.count ?? 0 };
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, interviews, practiceAttempts, coverage, completedCount] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, interview_credits, has_used_free_trial")
        .eq("id", user.id)
        .single(),
      getDashboardInterviews(supabase, user.id),
      getRecentPracticeAttempts(user.id),
      getSolvedCoverage(supabase, user.id),
      supabase
        .from("interviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed"),
    ]);

  const credits = profile?.interview_credits ?? 0;
  const isFreeTrialUser = !(profile?.has_used_free_trial ?? false);
  // Onboarding fills display_name, but OAuth metadata covers profiles created
  // before that step ran.
  const displayName =
    profile?.display_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    null;

  const attempts = practiceAttempts.map((attempt) => ({
    id: attempt.id,
    title: attempt.problem.title,
    slug: attempt.problem.slug,
    category: attempt.problem.category,
    language: attempt.language,
    isSolved: attempt.is_solved,
    testsPassed: attempt.tests_passed,
    testsTotal: attempt.tests_total,
    updatedAt:
      attempt.updated_at instanceof Date
        ? attempt.updated_at.toISOString()
        : String(attempt.updated_at),
  }));

  // Takes count up from the user's first completed round, newest row first, and
  // the trend and the session log have to agree on the numbering.
  let nextTake =
    completedCount.count ??
    interviews.filter((interview) => normalizeStatus(interview.status) === "completed")
      .length;
  const takes = interviews.map((interview) => {
    if (normalizeStatus(interview.status) !== "completed") return null;
    const take = nextTake;
    nextTake -= 1;
    return take;
  });

  const rounds: DashboardRound[] = interviews.map((interview, index) => ({
    id: interview.id,
    kind: mapInterviewToKind(interview.mode, interview.round_type),
    mode: interview.mode,
    status: normalizeStatus(interview.status),
    title: roundTitle(interview),
    score: interview.overall_score,
    verdict: (interview.hire_recommendation as HireRecommendation | null) ?? null,
    dimensionScores: toDimensionScores(interview.scores),
    take: takes[index],
    timestamp: interview.completed_at ?? interview.started_at,
  }));

  const summary = buildDashboardSummary({
    rounds,
    displayName,
    completedCount: completedCount.count ?? undefined,
    activityDates: [
      ...rounds.filter((round) => round.status === "completed").map((round) => round.timestamp),
      ...attempts.map((attempt) => attempt.updatedAt),
    ],
    problemsSolved: coverage.solved,
    problemsTotal: coverage.total,
  });

  const roundRows: SessionLogRow[] = interviews.map((interview, index) =>
    buildRoundLogRow(
      {
        id: rounds[index].id,
        kind: rounds[index].kind,
        status: rounds[index].status,
        title: rounds[index].title,
        language: interview.language,
        interviewerPersona: interview.interviewer_persona,
        durationSeconds: interview.duration_seconds,
        score: rounds[index].score,
        verdict: rounds[index].verdict,
        timestamp: rounds[index].timestamp,
      },
      takes[index],
    ),
  );

  const sessionRows = [
    ...roundRows.slice(0, LOG_ROUNDS),
    ...attempts.slice(0, LOG_ATTEMPTS).map(buildPracticeLogRow),
  ].sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
  );

  return (
    <DashboardHome
      credits={credits}
      hasCredits={credits > 0}
      isFreeTrialUser={isFreeTrialUser}
      summary={summary}
      sessionRows={sessionRows}
      practiceAttempts={attempts.slice(0, 3)}
    />
  );
}
