"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Loader2, Lock } from "lucide-react";
import { BODY, ButtonLink, CELL, CHIP, CONTAINER, Eyebrow, FOCUS, GRID, LABEL, LEAD, PAD } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";
import { ScoreSummary } from "@/components/results/ScoreSummary";
import { ScoreRadar } from "@/components/results/ScoreRadar";
import { FeedbackCard } from "@/components/results/FeedbackCard";
import { TranscriptReview } from "@/components/results/TranscriptReview";
import { CodeReview } from "@/components/results/CodeReview";
import { InterviewReviewGate } from "@/components/results/InterviewReviewGate";
import ResultsLoading from "./loading";
import { ROUND_SCORING_DIMENSIONS, SCORING_DIMENSIONS } from "@/lib/constants";
import type { HireRecommendation, InterviewMode, RoundScoreDimension, RoundType, ScoringDimension } from "@/lib/constants";
import { useInterviewStore } from "@/stores/interview-store";
import { useSupabase } from "@/hooks/useSupabase";
import { INTERVIEWER } from "@/lib/interviewer";
import { ROUND_TYPE_LABELS } from "@/lib/loops/round-config";
import type { LoopSummarySnapshot, RoundContextSnapshot } from "@/lib/loops/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type DimensionKey = ScoringDimension | RoundScoreDimension;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatLanguage(lang: string) {
  const map: Record<string, string> = {
    python: "Python",
    javascript: "JavaScript",
    java: "Java",
    cpp: "C++",
  };
  return map[lang] ?? lang;
}

function getDimensionConfig(mode: InterviewMode) {
  return mode === "targeted_loop" ? ROUND_SCORING_DIMENSIONS : SCORING_DIMENSIONS;
}

function getDimensionKeys(mode: InterviewMode): DimensionKey[] {
  return mode === "targeted_loop"
    ? (Object.keys(ROUND_SCORING_DIMENSIONS) as RoundScoreDimension[])
    : (Object.keys(SCORING_DIMENSIONS) as ScoringDimension[]);
}

/** Page shell: deep ink, design-system padding, a report-width column. */
const SHELL = cn("min-h-screen bg-brand-deep text-brand-text", PAD);
const COLUMN = cn(CONTAINER, "max-w-[1100px] py-10 sm:py-14");
const PAGE_TITLE = "text-balance text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text";
const SECTION_TITLE = "text-2xl font-normal tracking-[-0.03em] text-brand-text sm:text-3xl";
const BACK_LINK = cn(
  "group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-brand-muted transition-colors hover:text-brand-text",
  FOCUS
);

// ─── Empty state: no result found in store ────────────────────────────────────

function NoResultState() {
  return (
    <main className={SHELL}>
      <div className={COLUMN}>
        <Link href="/dashboard" className={BACK_LINK}>
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Dashboard
        </Link>

        <div className="mt-16 max-w-xl border-t border-white/[0.08] pt-10">
          <Eyebrow>Interview report</Eyebrow>
          <h1 className={PAGE_TITLE}>No Results Found</h1>
          <p className={cn(LEAD, "mt-4")}>
            We couldn&apos;t find interview results for this session. The results may have expired or you may have navigated here directly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/interviews/dsa/setup" size="sm">
              <RefreshCw className="h-4 w-4" />
              Start New Interview
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="ghost" size="sm">
              Go to Dashboard
            </ButtonLink>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Scoring unavailable state ────────────────────────────────────────────────

function ScoringUnavailableCard({
  reason,
  interviewerName,
}: {
  reason: "in_progress" | "failed";
  interviewerName: string;
}) {
  return (
    <div className="border-y border-white/[0.08] py-10">
      {reason === "in_progress" ? (
        <>
          <p className={cn(LABEL, "flex items-center gap-2")}>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-cyan" />
            Scoring In Progress
          </p>
          <p className={cn(BODY, "mt-3 max-w-prose")}>
            {interviewerName} is still evaluating your performance. Please check back shortly.
          </p>
        </>
      ) : (
        <>
          <p className={cn(LABEL, "text-brand-amber")}>Scoring Unavailable</p>
          <p className={cn(BODY, "mt-3 max-w-prose")}>
            AI scoring could not be completed for this session. Your transcript and code are still available below.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const params = useParams();
  const pageId = params.id as string;
  const storeResult = useInterviewStore((s) => s.interviewResult);
  const setupConfig = useInterviewStore((s) => s.setupConfig);
  const storeProblem = useInterviewStore((s) => s.problem);
  const { supabase } = useSupabase();

  const [dbResult, setDbResult] = useState<typeof storeResult>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [isFreeTrial, setIsFreeTrial] = useState(false);

  const [feedbackCompleted, setFeedbackCompleted] = useState<boolean | null>(null);

  const storeMatchesPage = storeResult?.interviewId === pageId;
  const result = storeMatchesPage ? storeResult : dbResult;

  // Check if feedback already exists for this interview
  useEffect(() => {
    if (!pageId) return;
    (async () => {
      try {
        const res = await fetch(`/api/interview/feedback?interviewId=${pageId}`);
        const json = await res.json();
        setFeedbackCompleted(json.success && json.data != null);
      } catch {
        setFeedbackCompleted(false);
      }
    })();
  }, [pageId]);

  useEffect(() => {
    if (storeMatchesPage || fetched) return;

    setLoading(true);
    (async () => {
      try {
        const { data: interview } = await supabase
          .from("interviews")
          .select("*, problems(title, difficulty, category), messages(*)")
          .eq("id", pageId)
          .single();

        if (interview) {
          setIsFreeTrial(interview.is_free_trial === true);

          if (interview.overall_score != null) {
            const scores = interview.scores as Record<string, { score: number; feedback: string }> | null;
            const prob = interview.problems as unknown as { title: string; difficulty: string; category: string } | null;
            const msgs = (interview.messages as unknown as { role: string; content: string; timestamp_ms: number }[]) || [];

            setDbResult({
              mode: (interview.mode as InterviewMode | null) ?? "general_dsa",
              roundType: (interview.round_type as RoundType | null) ?? "coding",
              roundTitle: interview.round_title ?? prob?.title ?? "Interview Round",
              interviewId: interview.id,
              finalCode: interview.final_code ?? "",
              language: interview.language ?? "python",
              transcript: msgs.map((m) => ({
                role: m.role as "interviewer" | "candidate" | "system",
                content: m.content,
                timestamp_ms: m.timestamp_ms,
              })),
              overallScore: interview.overall_score,
              scores: scores ? {
                problem_solving: scores.problem_solving ?? { score: 0, feedback: "" },
                code_quality: scores.code_quality ?? { score: 0, feedback: "" },
                communication: scores.communication ?? { score: 0, feedback: "" },
                technical_knowledge: scores.technical_knowledge ?? { score: 0, feedback: "" },
                testing: scores.testing ?? { score: 0, feedback: "" },
              } : null,
              hireRecommendation: interview.hire_recommendation,
              summary: interview.feedback_summary,
              keyStrengths: null,
              areasToImprove: null,
              testsPassed: interview.tests_passed ?? 0,
              testsTotal: interview.tests_total ?? 0,
              problemTitle: prob?.title ?? interview.round_title ?? "Interview",
              problemDifficulty: prob?.difficulty ?? "medium",
              problemCategory: prob?.category ?? "arrays",
              company: interview.company_snapshot ?? null,
              roleTitle: interview.role_title_snapshot ?? null,
              loopName:
                (interview.loop_summary_snapshot as LoopSummarySnapshot | null)?.loopName ?? null,
              loopSummary: (interview.loop_summary_snapshot as LoopSummarySnapshot | null) ?? null,
              roundContext:
                (interview.round_context_snapshot as RoundContextSnapshot | null) ?? null,
            });
          }
        }
      } catch {
        // Failed to fetch — will show NoResultState
      } finally {
        setLoading(false);
        setFetched(true);
      }
    })();
  }, [pageId, storeMatchesPage, fetched, supabase]);

  // For store-based results, also fetch is_free_trial from DB
  useEffect(() => {
    if (!storeMatchesPage) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("interviews")
          .select("is_free_trial")
          .eq("id", pageId)
          .single();
        if (data) setIsFreeTrial(data.is_free_trial === true);
      } catch {
        // Ignore — defaults to false (full access)
      }
    })();
  }, [storeMatchesPage, pageId, supabase]);

  // Loading state while checking feedback or fetching from DB
  if (feedbackCompleted === null || (!storeMatchesPage && loading)) {
    return (
      <ResultsLoading />
    );
  }

  // No result found
  if (!result) {
    return <NoResultState />;
  }

  // Mandatory review gate — must submit feedback before viewing report
  if (!feedbackCompleted) {
    return (
      <InterviewReviewGate
        interviewId={pageId}
        interviewerName={INTERVIEWER.name}
        onComplete={() => setFeedbackCompleted(true)}
      />
    );
  }

  // Derive display values
  const hasScores = result.scores !== null && result.overallScore !== null;
  const scores = result.scores;
  const overallScore = result.overallScore;
  const hireRec = result.hireRecommendation as HireRecommendation | null;
  const summary = result.summary;
  const finalCode = result.finalCode;
  const codeLanguage = result.language ?? setupConfig?.language ?? "python";
  const mode = result.mode ?? setupConfig?.mode ?? "general_dsa";
  const roundType = result.roundType ?? setupConfig?.roundType ?? "coding";
  const roundTitle =
    result.roundTitle ??
    result.roundContext?.title ??
    result.problemTitle ??
    "Interview Round";
  const company = result.company ?? setupConfig?.company ?? null;
  const roleTitle = result.roleTitle ?? setupConfig?.roleTitle ?? null;
  const loopSummary = result.loopSummary ?? setupConfig?.loopSummary ?? null;
  const roundContext = result.roundContext ?? null;
  const testsPassed = result.testsPassed;
  const testsTotal = result.testsTotal;
  const keyStrengths = result.keyStrengths;
  const areasToImprove = result.areasToImprove;
  const transcript = result.transcript ?? [];

  // Problem metadata
  const problemTitle = result.problemTitle ?? storeProblem?.title ?? "Interview";
  const problemDifficulty = result.problemDifficulty ?? storeProblem?.difficulty ?? setupConfig?.difficulty ?? "medium";
  const displayLanguage = formatLanguage(codeLanguage);
  const interviewer = INTERVIEWER;
  const dimensionConfig = getDimensionConfig(mode) as Record<
    DimensionKey,
    { label: string; weight: number; description: string }
  >;
  const dimensionKeys = getDimensionKeys(mode);
  const shouldShowCodeReview = roundType === "coding" && finalCode.trim().length > 0;
  const sessionMeta =
    mode === "targeted_loop"
      ? [
          interviewer.name,
          company,
          roundTitle,
          roleTitle,
          roundType === "coding" ? displayLanguage : ROUND_TYPE_LABELS[roundType],
        ]
          .filter(Boolean)
          .join(" · ")
      : `${interviewer.name} · ${problemTitle} · ${capitalize(problemDifficulty)} · ${displayLanguage}`;

  // Radar + feedback card data (only built when scores exist)
  const radarData = hasScores && scores
    ? dimensionKeys.filter((key) => scores[key]).map((key) => ({
        dimension: dimensionConfig[key].label,
        score: scores[key].score,
        maxScore: 100,
      }))
    : [];

  const feedbackCards = hasScores && scores
    ? dimensionKeys.filter((key) => scores[key]).map((key) => ({
        dimension: dimensionConfig[key].label,
        score: scores[key].score,
        weight: dimensionConfig[key].weight,
        feedback: scores[key].feedback,
      }))
    : [];

  return (
    <main className={SHELL}>
      <div className={cn(COLUMN, "space-y-16 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500")}>

        {/* Top nav + header */}
        <header>
          <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/dashboard" className={BACK_LINK}>
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to Dashboard
            </Link>
            <span className={LABEL}>{sessionMeta}</span>
          </div>

          <Eyebrow>Interview report</Eyebrow>
          <h1 className={PAGE_TITLE}>Interview Results</h1>
          <p className={cn(LEAD, "mt-4 max-w-[620px]")}>
            {hasScores
              ? mode === "targeted_loop"
                ? "Here\u2019s how you showed up in this round across the shared five interview signals."
                : "Here\u2019s a detailed breakdown of your performance across all 5 dimensions."
              : "Your interview session has ended. Score breakdown was not available for this session."}
          </p>
        </header>

        {mode === "targeted_loop" && (loopSummary || roundContext) && (
          <section className={cn(GRID, "md:grid-cols-[minmax(0,1fr)_320px]")}>
            <div className={cn(CELL, "p-6")}>
              <p className={LABEL}>Targeted Loop Context</p>
              <h2 className="mt-4 text-xl font-medium tracking-[-0.02em] text-brand-text">
                {roundTitle}
              </h2>
              <p className={cn(BODY, "mt-2")}>
                {roundContext?.summary ??
                  `This round was generated for ${company ?? "your target company"} and ${roleTitle ?? "your target role"}.`}
              </p>
              {roundContext?.focusAreas && roundContext.focusAreas.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {roundContext.focusAreas.map((item) => (
                    <span key={item} className={CHIP}>
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className={cn(CELL, "p-6")}>
              <p className={LABEL}>Loop</p>
              <p className="mt-4 text-[17px] tracking-[-0.01em] text-brand-text">
                {loopSummary?.loopName ?? "Targeted SWE loop"}
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                {company ?? "Company"} · {roleTitle ?? "Role"}
              </p>
            </div>
          </section>
        )}

        {/* ── Section 1: Score Summary (only if scores exist) ── */}
        <section>
          {hasScores && overallScore !== null && hireRec && summary ? (
            <ScoreSummary
              overallScore={overallScore}
              hireRecommendation={hireRec}
              summary={summary}
            />
          ) : (
            <ScoringUnavailableCard reason="failed" interviewerName={interviewer.name} />
          )}
        </section>

        {/* ── Audio preview upgrade CTA (shown instead of detailed sections) ── */}
        {isFreeTrial && hasScores && (
          <section className="flex flex-col items-start gap-6 rounded-[20px] border border-white/[0.08] p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex-1">
              <p className={cn(LABEL, "flex items-center gap-2")}>
                <Lock className="h-3.5 w-3.5" />
                Detailed Feedback Locked
              </p>
              <p className={cn(BODY, "mt-3 max-w-prose")}>
                Your 5-minute audio preview includes the overall score and hire recommendation above.
                Buy an interview pack to see the 5-dimension radar chart, per-dimension feedback,
                key strengths, and areas to improve.
              </p>
            </div>
            <ButtonLink href="/settings#rounds" size="sm" className="shrink-0">
              View Packs
            </ButtonLink>
          </section>
        )}

        {/* ── Section 2 + 3: Radar and per-dimension feedback (only if scores exist and not preview) ── */}
        {!isFreeTrial && hasScores && (radarData.length > 0 || feedbackCards.length > 0) && (
          <section>
            <h2 className={cn(SECTION_TITLE, "mb-6")}>Dimension Breakdown</h2>
            {radarData.length > 0 && (
              <div className="mb-8">
                <ScoreRadar scores={radarData} />
              </div>
            )}
            {feedbackCards.length > 0 && (
              <ul className={cn(GRID, "sm:grid-cols-2 lg:grid-cols-3")}>
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
            )}
          </section>
        )}

        {/* ── Section 3b: Key Strengths & Areas to Improve (only if provided and not preview) ── */}
        {!isFreeTrial && hasScores && (keyStrengths || areasToImprove) && (
          <section className={cn(GRID, "sm:grid-cols-2")}>
            {keyStrengths && keyStrengths.length > 0 && (
              <div className={cn(CELL, "p-6")}>
                <h3 className={cn(LABEL, "text-brand-green")}>Key Strengths</h3>
                <ul className="mt-4 divide-y divide-white/[0.08] border-t border-white/[0.08]">
                  {keyStrengths.map((s, i) => (
                    <li key={i} className="grid grid-cols-[16px_minmax(0,1fr)] gap-3 py-3 text-[15px] leading-relaxed text-brand-text">
                      <span className="font-mono text-brand-green">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {areasToImprove && areasToImprove.length > 0 && (
              <div className={cn(CELL, "p-6")}>
                <h3 className={cn(LABEL, "text-brand-amber")}>Areas to Improve</h3>
                <ul className="mt-4 divide-y divide-white/[0.08] border-t border-white/[0.08]">
                  {areasToImprove.map((a, i) => (
                    <li key={i} className="grid grid-cols-[16px_minmax(0,1fr)] gap-3 py-3 text-[15px] leading-relaxed text-brand-text">
                      <span className="font-mono text-brand-amber">-</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* ── Section 4: Code Review (always shown when code exists) ── */}
        {shouldShowCodeReview && (
          <section>
            <CodeReview
              code={finalCode}
              language={codeLanguage}
              testsPassed={testsPassed}
              testsTotal={testsTotal}
            />
          </section>
        )}

        {/* ── Section 5: Transcript (always shown when messages exist) ── */}
        <section>
          <TranscriptReview messages={transcript} interviewerName={interviewer.name} />
        </section>

        {/* ── CTA: Practice Again ── */}
        <div className="flex flex-col items-start gap-4 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className={BODY}>Ready to improve your score?</p>
          <ButtonLink href={mode === "targeted_loop" ? "/prep-guru" : "/interviews/dsa/setup"} size="sm">
            <RefreshCw className="h-4 w-4" />
            {mode === "targeted_loop" ? "Practice Another Targeted Round" : "Practice Again"}
          </ButtonLink>
        </div>

      </div>
    </main>
  );
}
