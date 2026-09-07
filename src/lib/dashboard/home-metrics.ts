import {
  ROUND_SCORING_DIMENSIONS,
  SCORING_DIMENSIONS,
} from "@/lib/constants";
import {
  DASHBOARD_FILTER_LABELS,
  type PracticeInterviewKind,
} from "@/lib/dashboard/models";

/** Weighted score a round has to clear to read as a hire. */
export const HIRE_LINE = 70;

const DIMENSION_SAMPLE_SIZE = 5;
const TREND_SAMPLE_SIZE = 12;
const METER_SEGMENTS = 5;

const NUMBER_WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
];

export type DashboardRound = {
  kind: PracticeInterviewKind;
  /** "general_dsa" or "targeted_loop" — decides which rubric the round used. */
  mode: string | null;
  status: "completed" | "abandoned" | "in_progress";
  score: number | null;
  dimensionScores: Record<string, number> | null;
  timestamp: string;
};

export type DashboardMeter = {
  label: string;
  value: string;
  suffix?: string;
  delta?: { label: string; tone: "green" | "rose" };
  caption?: string;
  segments?: { filled: number; total: number };
};

export type TrendPoint = {
  take: number;
  score: number;
  caption: string;
};

export type DimensionAverage = {
  key: string;
  label: string;
  average: number;
};

export type DashboardSummary = {
  greeting: string;
  headline: string;
  insight: string;
  meters: DashboardMeter[];
  trend: TrendPoint[];
  dimensions: DimensionAverage[];
  dimensionsNote: string;
  dimensionsFootnote: string | null;
};

function spellCount(value: number) {
  return value >= 0 && value < NUMBER_WORDS.length
    ? NUMBER_WORDS[value]
    : String(value);
}

function toDayStamp(value: string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/** Current and longest run of consecutive days that carry activity. */
export function calculateStreaks(activityDates: readonly string[]) {
  const days = Array.from(new Set(activityDates.map(toDayStamp))).sort(
    (left, right) => right - left
  );

  if (days.length === 0) return { current: 0, longest: 0 };

  const oneDay = 24 * 60 * 60 * 1000;
  const today = toDayStamp(new Date().toISOString());

  let current = 0;
  if (days[0] >= today - oneDay) {
    current = 1;
    for (let index = 1; index < days.length; index += 1) {
      if (days[index - 1] - days[index] > oneDay) break;
      current += 1;
    }
  }

  let longest = 1;
  let run = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (days[index - 1] - days[index] <= oneDay) {
      run += 1;
      longest = Math.max(longest, run);
      continue;
    }
    run = 1;
  }

  return { current, longest: Math.max(longest, current) };
}

function dimensionSetFor(mode: string | null) {
  return mode === "targeted_loop" ? ROUND_SCORING_DIMENSIONS : SCORING_DIMENSIONS;
}

function rubricLabel(mode: string | null) {
  return mode === "targeted_loop" ? "loop" : "DSA";
}

function buildKindBreakdown(rounds: readonly DashboardRound[]) {
  const counts = new Map<PracticeInterviewKind, number>();
  for (const round of rounds) {
    counts.set(round.kind, (counts.get(round.kind) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([kind, count]) => `${count} ${DASHBOARD_FILTER_LABELS[kind]}`)
    .join(" · ");
}

function buildDimensionAverages(scoredRounds: readonly DashboardRound[]) {
  const withDimensions = scoredRounds.filter(
    (round) => round.dimensionScores && Object.keys(round.dimensionScores).length > 0
  );

  if (withDimensions.length === 0) {
    return { dimensions: [] as DimensionAverage[], sampleSize: 0, mode: null };
  }

  const mode = withDimensions[0].mode;
  const sameRubric = withDimensions
    .filter((round) => rubricLabel(round.mode) === rubricLabel(mode))
    .slice(0, DIMENSION_SAMPLE_SIZE);
  const dimensionSet = dimensionSetFor(mode);

  const dimensions = Object.entries(dimensionSet)
    .map(([key, config]) => {
      const values = sameRubric
        .map((round) => round.dimensionScores?.[key])
        .filter((value): value is number => typeof value === "number");

      return {
        key,
        label: config.label,
        average: average(values),
      };
    })
    .filter(
      (entry): entry is DimensionAverage => typeof entry.average === "number"
    )
    .sort((left, right) => right.average - left.average);

  return { dimensions, sampleSize: sameRubric.length, mode };
}

function buildDimensionsFootnote(dimensions: readonly DimensionAverage[]) {
  if (dimensions.length === 0) return null;

  const weakest = dimensions[dimensions.length - 1];
  const below = dimensions.filter((entry) => entry.average < HIRE_LINE);

  if (below.length === 0) {
    return `Every dimension clears the hire line of ${HIRE_LINE}. Reach for harder problems or a company persona to keep the bar moving.`;
  }

  if (below.length === 1) {
    return `${weakest.label} is the only dimension below the hire line, at ${weakest.average}. One dimension is the cheapest score to buy — make it the thing you narrate out loud in your next round.`;
  }

  return `${below.length} dimensions sit below the hire line of ${HIRE_LINE}. Start with ${weakest.label} at ${weakest.average}; the lowest one drags the weighted score hardest.`;
}

/** First name only — a full legal name reads stiff in a greeting. */
function toFirstName(displayName: string | null | undefined) {
  const first = (displayName ?? "").trim().split(/\s+/)[0] ?? "";
  return first.length > 0 ? first : null;
}

function buildGreeting(
  displayName: string | null | undefined,
  totalCompleted: number
) {
  const name = toFirstName(displayName);

  if (totalCompleted === 0) {
    return name ? `Welcome, ${name}.` : "Welcome to your studio.";
  }

  return name ? `Welcome back, ${name}.` : "Welcome back.";
}

function buildInsight(
  dimensions: readonly DimensionAverage[],
  scoredCount: number
) {
  if (scoredCount === 0) {
    return "Run one scored round and this board fills in with your trend, dimension averages, and verdicts.";
  }

  if (dimensions.length === 0) {
    return "Scores are in, but this round did not return dimension detail. The next scored round will fill the breakdown.";
  }

  const weakest = dimensions[dimensions.length - 1];

  return weakest.average < HIRE_LINE
    ? `${weakest.label} is still your weakest dimension at ${weakest.average}. A round or two aimed at it should move the average.`
    : `${weakest.label} is your weakest dimension at ${weakest.average}, and even that clears the hire line.`;
}

export function buildDashboardSummary({
  rounds,
  activityDates,
  problemsSolved,
  problemsTotal,
  completedCount,
  displayName,
}: {
  rounds: readonly DashboardRound[];
  activityDates: readonly string[];
  problemsSolved: number;
  problemsTotal: number;
  /** Profile name used to greet the user; the greeting drops it when absent. */
  displayName?: string | null;
  /** Total completed rounds on the account, when it exceeds the fetched window. */
  completedCount?: number;
}): DashboardSummary {
  const completed = rounds.filter((round) => round.status === "completed");
  const totalCompleted = Math.max(completedCount ?? completed.length, completed.length);
  const scored = completed.filter(
    (round): round is DashboardRound & { score: number } =>
      typeof round.score === "number"
  );

  const overallAverage = average(scored.map((round) => round.score));
  const recentAverage = average(
    scored.slice(0, DIMENSION_SAMPLE_SIZE).map((round) => round.score)
  );
  const delta =
    overallAverage !== null && recentAverage !== null && scored.length >= 3
      ? recentAverage - overallAverage
      : null;

  const { dimensions, sampleSize, mode } = buildDimensionAverages(scored);
  const streaks = calculateStreaks(activityDates);

  const trend: TrendPoint[] = scored
    .slice(0, TREND_SAMPLE_SIZE)
    .reverse()
    .map((round, index) => ({
      take: index + 1,
      score: round.score,
      caption: `Take ${index + 1} · ${round.score}`,
    }));

  const solvedRatio = problemsTotal > 0 ? problemsSolved / problemsTotal : 0;

  const meters: DashboardMeter[] = [
    {
      label: "Total rounds",
      value: String(totalCompleted),
      caption:
        completed.length > 0
          ? buildKindBreakdown(completed)
          : "No completed rounds yet",
    },
    {
      label: "Average score",
      value: overallAverage === null ? "—" : String(overallAverage),
      delta:
        delta === null || delta === 0
          ? undefined
          : {
              label: `${delta > 0 ? "+" : ""}${delta}`,
              tone: delta > 0 ? "green" : "rose",
            },
      caption:
        recentAverage === null
          ? "Awaiting your first score"
          : `Last ${Math.min(scored.length, DIMENSION_SAMPLE_SIZE)} takes average ${recentAverage}`,
    },
    {
      label: "Problems solved",
      value: String(problemsSolved),
      suffix: problemsTotal > 0 ? `/${problemsTotal}` : undefined,
      segments: {
        filled: Math.round(solvedRatio * METER_SEGMENTS),
        total: METER_SEGMENTS,
      },
      caption:
        problemsSolved === 0
          ? "Nothing passed every test yet"
          : `${Math.round(solvedRatio * 100)}% of the catalog`,
    },
    {
      label: "Current streak",
      value: String(streaks.current),
      suffix: "d",
      caption:
        streaks.longest > 0
          ? `Longest run so far: ${streaks.longest} day${streaks.longest === 1 ? "" : "s"}`
          : "Start a round to open a streak",
    },
  ];

  return {
    greeting: buildGreeting(displayName, totalCompleted),
    headline:
      totalCompleted === 0
        ? "Your first take is one round away."
        : `${spellCount(totalCompleted)} take${totalCompleted === 1 ? "" : "s"} on the board.`,
    insight: buildInsight(dimensions, scored.length),
    meters,
    trend,
    dimensions,
    dimensionsNote:
      sampleSize > 0
        ? `Last ${sampleSize} ${rubricLabel(mode)} round${sampleSize === 1 ? "" : "s"}`
        : "Awaiting a scored round",
    dimensionsFootnote: buildDimensionsFootnote(dimensions),
  };
}
