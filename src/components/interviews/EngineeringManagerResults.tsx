"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  FileQuestion,
  Loader2,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { useSupabase } from "@/hooks/useSupabase";
import { useInterviewStore } from "@/stores/interview-store";
import { ScoreSummary } from "@/components/results/ScoreSummary";
import { ScoreRadar } from "@/components/results/ScoreRadar";
import { FeedbackCard } from "@/components/results/FeedbackCard";
import { TranscriptReview } from "@/components/results/TranscriptReview";
import {
  ROUND_SCORING_DIMENSIONS,
  type HireRecommendation,
  type RoundScoreDimension,
} from "@/lib/constants";
import {
  getInterviewerPersona,
  resolveInterviewerPersona,
} from "@/lib/interviewer-personas";
import type { RoundContextSnapshot } from "@/lib/loops/types";

type EngineeringManagerResultsProps = {
  interviewId: string;
};

type StoreLikeResult = NonNullable<
  ReturnType<typeof useInterviewStore.getState>["interviewResult"]
>;

function NoResultState() {
  return (
    <main className="min-h-screen bg-brand-deep px-4 py-12 text-brand-text">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-3xl border border-brand-border bg-brand-card px-8 py-16 text-center">
        <FileQuestion className="h-12 w-12 text-brand-cyan" />
        <h1 className="mt-5 text-2xl font-semibold">No Engineering Manager report found</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-muted">
          We couldn&apos;t find an Engineering Manager result for this session. The store may have
          been cleared or the interview might not have been completed yet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/interviews/engineering-manager/setup"
            className="inline-flex items-center rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-cyan/90"
          >
            Start a new Engineering Manager round
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text transition-colors hover:border-brand-cyan/30"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

function buildDbResult(interview: Record<string, unknown>): StoreLikeResult {
  const rawScores =
    (interview.scores as Record<string, { score: number; feedback: string }> | null) ?? null;
  const roundContext = (interview.round_context_snapshot as RoundContextSnapshot | null) ?? null;
  const transcript =
    ((interview.messages as { role: string; content: string; timestamp_ms: number }[] | undefined) ??
      []).map((message) => ({
      role: message.role as "interviewer" | "candidate" | "system",
      content: message.content,
      timestamp_ms: message.timestamp_ms,
    }));

  return {
    mode: "targeted_loop",
    roundType: "hiring_manager",
    roundTitle:
      (interview.round_title as string | null) ??
      roundContext?.title ??
      "Engineering Manager Round",
    interviewId: interview.id as string,
    interviewerPersona: resolveInterviewerPersona(
      (interview.interviewer_persona as string | null | undefined) ?? null
    ),
    finalCode: "",
    language: (interview.language as string | null) ?? "javascript",
    transcript,
    overallScore: (interview.overall_score as number | null) ?? null,
    scores: rawScores,
    hireRecommendation: (interview.hire_recommendation as string | null) ?? null,
    summary: (interview.feedback_summary as string | null) ?? null,
    keyStrengths: null,
    areasToImprove: null,
    testsPassed: 0,
    testsTotal: 0,
    problemTitle: roundContext?.title ?? "Engineering Manager Round",
    problemDifficulty: "medium",
    problemCategory: "engineering-manager",
    company: (interview.company_snapshot as string | null) ?? null,
    roleTitle: (interview.role_title_snapshot as string | null) ?? null,
    loopName: null,
    loopSummary: null,
    roundContext,
  };
}

export function EngineeringManagerResults({
  interviewId,
}: EngineeringManagerResultsProps) {
  const storeResult = useInterviewStore((state) => state.interviewResult);
  const storeMatches =
    storeResult?.interviewId === interviewId && storeResult?.roundType === "hiring_manager";
  const { supabase } = useSupabase();

  const [dbResult, setDbResult] = useState<StoreLikeResult | null>(null);
  const [isLoading, setIsLoading] = useState(!storeMatches);

  useEffect(() => {
    if (storeMatches) return;

    setIsLoading(true);
    void (async () => {
      try {
        const { data } = await supabase
          .from("interviews")
          .select(
            "id, round_type, interviewer_persona, language, overall_score, scores, feedback_summary, hire_recommendation, round_title, round_context_snapshot, company_snapshot, role_title_snapshot, messages(*)"
          )
          .eq("id", interviewId)
          .single();

        if (data && data.round_type === "hiring_manager" && data.round_context_snapshot) {
          setDbResult(buildDbResult(data as Record<string, unknown>));
        }
      } catch {
        // no-op
      } finally {
        setIsLoading(false);
      }
    })();
  }, [interviewId, storeMatches, supabase]);

  const result = storeMatches ? storeResult : dbResult;

  const radarData = useMemo(() => {
    if (!result?.scores) return [];

    return (Object.keys(ROUND_SCORING_DIMENSIONS) as RoundScoreDimension[])
      .filter((key) => result.scores?.[key])
      .map((key) => ({
        dimension: ROUND_SCORING_DIMENSIONS[key].label,
        score: result.scores?.[key]?.score ?? 0,
        maxScore: 100,
      }));
  }, [result]);

  const feedbackCards = useMemo(() => {
    if (!result?.scores) return [];

    return (Object.keys(ROUND_SCORING_DIMENSIONS) as RoundScoreDimension[])
      .filter((key) => result.scores?.[key])
      .map((key) => ({
        dimension: ROUND_SCORING_DIMENSIONS[key].label,
        score: result.scores?.[key]?.score ?? 0,
        weight: ROUND_SCORING_DIMENSIONS[key].weight,
        feedback: result.scores?.[key]?.feedback ?? "",
      }));
  }, [result]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-deep text-brand-text">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
          <p className="text-sm text-brand-muted">
            Loading Engineering Manager report...
          </p>
        </div>
      </main>
    );
  }

  if (!result || result.roundType !== "hiring_manager") {
    return <NoResultState />;
  }

  const interviewer = getInterviewerPersona(result.interviewerPersona);
  const round = result.roundContext;
  const hasScores = Boolean(result.overallScore !== null && result.scores);

  return (
    <main className="min-h-screen bg-brand-deep px-4 py-8 text-brand-text">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-brand-muted transition-colors hover:text-brand-text"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <Link
            href="/interviews/engineering-manager/setup"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text transition-colors hover:border-brand-cyan/30"
          >
            Start another round
          </Link>
        </div>

        <section className="rounded-3xl border border-brand-border bg-brand-card p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
            Engineering Manager Report
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {round?.title ?? "Engineering Manager Round"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-brand-muted">
                {round?.summary ??
                  "A voice-first leadership round focused on how clearly you explained impact, priorities, stakeholder alignment, and decision-making under pressure."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
                {interviewer.name}
              </span>
              {result.company ? (
                <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
                  {result.company}
                </span>
              ) : null}
              {result.roleTitle ? (
                <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
                  {result.roleTitle}
                </span>
              ) : null}
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
                Voice chat
              </span>
            </div>
          </div>
          {round?.focusAreas?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {round.focusAreas.map((focus) => (
                <span
                  key={focus}
                  className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted"
                >
                  {focus}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {hasScores && result.overallScore !== null && result.hireRecommendation && result.summary ? (
          <ScoreSummary
            overallScore={result.overallScore}
            hireRecommendation={result.hireRecommendation as HireRecommendation}
            summary={result.summary}
          />
        ) : (
          <section className="rounded-3xl border border-brand-border bg-brand-card p-7">
            <p className="text-sm text-brand-muted">
              Scoring was not available for this Engineering Manager session, but the transcript is
              still available below.
            </p>
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            {radarData.length > 0 ? <ScoreRadar scores={radarData} /> : null}

            {feedbackCards.length > 0 ? (
              <section>
                <h2 className="mb-4 text-lg font-semibold">Dimension Breakdown</h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {feedbackCards.map((card) => (
                    <FeedbackCard
                      key={card.dimension}
                      dimension={card.dimension}
                      score={card.score}
                      weight={card.weight}
                      feedback={card.feedback}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <TranscriptReview
              messages={result.transcript}
              interviewerName={interviewer.name}
            />
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                <Sparkles className="h-3.5 w-3.5" />
                Round Setup
              </div>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                {round?.rationale ??
                  "This round is designed to test whether you can explain why you fit the role, how you prioritize, and how you lead through ambiguity with clear judgment."}
              </p>
            </div>

            <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                What Was Evaluated
              </div>
              <div className="mt-4 space-y-3 text-sm text-brand-muted">
                <p>Role fit, motivation, and leadership signal</p>
                <p>Prioritization quality and tradeoff clarity</p>
                <p>Stakeholder management and influence</p>
                <p>How concretely you backed answers with real examples</p>
              </div>
            </div>

            {round?.prompt ? (
              <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Interview Brief
                </div>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">{round.prompt}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
