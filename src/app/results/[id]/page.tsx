"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Loader2, FileQuestion } from "lucide-react";
import { ScoreSummary } from "@/components/results/ScoreSummary";
import { ScoreRadar } from "@/components/results/ScoreRadar";
import { FeedbackCard } from "@/components/results/FeedbackCard";
import { TranscriptReview } from "@/components/results/TranscriptReview";
import { CodeReview } from "@/components/results/CodeReview";
import { SCORING_DIMENSIONS } from "@/lib/constants";
import type { HireRecommendation } from "@/lib/constants";
import { useInterviewStore } from "@/stores/interview-store";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type DimensionKey = "problem_solving" | "code_quality" | "communication" | "technical_knowledge" | "testing";

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

// ─── Empty state: no result found in store ────────────────────────────────────

function NoResultState() {
  return (
    <main className="min-h-screen bg-brand-deep text-brand-text">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-border bg-brand-card">
            <FileQuestion className="h-8 w-8 text-brand-muted" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-text">No Results Found</h1>
            <p className="text-sm text-brand-muted mt-2 max-w-sm">
              We couldn&apos;t find interview results for this session. The results may have expired or you may have navigated here directly.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-sm text-brand-text hover:bg-brand-card transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/interview/setup"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-cyan text-brand-deep font-semibold text-sm hover:bg-brand-cyan/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Start New Interview
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Scoring unavailable state ────────────────────────────────────────────────

function ScoringUnavailableCard({ reason }: { reason: "in_progress" | "failed" }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-card p-8 flex flex-col items-center gap-4 text-center">
      {reason === "in_progress" ? (
        <>
          <Loader2 className="h-8 w-8 text-brand-cyan animate-spin" />
          <div>
            <h3 className="text-sm font-semibold text-brand-text">Scoring In Progress</h3>
            <p className="text-xs text-brand-muted mt-1">
              Alex is still evaluating your performance. Please check back shortly.
            </p>
          </div>
        </>
      ) : (
        <>
          <AlertCircle className="h-8 w-8 text-brand-amber" />
          <div>
            <h3 className="text-sm font-semibold text-brand-text">Scoring Unavailable</h3>
            <p className="text-xs text-brand-muted mt-1">
              AI scoring could not be completed for this session. Your transcript and code are still available below.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const result = useInterviewStore((s) => s.interviewResult);
  const setupConfig = useInterviewStore((s) => s.setupConfig);
  const storeProblem = useInterviewStore((s) => s.problem);

  // No result in store at all
  if (!result) {
    return <NoResultState />;
  }

  // Derive display values
  const hasScores = result.scores !== null && result.overallScore !== null;
  const scores = result.scores;
  const overallScore = result.overallScore;
  const hireRec = result.hireRecommendation as HireRecommendation | null;
  const summary = result.summary;
  const finalCode = result.finalCode;
  const codeLanguage = result.language ?? setupConfig?.language ?? "python";
  const testsPassed = result.testsPassed;
  const testsTotal = result.testsTotal;
  const keyStrengths = result.keyStrengths;
  const areasToImprove = result.areasToImprove;
  const transcript = result.transcript ?? [];

  // Problem metadata
  const problemTitle = result.problemTitle ?? storeProblem?.title ?? "Interview";
  const problemDifficulty = result.problemDifficulty ?? storeProblem?.difficulty ?? setupConfig?.difficulty ?? "medium";
  const displayLanguage = formatLanguage(codeLanguage);

  // Radar + feedback card data (only built when scores exist)
  const radarData = hasScores && scores
    ? (Object.keys(scores) as DimensionKey[]).map((key) => ({
        dimension: SCORING_DIMENSIONS[key].label,
        score: scores[key].score,
        maxScore: 100,
      }))
    : [];

  const feedbackCards = hasScores && scores
    ? (Object.keys(scores) as DimensionKey[]).map((key) => ({
        dimension: SCORING_DIMENSIONS[key].label,
        score: scores[key].score,
        weight: SCORING_DIMENSIONS[key].weight,
        feedback: scores[key].feedback,
      }))
    : [];

  return (
    <main className="min-h-screen bg-brand-deep text-brand-text relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-brand-cyan/3 blur-[120px] pointer-events-none" />

      <style>{`
        @keyframes results-fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes results-scale-in {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes results-slide-left {
          0% { opacity: 0; transform: translateX(-16px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes results-slide-right {
          0% { opacity: 0; transform: translateX(16px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .r-anim-1 { animation: results-fade-up 0.5s ease-out 0.05s both; }
        .r-anim-2 { animation: results-fade-up 0.5s ease-out 0.15s both; }
        .r-anim-3 { animation: results-scale-in 0.5s ease-out 0.25s both; }
        .r-anim-4 { animation: results-scale-in 0.5s ease-out 0.35s both; }
        .r-anim-5 { animation: results-fade-up 0.5s ease-out 0.45s both; }
        .r-anim-6 { animation: results-fade-up 0.5s ease-out 0.55s both; }
        .r-anim-7 { animation: results-fade-up 0.5s ease-out 0.65s both; }
        .r-anim-8 { animation: results-fade-up 0.5s ease-out 0.75s both; }
        .r-anim-sl { animation: results-slide-left 0.5s ease-out 0.5s both; }
        .r-anim-sr { animation: results-slide-right 0.5s ease-out 0.55s both; }
      `}</style>

      <div className="relative z-10 max-w-5xl mx-auto py-8 px-4">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-8 r-anim-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>
          <span className="text-xs text-brand-muted bg-brand-surface border border-brand-border px-3 py-1 rounded-full">
            {problemTitle} &middot; {capitalize(problemDifficulty)} &middot; {displayLanguage}
          </span>
        </div>

        {/* Page title */}
        <div className="mb-8 r-anim-2">
          <h1 className="text-2xl font-bold text-brand-text tracking-tight">
            Interview Results
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            {hasScores
              ? "Here\u2019s a detailed breakdown of your performance across all 5 dimensions."
              : "Your interview session has ended. Score breakdown was not available for this session."}
          </p>
        </div>

        {/* ── Section 1: Score Summary (only if scores exist) ── */}
        {hasScores && overallScore !== null && hireRec && summary ? (
          <section className="mb-6 r-anim-3">
            <ScoreSummary
              overallScore={overallScore}
              hireRecommendation={hireRec}
              summary={summary}
            />
          </section>
        ) : (
          <section className="mb-6 r-anim-3">
            <ScoringUnavailableCard reason="failed" />
          </section>
        )}

        {/* ── Section 2: Radar Chart (only if scores exist) ── */}
        {hasScores && radarData.length > 0 && (
          <section className="mb-6 r-anim-4">
            <ScoreRadar scores={radarData} />
          </section>
        )}

        {/* ── Section 3: Feedback Cards (only if scores exist) ── */}
        {hasScores && feedbackCards.length > 0 && (
          <section className="mb-6 r-anim-5">
            <h2 className="text-base font-semibold text-brand-text mb-4">
              Dimension Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedbackCards.map((card, i) => (
                <div key={card.dimension} style={{ animation: `results-scale-in 0.4s ease-out ${0.5 + i * 0.08}s both` }}>
                  <FeedbackCard
                    dimension={card.dimension}
                    score={card.score}
                    weight={card.weight}
                    feedback={card.feedback}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Section 3b: Key Strengths & Areas to Improve (only if provided) ── */}
        {hasScores && (keyStrengths || areasToImprove) && (
          <section className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {keyStrengths && keyStrengths.length > 0 && (
              <div className="rounded-xl border border-brand-border bg-brand-card p-5 r-anim-sl">
                <h3 className="text-sm font-semibold text-brand-green flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4" />
                  Key Strengths
                </h3>
                <ul className="space-y-2">
                  {keyStrengths.map((s, i) => (
                    <li key={i} className="text-sm text-brand-text flex items-start gap-2" style={{ animation: `results-fade-up 0.3s ease-out ${0.6 + i * 0.06}s both` }}>
                      <span className="text-brand-green mt-0.5 shrink-0">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {areasToImprove && areasToImprove.length > 0 && (
              <div className="rounded-xl border border-brand-border bg-brand-card p-5 r-anim-sr">
                <h3 className="text-sm font-semibold text-brand-amber flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4" />
                  Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {areasToImprove.map((a, i) => (
                    <li key={i} className="text-sm text-brand-text flex items-start gap-2" style={{ animation: `results-fade-up 0.3s ease-out ${0.65 + i * 0.06}s both` }}>
                      <span className="text-brand-amber mt-0.5 shrink-0">-</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* ── Section 4: Code Review (always shown when code exists) ── */}
        {finalCode && (
          <section className="mb-6 r-anim-7">
            <CodeReview
              code={finalCode}
              language={codeLanguage}
              testsPassed={testsPassed}
              testsTotal={testsTotal}
            />
          </section>
        )}

        {/* ── Section 5: Transcript (always shown when messages exist) ── */}
        <section className="mb-10 r-anim-7">
          <TranscriptReview messages={transcript} />
        </section>

        {/* ── CTA: Practice Again ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-brand-border r-anim-8">
          <p className="text-sm text-brand-muted">Ready to improve your score?</p>
          <Link
            href="/interview/setup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-cyan text-brand-deep font-semibold text-sm hover:bg-brand-cyan/90 hover:scale-[1.03] active:scale-[0.98] transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Practice Again
          </Link>
        </div>

      </div>
    </main>
  );
}
