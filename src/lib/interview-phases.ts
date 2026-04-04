/** Live interview room phases (9 steps) — uppercase API / UI convention */

export const PHASE_ORDER = [
  "INTRO",
  "PROBLEM_PRESENTED",
  "CLARIFICATION",
  "APPROACH_DISCUSSION",
  "CODING",
  "TESTING",
  "COMPLEXITY_ANALYSIS",
  "FOLLOW_UP",
  "WRAP_UP",
] as const;

export type InterviewPhase = (typeof PHASE_ORDER)[number];

export const PHASE_LABELS: Record<InterviewPhase, string> = {
  INTRO: "Introduction",
  PROBLEM_PRESENTED: "Problem",
  CLARIFICATION: "Clarification",
  APPROACH_DISCUSSION: "Approach",
  CODING: "Coding",
  TESTING: "Testing",
  COMPLEXITY_ANALYSIS: "Complexity",
  FOLLOW_UP: "Follow-up",
  WRAP_UP: "Wrap-up",
};

export const PHASE_STEP: Record<InterviewPhase, number> = {
  INTRO: 1,
  PROBLEM_PRESENTED: 2,
  CLARIFICATION: 3,
  APPROACH_DISCUSSION: 4,
  CODING: 5,
  TESTING: 6,
  COMPLEXITY_ANALYSIS: 7,
  FOLLOW_UP: 8,
  WRAP_UP: 9,
};

/** Fraction of total duration at which each phase becomes the minimum (time floor). */
const PHASE_BOUNDARIES = {
  INTRO: 0 / 100,
  PROBLEM_PRESENTED: 2.2 / 100,
  CLARIFICATION: 4.4 / 100,
  APPROACH_DISCUSSION: 11.1 / 100,
  CODING: 26.7 / 100,
  TESTING: 71.1 / 100,
  COMPLEXITY_ANALYSIS: 82.2 / 100,
  FOLLOW_UP: 88.9 / 100,
  WRAP_UP: 95.6 / 100,
} as const;

export function phaseIndex(phase: InterviewPhase): number {
  return PHASE_ORDER.indexOf(phase);
}

/** Minimum phase implied by elapsed fraction of the interview (0–1). */
export function phaseFromElapsedFraction(pct: number): InterviewPhase {
  if (pct < PHASE_BOUNDARIES.PROBLEM_PRESENTED) return "INTRO";
  if (pct < PHASE_BOUNDARIES.CLARIFICATION) return "PROBLEM_PRESENTED";
  if (pct < PHASE_BOUNDARIES.APPROACH_DISCUSSION) return "CLARIFICATION";
  if (pct < PHASE_BOUNDARIES.CODING) return "APPROACH_DISCUSSION";
  if (pct < PHASE_BOUNDARIES.TESTING) return "CODING";
  if (pct < PHASE_BOUNDARIES.COMPLEXITY_ANALYSIS) return "TESTING";
  if (pct < PHASE_BOUNDARIES.FOLLOW_UP) return "COMPLEXITY_ANALYSIS";
  if (pct < PHASE_BOUNDARIES.WRAP_UP) return "FOLLOW_UP";
  return "WRAP_UP";
}

export function parseInterviewPhase(value: unknown): InterviewPhase | null {
  if (typeof value !== "string") return null;
  return (PHASE_ORDER as readonly string[]).includes(value) ? (value as InterviewPhase) : null;
}

/** Use the later of the two phases in the interview timeline (conversation vs. time floor). */
export function clampPhaseToTimeFloor(aiPhase: InterviewPhase, timeFloorPhase: InterviewPhase): InterviewPhase {
  const ai = phaseIndex(aiPhase);
  const t = phaseIndex(timeFloorPhase);
  return PHASE_ORDER[Math.max(ai, t)]!;
}

/** Comma-separated list for LLM prompts */
export const PHASE_ORDER_PROMPT_LIST = PHASE_ORDER.join(", ");
