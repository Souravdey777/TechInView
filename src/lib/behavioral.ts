import { REVIEWED_HISTORICAL_QUESTIONS } from "@/data/historical-questions";
import { FULL_INTERVIEW_DURATION_MINUTES } from "@/lib/constants";
import {
  buildRoundValuesContext,
  getValueCompetencyLabels,
  getValueFramework,
  type ValueFrameworkId,
} from "@/lib/interview-values";
import { getWorkspaceSections } from "@/lib/loops/round-config";
import type { HistoricalQuestion, RoundContextSnapshot } from "@/lib/loops/types";

export const BEHAVIORAL_DURATION_MINUTES = FULL_INTERVIEW_DURATION_MINUTES;

/**
 * Story context the candidate wants to rehearse. These are deliberately *not*
 * competencies: the value lens (see `@/lib/interview-values`) decides what is
 * graded, while a scenario decides which part of the candidate's history the
 * interviewer pulls stories from.
 */
export const BEHAVIORAL_SCENARIO_OPTIONS = [
  {
    value: "recent_project",
    label: "Recent Project",
    description: "Your most recent significant piece of work, end to end.",
    keywords: ["ownership", "delivery", "project", "impact"],
  },
  {
    value: "cross_team",
    label: "Cross-Team Work",
    description: "Work that only landed because other teams moved with you.",
    keywords: ["cross-functional", "collaboration", "stakeholders", "alignment"],
  },
  {
    value: "failure",
    label: "Failure Or Outage",
    description: "Something that broke, and what you did during and after.",
    keywords: ["failure", "outage", "incident", "mistake"],
  },
  {
    value: "conflict",
    label: "Disagreement",
    description: "A real disagreement with a peer, a manager, or a partner team.",
    keywords: ["conflict", "disagreement", "escalation", "influence"],
  },
  {
    value: "underperformance",
    label: "Struggling Teammate Or Process",
    description: "A person or a process that was not working, and how you handled it.",
    keywords: ["feedback", "mentorship", "team health", "process"],
  },
  {
    value: "scope_cut",
    label: "Hard Deadline",
    description: "Delivery against a date that forced you to cut something.",
    keywords: ["deadline", "tradeoffs", "prioritization", "quality"],
  },
  {
    value: "influence",
    label: "Change Without Authority",
    description: "Driving a change you had no mandate to make.",
    keywords: ["influence", "leadership", "initiative", "ambiguity"],
  },
] as const;

export type BehavioralScenarioId = (typeof BEHAVIORAL_SCENARIO_OPTIONS)[number]["value"];

export const DEFAULT_BEHAVIORAL_SCENARIO_FOCUS: BehavioralScenarioId[] = [
  "recent_project",
  "cross_team",
  "conflict",
];

/** Number of scenario contexts a 45-minute round can realistically draw on. */
export const MAX_BEHAVIORAL_SCENARIOS = 4;

export type BehavioralSetupInput = {
  company?: string | null;
  roleTitle?: string | null;
  valueFrameworkId: ValueFrameworkId;
  valueCompetencyIds: string[];
  scenarioFocus: string[];
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

function resolveScenarioOptions(selectedValues: readonly string[]) {
  const selectedSet = new Set(selectedValues);
  return BEHAVIORAL_SCENARIO_OPTIONS.filter((option) => selectedSet.has(option.value));
}

export function getBehavioralScenarioLabels(scenarioFocus: readonly string[]) {
  return resolveScenarioOptions(scenarioFocus).map((option) => option.label);
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

/**
 * Reviewed behavioural questions, ranked by company match and by how well they
 * line up with the selected scenarios and competencies. Only reviewed rows are
 * used, so this can legitimately come back empty.
 */
function pickHistoricalQuestions(
  company: string | null,
  focusKeywords: string[]
): HistoricalQuestion[] {
  const companySlug = normalizeCompany(company);

  const reviewed = REVIEWED_HISTORICAL_QUESTIONS.filter(
    (question) => question.reviewStatus === "reviewed" && question.roundType === "behavioral"
  );

  const rank = (questions: HistoricalQuestion[]) =>
    questions
      .map((question) => ({
        question,
        score: scoreHistoricalQuestion(question, companySlug, focusKeywords),
      }))
      .sort((left, right) => right.score - left.score)
      .map((entry) => entry.question);

  const rankedExact =
    companySlug === null
      ? []
      : rank(reviewed.filter((question) => question.company === companySlug));

  if (rankedExact.length >= 3) {
    return rankedExact.slice(0, 3);
  }

  const fallbackPool = rank(
    reviewed.filter((question) => question.company !== companySlug)
  );

  return [...rankedExact, ...fallbackPool].slice(0, 3);
}

function buildBehavioralPrompt(
  contextLabel: string,
  frameworkLabel: string,
  scenarioLabels: string[]
) {
  const scenarioBlock =
    scenarioLabels.length > 0
      ? `

Story context the candidate came to rehearse:
- ${scenarioLabels.join("\n- ")}
- When a competency fits more than one of these, pull the story from this list. Never force a scenario onto a competency it does not test.`
      : "";

  return `Run a ${BEHAVIORAL_DURATION_MINUTES}-minute, voice-first behavioural interview for a ${contextLabel}. This round is graded against the value lens below (${frameworkLabel}).

Round contract:
- Ask four to six behavioural questions across the session, each with its own follow-ups. Do not exceed that: depth on one story beats coverage of six.
- Anchor every question to exactly one competency from the value lens. Never bundle two competencies into one question.
- Phrase questions as a request for one specific past event: "tell me about a time...", "walk me through a specific situation where...". Do not ask hypotheticals, and do not name the competency as a label the candidate can play back to you.
- Expect answers in STAR shape: the situation, what the candidate was responsible for, what they personally did, and the result. If a part is missing, ask for that part before you move on.
- Ask exactly one question per turn, then stop speaking and wait.
- Do not ask the candidate to code. There is no editor in this round.

Follow-ups are mandatory. Before leaving a story, make these four things clear:
1. The candidate's own contribution, separated from what the team did.
2. What actually made it hard: the tradeoff, the constraint, or who pushed back and what their argument was.
3. The measurable result. If they gave no number, ask for the number and how it was measured.
4. The hindsight: what they would do differently, and what they would need to have known.
Two or three follow-ups per question is normal. Use probes like "what was your specific role?", "who disagreed with you and what was their case?", "what was the metric exactly?", "what data did you not have that would have changed your decision?".

Evidence bar:
- Past behaviour is the only evidence. A polished, confident answer with no specific instance is missing evidence, not a strong answer.
- If the candidate answers in generalities or in "we", ask once for a specific instance and their own part in it, then move on if none exists.
- Take "I don't know" or "we never measured it" at face value without penalising honesty. Note the gap and continue.
- Work through the competencies in the order they are listed, moving on once you have real evidence or have established that there is none. Do not skim all of them in the last five minutes.${scenarioBlock}`;
}

export function buildBehavioralRoundContext(
  input: BehavioralSetupInput
): RoundContextSnapshot {
  const company = trimOrNull(input.company);
  const roleTitle = trimOrNull(input.roleTitle);
  const framework = getValueFramework(input.valueFrameworkId);
  const valuesContext = buildRoundValuesContext(
    input.valueFrameworkId,
    input.valueCompetencyIds
  );
  const competencyLabels = getValueCompetencyLabels(
    input.valueFrameworkId,
    input.valueCompetencyIds
  );
  const scenarioLabels = getBehavioralScenarioLabels(input.scenarioFocus);
  const contextLabel = buildRoleContextLabel(company, roleTitle);
  const focusKeywords = [
    ...resolveScenarioOptions(input.scenarioFocus).flatMap((option) => option.keywords),
    ...competencyLabels.map((label) => label.toLowerCase()),
  ];
  const historicalQuestions = pickHistoricalQuestions(company, focusKeywords);
  const titlePrefix = [company, roleTitle].filter(Boolean).join(" · ");

  return {
    id: `behavioral-${Date.now()}`,
    roundType: "behavioral",
    title: titlePrefix ? `${titlePrefix} Behavioral Round` : "Behavioral Round",
    summary: `A ${BEHAVIORAL_DURATION_MINUTES}-minute voice-first behavioural round for a ${contextLabel}, graded against ${framework.label}. Expect four to six "tell me about a time" questions, each pushed with follow-ups until your own contribution, the hard part, the measurable result, and your hindsight are clear.`,
    rationale:
      "This mirrors the dedicated behavioural round in a real loop: no coding, one competency per question, and an interviewer who keeps probing until the story is specific enough to grade. Vague, team-level, or unmeasured answers are the most common reason strong engineers lose this round.",
    confidence: historicalQuestions.length > 0 ? "high" : "medium",
    estimatedMinutes: BEHAVIORAL_DURATION_MINUTES,
    difficulty: null,
    focusAreas: [...competencyLabels, ...scenarioLabels].slice(0, 6),
    prompt: buildBehavioralPrompt(contextLabel, framework.label, scenarioLabels),
    historicalQuestions,
    workspaceSections: getWorkspaceSections("behavioral"),
    valuesContext,
  };
}
