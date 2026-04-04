"use client";

import { ScoreSummary } from "@/components/results/ScoreSummary";
import { ScoreRadar } from "@/components/results/ScoreRadar";
import { FeedbackCard } from "@/components/results/FeedbackCard";
import {
  SCORING_DIMENSIONS,
  type ScoringDimension,
} from "@/lib/constants";

const SAMPLE_DIMENSION_ORDER: ScoringDimension[] = [
  "problem_solving",
  "code_quality",
  "communication",
  "technical_knowledge",
  "testing",
];

const SAMPLE_SCORES: Record<ScoringDimension, number> = {
  problem_solving: 78,
  code_quality: 82,
  communication: 71,
  technical_knowledge: 74,
  testing: 68,
};

const SAMPLE_FEEDBACK: Record<ScoringDimension, string> = {
  problem_solving:
    "You asked good clarifying questions about duplicates and empty inputs before coding. The two-pointer approach was appropriate; consider stating the invariant you maintain across moves earlier in the discussion.",
  code_quality:
    "Naming was clear and the loop structure was easy to follow. Minor nit: extracting the swap into a small helper would match common style for readability in longer solutions.",
  communication:
    "You explained your thinking at a steady pace. A few pauses were long; briefly narrating what you are stuck on helps Tia coach you faster.",
  technical_knowledge:
    "Time and space complexity were correct. You mentioned stability trade-offs when relevant; deepening one sentence on why the hash map beats sorting for this constraint would strengthen the answer.",
  testing:
    "You walked the main example and one edge case. Adding a quick check for single-element or all-equal inputs would mirror what many interviewers expect before they say “looks good.”",
};

export function SampleReportPreview() {
  const radarScores = SAMPLE_DIMENSION_ORDER.map((key) => ({
    dimension: SCORING_DIMENSIONS[key].label,
    score: SAMPLE_SCORES[key],
    maxScore: 100,
  }));

  return (
    <div className="space-y-8">
      <div
        className="rounded-xl border border-brand-amber/30 bg-brand-amber/[0.06] px-4 py-3 text-sm text-brand-text"
        role="note"
      >
        <span className="font-semibold text-brand-amber">Sample only.</span>{" "}
        This preview mirrors TechInView results after an AI interview; your real report
        reflects your session and includes transcript and code review.
      </div>

      <ScoreSummary
        overallScore={76}
        hireRecommendation="hire"
        summary="Solid performance: clear approach, working solution, and reasonable complexity discussion. Communication was good with room to be more vocal during debugging. Overall aligned with a hire-level bar for this problem."
      />

      <ScoreRadar scores={radarScores} />

      <div>
        <h2 className="text-base font-semibold text-brand-text mb-4">
          Dimension breakdown
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_DIMENSION_ORDER.map((key) => (
            <FeedbackCard
              key={key}
              dimension={SCORING_DIMENSIONS[key].label}
              score={SAMPLE_SCORES[key]}
              weight={SCORING_DIMENSIONS[key].weight}
              feedback={SAMPLE_FEEDBACK[key]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
