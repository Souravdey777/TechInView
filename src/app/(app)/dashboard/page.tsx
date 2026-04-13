import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { getDefaultInterviewerPersona, getInterviewerPersona } from "@/lib/interviewer-personas";
import {
  DASHBOARD_FILTER_LABELS,
  mapInterviewToKind,
  type DashboardPracticeItem,
} from "@/lib/dashboard/models";
import { getRecentPracticeAttempts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

function isMissingColumn(error: { code?: string; message?: string } | null, column: string) {
  if (!error) return false;
  return error.code === "42703" || error.message?.toLowerCase().includes(column.toLowerCase());
}

async function getDashboardInterviews(
  supabase: ReturnType<typeof createClient>,
  userId: string,
) {
  const fullSelect =
    "id, status, language, interviewer_persona, mode, round_type, round_title, overall_score, duration_seconds, started_at, completed_at, problem_id, hire_recommendation, problems(title, difficulty, category)";

  const withRoundFields = await supabase
    .from("interviews")
    .select(fullSelect)
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(20);

  if (!withRoundFields.error) {
    return withRoundFields.data ?? [];
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
    .select("id, status, language, overall_score, duration_seconds, started_at, completed_at, problem_id, hire_recommendation, problems(title, difficulty, category)")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(20);

  if (legacy.error) {
    throw legacy.error;
  }

  return (legacy.data ?? []).map((interview) => ({
    ...interview,
    interviewer_persona: null,
    mode: null,
    round_type: null,
    round_title: null,
  }));
}

function toDashboardPracticeItems(
  interviews: Awaited<ReturnType<typeof getDashboardInterviews>>
): DashboardPracticeItem[] {
  return interviews.map((interview) => {
    const problem = interview.problems as unknown as {
      title: string;
      difficulty: string;
      category: string;
    } | null;
    const kind = mapInterviewToKind(interview.mode, interview.round_type);
    const title = interview.round_title ?? problem?.title ?? "Interview";
    const subtitle =
      kind === "dsa"
        ? [problem?.category ?? "coding", interview.language ?? null].filter(Boolean).join(" · ")
        : [DASHBOARD_FILTER_LABELS[kind], problem?.category ?? null].filter(Boolean).join(" · ");

    return {
      id: interview.id,
      kind,
      title,
      subtitle,
      score: interview.overall_score as number | null,
      status: interview.status as "completed" | "abandoned" | "in_progress",
      startedAt: (interview.completed_at ?? interview.started_at) as string,
      durationSeconds: interview.duration_seconds as number | null,
    };
  });
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, interviewResult, practiceAttempts] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, interview_credits, has_used_free_trial, target_company")
      .eq("id", user.id)
      .single(),
    getDashboardInterviews(supabase, user.id),
    getRecentPracticeAttempts(user.id),
  ]);

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "there";
  const credits = profile?.interview_credits ?? 0;
  const hasCredits = credits > 0;
  const isFreeTrialUser = !(profile?.has_used_free_trial ?? false);
  const defaultInterviewer = getInterviewerPersona(
    getDefaultInterviewerPersona(profile?.target_company ?? null, isFreeTrialUser)
  );

  return (
    <DashboardHome
      displayName={displayName}
      credits={credits}
      hasCredits={hasCredits}
      isFreeTrialUser={isFreeTrialUser}
      defaultInterviewerName={defaultInterviewer.name}
      initialInterviews={toDashboardPracticeItems(interviewResult)}
      practiceAttempts={practiceAttempts.map((attempt) => ({
        id: attempt.id,
        title: attempt.problem.title,
        slug: attempt.problem.slug,
        difficulty: attempt.problem.difficulty,
        category: attempt.problem.category,
        language: attempt.language,
        isSolved: attempt.is_solved,
        testsPassed: attempt.tests_passed,
        testsTotal: attempt.tests_total,
        updatedAt:
          attempt.updated_at instanceof Date
            ? attempt.updated_at.toISOString()
            : String(attempt.updated_at),
      }))}
    />
  );
}
