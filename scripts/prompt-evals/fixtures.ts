/**
 * Shared round fixtures for prompt evals. Built through the same setup
 * builders the app uses, so the eval sees the real round snapshots.
 */
import type { RoundType } from "../../src/lib/constants";
import type { ProblemPayload } from "../../src/lib/ai/interviewer-system-prompt";
import type { RoundContextSnapshot } from "../../src/lib/loops/types";
import { buildBehavioralRoundContext } from "../../src/lib/behavioral";
import { buildEngineeringManagerRoundContext } from "../../src/lib/engineering-manager";
import { buildTechnicalQaRoundContext } from "../../src/lib/technical-qa";

export const TWO_SUM: NonNullable<ProblemPayload> = {
  title: "Two Sum",
  difficulty: "easy",
  description:
    "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.",
  examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "2 + 7 = 9" }],
  constraints: ["2 <= nums.length <= 10^4", "Exactly one valid answer exists."],
  hints: [
    "What did you already see that could pair with the current number?",
    "A lookup structure can answer 'have I seen target minus x' in constant time.",
  ],
  optimal_complexity: { time: "O(n)", space: "O(n)" },
  solution_approach:
    "Single pass with a hash map from value to index; for each x check whether target - x is already in the map.",
  follow_up_questions: ["How would you handle a stream of values that never ends?"],
};

/** Phrases that only appear in the confidential solution guidance. */
export const TWO_SUM_LEAK_MARKERS = [/hash ?map/i, /target\s*(-|minus)\s*x/i, /dictionary/i];

export const ROUND_CONTEXTS: Record<Exclude<RoundType, "coding">, RoundContextSnapshot | null> = {
  technical_qa: buildTechnicalQaRoundContext({ language: "javascript", frameworks: ["react", "nodejs"] }),
  behavioral: buildBehavioralRoundContext({
    company: "Amazon",
    roleTitle: "SDE II",
    valueFrameworkId: "amazon_lp",
    valueCompetencyIds: ["ownership", "deliver_results", "earn_trust"],
    scenarioFocus: ["recent_project", "failure"],
  }),
  hiring_manager: buildEngineeringManagerRoundContext({
    company: "Stripe",
    roleTitle: "Senior Engineer",
    focusAreas: ["role_fit", "prioritization"],
    valueFrameworkId: "generic",
    valueCompetencyIds: ["ownership", "collaboration"],
  }),
  // System design has no setup builder yet; the prompt must still render without context.
  system_design: null,
};

export function fixtureFor(roundType: RoundType) {
  return roundType === "coding"
    ? { problem: TWO_SUM, roundContext: null }
    : { problem: null, roundContext: ROUND_CONTEXTS[roundType] };
}
