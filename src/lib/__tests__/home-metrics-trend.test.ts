import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildDashboardSummary,
  type DashboardRound,
} from "../dashboard/home-metrics";

type RoundOverrides = Partial<DashboardRound> & { id: string };

/** Rounds arrive newest-first, the way the dashboard query returns them. */
function round(overrides: RoundOverrides): DashboardRound {
  return {
    kind: "dsa",
    mode: "general_dsa",
    status: "completed",
    title: "Two Sum",
    score: 70,
    verdict: "hire",
    dimensionScores: null,
    take: null,
    timestamp: "2026-04-10T10:00:00.000Z",
    ...overrides,
  };
}

function summaryFor(rounds: DashboardRound[]) {
  return buildDashboardSummary({
    rounds,
    activityDates: rounds.map((entry) => entry.timestamp),
    problemsSolved: 0,
    problemsTotal: 0,
  });
}

test("trend points run oldest to newest and carry their round's results href", () => {
  const { trend } = summaryFor([
    round({
      id: "newest",
      title: "Word Ladder",
      score: 82,
      take: 3,
      timestamp: "2026-04-12T10:00:00.000Z",
    }),
    round({
      id: "middle",
      kind: "technical_qa",
      title: "React internals",
      score: 64,
      verdict: "lean_hire",
      take: 2,
      timestamp: "2026-04-11T10:00:00.000Z",
    }),
    round({ id: "oldest", score: 55, take: 1 }),
  ]);

  assert.deepEqual(
    trend.map((point) => point.take),
    [1, 2, 3],
  );
  assert.deepEqual(
    trend.map((point) => point.href),
    [
      "/results/oldest",
      "/interviews/technical-qa/results/middle",
      "/results/newest",
    ],
  );
  assert.deepEqual(
    trend.map((point) => point.typeLabel),
    ["DSA", "Technical Q&A", "DSA"],
  );
  assert.equal(trend[1].title, "React internals");
  assert.equal(trend[1].verdictLabel, "Lean Hire");
});

test("trend skips rounds without a score and falls back to positional takes", () => {
  const { trend } = summaryFor([
    round({ id: "abandoned", status: "abandoned", score: 90 }),
    round({ id: "unscored", score: null, verdict: null }),
    round({ id: "scored-b", score: 71, take: null }),
    round({ id: "scored-a", score: 60, take: null }),
  ]);

  assert.deepEqual(
    trend.map((point) => point.score),
    [60, 71],
  );
  assert.deepEqual(
    trend.map((point) => point.take),
    [1, 2],
  );
});

test("an unverdicted round still plots, with no verdict label", () => {
  const { trend } = summaryFor([
    round({ id: "b", score: 66, verdict: null, take: 2 }),
    round({ id: "a", score: 58, take: 1 }),
  ]);

  assert.equal(trend.length, 2);
  assert.equal(trend[1].verdictLabel, null);
});
