"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  Bug,
  CheckCircle2,
  FileQuestion,
  Gauge,
  ListChecks,
  Loader2,
  MessageSquareText,
  Sparkles,
  Target,
  Wrench,
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
import { getTechnicalQaLanguageLabel } from "@/lib/technical-qa";
import type { RoundContextSnapshot } from "@/lib/loops/types";

type TechnicalQaResultsProps = {
  interviewId: string;
};

type StoreLikeResult = NonNullable<
  ReturnType<typeof useInterviewStore.getState>["interviewResult"]
>;
type TechnicalQaScores = StoreLikeResult["scores"];
type TechnicalQaTranscript = StoreLikeResult["transcript"];

const TECHNICAL_QA_SCORE_DIMENSIONS = {
  problem_solving: {
    ...ROUND_SCORING_DIMENSIONS.problem_solving,
    label: "Answer Framing",
    description: "How well the candidate scoped the prompt, stated assumptions, and chose a useful path before going deep.",
  },
  communication: {
    ...ROUND_SCORING_DIMENSIONS.communication,
    label: "Explanation Clarity",
    description: "How structured, concise, and easy to follow the answers were under follow-up pressure.",
  },
  technical_depth: {
    ...ROUND_SCORING_DIMENSIONS.technical_depth,
    label: "Stack Depth",
    description: "Mechanism-level understanding of the selected language, frameworks, runtime behavior, and internals.",
  },
  execution: {
    ...ROUND_SCORING_DIMENSIONS.execution,
    label: "Debugging Flow",
    description: "How concretely the candidate moved from symptoms to hypotheses, instrumentation, and next actions.",
  },
  judgment: {
    ...ROUND_SCORING_DIMENSIONS.judgment,
    label: "Production Judgment",
    description: "Decision quality around reliability, performance, rollout risk, observability, and tradeoffs.",
  },
} satisfies Record<
  RoundScoreDimension,
  { label: string; weight: number; description: string }
>;

const TECHNICAL_QA_SCORE_ORDER = [
  "technical_depth",
  "judgment",
  "execution",
  "communication",
  "problem_solving",
] as const satisfies readonly RoundScoreDimension[];

const TECHNICAL_QA_SIGNAL_CARDS = [
  {
    key: "technical_depth",
    title: "Stack Depth",
    description: "Precise mechanisms, runtime behavior, framework internals, and non-trivia depth.",
    icon: BrainCircuit,
  },
  {
    key: "execution",
    title: "Debugging Flow",
    description: "Concrete hypotheses, inspection steps, failure modes, and recovery paths.",
    icon: Bug,
  },
  {
    key: "judgment",
    title: "Production Judgment",
    description: "Sensible tradeoffs around reliability, scale, rollout risk, and observability.",
    icon: Gauge,
  },
  {
    key: "communication",
    title: "Answer Quality",
    description: "Structured responses that stayed direct while still showing enough technical detail.",
    icon: MessageSquareText,
  },
] as const;

const TECHNICAL_QA_EVALUATED_SIGNALS = [
  "Mechanism-level language and framework explanations",
  "Debugging approach for ambiguous production failures",
  "Performance, reliability, and operational tradeoffs",
  "Concrete examples instead of definition recall",
];

function getScoreTone(score: number) {
  if (score >= 85) {
    return {
      label: "Strong",
      text: "text-brand-green",
      bg: "bg-brand-green/10",
      border: "border-brand-green/25",
      bar: "bg-brand-green",
    };
  }
  if (score >= 70) {
    return {
      label: "Solid",
      text: "text-brand-cyan",
      bg: "bg-brand-cyan/10",
      border: "border-brand-cyan/25",
      bar: "bg-brand-cyan",
    };
  }
  if (score >= 55) {
    return {
      label: "Developing",
      text: "text-brand-amber",
      bg: "bg-brand-amber/10",
      border: "border-brand-amber/25",
      bar: "bg-brand-amber",
    };
  }
  return {
    label: "Needs Work",
    text: "text-brand-rose",
    bg: "bg-brand-rose/10",
    border: "border-brand-rose/25",
    bar: "bg-brand-rose",
  };
}

function getTranscriptStats(transcript: TechnicalQaTranscript) {
  const lastMessage = transcript[transcript.length - 1];
  const durationMinutes = lastMessage
    ? Math.max(1, Math.ceil(lastMessage.timestamp_ms / 60000))
    : 0;
  const candidateTurns = transcript.filter((message) => message.role === "candidate").length;
  const interviewerQuestions = transcript.filter(
    (message) => message.role === "interviewer" && message.content.includes("?")
  ).length;

  return {
    durationLabel: durationMinutes > 0 ? `${durationMinutes} min` : "0 min",
    candidateTurns,
    interviewerQuestions,
    totalTurns: transcript.filter((message) => message.role !== "system").length,
  };
}

function TechnicalQaSignalSnapshot({ scores }: { scores: TechnicalQaScores }) {
  if (!scores) return null;

  const signalCards = TECHNICAL_QA_SIGNAL_CARDS.map((signal) => ({
    ...signal,
    score: scores[signal.key]?.score,
  })).filter((signal): signal is (typeof TECHNICAL_QA_SIGNAL_CARDS)[number] & { score: number } => (
    typeof signal.score === "number"
  ));

  if (signalCards.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Technical Q&amp;A Signals</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Stack depth, debugging flow, production judgment, and answer quality in one scan.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {signalCards.map((signal) => {
          const Icon = signal.icon;
          const tone = getScoreTone(signal.score);

          return (
            <div
              key={signal.key}
              className="rounded-3xl border border-brand-border bg-brand-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone.border} ${tone.bg}`}>
                    <Icon className={`h-5 w-5 ${tone.text}`} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-brand-text">{signal.title}</h3>
                    <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.14em] ${tone.text}`}>
                      {tone.label}
                    </p>
                  </div>
                </div>
                <span className={`text-2xl font-bold tabular-nums ${tone.text}`}>
                  {signal.score}
                  <span className="text-xs font-normal text-brand-muted">/100</span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-brand-muted">
                {signal.description}
              </p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-brand-surface">
                <div
                  className={`h-full rounded-full ${tone.bar}`}
                  style={{ width: `${Math.min(100, Math.max(0, signal.score))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TechnicalQaCoachingNotes({
  strengths,
  areasToImprove,
}: {
  strengths: string[] | null;
  areasToImprove: string[] | null;
}) {
  if ((!strengths || strengths.length === 0) && (!areasToImprove || areasToImprove.length === 0)) {
    return null;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {strengths && strengths.length > 0 ? (
        <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-green">
            <CheckCircle2 className="h-4 w-4" />
            Technical Strengths
          </div>
          <ul className="mt-4 space-y-3">
            {strengths.map((strength) => (
              <li key={strength} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm leading-relaxed text-brand-muted">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-green" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {areasToImprove && areasToImprove.length > 0 ? (
        <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-amber">
            <Target className="h-4 w-4" />
            Next Practice Priorities
          </div>
          <ul className="mt-4 space-y-3">
            {areasToImprove.map((area) => (
              <li key={area} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm leading-relaxed text-brand-muted">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-amber" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function NoResultState() {
  return (
    <main className="min-h-screen bg-brand-deep px-4 py-12 text-brand-text">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-3xl border border-brand-border bg-brand-card px-8 py-16 text-center">
        <FileQuestion className="h-12 w-12 text-brand-cyan" />
        <h1 className="mt-5 text-2xl font-semibold">No Technical Q&A report found</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-muted">
          We couldn&apos;t find a Technical Q&amp;A result for this session. The store may have been cleared or the interview might not have been completed yet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/interviews/technical-qa/setup"
            className="inline-flex items-center rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-cyan/90"
          >
            Start a new Technical Q&amp;A round
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
  const rawScores = (interview.scores as Record<string, { score: number; feedback: string }> | null) ?? null;
  const roundContext = (interview.round_context_snapshot as RoundContextSnapshot | null) ?? null;
  const transcript =
    ((interview.messages as { role: string; content: string; timestamp_ms: number }[] | undefined) ?? []).map((message) => ({
      role: message.role as "interviewer" | "candidate" | "system",
      content: message.content,
      timestamp_ms: message.timestamp_ms,
    }));

  return {
    mode: "targeted_loop",
    roundType: "technical_qa",
    roundTitle: (interview.round_title as string | null) ?? roundContext?.title ?? "Technical Q&A",
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
    problemTitle: roundContext?.title ?? "Technical Q&A",
    problemDifficulty: "medium",
    problemCategory: "technical-qa",
    company: (interview.company_snapshot as string | null) ?? null,
    roleTitle: (interview.role_title_snapshot as string | null) ?? null,
    loopName: null,
    loopSummary: null,
    roundContext,
  };
}

export function TechnicalQaResults({ interviewId }: TechnicalQaResultsProps) {
  const storeResult = useInterviewStore((state) => state.interviewResult);
  const storeMatches = storeResult?.interviewId === interviewId && storeResult?.roundType === "technical_qa";
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
          .select("id, round_type, interviewer_persona, language, overall_score, scores, feedback_summary, hire_recommendation, round_title, round_context_snapshot, company_snapshot, role_title_snapshot, messages(*)")
          .eq("id", interviewId)
          .single();

        if (data && data.round_type === "technical_qa" && data.round_context_snapshot) {
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

    return TECHNICAL_QA_SCORE_ORDER
      .filter((key) => result.scores?.[key])
      .map((key) => ({
        dimension: TECHNICAL_QA_SCORE_DIMENSIONS[key].label,
        score: result.scores?.[key]?.score ?? 0,
        maxScore: 100,
      }));
  }, [result]);

  const feedbackCards = useMemo(() => {
    if (!result?.scores) return [];

    return TECHNICAL_QA_SCORE_ORDER
      .filter((key) => result.scores?.[key])
      .map((key) => ({
        dimension: TECHNICAL_QA_SCORE_DIMENSIONS[key].label,
        score: result.scores?.[key]?.score ?? 0,
        weight: TECHNICAL_QA_SCORE_DIMENSIONS[key].weight,
        feedback: result.scores?.[key]?.feedback ?? "",
      }));
  }, [result]);

  const transcriptStats = useMemo(
    () => getTranscriptStats(result?.transcript ?? []),
    [result?.transcript]
  );

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-deep text-brand-text">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
          <p className="text-sm text-brand-muted">Loading Technical Q&amp;A report...</p>
        </div>
      </main>
    );
  }

  if (!result || result.roundType !== "technical_qa") {
    return <NoResultState />;
  }

  const interviewer = getInterviewerPersona(result.interviewerPersona);
  const round = result.roundContext;
  const languageLabel = getTechnicalQaLanguageLabel(result.language);
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
            href="/interviews/technical-qa/setup"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text transition-colors hover:border-brand-cyan/30"
          >
            Start another round
          </Link>
        </div>

        <section className="rounded-3xl border border-brand-border bg-brand-card p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
            Technical Q&amp;A Report
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {round?.title ?? "Technical Q&A"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-brand-muted">
                {round?.summary ??
                  "A voice-first technical depth interview focused on whether your answers showed real stack fluency, debugging judgment, production tradeoffs, and clear follow-up handling."}
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
                {languageLabel}
              </span>
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
                No coding
              </span>
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
                Voice Q&amp;A
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
              Scoring was not available for this Technical Q&amp;A session, but the transcript is still available below.
            </p>
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <TechnicalQaSignalSnapshot scores={result.scores} />

            {radarData.length > 0 ? <ScoreRadar scores={radarData} /> : null}

            {feedbackCards.length > 0 ? (
              <section>
                <h2 className="mb-4 text-lg font-semibold">Technical Rubric Breakdown</h2>
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

            <TechnicalQaCoachingNotes
              strengths={result.keyStrengths}
              areasToImprove={result.areasToImprove}
            />

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
                  "This round is designed to test whether you can explain the stack you claim as expertise with practical, production-aware judgment."}
              </p>
            </div>

            <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                <ListChecks className="h-3.5 w-3.5" />
                Q&amp;A Coverage
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-brand-muted">Duration</p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">{transcriptStats.durationLabel}</p>
                </div>
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-brand-muted">Turns</p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">{transcriptStats.totalTurns}</p>
                </div>
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-brand-muted">Answers</p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">{transcriptStats.candidateTurns}</p>
                </div>
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-brand-muted">Questions</p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">{transcriptStats.interviewerQuestions}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                <Wrench className="h-3.5 w-3.5" />
                What Was Evaluated
              </div>
              <div className="mt-4 space-y-3 text-sm text-brand-muted">
                {TECHNICAL_QA_EVALUATED_SIGNALS.map((signal) => (
                  <p key={signal}>{signal}</p>
                ))}
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
