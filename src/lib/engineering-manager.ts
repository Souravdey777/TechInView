import { REVIEWED_HISTORICAL_QUESTIONS } from "@/data/historical-questions";
import type { HistoricalQuestion, RoundContextSnapshot } from "@/lib/loops/types";

export const ENGINEERING_MANAGER_DURATION_MINUTES = 35;

export const ENGINEERING_MANAGER_FOCUS_OPTIONS = [
  {
    value: "role_fit",
    label: "Role Fit",
    description: "Why this team, this role, and this timing make sense.",
    keywords: ["role fit", "motivation", "mission", "match"],
  },
  {
    value: "prioritization",
    label: "Prioritization",
    description: "How you choose between roadmap, quality, debt, and urgency.",
    keywords: ["prioritization", "priorities", "tradeoffs", "decision quality"],
  },
  {
    value: "stakeholders",
    label: "Stakeholders",
    description: "How you align product, design, leadership, and partner teams.",
    keywords: ["stakeholders", "cross-functional", "alignment", "communication"],
  },
  {
    value: "leadership",
    label: "Leadership",
    description: "Ownership, influence, autonomy, and raising the bar.",
    keywords: ["leadership", "ownership", "autonomy", "initiative"],
  },
  {
    value: "execution",
    label: "Execution",
    description: "Delivery under ambiguity, pressure, or changing constraints.",
    keywords: ["execution", "delivery", "ambiguity", "metrics"],
  },
  {
    value: "mentorship",
    label: "Mentorship",
    description: "Coaching, feedback, delegation, and team health.",
    keywords: ["mentorship", "coaching", "feedback", "team health"],
  },
  {
    value: "conflict",
    label: "Conflict",
    description: "Disagreement handling, influence, and escalation judgment.",
    keywords: ["conflict", "disagreement", "influence", "escalation"],
  },
] as const;

export type EngineeringManagerFocusId =
  (typeof ENGINEERING_MANAGER_FOCUS_OPTIONS)[number]["value"];

export const DEFAULT_ENGINEERING_MANAGER_FOCUS_AREAS: EngineeringManagerFocusId[] = [
  "role_fit",
  "prioritization",
  "stakeholders",
];

export type EngineeringManagerSetupInput = {
  company?: string | null;
  roleTitle?: string | null;
  focusAreas: string[];
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCompany(value?: string | null) {
  const slug = slugify(value ?? "");
  return slug.length > 0 ? slug : null;
}

function trimOrNull(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function buildRoleContextLabel(company?: string | null, roleTitle?: string | null) {
  const normalizedCompany = trimOrNull(company);
  const normalizedRole = trimOrNull(roleTitle);

  if (normalizedCompany && normalizedRole) {
    return `${normalizedRole} at ${normalizedCompany}`;
  }

  if (normalizedRole) {
    return normalizedRole;
  }

  if (normalizedCompany) {
    return `${normalizedCompany} engineering team`;
  }

  return "software engineering role";
}

function resolveFocusOptions(selectedValues: string[]) {
  const selectedSet = new Set(selectedValues);
  return ENGINEERING_MANAGER_FOCUS_OPTIONS.filter((option) => selectedSet.has(option.value));
}

function scoreHistoricalQuestion(
  question: HistoricalQuestion,
  companySlug: string | null,
  focusKeywords: string[]
) {
  const haystack = `${question.prompt} ${question.topics.join(" ")} ${question.jdTags.join(" ")}`.toLowerCase();
  const keywordMatches = focusKeywords.filter((keyword) => haystack.includes(keyword)).length;

  let score = question.confidence + keywordMatches * 2;

  if (companySlug && question.company === companySlug) {
    score += 5;
  } else if (question.company === "generic") {
    score += 1;
  }

  return score;
}

function pickHistoricalQuestions(
  company?: string | null,
  focusAreas?: string[]
): HistoricalQuestion[] {
  const companySlug = normalizeCompany(company);
  const selectedOptions = resolveFocusOptions(focusAreas ?? []);
  const focusKeywords = selectedOptions.flatMap((option) => option.keywords);

  const reviewed = REVIEWED_HISTORICAL_QUESTIONS.filter(
    (question) => question.reviewStatus === "reviewed" && question.roundType === "hiring_manager"
  );

  const exactMatches =
    companySlug === null
      ? []
      : reviewed.filter((question) => question.company === companySlug);

  const rankedExact = exactMatches
    .map((question) => ({
      question,
      score: scoreHistoricalQuestion(question, companySlug, focusKeywords),
    }))
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.question);

  if (rankedExact.length >= 3) {
    return rankedExact.slice(0, 3);
  }

  const fallbackPool = reviewed
    .filter((question) => question.company === "generic" || question.company !== companySlug)
    .map((question) => ({
      question,
      score: scoreHistoricalQuestion(question, companySlug, focusKeywords),
    }))
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.question);

  return [...rankedExact, ...fallbackPool].slice(0, 3);
}

export function getEngineeringManagerFocusLabels(focusAreas: string[]) {
  return resolveFocusOptions(focusAreas).map((option) => option.label);
}

export function buildEngineeringManagerRoundContext(
  input: EngineeringManagerSetupInput
): RoundContextSnapshot {
  const company = trimOrNull(input.company);
  const roleTitle = trimOrNull(input.roleTitle);
  const focusLabels = getEngineeringManagerFocusLabels(input.focusAreas);
  const contextLabel = buildRoleContextLabel(company, roleTitle);
  const historicalQuestions = pickHistoricalQuestions(company, input.focusAreas);

  return {
    id: `engineering-manager-${Date.now()}`,
    roundType: "hiring_manager",
    title:
      company || roleTitle
        ? `${[company, roleTitle].filter(Boolean).join(" · ")} Engineering Manager Round`
        : "Engineering Manager Round",
    summary: `A ${ENGINEERING_MANAGER_DURATION_MINUTES}-minute voice-first leadership round for a ${contextLabel}. Expect concrete questions on role fit, decision-making, stakeholder alignment, execution tradeoffs, and how you lead through ambiguity without hand-waving.`,
    rationale:
      "This mirrors the leadership or hiring-manager conversation where the bar is not coding output, but how clearly you explain impact, prioritize competing asks, influence partners, and back your decisions with real examples.",
    confidence: historicalQuestions.length > 0 ? "high" : "medium",
    estimatedMinutes: ENGINEERING_MANAGER_DURATION_MINUTES,
    difficulty: null,
    focusAreas:
      focusLabels.length > 0
        ? focusLabels
        : ["Role Fit", "Prioritization", "Stakeholders", "Leadership"],
    prompt: `Run a ${ENGINEERING_MANAGER_DURATION_MINUTES}-minute, voice-first engineering manager round for a ${contextLabel}. Ask one high-signal question at a time. Keep the interview grounded in concrete examples from the candidate's real work. Probe on role fit, leadership, prioritization, stakeholder management, tradeoffs, conflict handling, and execution under ambiguity. Do not ask the candidate to code. Challenge vague answers and ask for measurable outcomes or decision criteria when needed.`,
    historicalQuestions,
    workspaceSections: [],
  };
}
