export const SUPPORTED_LANGUAGES = ["python", "javascript", "java", "cpp"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_CONFIG: Record<
  SupportedLanguage,
  { label: string; monacoId: string; pistonId: string; version: string }
> = {
  python: { label: "Python 3", monacoId: "python", pistonId: "python", version: "3.10.0" },
  javascript: { label: "JavaScript", monacoId: "javascript", pistonId: "javascript", version: "18.15.0" },
  java: { label: "Java", monacoId: "java", pistonId: "java", version: "15.0.2" },
  cpp: { label: "C++", monacoId: "cpp", pistonId: "c++", version: "10.2.0" },
};

export const INTERVIEW_PHASES = [
  "intro",
  "problem_presented",
  "clarification",
  "approach",
  "coding",
  "testing",
  "complexity",
  "wrapup",
  "completed",
] as const;
export type InterviewPhase = (typeof INTERVIEW_PHASES)[number];

export const PHASE_LABELS: Record<InterviewPhase, string> = {
  intro: "Introduction",
  problem_presented: "Problem Presented",
  clarification: "Clarification",
  approach: "Approach Discussion",
  coding: "Coding",
  testing: "Testing",
  complexity: "Complexity Analysis",
  wrapup: "Wrap Up",
  completed: "Completed",
};

export const SCORING_DIMENSIONS = {
  problem_solving: { label: "Problem Solving", weight: 0.30, description: "Clarification, approach, edge cases" },
  code_quality: { label: "Code Quality", weight: 0.25, description: "Readability, naming, idioms" },
  communication: { label: "Communication", weight: 0.20, description: "Thinking aloud, structured explanation" },
  technical_knowledge: { label: "Technical Knowledge", weight: 0.15, description: "Complexity analysis, trade-offs" },
  testing: { label: "Testing", weight: 0.10, description: "Edge cases, proactive testing" },
} as const;

export type ScoringDimension = keyof typeof SCORING_DIMENSIONS;

export const MAX_INTERVIEW_DURATION = 2700;
export const FREE_INTERVIEWS_PER_WEEK = 1;

export const HIRE_RECOMMENDATIONS = ["strong_hire", "hire", "lean_hire", "lean_no_hire", "no_hire"] as const;
export type HireRecommendation = (typeof HIRE_RECOMMENDATIONS)[number];

export const HIRE_RECOMMENDATION_CONFIG: Record<HireRecommendation, { label: string; minScore: number; color: string }> = {
  strong_hire: { label: "Strong Hire", minScore: 85, color: "text-brand-green" },
  hire: { label: "Hire", minScore: 70, color: "text-brand-green" },
  lean_hire: { label: "Lean Hire", minScore: 55, color: "text-brand-amber" },
  lean_no_hire: { label: "Lean No Hire", minScore: 40, color: "text-brand-rose" },
  no_hire: { label: "No Hire", minScore: 0, color: "text-brand-rose" },
};

export const PROBLEM_CATEGORIES = [
  "arrays", "strings", "trees", "graphs", "dp",
  "linked-lists", "stacks-queues", "binary-search", "heap", "backtracking",
] as const;
export type ProblemCategory = (typeof PROBLEM_CATEGORIES)[number];

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; color: string; bgColor: string }> = {
  easy: { label: "Easy", color: "text-brand-green", bgColor: "bg-brand-green/10" },
  medium: { label: "Medium", color: "text-brand-amber", bgColor: "bg-brand-amber/10" },
  hard: { label: "Hard", color: "text-brand-rose", bgColor: "bg-brand-rose/10" },
};
