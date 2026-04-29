import { getWorkspaceSections } from "@/lib/loops/round-config";
import { FULL_INTERVIEW_DURATION_MINUTES } from "@/lib/constants";
import type { RoundContextSnapshot } from "@/lib/loops/types";

export const TECHNICAL_QA_DURATION_MINUTES = FULL_INTERVIEW_DURATION_MINUTES;

export const TECHNICAL_QA_LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript / TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
] as const;

export type TechnicalQaLanguage = (typeof TECHNICAL_QA_LANGUAGE_OPTIONS)[number]["value"];

export const TECHNICAL_QA_FRAMEWORK_OPTIONS = {
  javascript: [
    { value: "react", label: "React" },
    { value: "nextjs", label: "Next.js" },
    { value: "nodejs", label: "Node.js" },
    { value: "express", label: "Express" },
    { value: "nestjs", label: "NestJS" },
    { value: "graphql", label: "GraphQL" },
  ],
  python: [
    { value: "django", label: "Django" },
    { value: "fastapi", label: "FastAPI" },
    { value: "flask", label: "Flask" },
    { value: "sqlalchemy", label: "SQLAlchemy" },
    { value: "celery", label: "Celery" },
    { value: "pandas", label: "Pandas" },
  ],
  java: [
    { value: "spring-boot", label: "Spring Boot" },
    { value: "hibernate", label: "Hibernate" },
    { value: "kafka", label: "Kafka" },
    { value: "junit", label: "JUnit" },
    { value: "microservices", label: "Microservices" },
    { value: "grpc", label: "gRPC" },
  ],
  cpp: [
    { value: "stl", label: "STL" },
    { value: "multithreading", label: "Multithreading" },
    { value: "memory-management", label: "Memory Management" },
    { value: "networking", label: "Networking" },
    { value: "performance", label: "Performance Tuning" },
  ],
} as const satisfies Record<TechnicalQaLanguage, readonly { value: string; label: string }[]>;

export type TechnicalQaFrameworkId =
  (typeof TECHNICAL_QA_FRAMEWORK_OPTIONS)[keyof typeof TECHNICAL_QA_FRAMEWORK_OPTIONS][number]["value"];

export type TechnicalQaSetupInput = {
  language: TechnicalQaLanguage;
  frameworks: string[];
};

export function getTechnicalQaLanguageLabel(language: string) {
  return (
    TECHNICAL_QA_LANGUAGE_OPTIONS.find((item) => item.value === language)?.label ?? language
  );
}

export function getTechnicalQaFrameworkOptions(language: TechnicalQaLanguage) {
  return TECHNICAL_QA_FRAMEWORK_OPTIONS[language];
}

export function getFrameworkLabels(
  language: TechnicalQaLanguage,
  frameworks: string[]
) {
  const optionMap = new Map<string, string>(
    getTechnicalQaFrameworkOptions(language).map((option) => [option.value, option.label] as const)
  );

  return frameworks
    .map((framework) => optionMap.get(framework))
    .filter((label): label is string => Boolean(label));
}

function buildTechnicalQaPrompt(languageLabel: string, frameworkLabels: string[]) {
  const stackText =
    frameworkLabels.length > 0
      ? `${languageLabel} with ${frameworkLabels.join(", ")}`
      : `${languageLabel} fundamentals`;

  return `Run a ${TECHNICAL_QA_DURATION_MINUTES}-minute, voice-first technical Q&A interview focused on ${stackText}.

Conversation contract:
- Start with exactly one short calibration question about the candidate's hands-on experience with this stack, then wait.
- After the candidate answers, ask one high-signal technical question at a time. Never ask a bundle of questions.
- Do not ask the candidate to code and do not turn this into trivia. Probe how they reason, debug, choose tradeoffs, and explain production behavior.
- Challenge vague answers with one narrower follow-up asking for a concrete example, failure mode, metric, runtime behavior, or alternative design.
- Stop speaking after each question so the candidate has room to answer.

Question design:
- Start broad enough to calibrate level, then go deeper into internals, debugging, testing, performance, rollout risk, scaling implications, and practical production judgment.
- Prefer scenarios like "this fails in production, how would you debug it?" over definition recall.
- Reward precise mechanisms, clear tradeoffs, and honest uncertainty. Push back on hand-wavy answers.`;
}

export function buildTechnicalQaRoundContext(
  input: TechnicalQaSetupInput
): RoundContextSnapshot {
  const languageLabel = getTechnicalQaLanguageLabel(input.language);
  const frameworkLabels = getFrameworkLabels(input.language, input.frameworks);
  const headline =
    frameworkLabels.length > 0
      ? `${languageLabel} · ${frameworkLabels.join(" · ")}`
      : languageLabel;
  const focusAreas = [
    languageLabel,
    ...frameworkLabels,
    "runtime behavior",
    "debugging",
    "tradeoffs",
    "production judgment",
  ].slice(0, 6);

  return {
    id: `technical-qa-${input.language}-${Date.now()}`,
    roundType: "technical_qa",
    title: `${headline} Technical Q&A`,
    summary:
      frameworkLabels.length > 0
        ? `A ${TECHNICAL_QA_DURATION_MINUTES}-minute voice-first technical interview focused on ${frameworkLabels.join(", ")} in ${languageLabel}, with realistic follow-ups on internals, debugging, performance, and production tradeoffs.`
        : `A ${TECHNICAL_QA_DURATION_MINUTES}-minute voice-first technical interview focused on ${languageLabel} fundamentals, framework depth, debugging, performance, and production tradeoffs.`,
    rationale:
      "This mirrors stack-depth interviews where the bar is not whether you can code from scratch on the spot, but whether you can explain how your tools behave, reason through tradeoffs, and answer realistic engineering follow-ups with precision.",
    confidence: "high",
    estimatedMinutes: TECHNICAL_QA_DURATION_MINUTES,
    difficulty: null,
    focusAreas,
    prompt: buildTechnicalQaPrompt(languageLabel, frameworkLabels),
    historicalQuestions: [],
    workspaceSections: getWorkspaceSections("technical_qa"),
  };
}
