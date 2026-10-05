"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  FileQuestion,
  ListChecks,
  Loader2,
  MessageSquareText,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useSupabase } from "@/hooks/useSupabase";
import { useInterviewStore } from "@/stores/interview-store";
import { ScoreSummary } from "@/components/results/ScoreSummary";
import { ScoreRadar } from "@/components/results/ScoreRadar";
import { FeedbackCard } from "@/components/results/FeedbackCard";
import { TranscriptReview } from "@/components/results/TranscriptReview";
import { CompetencyReportPanel } from "@/components/results/CompetencyReportPanel";
import {
  ROUND_SCORING_DIMENSIONS,
  type HireRecommendation,
  type RoundScoreDimension,
} from "@/lib/constants";
import { INTERVIEWER } from "@/lib/interviewer";
import type { RoundContextSnapshot } from "@/lib/loops/types";
import type { CompetencyReport } from "@/types";

type EngineeringManagerResultsProps = {
  interviewId: string;
};

type StoreLikeResult = NonNullable<
  ReturnType<typeof useInterviewStore.getState>["interviewResult"]
>;
type EngineeringManagerScores = StoreLikeResult["scores"];
type EngineeringManagerTranscript = StoreLikeResult["transcript"];

const INTERVIEW_SELECT_COLUMNS =
  "id, round_type, language, overall_score, scores, feedback_summary, hire_recommendation, round_title, round_context_snapshot, competency_report, company_snapshot, role_title_snapshot, messages(*)";

/**
 * The shared five dimensions, relabelled for a leadership lens. A hiring
 * manager is not grading "technical depth" as implementation fluency here — the
 * same dimension is read as tradeoff reasoning behind the calls the candidate
 * made.
 */
const ENGINEERING_MANAGER_SCORE_DIMENSIONS = {
  problem_solving: {
    ...ROUND_SCORING_DIMENSIONS.problem_solving,
    label: "Situation Framing",
    description:
      "How clearly each story was set up: the scope you owned, the constraint that made it hard, and why it mattered to the business.",
  },
  communication: {
    ...ROUND_SCORING_DIMENSIONS.communication,
    label: "Stakeholder Communication",
    description:
      "How legibly you explained decisions, tradeoffs, and bad news to the people who had to act on them.",
  },
  technical_depth: {
    ...ROUND_SCORING_DIMENSIONS.technical_depth,
    label: "Technical Judgment",
    description:
      "Tradeoff reasoning behind your technical calls (why that option, what it cost) rather than implementation fluency.",
  },
  execution: {
    ...ROUND_SCORING_DIMENSIONS.execution,
    label: "Delivery Evidence",
    description:
      "What actually shipped, the number that moved, and your own contribution as distinct from the team's.",
  },
  judgment: {
    ...ROUND_SCORING_DIMENSIONS.judgment,
    label: "Prioritization & Decisions",
    description:
      "How you sequenced roadmap against quality and debt, what you cut, and how you handled conflict and escalation.",
  },
} satisfies Record<
  RoundScoreDimension,
  { label: string; weight: number; description: string }
>;

/** Leadership-first ordering: what a hiring manager reads before anything else. */
const ENGINEERING_MANAGER_SCORE_ORDER = [
  "judgment",
  "communication",
  "execution",
  "problem_solving",
  "technical_depth",
] as const satisfies readonly RoundScoreDimension[];

const ENGINEERING_MANAGER_SIGNAL_CARDS = [
  {
    key: "judgment",
    title: "Prioritization & Decisions",
    description:
      "Whether you sequenced competing asks with a real example, and named what you dropped.",
    icon: Compass,
  },
  {
    key: "communication",
    title: "Stakeholder Communication",
    description:
      "How you aligned partners you could not instruct, and how early you surfaced risk.",
    icon: Users,
  },
  {
    key: "execution",
    title: "Delivery Evidence",
    description:
      "Measurable outcomes and your own contribution, rather than effort or scope.",
    icon: TrendingUp,
  },
  {
    key: "technical_depth",
    title: "Technical Judgment",
    description:
      "Tradeoff reasoning behind hard calls: the alternatives, the cost, the hindsight.",
    icon: BrainCircuit,
  },
] as const;

const ENGINEERING_MANAGER_EVALUATED_SIGNALS = [
  "Role fit and motivation: why this team, this role, now",
  "Prioritization between roadmap, quality, and debt, backed by a real example",
  "Stakeholder alignment and influence without formal authority",
  "Conflict, escalation, and decisions with no perfect option",
  "Personal contribution, measurable outcome, and hindsight in each story",
  "The questions you asked the manager at the close",
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

function getTranscriptStats(transcript: EngineeringManagerTranscript) {
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

function EngineeringManagerSignalSnapshot({
  scores,
}: {
  scores: EngineeringManagerScores;
}) {
  if (!scores) return null;

  const signalCards = ENGINEERING_MANAGER_SIGNAL_CARDS.map((signal) => ({
    ...signal,
    score: scores[signal.key]?.score,
  })).filter(
    (
      signal
    ): signal is (typeof ENGINEERING_MANAGER_SIGNAL_CARDS)[number] & { score: number } =>
      typeof signal.score === "number"
  );

  if (signalCards.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Hiring Manager Signals</h2>
        <p className="mt-1 text-sm text-brand-muted">
          The four things a hiring manager writes down after this round, in one scan.
        </p>
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
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone.border} ${tone.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${tone.text}`} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-brand-text">{signal.title}</h3>
                    <p
                      className={`mt-1 text-xs font-semibold uppercase tracking-[0.14em] ${tone.text}`}
                    >
                      {tone.label}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 text-2xl font-bold tabular-nums ${tone.text}`}>
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

function EngineeringManagerCoachingNotes({
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
            Leadership Strengths
          </div>
          <ul className="mt-4 space-y-3">
            {strengths.map((strength) => (
              <li
                key={strength}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm leading-relaxed text-brand-muted"
              >
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
              <li
                key={area}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm leading-relaxed text-brand-muted"
              >
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
    competencyReport: normalizeCompetencyReport(interview.competency_report),
  };
}

/** Drops an empty or malformed persisted report so the panel is not rendered blank. */
function normalizeCompetencyReport(value: unknown): CompetencyReport | null {
  const report = (value as CompetencyReport | null | undefined) ?? null;

  if (!report || !Array.isArray(report.competencies) || report.competencies.length === 0) {
    return null;
  }

  return report;
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

  // Store-first: the round that just finished renders with no query at all. The
  // Supabase row is only needed on a reload or a later visit, and it carries the
  // persisted competency report so the full debrief survives either way.
  useEffect(() => {
    if (storeMatches) return;

    setIsLoading(true);
    void (async () => {
      try {
        const { data } = await supabase
          .from("interviews")
          .select(INTERVIEW_SELECT_COLUMNS)
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

    return ENGINEERING_MANAGER_SCORE_ORDER.filter((key) => result.scores?.[key]).map((key) => ({
      dimension: ENGINEERING_MANAGER_SCORE_DIMENSIONS[key].label,
      score: result.scores?.[key]?.score ?? 0,
      maxScore: 100,
    }));
  }, [result]);

  const feedbackCards = useMemo(() => {
    if (!result?.scores) return [];

    return ENGINEERING_MANAGER_SCORE_ORDER.filter((key) => result.scores?.[key]).map((key) => ({
      dimension: ENGINEERING_MANAGER_SCORE_DIMENSIONS[key].label,
      score: result.scores?.[key]?.score ?? 0,
      weight: ENGINEERING_MANAGER_SCORE_DIMENSIONS[key].weight,
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

  const interviewer = INTERVIEWER;
  const round = result.roundContext;
  const valueLens = round?.valuesContext ?? null;
  const hasScores = Boolean(result.overallScore !== null && result.scores);
  // Set from the scoring response on the store path and from the persisted
  // `competency_report` column on the DB path.
  const competencyReport = normalizeCompetencyReport(result.competencyReport);
  // `buildDbResult` cannot recover key strengths from the interviews row, so on
  // a reload the report's own copy is the fallback rather than an empty list.
  const keyStrengths = result.keyStrengths ?? competencyReport?.key_strengths ?? null;
  const areasToImprove = result.areasToImprove ?? competencyReport?.areas_to_improve ?? null;

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
                  "A voice-first hiring-manager round focused on how clearly you explained impact, priorities, stakeholder alignment, and decision-making under pressure."}
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
              {valueLens ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
                  <Scale className="h-3 w-3" />
                  {valueLens.frameworkLabel}
                </span>
              ) : null}
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
                No coding
              </span>
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
            {competencyReport ? (
              <CompetencyReportPanel
                report={competencyReport}
                title="Leadership Signals"
                description="Each competency you chose, graded on the evidence you actually gave. A hiring manager rates a specific example with your own action and a real outcome, not a well-delivered generality."
              />
            ) : null}

            <EngineeringManagerSignalSnapshot scores={result.scores} />

            {radarData.length > 0 ? <ScoreRadar scores={radarData} /> : null}

            {feedbackCards.length > 0 ? (
              <section>
                <h2 className="mb-4 text-lg font-semibold">Leadership Rubric Breakdown</h2>
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

            <EngineeringManagerCoachingNotes
              strengths={keyStrengths}
              areasToImprove={areasToImprove}
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
                  "This round tests whether the manager would take you onto the team: why you fit the role, how you prioritize, how you move people who do not report to you, and whether your examples hold up under follow-up."}
              </p>
            </div>

            {valueLens && valueLens.competencies.length > 0 ? (
              <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                  <Scale className="h-3.5 w-3.5" />
                  Value Lens
                </div>
                <p className="mt-3 text-sm font-semibold text-brand-text">
                  {valueLens.frameworkLabel}
                </p>
                <p className="mt-1 text-xs text-brand-muted">{valueLens.frameworkOrigin}</p>
                <div className="mt-4 space-y-3">
                  {valueLens.competencies.map((competency) => (
                    <div
                      key={competency.id}
                      className="rounded-2xl border border-brand-border bg-brand-surface p-3"
                    >
                      <p className="text-sm font-semibold text-brand-text">
                        {competency.label}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                        {competency.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                <ListChecks className="h-3.5 w-3.5" />
                Round Coverage
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-brand-muted">
                    Duration
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">
                    {transcriptStats.durationLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-brand-muted">
                    Turns
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">
                    {transcriptStats.totalTurns}
                  </p>
                </div>
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-brand-muted">
                    Your answers
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">
                    {transcriptStats.candidateTurns}
                  </p>
                </div>
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-brand-muted">
                    Questions
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">
                    {transcriptStats.interviewerQuestions}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                What Was Evaluated
              </div>
              <div className="mt-4 space-y-3 text-sm text-brand-muted">
                {ENGINEERING_MANAGER_EVALUATED_SIGNALS.map((signal) => (
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
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-brand-muted">
                  {round.prompt}
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
