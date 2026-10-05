import { ScoreCard } from "@/components/landing/LandingLive";
import { BODY, CELL, GRID, H3, LABEL } from "@/components/marketing/ds";
import { HIRE_RECOMMENDATION_CONFIG, SCORING_DIMENSIONS, type ScoringDimension } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SAMPLE_DIMENSION_ORDER: ScoringDimension[] = [
  "problem_solving",
  "code_quality",
  "communication",
  "technical_knowledge",
  "testing",
];

const SHORT: Record<ScoringDimension, string> = {
  problem_solving: "PROBLEM SOLVING",
  code_quality: "CODE QUALITY",
  communication: "COMMUNICATION",
  technical_knowledge: "TECH KNOWLEDGE",
  testing: "TESTING",
};

const SAMPLE_SCORES: Record<ScoringDimension, number> = {
  problem_solving: 78,
  code_quality: 82,
  communication: 71,
  technical_knowledge: 74,
  testing: 68,
};

const SAMPLE_OVERALL = 76;

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
  const dims = SAMPLE_DIMENSION_ORDER.map((key) => ({
    name: SCORING_DIMENSIONS[key].label,
    short: SHORT[key],
    score: SAMPLE_SCORES[key],
  }));

  return (
    <div>
      <ScoreCard
        dims={dims}
        overall={SAMPLE_OVERALL}
        interviewerName="Tia"
        header={
          <div className="mb-10">
            <p className={cn(LABEL, "text-brand-cyan")} role="note">
              Sample only · scores and notes are made up to show the format
            </p>
            <p className={cn(LABEL, "mt-8")}>Recommendation</p>
            <h3 className="mt-2 text-[40px] font-normal leading-none tracking-[-0.035em]">
              {HIRE_RECOMMENDATION_CONFIG.hire.label}
            </h3>
            <p className={cn(BODY, "mt-5 max-w-[460px]")}>
              Solid performance: clear approach, working solution, and reasonable complexity discussion.
              Communication was good with room to be more vocal during debugging. Overall aligned with a
              hire-level bar for this problem.
            </p>
          </div>
        }
        footer={
          <p className={cn(BODY, "mt-6 max-w-[460px] text-sm")}>
            Your report is based on your own session and includes the transcript and your code.
          </p>
        }
      />

      <h3 className={cn(H3, "mb-6 mt-20")}>Dimension breakdown</h3>
      <ul className={cn(GRID, "sm:grid-cols-2 lg:grid-cols-3")}>
        {SAMPLE_DIMENSION_ORDER.map((key, i) => (
          <li key={key} className={cn(CELL, "flex flex-col p-6")}>
            <div className={cn(LABEL, "flex justify-between gap-4")}>
              <span>
                {String(i + 1).padStart(2, "0")} · {Math.round(SCORING_DIMENSIONS[key].weight * 100)}% weight
              </span>
              <span className="text-brand-text">{SAMPLE_SCORES[key]}/100</span>
            </div>
            <h4 className="mt-5 text-[17px] tracking-[-0.01em]">{SCORING_DIMENSIONS[key].label}</h4>
            <p className={cn(BODY, "mt-2")}>{SAMPLE_FEEDBACK[key]}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
