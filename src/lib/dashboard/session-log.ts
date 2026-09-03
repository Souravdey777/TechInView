import {
  HIRE_RECOMMENDATION_CONFIG,
  type HireRecommendation,
} from "@/lib/constants";
import {
  DASHBOARD_FILTER_LABELS,
  getPracticeResultsHref,
  type PracticeInterviewKind,
} from "@/lib/dashboard/models";
import { getInterviewerPersona } from "@/lib/interviewer-personas";
import { formatDuration } from "@/lib/utils";

export type SessionLogKey = PracticeInterviewKind | "practice";
export type SessionLogFilter = "all" | SessionLogKey;

export const SESSION_LOG_FILTER_LABELS: Record<SessionLogFilter, string> = {
  all: "All",
  dsa: DASHBOARD_FILTER_LABELS.dsa,
  machine_coding: DASHBOARD_FILTER_LABELS.machine_coding,
  system_design: DASHBOARD_FILTER_LABELS.system_design,
  technical_qa: DASHBOARD_FILTER_LABELS.technical_qa,
  engineering_manager: DASHBOARD_FILTER_LABELS.engineering_manager,
  behavioral: DASHBOARD_FILTER_LABELS.behavioral,
  practice: "Practice",
};

export type SessionLogRow = {
  id: string;
  key: SessionLogKey;
  /** Sequential take number among scored rounds, or null for practice. */
  take: number | null;
  title: string;
  typeLabel: string;
  interviewerLabel: string;
  durationLabel: string | null;
  score: number | null;
  resultLabel: string | null;
  verdictLabel: string;
  verdictClassName: string;
  href: string;
  timestamp: string;
};

export type RoundLogInput = {
  id: string;
  kind: PracticeInterviewKind;
  status: "completed" | "abandoned" | "in_progress";
  title: string;
  language: string | null;
  interviewerPersona: string | null;
  durationSeconds: number | null;
  score: number | null;
  verdict: HireRecommendation | null;
  timestamp: string;
};

export type PracticeLogInput = {
  id: string;
  title: string;
  slug: string;
  language: string;
  category: string;
  isSolved: boolean;
  testsPassed: number | null;
  testsTotal: number | null;
  updatedAt: string;
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** One row of the session log for a voice round. */
export function buildRoundLogRow(
  round: RoundLogInput,
  take: number | null
): SessionLogRow {
  const persona = round.interviewerPersona
    ? getInterviewerPersona(round.interviewerPersona)
    : null;

  const verdict =
    round.status !== "completed"
      ? {
          label: round.status === "in_progress" ? "In progress" : "Abandoned",
          className: round.status === "in_progress" ? "text-brand-amber" : "text-brand-subtle",
        }
      : round.verdict
        ? {
            label: HIRE_RECOMMENDATION_CONFIG[round.verdict].label,
            className: HIRE_RECOMMENDATION_CONFIG[round.verdict].color,
          }
        : { label: "Unscored", className: "text-brand-subtle" };

  return {
    id: round.id,
    key: round.kind,
    take,
    title: round.title,
    typeLabel: [DASHBOARD_FILTER_LABELS[round.kind], round.language ? titleCase(round.language) : null]
      .filter(Boolean)
      .join(" · "),
    interviewerLabel: persona ? `${persona.name} · ${persona.companyLabel}` : "Interviewer",
    durationLabel:
      typeof round.durationSeconds === "number" && round.durationSeconds > 0
        ? formatDuration(round.durationSeconds)
        : null,
    score: round.score,
    resultLabel: null,
    verdictLabel: verdict.label,
    verdictClassName: verdict.className,
    href: getPracticeResultsHref(round.kind, round.id),
    timestamp: round.timestamp,
  };
}

/** One row of the session log for a saved solo-practice attempt. */
export function buildPracticeLogRow(attempt: PracticeLogInput): SessionLogRow {
  return {
    id: attempt.id,
    key: "practice",
    take: null,
    title: attempt.title,
    typeLabel: `Practice · ${titleCase(attempt.language)}`,
    interviewerLabel: "Solo",
    durationLabel: null,
    score: null,
    resultLabel:
      attempt.testsTotal && attempt.testsTotal > 0
        ? `${attempt.testsPassed ?? 0}/${attempt.testsTotal} tests`
        : "Code saved",
    verdictLabel: attempt.isSolved ? "Solved" : "Unscored",
    verdictClassName: attempt.isSolved ? "text-brand-green" : "text-brand-subtle",
    href: `/practice/solve/${attempt.slug}`,
    timestamp: attempt.updatedAt,
  };
}

/** "All" plus only the filters that actually have rows behind them. */
export function buildSessionLogFilters(
  rows: readonly SessionLogRow[]
): SessionLogFilter[] {
  const present = new Set(rows.map((row) => row.key));
  const ordered: SessionLogKey[] = [
    "dsa",
    "technical_qa",
    "engineering_manager",
    "system_design",
    "machine_coding",
    "behavioral",
    "practice",
  ];

  const available = ordered.filter((key) => present.has(key));
  return available.length > 1 ? ["all", ...available] : available;
}
