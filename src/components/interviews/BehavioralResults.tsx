"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useSupabase } from "@/hooks/useSupabase";
import { useInterviewStore } from "@/stores/interview-store";
import { ScoreRadar } from "@/components/results/ScoreRadar";
import { FeedbackCard } from "@/components/results/FeedbackCard";
import { TranscriptReview } from "@/components/results/TranscriptReview";
import { CompetencyReportPanel } from "@/components/results/CompetencyReportPanel";
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
import type { RoundContextSnapshot } from "@/lib/loops/types";
import type { CompetencyReport } from "@/types";

type BehavioralResultsProps = {
  interviewId: string;
};

type StoreLikeResult = NonNullable<
  ReturnType<typeof useInterviewStore.getState>["interviewResult"]
>;
type BehavioralScores = StoreLikeResult["scores"];
type BehavioralTranscript = StoreLikeResult["transcript"];

const BEHAVIORAL_SCORE_DIMENSIONS = {
  problem_solving: {
    ...ROUND_SCORING_DIMENSIONS.problem_solving,
    label: "Story Selection",
    description:
      "Whether the examples you reached for actually tested the competency being asked about, at a scope worth grading.",
  },
  communication: {
    ...ROUND_SCORING_DIMENSIONS.communication,
    label: "Story Clarity",
    description:
      "How cleanly each answer moved through situation, task, action, and result without wandering or needing to be restarted.",
  },
  technical_depth: {
    ...ROUND_SCORING_DIMENSIONS.technical_depth,
    label: "Depth of Detail",
    description:
      "How far your stories held up under follow-up: the real constraint, the option you rejected, who pushed back and why.",
  },
  execution: {
    ...ROUND_SCORING_DIMENSIONS.execution,
    label: "Evidence & Specifics",
    description:
      "Whether your own contribution and a measured outcome were concrete, or stayed at the level of team effort and assertion.",
  },
  judgment: {
    ...ROUND_SCORING_DIMENSIONS.judgment,
    label: "Reflection & Judgment",
    description:
      "The quality of your decisions in hindsight: what you would change, what you learned, and how honestly you own the misses.",
  },
} satisfies Record<
  RoundScoreDimension,
  { label: string; weight: number; description: string }
>;

const BEHAVIORAL_SCORE_ORDER = [
  "execution",
  "technical_depth",
  "judgment",
  "communication",
  "problem_solving",
] as const satisfies readonly RoundScoreDimension[];

const BEHAVIORAL_SIGNAL_CARDS = [
  {
    key: "execution",
    title: "Evidence & Specifics",
    description: "Your own action, the numbers, and how the result was measured.",
  },
  {
    key: "technical_depth",
    title: "Depth of Detail",
    description: "How well the story survived probing on the genuinely hard part.",
  },
  {
    key: "judgment",
    title: "Reflection & Judgment",
    description: "Decision quality, honest hindsight, and what you would change.",
  },
  {
    key: "communication",
    title: "Story Clarity",
    description: "STAR structure held under pressure, without rambling or resets.",
  },
] as const;

const BEHAVIORAL_EVALUATED_SIGNALS = [
  "A specific past situation for every question, not a hypothetical",
  "Your personal contribution separated from the team's",
  "The tradeoff, the constraint, and who disagreed with you",
  "A measurable result and how you knew it moved",
  "What you would do differently with hindsight",
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

function getTranscriptStats(transcript: BehavioralTranscript) {
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

function BehavioralSignalSnapshot({ scores }: { scores: BehavioralScores }) {
  if (!scores) return null;

  const signalCards = BEHAVIORAL_SIGNAL_CARDS.map((signal) => ({
    ...signal,
    score: scores[signal.key]?.score,
  })).filter((signal): signal is (typeof BEHAVIORAL_SIGNAL_CARDS)[number] & { score: number } => (
    typeof signal.score === "number"
  ));

  if (signalCards.length === 0) return null;

  return (
    <section>
      <SectionTitle
        title="Answer Quality"
        description="How your stories scored as evidence, independent of the individual competencies."
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

function BehavioralCoachingNotes({
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
        <NoteList title="What Landed" toneClass="text-brand-green" items={strengths} />
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
        <Eyebrow>Behavioral report</Eyebrow>
        <h1 className={PAGE_TITLE}>No behavioral report found</h1>
        <p className={cn(LEAD, "mt-5 max-w-[560px]")}>
          We couldn&apos;t find a behavioral result for this session. The store may have been cleared or the interview might not have been completed yet.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/interviews/behavioral/setup">Start a new behavioral round</ButtonLink>
          <ButtonLink href="/dashboard" variant="ghost">
            Back to dashboard
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

/**
 * The competency report is stored as jsonb, so treat every field as untrusted
 * and drop the report entirely when there are no competency rows to show.
 */
function parseCompetencyReport(value: unknown): CompetencyReport | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<CompetencyReport>;

  if (!Array.isArray(candidate.competencies) || candidate.competencies.length === 0) {
    return null;
  }

  return {
    framework_id: typeof candidate.framework_id === "string" ? candidate.framework_id : "generic",
    framework_label:
      typeof candidate.framework_label === "string"
        ? candidate.framework_label
        : "Behavioural competencies",
    competencies: candidate.competencies,
    star_coverage: candidate.star_coverage ?? null,
    debrief_note: typeof candidate.debrief_note === "string" ? candidate.debrief_note : "",
    follow_up_drills: Array.isArray(candidate.follow_up_drills)
      ? candidate.follow_up_drills
      : [],
    key_strengths: Array.isArray(candidate.key_strengths) ? candidate.key_strengths : [],
    areas_to_improve: Array.isArray(candidate.areas_to_improve)
      ? candidate.areas_to_improve
      : [],
  };
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
    roundType: "behavioral",
    roundTitle: (interview.round_title as string | null) ?? roundContext?.title ?? "Behavioral Round",
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
    competencyReport: parseCompetencyReport(interview.competency_report),
    testsPassed: 0,
    testsTotal: 0,
    problemTitle: roundContext?.title ?? "Behavioral Round",
    problemDifficulty: "medium",
    problemCategory: "behavioral",
    company: (interview.company_snapshot as string | null) ?? null,
    roleTitle: (interview.role_title_snapshot as string | null) ?? null,
    loopName: null,
    loopSummary: null,
    roundContext,
  };
}

export function BehavioralResults({ interviewId }: BehavioralResultsProps) {
  const storeResult = useInterviewStore((state) => state.interviewResult);
  const storeMatches =
    storeResult?.interviewId === interviewId && storeResult?.roundType === "behavioral";
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
          .select("id, round_type, language, overall_score, scores, competency_report, feedback_summary, hire_recommendation, round_title, round_context_snapshot, company_snapshot, role_title_snapshot, messages(*)")
          .eq("id", interviewId)
          .single();

        if (data && data.round_type === "behavioral" && data.round_context_snapshot) {
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

    return BEHAVIORAL_SCORE_ORDER
      .filter((key) => result.scores?.[key])
      .map((key) => ({
        dimension: BEHAVIORAL_SCORE_DIMENSIONS[key].label,
        score: result.scores?.[key]?.score ?? 0,
        maxScore: 100,
      }));
  }, [result]);

  const feedbackCards = useMemo(() => {
    if (!result?.scores) return [];

    return BEHAVIORAL_SCORE_ORDER
      .filter((key) => result.scores?.[key])
      .map((key) => ({
        dimension: BEHAVIORAL_SCORE_DIMENSIONS[key].label,
        score: result.scores?.[key]?.score ?? 0,
        weight: BEHAVIORAL_SCORE_DIMENSIONS[key].weight,
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
          <p className={LABEL}>Loading behavioral report...</p>
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

  if (!result || result.roundType !== "behavioral") {
    return <NoResultState />;
  }

  const interviewer = INTERVIEWER;
  const round = result.roundContext;
  // Store path carries the report the room just scored; the DB path normalizes
  // it out of jsonb in buildDbResult. Older results have neither.
  const competencyReport = result.competencyReport ?? null;
  const valueLensLabel =
    round?.valuesContext?.frameworkLabel ?? competencyReport?.framework_label ?? null;
  const hasScores = Boolean(result.overallScore !== null && result.scores);
  // Store copy wins while it is warm; the report's own lists survive a reload.
  const strengths =
    result.keyStrengths && result.keyStrengths.length > 0
      ? result.keyStrengths
      : competencyReport?.key_strengths ?? null;
  const areasToImprove =
    result.areasToImprove && result.areasToImprove.length > 0
      ? result.areasToImprove
      : competencyReport?.areas_to_improve ?? null;
  const recommendation = result.hireRecommendation as HireRecommendation | null;

  return (
    <main className={cn("min-h-screen bg-brand-deep text-brand-text", PAD)}>
      <div className={cn(CONTAINER, "py-10 sm:py-14")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ButtonLink href="/dashboard" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </ButtonLink>
          <ButtonLink href="/interviews/behavioral/setup" size="sm">
            Start another round
          </ButtonLink>
        </div>

        <header className="mt-14">
          <Eyebrow>Behavioral Report</Eyebrow>
          <h1 className={cn(PAGE_TITLE, "max-w-[22ch]")}>
            {round?.title ?? "Behavioral Round"}
          </h1>
          <p className={cn(LEAD, "mt-5 max-w-[720px]")}>
            {round?.summary ??
              "A voice-first behavioural round graded on the evidence in your stories: the specific situation, your own contribution, the measurable result, and what you would do differently."}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
              <Badge variant="secondary">{interviewer.name}</Badge>
              {result.company ? <Badge variant="secondary">{result.company}</Badge> : null}
              {result.roleTitle ? <Badge variant="secondary">{result.roleTitle}</Badge> : null}
              {valueLensLabel ? <Badge variant="secondary">{valueLensLabel}</Badge> : null}
              <Badge variant="secondary">No coding</Badge>
              <Badge variant="secondary">STAR stories</Badge>
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
              Scoring was not available for this behavioral session, but the transcript is still available below.
            </p>
          </section>
        )}

        <div className="mt-16 grid gap-16 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-20">
          <div className="min-w-0 space-y-16">
            {competencyReport ? (
              <CompetencyReportPanel
                report={competencyReport}
                title="Competency Signals"
                description="Each competency you selected, graded only on the evidence you actually gave. A low rating means the story was missing a part an interviewer needs, not that the delivery was poor."
              />
            ) : null}

            <BehavioralSignalSnapshot scores={result.scores} />

            {radarData.length > 0 ? <ScoreRadar scores={radarData} /> : null}

            {feedbackCards.length > 0 ? (
              <section>
                <SectionTitle title="Behavioral Rubric Breakdown" />
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

            <BehavioralCoachingNotes
              strengths={strengths}
              areasToImprove={areasToImprove}
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
                  "This round mirrors the dedicated behavioural interview in a real loop: one competency per question, and follow-ups until the story is specific enough to grade."}
              </p>
            </AsideBlock>

            <AsideBlock label="Round Coverage">
              <CoverageGrid
                stats={[
                  { label: "Duration", value: transcriptStats.durationLabel },
                  { label: "Turns", value: transcriptStats.totalTurns },
                  { label: "Your turns", value: transcriptStats.candidateTurns },
                  { label: "Questions", value: transcriptStats.interviewerQuestions },
                ]}
              />
            </AsideBlock>

            <AsideBlock label="What Was Evaluated">
              <ul className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {BEHAVIORAL_EVALUATED_SIGNALS.map((signal) => (
                  <li key={signal} className="py-3 text-sm leading-relaxed text-brand-muted">
                    {signal}
                  </li>
                ))}
              </ul>
            </AsideBlock>

            {round?.prompt ? (
              <AsideBlock label="Interview Brief">
                <p className="whitespace-pre-line text-sm leading-relaxed text-brand-muted">{round.prompt}</p>
              </AsideBlock>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
