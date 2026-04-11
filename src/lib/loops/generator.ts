import {
  type DifficultyLevel,
  type InterviewMode,
  type RoundType,
  type SupportedLanguage,
} from "@/lib/constants";
import {
  DEFAULT_INTERVIEWER_PERSONA,
  type InterviewerPersonaId,
  isCompanyPersonaId,
} from "@/lib/interviewer-personas";
import { REVIEWED_HISTORICAL_QUESTIONS } from "@/data/historical-questions";
import { getWorkspaceSections } from "./round-config";
import type {
  GeneratedLoop,
  GeneratedLoopRound,
  HistoricalQuestion,
  LoopGenerationInput,
  LoopSummarySnapshot,
  RoundContextSnapshot,
} from "./types";
import type { ExperienceLevel } from "@/types";

const SIGNAL_KEYWORDS: Record<string, string[]> = {
  ownership: ["ownership", "own", "drive", "leader", "lead", "initiative"],
  platform: ["platform", "infrastructure", "backend", "api", "services"],
  frontend: ["frontend", "react", "ui", "web"],
  distributed_systems: ["distributed", "scale", "latency", "throughput", "queue", "stream"],
  product: ["product", "customers", "user experience", "product managers"],
  experimentation: ["experimentation", "ab test", "metrics", "data driven"],
  leadership: ["mentor", "leadership", "staff", "cross-functional"],
};

const SIMILAR_COMPANY_CLUSTERS: Record<string, string[]> = {
  google: ["google", "youtube", "linkedin", "microsoft", "stripe"],
  meta: ["meta", "facebook", "instagram", "uber", "doordash"],
  amazon: ["amazon", "aws", "oracle", "salesforce"],
  apple: ["apple", "adobe", "nvidia"],
  netflix: ["netflix", "airbnb", "coinbase"],
};

const DEFAULT_LANGUAGE: SupportedLanguage = "python";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeCompany(company: string): string {
  const slug = slugify(company);
  if (!slug) return "generic";
  return slug;
}

export function chooseLoopPersonaId(company: string): InterviewerPersonaId {
  if (isCompanyPersonaId(company)) return company;

  for (const [personaId, companies] of Object.entries(SIMILAR_COMPANY_CLUSTERS)) {
    if (companies.includes(company)) {
      return personaId as InterviewerPersonaId;
    }
  }

  return DEFAULT_INTERVIEWER_PERSONA;
}

export function extractJdSignals(jdText: string, roleTitle: string): string[] {
  const haystack = `${roleTitle}\n${jdText}`.toLowerCase();
  const signals = new Set<string>();

  for (const [signal, keywords] of Object.entries(SIGNAL_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      signals.add(signal);
    }
  }

  if (roleTitle.toLowerCase().includes("staff") || roleTitle.toLowerCase().includes("principal")) {
    signals.add("leadership");
    signals.add("distributed_systems");
  }

  return Array.from(signals);
}

function shouldIncludeSystemDesign(experienceLevel: ExperienceLevel, jdSignals: string[]): boolean {
  if (experienceLevel === "senior" || experienceLevel === "staff") return true;
  return jdSignals.some((signal) =>
    signal === "distributed_systems" || signal === "platform" || signal === "leadership"
  );
}

function difficultyForExperience(experienceLevel: ExperienceLevel): DifficultyLevel {
  if (experienceLevel === "junior") return "easy";
  if (experienceLevel === "mid") return "medium";
  return "hard";
}

function roundDuration(roundType: RoundType): number {
  if (roundType === "system_design") return 50;
  if (roundType === "hiring_manager") return 35;
  if (roundType === "behavioral") return 30;
  return 45;
}

function matchesCompany(question: HistoricalQuestion, company: string): boolean {
  if (question.company === company) return true;
  const cluster = Object.values(SIMILAR_COMPANY_CLUSTERS).find((companies) => companies.includes(company));
  return Boolean(cluster && cluster.includes(question.company));
}

function pickHistoricalQuestions(
  company: string,
  roundType: RoundType,
  experienceLevel: ExperienceLevel,
  jdSignals: string[],
): {
  questions: HistoricalQuestion[];
  usedFallback: boolean;
} {
  const reviewed = REVIEWED_HISTORICAL_QUESTIONS.filter((question) => question.reviewStatus === "reviewed");
  const exact = reviewed.filter(
    (question) =>
      question.company === company &&
      question.roundType === roundType &&
      question.levelBand === experienceLevel
  );

  const exactOrLowerBand = exact.length > 0
    ? exact
    : reviewed.filter(
        (question) =>
          question.company === company &&
          question.roundType === roundType
      );

  const ranked = exactOrLowerBand
    .map((question) => ({
      question,
      score:
        question.jdTags.filter((tag) => jdSignals.includes(tag)).length * 4 +
        question.topics.filter((topic) => jdSignals.includes(topic)).length * 3 +
        question.confidence,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.question);

  if (ranked.length > 0) {
    return { questions: ranked.slice(0, 3), usedFallback: false };
  }

  const fallback = reviewed
    .filter((question) => question.roundType === roundType && matchesCompany(question, company))
    .sort((a, b) => b.confidence - a.confidence);

  return { questions: fallback.slice(0, 3), usedFallback: true };
}

function roundSummary(roundType: RoundType, company: string, roleTitle: string, jdSignals: string[]): string {
  if (roundType === "coding") {
    return `A ${company} style coding round tuned for ${roleTitle}, with prompts biased toward ${jdSignals.slice(0, 2).join(" and ") || "core problem solving"}.`;
  }
  if (roundType === "behavioral") {
    return `Behavioral practice focused on the stories and ownership signals this role is likely to probe.`;
  }
  if (roundType === "hiring_manager") {
    return `An engineering manager conversation centered on role fit, priorities, leadership, and decision quality for this job.`;
  }
  return `A system design round shaped around architecture, tradeoffs, and scale signals from the job description.`;
}

function roundRationale(roundType: RoundType, company: string, roleTitle: string, jdSignals: string[]): string {
  if (roundType === "coding") {
    return `Historical reports for ${company} still show coding as the core bar for ${roleTitle}, so the loop starts with a problem-solving screen before broader evaluation.`;
  }
  if (roundType === "behavioral") {
    return `The job description stresses collaboration and ownership, so a behavioral round is included to practice signal beyond pure implementation.`;
  }
  if (roundType === "hiring_manager") {
    return `An engineering manager screen is likely because this role needs clear judgment, prioritization, leadership, and role-fit communication.`;
  }
  return jdSignals.includes("distributed_systems") || jdSignals.includes("platform")
    ? `Architecture and scale signals in the JD strongly suggest a design round should be part of this loop.`
    : `Senior SWE loops at ${company} commonly include a design discussion, so the loop includes one here.`;
}

function roundPrompt(roundType: RoundType, roleTitle: string, company: string, jdSignals: string[]): string {
  if (roundType === "coding") {
    return `Run this as a realistic ${company}-style coding interview for a ${roleTitle}. Push for a clear approach, tight execution, good edge-case handling, and concise tradeoff explanations.`;
  }
  if (roundType === "behavioral") {
    return `Run this as a behavioral interview for a ${roleTitle}. Ask for concrete stories, probe for ownership and collaboration, and keep pressing until the candidate gives specific actions, results, and lessons.`;
  }
  if (roundType === "hiring_manager") {
    return `Run this as an engineering manager round for a ${roleTitle}. Focus on role fit, prioritization, judgment, stakeholder management, and why the candidate is a strong match for the team.`;
  }
  return `Run this as a system design interview for a ${roleTitle}. Start with requirements, then architecture, data flow, bottlenecks, tradeoffs, and scaling. Probe especially on ${jdSignals.join(", ") || "system design fundamentals"}.`;
}

function focusAreasForRound(roundType: RoundType, jdSignals: string[]): string[] {
  if (roundType === "coding") {
    return ["clarity under pressure", "edge-case coverage", "clean implementation"];
  }
  if (roundType === "behavioral") {
    return ["clear ownership", "specific actions", "measurable results"];
  }
  if (roundType === "hiring_manager") {
    return ["role fit", "prioritization", "decision quality"];
  }

  const areas = ["requirements", "high-level design", "tradeoffs", "scaling plan"];
  if (jdSignals.includes("distributed_systems")) areas.push("reliability");
  return Array.from(new Set(areas));
}

export function buildLoopSummary(loop: GeneratedLoop): LoopSummarySnapshot {
  return {
    id: loop.id,
    loopName: loop.loopName,
    company: loop.company,
    roleTitle: loop.roleTitle,
    experienceLevel: loop.experienceLevel,
    rounds: loop.rounds.map((round) => ({
      id: round.id,
      order: round.order,
      roundType: round.roundType,
      title: round.title,
    })),
    jdSignals: loop.jdSignals,
  };
}

export function buildRoundContextSnapshot(round: GeneratedLoopRound): RoundContextSnapshot {
  return {
    id: round.id,
    roundType: round.roundType,
    title: round.title,
    summary: round.summary,
    rationale: round.rationale,
    confidence: round.confidence,
    estimatedMinutes: round.estimatedMinutes,
    difficulty: round.difficulty,
    focusAreas: round.focusAreas,
    prompt: round.prompt,
    historicalQuestions: round.historicalQuestions,
    workspaceSections: round.workspaceSections,
  };
}

function buildRound(
  company: string,
  roleTitle: string,
  roundType: RoundType,
  order: number,
  experienceLevel: ExperienceLevel,
  jdSignals: string[],
): {
  round: GeneratedLoopRound;
  usedFallback: boolean;
} {
  const { questions, usedFallback } = pickHistoricalQuestions(
    company,
    roundType,
    experienceLevel,
    jdSignals,
  );

  const round: GeneratedLoopRound = {
    id: `${roundType}-${order}`,
    order,
    roundType,
    title:
      roundType === "coding"
        ? `Coding Round ${order}`
        : roundType === "behavioral"
          ? "Behavioral Loop"
          : roundType === "hiring_manager"
            ? "Engineering Manager Round"
            : "System Design Round",
    summary: roundSummary(roundType, company, roleTitle, jdSignals),
    rationale: roundRationale(roundType, company, roleTitle, jdSignals),
    confidence: usedFallback ? "medium" : "high",
    estimatedMinutes: roundDuration(roundType),
    difficulty: roundType === "coding" ? difficultyForExperience(experienceLevel) : null,
    focusAreas: focusAreasForRound(roundType, jdSignals),
    prompt: roundPrompt(roundType, roleTitle, company, jdSignals),
    historicalQuestions: questions,
    workspaceSections: getWorkspaceSections(roundType),
  };

  return { round, usedFallback };
}

export function generateTargetedLoop(input: LoopGenerationInput): GeneratedLoop {
  const company = normalizeCompany(input.company);
  const roleTitle = input.roleTitle.trim() || "Software Engineer";
  const jdText = input.jdText.trim();
  const jdSignals = extractJdSignals(jdText, roleTitle);
  const personaId = chooseLoopPersonaId(company);
  const includeDesign = shouldIncludeSystemDesign(input.experienceLevel, jdSignals);
  const roundSequence: RoundType[] = includeDesign
    ? ["coding", "system_design", "behavioral", "hiring_manager"]
    : ["coding", "coding", "behavioral", "hiring_manager"];

  let usedAnyFallback = false;
  const rounds = roundSequence.map((roundType, index) => {
    const { round, usedFallback } = buildRound(
      company,
      roleTitle,
      roundType,
      index + 1,
      input.experienceLevel,
      jdSignals,
    );
    if (usedFallback) usedAnyFallback = true;
    return round;
  });

  const createdAt = new Date().toISOString();
  const loopId = `loop-${slugify(company)}-${slugify(roleTitle)}-${createdAt.slice(0, 10)}`;

  return {
    id: loopId,
    mode: "targeted_loop" as InterviewMode,
    loopName: `${input.company} ${roleTitle} loop`,
    company,
    roleTitle,
    experienceLevel: input.experienceLevel,
    jdText,
    jdSignals,
    summary: includeDesign
      ? `This loop mixes coding, system design, behavioral, and hiring-manager practice because the role signals both implementation depth and architectural ownership.`
      : `This loop prioritizes two coding rounds plus behavioral and hiring-manager practice because the role reads like an execution-heavy SWE IC loop.`,
    confidence: usedAnyFallback ? "medium" : "high",
    personaId,
    similarCompanyFallback: usedAnyFallback,
    rounds,
    createdAt,
  };
}

export function sanitizeJdText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildLoopStartPayload(
  loop: GeneratedLoop,
  round: GeneratedLoopRound,
  language: SupportedLanguage = DEFAULT_LANGUAGE,
) {
  return {
    mode: "targeted_loop" as InterviewMode,
    roundType: round.roundType,
    language,
    difficulty: round.difficulty ?? undefined,
    generatedLoopId: loop.id,
    generatedLoopRoundId: round.id,
    generatedLoopSummary: buildLoopSummary(loop),
    generatedLoopRoundSnapshot: buildRoundContextSnapshot(round),
    interviewerPersona: loop.personaId,
  };
}
