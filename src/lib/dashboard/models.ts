export const PRACTICE_INTERVIEW_KINDS = [
  "dsa",
  "machine_coding",
  "system_design",
  "technical_qa",
  "engineering_manager",
  "behavioral",
] as const;

export type PracticeInterviewKind = (typeof PRACTICE_INTERVIEW_KINDS)[number];

export const DASHBOARD_FILTERS = [
  "all",
  ...PRACTICE_INTERVIEW_KINDS,
  "prep_plans",
] as const;

export type DashboardFilter = (typeof DASHBOARD_FILTERS)[number];

export type PracticeAvailability = "live" | "beta" | "planned" | "coming_soon";

export type PracticeCardConfig = {
  kind: PracticeInterviewKind;
  label: string;
  shortDescription: string;
  status: PracticeAvailability;
  href: string;
  setupHighlights: string[];
  ctaLabel: string;
};

export const DASHBOARD_FILTER_LABELS: Record<DashboardFilter, string> = {
  all: "All",
  dsa: "DSA",
  machine_coding: "Machine Coding",
  system_design: "System Design",
  technical_qa: "Technical Q&A",
  engineering_manager: "Engineering Manager",
  behavioral: "Behavioral",
  prep_plans: "Prep Plans",
};

export const PRACTICE_CARD_CONFIGS: readonly PracticeCardConfig[] = [
  {
    kind: "dsa",
    label: "DSA",
    shortDescription: "Choose persona, problem, difficulty, and category for coding-interview prep.",
    status: "live",
    href: "/interviews/dsa/setup",
    setupHighlights: ["Persona", "Problem", "Difficulty", "Category"],
    ctaLabel: "Open DSA setup",
  },
  {
    kind: "machine_coding",
    label: "Machine Coding",
    shortDescription: "Practice FE, BE, or FS build rounds with persona, stack, and problem setup.",
    status: "coming_soon",
    href: "/interviews/machine-coding/setup",
    setupHighlights: ["Persona", "Stack", "Problem"],
    ctaLabel: "Machine coding coming soon",
  },
  {
    kind: "system_design",
    label: "System Design",
    shortDescription: "Practice design rounds with persona, stack, and system-design prompts.",
    status: "coming_soon",
    href: "/interviews/system-design/setup",
    setupHighlights: ["Persona", "Stack", "Prompt"],
    ctaLabel: "System design coming soon",
  },
  {
    kind: "technical_qa",
    label: "Technical Q&A",
    shortDescription: "Choose languages and frameworks, then answer domain-specific technical questions.",
    status: "coming_soon",
    href: "/interviews/technical-qa/setup",
    setupHighlights: ["Languages", "Frameworks", "Expertise"],
    ctaLabel: "Technical Q&A coming soon",
  },
  {
    kind: "engineering_manager",
    label: "Engineering Manager",
    shortDescription: "Practice voice-first leadership, prioritization, and stakeholder questions grounded in your target role.",
    status: "coming_soon",
    href: "/interviews/engineering-manager/setup",
    setupHighlights: ["Role context", "Leadership", "Stakeholder tradeoffs"],
    ctaLabel: "Engineering manager coming soon",
  },
  {
    kind: "behavioral",
    label: "Behavioral",
    shortDescription: "Practice general behavioral scenarios with structured follow-ups and coaching.",
    status: "coming_soon",
    href: "/interviews/behavioral/setup",
    setupHighlights: ["Scenarios", "Persona", "Role context"],
    ctaLabel: "Behavioral coming soon",
  },
] as const;

export type PrepPlanTrackStatus = "not_started" | "in_progress" | "completed";

export type PrepPlanTrack = {
  kind: PracticeInterviewKind;
  title?: string;
  rationale?: string;
  status: PrepPlanTrackStatus;
  progressPercent: number;
  priority: "core" | "supporting";
  questionCount: number;
  nextActionLabel: string;
};

export type PrepPlanStatus = "active" | "completed";

export type PrepPlanSummary = {
  id: string;
  label: string;
  company: string;
  role: string;
  jdText: string;
  jdSignals: string[];
  planSummary?: string;
  status: PrepPlanStatus;
  createdAt: string;
  updatedAt: string;
  nextRecommendedKind: PracticeInterviewKind;
  nextActionLabel: string;
  tracks: PrepPlanTrack[];
};

export type DashboardPracticeItem = {
  id: string;
  kind: PracticeInterviewKind;
  title: string;
  subtitle: string;
  score: number | null;
  status: "completed" | "abandoned" | "in_progress";
  startedAt: string;
  durationSeconds: number | null;
};

export type DashboardActivityItem =
  | {
      id: string;
      type: "practice";
      filter: PracticeInterviewKind;
      title: string;
      subtitle: string;
      timestamp: string;
      href: string;
      statusLabel: string;
      score: number | null;
    }
  | {
      id: string;
      type: "prep_plan";
      filter: "prep_plans";
      relatedKind: PracticeInterviewKind;
      title: string;
      subtitle: string;
      timestamp: string;
      href: string;
      statusLabel: string;
    };

export function getPracticeCard(kind: PracticeInterviewKind) {
  return PRACTICE_CARD_CONFIGS.find((item) => item.kind === kind);
}

export function getPracticeKindLabel(kind: PracticeInterviewKind) {
  return DASHBOARD_FILTER_LABELS[kind];
}

export function mapInterviewToKind(
  mode: string | null | undefined,
  roundType: string | null | undefined
): PracticeInterviewKind {
  if (roundType === "technical_qa") return "technical_qa";
  if (roundType === "system_design") return "system_design";
  if (roundType === "behavioral") return "behavioral";
  if (roundType === "hiring_manager") return "engineering_manager";

  if (mode === "targeted_loop" && roundType === "coding") {
    return "dsa";
  }

  return "dsa";
}

export function getPracticeResultsHref(kind: PracticeInterviewKind, interviewId: string) {
  if (kind === "technical_qa") {
    return `/interviews/technical-qa/results/${interviewId}`;
  }

  if (kind === "engineering_manager") {
    return `/interviews/engineering-manager/results/${interviewId}`;
  }

  return `/results/${interviewId}`;
}
