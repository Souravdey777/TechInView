/**
 * Engineering Manager (hiring manager) round configuration.
 *
 * This is the go/no-go conversation with the manager who would own the
 * candidate's work: 30-45 minutes, no coding, no system design. The round is
 * shaped by three inputs the candidate picks at setup:
 *
 *  1. leadership focus areas (role fit, prioritization, stakeholders, ...)
 *  2. a *value lens* from `src/lib/interview-values.ts` — the value system the
 *     interviewer grades against, which also drives the competency report
 *  3. the candidate's current reporting scope, which decides whether team
 *     health and performance management are fair game at all
 *
 * Only the round-specific focus catalog lives here. The value frameworks are
 * shared with the Behavioral round and must not be duplicated.
 */

import { REVIEWED_HISTORICAL_QUESTIONS } from "@/data/historical-questions";
import { FULL_INTERVIEW_DURATION_MINUTES } from "@/lib/constants";
import {
  DEFAULT_VALUE_FRAMEWORK_ID,
  buildRoundValuesContext,
  getValueCompetencyLabels,
  getValueFramework,
  type ValueFrameworkId,
} from "@/lib/interview-values";
import type { HistoricalQuestion, RoundContextSnapshot } from "@/lib/loops/types";

export const ENGINEERING_MANAGER_DURATION_MINUTES = FULL_INTERVIEW_DURATION_MINUTES;

/** Focus-area chips shown on the round brief. Combined focus + competency labels. */
const MAX_ROUND_FOCUS_LABELS = 6;

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

/**
 * How much of a team the candidate currently leads. A hiring manager calibrates
 * on this in the first two minutes, and it changes what is legitimate to ask:
 * you do not question an IC about performance management, and you do not let a
 * people manager off with delivery stories only.
 */
export const ENGINEERING_MANAGER_REPORTING_SCOPES = [
  {
    value: "individual_contributor",
    label: "Individual contributor",
    description: "You own projects and influence peers, with no direct reports.",
    /** Candidate-facing one-liner for the round summary. */
    summaryLabel: "an individual contributor",
    promptHint:
      "The candidate is an individual contributor with no direct reports. Test influence without authority, ownership past their assigned scope, how they work with their own manager, and how they move partner teams they cannot instruct. Do not ask about performance management, headcount, or firing.",
  },
  {
    value: "tech_lead",
    label: "Tech lead",
    description: "You set technical direction for a team without formal reports.",
    summaryLabel: "a tech lead",
    promptHint:
      "The candidate is a tech lead without formal reports. Test how they set technical direction, delegate work they could have done faster themselves, unblock others, and balance their own delivery against the team's. Mentorship and raising the bar are fair game; formal performance management and headcount are not.",
  },
  {
    value: "manages_engineers",
    label: "Manages engineers",
    description: "You have direct reports and own team health as well as delivery.",
    summaryLabel: "an engineering manager with direct reports",
    promptHint:
      "The candidate manages engineers directly. Alongside delivery and prioritization, team health, hiring, delegation, growth conversations, underperformance, and protecting the team's focus are all fair game. Expect them to separate their own contribution from their team's output.",
  },
] as const;

export type EngineeringManagerReportingScopeId =
  (typeof ENGINEERING_MANAGER_REPORTING_SCOPES)[number]["value"];

export const DEFAULT_ENGINEERING_MANAGER_REPORTING_SCOPE: EngineeringManagerReportingScopeId =
  "individual_contributor";

export type EngineeringManagerReportingScope =
  (typeof ENGINEERING_MANAGER_REPORTING_SCOPES)[number];

export function getEngineeringManagerReportingScope(
  value?: string | null
): EngineeringManagerReportingScope {
  return (
    ENGINEERING_MANAGER_REPORTING_SCOPES.find((scope) => scope.value === value) ??
    ENGINEERING_MANAGER_REPORTING_SCOPES[0]
  );
}

export type EngineeringManagerSetupInput = {
  company?: string | null;
  roleTitle?: string | null;
  focusAreas: string[];
  /**
   * Value system the round is run and graded against. Optional so older callers
   * keep compiling; falls back to the default framework and its own defaults.
   */
  valueFrameworkId?: ValueFrameworkId | null;
  valueCompetencyIds?: string[];
  /** How much of a team the candidate leads today. Defaults to IC. */
  reportingScope?: EngineeringManagerReportingScopeId | null;
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
  company: string | null | undefined,
  focusAreas: string[] | undefined,
  competencyLabels: string[]
): HistoricalQuestion[] {
  const companySlug = normalizeCompany(company);
  const selectedOptions = resolveFocusOptions(focusAreas ?? []);
  const focusKeywords = [
    ...selectedOptions.flatMap((option) => option.keywords),
    // Competency labels double as ranking keywords, so an "Ownership"-heavy
    // value lens surfaces ownership-shaped historical questions.
    ...competencyLabels.map((label) => label.toLowerCase()),
  ];

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

/**
 * Interviewer brief for the round. Rendered into the live system prompt as
 * "Interviewer brief" alongside the shared value-lens block, so it deliberately
 * does *not* restate the selected competencies — that would double up with
 * `buildValuesPromptBlock`.
 */
function buildEngineeringManagerPrompt(
  contextLabel: string,
  focusLabels: string[],
  scope: EngineeringManagerReportingScope
) {
  const focusText =
    focusLabels.length > 0
      ? focusLabels.join(", ")
      : "role fit, prioritization, stakeholders, leadership";

  return `Run a ${ENGINEERING_MANAGER_DURATION_MINUTES}-minute, voice-first engineering manager round for a ${contextLabel}.

This is the hiring-manager conversation: effectively a go/no-go on whether you would take this person onto your team. It is not a coding round and not a system-design round.

Candidate scope: ${scope.promptHint}

Conversation contract:
- Ask exactly one high-signal question at a time, then stop and wait.
- Never ask the candidate to write code, sketch a system, or solve an algorithm puzzle.
- Ground every question in the candidate's real past work. Prefer "tell me about the time you..." over "how would you...".
- Technical questions here test judgment and tradeoff reasoning, not implementation fluency. Ask why a call was hard and what the alternatives cost, never how an API or a language feature works.
- Treat abstract philosophy, framework names, and polished slogans as incomplete answers. Ask once for the specific instance behind them, then move on if none exists.
- Push each story until you know four things: the candidate's own contribution as distinct from the team's, why the decision was genuinely hard, the measurable outcome, and what they would do differently. Ask for whichever of the four is missing.
- If prioritization is answered as a philosophy or a framework, ask for the last real time they had to make that call, what they dropped, and who was unhappy about it.
- Maintain a supportive tone with a senior hiring-manager bar. No lectures, no leading the candidate to the answer.

Round focus:
- Prioritize ${focusText}.
- Across the round, get evidence on role fit and motivation (why this team, this role, now), how they sequence roadmap against quality and debt, stakeholder and cross-functional alignment, conflict and escalation judgment, execution under ambiguity, and ownership or influence beyond their assigned scope.

Close of round:
- In the last few minutes, give one genuine strength tied to a specific moment in the conversation and one realistic gap.
- Then invite the candidate's own questions about the team, the role, or how you operate, and answer one of them briefly. What they choose to ask is itself signal: note it, do not steer it.`;
}

export function buildEngineeringManagerRoundContext(
  input: EngineeringManagerSetupInput
): RoundContextSnapshot {
  const company = trimOrNull(input.company);
  const roleTitle = trimOrNull(input.roleTitle);
  const focusLabels = getEngineeringManagerFocusLabels(input.focusAreas);
  const contextLabel = buildRoleContextLabel(company, roleTitle);
  const scope = getEngineeringManagerReportingScope(
    input.reportingScope ?? DEFAULT_ENGINEERING_MANAGER_REPORTING_SCOPE
  );

  const frameworkId = input.valueFrameworkId ?? DEFAULT_VALUE_FRAMEWORK_ID;
  const competencyIds = input.valueCompetencyIds ?? [];
  const framework = getValueFramework(frameworkId);
  const competencyLabels = getValueCompetencyLabels(frameworkId, competencyIds);
  const valuesContext = buildRoundValuesContext(frameworkId, competencyIds);

  const historicalQuestions = pickHistoricalQuestions(
    company,
    input.focusAreas,
    competencyLabels
  );

  // The brief shows the leadership focus first, then the value competencies the
  // report will grade, deduped and capped so the chip row stays readable.
  const roundFocusAreas = Array.from(
    new Set([
      ...(focusLabels.length > 0
        ? focusLabels
        : ["Role Fit", "Prioritization", "Stakeholders", "Leadership"]),
      ...competencyLabels,
    ])
  ).slice(0, MAX_ROUND_FOCUS_LABELS);

  return {
    id: `engineering-manager-${Date.now()}`,
    roundType: "hiring_manager",
    title:
      company || roleTitle
        ? `${[company, roleTitle].filter(Boolean).join(" · ")} Engineering Manager Round`
        : "Engineering Manager Round",
    summary: `A ${ENGINEERING_MANAGER_DURATION_MINUTES}-minute voice-first hiring-manager round for a ${contextLabel}, run as ${scope.summaryLabel}. Expect concrete questions on role fit, prioritization, stakeholder alignment, conflict, and the decisions you actually made — graded against ${framework.label}. No coding, and no hand-waving.`,
    rationale: `This mirrors the hiring-manager conversation where the bar is not coding output but whether the manager would take you onto the team: how clearly you explain impact, how you prioritize competing asks, how you move people who do not report to you, and whether your examples hold up under follow-up. Leadership signal is graded against ${framework.label}, and the round closes with your questions for the manager.`,
    confidence: historicalQuestions.length > 0 ? "high" : "medium",
    estimatedMinutes: ENGINEERING_MANAGER_DURATION_MINUTES,
    difficulty: null,
    focusAreas: roundFocusAreas,
    prompt: buildEngineeringManagerPrompt(contextLabel, focusLabels, scope),
    historicalQuestions,
    workspaceSections: [],
    valuesContext,
  };
}
