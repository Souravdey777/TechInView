"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useSupabase } from "@/hooks/useSupabase";
import { useInterviewStore } from "@/stores/interview-store";
import { ScoreRadar } from "@/components/results/ScoreRadar";
import { FeedbackCard } from "@/components/results/FeedbackCard";
import { TranscriptReview } from "@/components/results/TranscriptReview";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BODY,
  ButtonLink,
  CELL,
  CONTAINER,
  Eyebrow,
  GRID,
  LABEL,
  LEAD,
  PAD,
} from "@/components/marketing/ds";
import {
  HIRE_RECOMMENDATION_CONFIG,
  ROUND_SCORING_DIMENSIONS,
  type HireRecommendation,
  type RoundScoreDimension,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { INTERVIEWER } from "@/lib/interviewer";
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
  },
  {
    key: "execution",
    title: "Debugging Flow",
    description: "Concrete hypotheses, inspection steps, failure modes, and recovery paths.",
  },
  {
    key: "judgment",
    title: "Production Judgment",
    description: "Sensible tradeoffs around reliability, scale, rollout risk, and observability.",
  },
  {
    key: "communication",
    title: "Answer Quality",
    description: "Structured responses that stayed direct while still showing enough technical detail.",
  },
] as const;

const TECHNICAL_QA_EVALUATED_SIGNALS = [
  "Mechanism-level language and framework explanations",
  "Debugging approach for ambiguous production failures",
  "Performance, reliability, and operational tradeoffs",
  "Concrete examples instead of definition recall",
];

/** Page title, sized like the dashboard header. */
const PAGE_TITLE =
  "text-balance text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em]";

/** Recommendation chip uses the semantic verdict colors, never the cyan accent. */
function getVerdictClass(recommendation: HireRecommendation) {
  if (recommendation === "strong_hire" || recommendation === "hire") {
    return "border-brand-green/40 text-brand-green";
  }
  if (recommendation === "lean_hire") return "border-brand-amber/40 text-brand-amber";
  return "border-brand-rose/40 text-brand-rose";
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-normal tracking-[-0.03em] text-brand-text">{title}</h2>
      {description ? <p className={cn(BODY, "mt-2 max-w-[640px]")}>{description}</p> : null}
    </div>
  );
}

/** Thin hairline score bar pinned to the bottom of its cell; `fill` is the semantic color. */
function ScoreBar({ score, fill }: { score: number; fill: string }) {
  return (
    <div className="mt-auto pt-6">
      <div className="h-0.5 bg-white/[0.08]">
        <div
          className={cn("h-full", fill)}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

/** Transcript counts as a 2x2 hairline grid. */
function CoverageGrid({ stats }: { stats: { label: string; value: string | number }[] }) {
  return (
    <div className={cn(GRID, "grid-cols-2")}>
      {stats.map((stat) => (
        <div key={stat.label} className={cn(CELL, "p-4")}>
          <p className={LABEL}>{stat.label}</p>
          <p className="mt-2 text-2xl font-normal tracking-[-0.02em] tabular-nums text-brand-text">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Mono label header over a hairline-divided list (strengths, priorities). */
function NoteList({
  title,
  toneClass,
  items,
}: {
  title: string;
  toneClass: string;
  items: string[];
}) {
  return (
    <div>
      <p className={cn(LABEL, "mb-3", toneClass)}>{title}</p>
      <ul className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
        {items.map((item) => (
          <li key={item} className={cn(BODY, "py-4")}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Aside block: hairline rule on top, mono label, then content. */
function AsideBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/[0.08] pt-5">
      <p className={cn(LABEL, "mb-3")}>{label}</p>
      {children}
    </div>
  );
}

function getScoreTone(score: number) {
  if (score >= 85) {
    return {
      label: "Strong",
      text: "text-brand-green",
      bar: "bg-brand-green",
    };
  }
  if (score >= 70) {
    return {
      label: "Solid",
      text: "text-brand-cyan",
      bar: "bg-brand-cyan",
    };
  }
  if (score >= 55) {
    return {
      label: "Developing",
      text: "text-brand-amber",
      bar: "bg-brand-amber",
    };
  }
  return {
    label: "Needs Work",
    text: "text-brand-rose",
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
      <SectionTitle
        title="Technical Q&A Signals"
        description="Stack depth, debugging flow, production judgment, and answer quality in one scan."
      />
      <ul className={cn(GRID, "sm:grid-cols-2")}>
        {signalCards.map((signal) => {
          const tone = getScoreTone(signal.score);

          return (
            <li key={signal.key} className={cn(CELL, "flex flex-col p-6")}>
              <div className={cn(LABEL, "flex justify-between gap-4")}>
                <span className={tone.text}>{tone.label}</span>
                <span className="tabular-nums text-brand-text">{signal.score}/100</span>
              </div>
              <h3 className="mt-5 text-[17px] tracking-[-0.01em] text-brand-text">{signal.title}</h3>
              <p className={cn(BODY, "mt-2")}>{signal.description}</p>
              <ScoreBar score={signal.score} fill={tone.bar} />
            </li>
          );
        })}
      </ul>
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
    <section className="grid gap-12 md:grid-cols-2">
      {strengths && strengths.length > 0 ? (
        <NoteList title="Technical Strengths" toneClass="text-brand-green" items={strengths} />
      ) : null}

      {areasToImprove && areasToImprove.length > 0 ? (
        <NoteList title="Next Practice Priorities" toneClass="text-brand-amber" items={areasToImprove} />
      ) : null}
    </section>
  );
}

function NoResultState() {
  return (
    <main className={cn("min-h-screen bg-brand-deep text-brand-text", PAD)}>
      <div className={cn(CONTAINER, "py-20 sm:py-28")}>
        <Eyebrow>Technical Q&amp;A report</Eyebrow>
        <h1 className={PAGE_TITLE}>No Technical Q&A report found</h1>
        <p className={cn(LEAD, "mt-5 max-w-[560px]")}>
          We couldn&apos;t find a Technical Q&amp;A result for this session. The store may have been cleared or the interview might not have been completed yet.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/interviews/technical-qa/setup">Start a new Technical Q&amp;A round</ButtonLink>
          <ButtonLink href="/dashboard" variant="ghost">
            Back to dashboard
          </ButtonLink>
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
          .select("id, round_type, language, overall_score, scores, feedback_summary, hire_recommendation, round_title, round_context_snapshot, company_snapshot, role_title_snapshot, messages(*)")
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
      <main className={cn("min-h-screen bg-brand-deep text-brand-text", PAD)}>
        <div className={cn(CONTAINER, "py-10 sm:py-14")}>
          <p className={LABEL}>Loading Technical Q&amp;A report...</p>
          <Skeleton className="mt-14 h-12 w-full max-w-[560px]" />
          <Skeleton className="mt-5 h-5 w-full max-w-[720px]" />
          <div className="mt-14 grid gap-10 border-t border-white/[0.08] pt-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-20">
            <Skeleton className="h-32 w-48" />
            <div className="space-y-3 lg:pt-10">
              <Skeleton className="h-4 w-full max-w-[640px]" />
              <Skeleton className="h-4 w-4/5 max-w-[520px]" />
            </div>
          </div>
          <div className={cn(GRID, "mt-16 sm:grid-cols-2")}>
            {[0, 1, 2, 3].map((cell) => (
              <div key={cell} className={cn(CELL, "h-44 p-6")}>
                <Skeleton className="h-full w-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!result || result.roundType !== "technical_qa") {
    return <NoResultState />;
  }

  const interviewer = INTERVIEWER;
  const round = result.roundContext;
  const languageLabel = getTechnicalQaLanguageLabel(result.language);
  const hasScores = Boolean(result.overallScore !== null && result.scores);
  const recommendation = result.hireRecommendation as HireRecommendation | null;

  return (
    <main className={cn("min-h-screen bg-brand-deep text-brand-text", PAD)}>
      <div className={cn(CONTAINER, "py-10 sm:py-14")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ButtonLink href="/dashboard" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </ButtonLink>
          <ButtonLink href="/interviews/technical-qa/setup" size="sm">
            Start another round
          </ButtonLink>
        </div>

        <header className="mt-14">
          <Eyebrow>Technical Q&amp;A Report</Eyebrow>
          <h1 className={cn(PAGE_TITLE, "max-w-[22ch]")}>
            {round?.title ?? "Technical Q&A"}
          </h1>
          <p className={cn(LEAD, "mt-5 max-w-[720px]")}>
            {round?.summary ??
              "A voice-first technical depth interview focused on whether your answers showed real stack fluency, debugging judgment, production tradeoffs, and clear follow-up handling."}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
              <Badge variant="secondary">{interviewer.name}</Badge>
              {result.company ? <Badge variant="secondary">{result.company}</Badge> : null}
              {result.roleTitle ? <Badge variant="secondary">{result.roleTitle}</Badge> : null}
              <Badge variant="secondary">{languageLabel}</Badge>
              <Badge variant="secondary">No coding</Badge>
              <Badge variant="secondary">Voice Q&amp;A</Badge>
          </div>
          {round?.focusAreas?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {round.focusAreas.map((focus) => (
                <Badge key={focus} variant="secondary">
                  {focus}
                </Badge>
              ))}
            </div>
          ) : null}
        </header>

        {hasScores && result.overallScore !== null && recommendation && result.summary ? (
          <section className="mt-14 grid gap-10 border-t border-white/[0.08] pt-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-20">
            <div>
              <p className={LABEL}>Overall score</p>
              <p className="mt-5 flex items-baseline gap-3">
                <span className="text-[clamp(96px,13vw,168px)] font-normal leading-[0.8] tracking-[-0.06em] tabular-nums text-brand-text">
                  {result.overallScore}
                </span>
                <span className="font-mono text-sm text-brand-subtle">/100</span>
              </p>
              <Badge variant="secondary" className={cn("mt-8", getVerdictClass(recommendation))}>
                {HIRE_RECOMMENDATION_CONFIG[recommendation]?.label ?? recommendation}
              </Badge>
            </div>
            <div className="lg:pt-10">
              <p className={LABEL}>Summary</p>
              <p className={cn(LEAD, "mt-3 max-w-[640px]")}>{result.summary}</p>
            </div>
          </section>
        ) : (
          <section className="mt-14 border-t border-white/[0.08] pt-10">
            <p className={BODY}>
              Scoring was not available for this Technical Q&amp;A session, but the transcript is still available below.
            </p>
          </section>
        )}

        <div className="mt-16 grid gap-16 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-20">
          <div className="min-w-0 space-y-16">
            <TechnicalQaSignalSnapshot scores={result.scores} />

            {radarData.length > 0 ? <ScoreRadar scores={radarData} /> : null}

            {feedbackCards.length > 0 ? (
              <section>
                <SectionTitle title="Technical Rubric Breakdown" />
                <ul className={cn(GRID, "grid-cols-1 md:grid-cols-2")}>
                  {feedbackCards.map((card) => (
                    <li key={card.dimension} className={CELL}>
                      <FeedbackCard
                        dimension={card.dimension}
                        score={card.score}
                        weight={card.weight}
                        feedback={card.feedback}
                      />
                    </li>
                  ))}
                </ul>
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

          <aside className="space-y-10">
            <AsideBlock label="Round Setup">
              <p className="text-sm leading-relaxed text-brand-muted">
                {round?.rationale ??
                  "This round is designed to test whether you can explain the stack you claim as expertise with practical, production-aware judgment."}
              </p>
            </AsideBlock>

            <AsideBlock label="Q&A Coverage">
              <CoverageGrid
                stats={[
                  { label: "Duration", value: transcriptStats.durationLabel },
                  { label: "Turns", value: transcriptStats.totalTurns },
                  { label: "Answers", value: transcriptStats.candidateTurns },
                  { label: "Questions", value: transcriptStats.interviewerQuestions },
                ]}
              />
            </AsideBlock>

            <AsideBlock label="What Was Evaluated">
              <ul className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {TECHNICAL_QA_EVALUATED_SIGNALS.map((signal) => (
                  <li key={signal} className="py-3 text-sm leading-relaxed text-brand-muted">
                    {signal}
                  </li>
                ))}
              </ul>
            </AsideBlock>

            {round?.prompt ? (
              <AsideBlock label="Interview Brief">
                <p className="text-sm leading-relaxed text-brand-muted">{round.prompt}</p>
              </AsideBlock>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
