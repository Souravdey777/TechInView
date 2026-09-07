import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cn, getScoreBgColor, getScoreColor } from "@/lib/utils";
import { PROBLEM_CATEGORIES } from "@/lib/constants";
import type { ProblemCategory } from "@/lib/constants";
import { MonoLabel, Rack } from "@/components/shared/Rack";
import { ScoreTrendPanel } from "@/components/dashboard/home/ScoreTrendPanel";
import {
  buildTrendPoints,
  fetchTrendInterviews,
} from "@/lib/dashboard/trend-points";

export const dynamic = "force-dynamic";

/** Matches the dashboard's metrics window so both trends cover the same rounds. */
const TREND_WINDOW = 20;

const CATEGORY_LABELS: Record<ProblemCategory, string> = {
  arrays: "Arrays",
  strings: "Strings",
  trees: "Trees",
  graphs: "Graphs",
  dp: "Dynamic Prog.",
  "linked-lists": "Linked Lists",
  "stacks-queues": "Stacks & Queues",
  "binary-search": "Binary Search",
  heap: "Heap / PQ",
  backtracking: "Backtracking",
  "sliding-window": "Sliding Window",
  trie: "Trie",
};

const CATEGORY_ICONS: Record<ProblemCategory, string> = {
  arrays: "▦",
  strings: "Ab",
  trees: "⬡",
  graphs: "◎",
  dp: "⬒",
  "linked-lists": "⬟",
  "stacks-queues": "⊞",
  "binary-search": "⌕",
  heap: "△",
  backtracking: "↺",
  "sliding-window": "⇥",
  trie: "⊤",
};

type ProgressData = {
  category: string;
  problems_attempted: number;
  problems_solved: number;
  avg_score: number | null;
};

export default async function ProgressPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch progress data and trend data in parallel
  const [{ data: progressRows }, trendInterviews, completedCount] = await Promise.all([
    supabase
      .from("progress")
      .select("category, problems_attempted, problems_solved, avg_score")
      .eq("user_id", user.id),
    // A trend point carries the round's title, type and verdict, so this needs
    // more than the score: the panel makes each take clickable through to its
    // own results page.
    fetchTrendInterviews(supabase, user.id, TREND_WINDOW).catch(() => []),
    // Takes are numbered from the user's first completed round, not from the
    // start of the window, so a take reads the same here as on the dashboard.
    supabase
      .from("interviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed"),
  ]);

  const progressMap = new Map<string, ProgressData>();
  for (const row of progressRows || []) {
    progressMap.set(row.category, row as ProgressData);
  }

  // If progress table is empty, compute from interviews directly
  if (progressMap.size === 0) {
    const { data: completedInterviews } = await supabase
      .from("interviews")
      .select("overall_score, problem_id, problems(category)")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .not("overall_score", "is", null);

    if (completedInterviews && completedInterviews.length > 0) {
      const catMap = new Map<string, { scores: number[]; count: number }>();
      for (const iv of completedInterviews) {
        const cat = (iv.problems as unknown as { category: string } | null)?.category;
        if (!cat) continue;
        const entry = catMap.get(cat) || { scores: [], count: 0 };
        entry.scores.push(iv.overall_score ?? 0);
        entry.count++;
        catMap.set(cat, entry);
      }
      catMap.forEach((data, cat) => {
        const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        const solved = data.scores.filter((s) => s >= 55).length;
        progressMap.set(cat, {
          category: cat,
          problems_attempted: data.count,
          problems_solved: solved,
          avg_score: Math.round(avg),
        });
      });
    }
  }

  const trend = buildTrendPoints(trendInterviews, completedCount.count ?? undefined);

  // Compute strengths and weaknesses
  const categoriesWithScores = PROBLEM_CATEGORIES
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      avgScore: progressMap.get(cat)?.avg_score ?? null,
      attempted: progressMap.get(cat)?.problems_attempted ?? 0,
    }))
    .filter((c) => c.avgScore !== null && c.attempted > 0)
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));

  const strengths = categoriesWithScores.slice(0, 3);
  const weaknesses = [...categoriesWithScores].reverse().slice(0, 3);
  const hasInsights = categoriesWithScores.length >= 2;
  const attemptedCategories = PROBLEM_CATEGORIES.filter(
    (cat) => (progressMap.get(cat)?.problems_attempted ?? 0) > 0
  ).length;

  return (
    <div className="mx-auto max-w-6xl animate-fade-in space-y-5">
      {/* ─── Hero ─── */}
      <header>
        <MonoLabel>Progress</MonoLabel>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
          Your Progress
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-muted">
          Track your improvement across all problem categories.
        </p>
      </header>

      {/* ─── Score trend ─── */}
      {/* Same panel the dashboard uses, so a take reads identically on both
          surfaces: hoverable points, per-take cards, and its own empty state. */}
      <ScoreTrendPanel trend={trend} />

      {/* ─── Category breakdown ─── */}
      <Rack
        label={
          <h2>
            <MonoLabel className="tracking-[0.18em]">Category Breakdown</MonoLabel>
          </h2>
        }
        accessory={
          <MonoLabel className="tracking-[0.12em]">
            {attemptedCategories} of {PROBLEM_CATEGORIES.length} attempted
          </MonoLabel>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PROBLEM_CATEGORIES.map((category) => {
            const data = progressMap.get(category);
            return (
              <CategoryCard
                key={category}
                category={category}
                attempted={data?.problems_attempted ?? 0}
                solved={data?.problems_solved ?? 0}
                avgScore={data?.avg_score ?? 0}
              />
            );
          })}
        </div>
      </Rack>

      {/* ─── Strengths & weaknesses ─── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <InsightRack
          label="Strengths"
          accessory={`Top ${strengths.length} by average`}
          tone="text-brand-green"
          rows={strengths}
          hasInsights={hasInsights}
          emptyCopy="Complete interviews across different categories to see your strengths."
        />
        <InsightRack
          label="Areas to Improve"
          accessory={`Weakest ${weaknesses.length} by average`}
          tone="text-brand-rose"
          rows={weaknesses}
          hasInsights={hasInsights}
          emptyCopy="Your weak spots will be identified after completing several interviews."
        />
      </div>
    </div>
  );
}

type InsightRow = {
  category: ProblemCategory;
  label: string;
  avgScore: number | null;
};

function InsightRack({
  label,
  accessory,
  tone,
  rows,
  hasInsights,
  emptyCopy,
}: {
  label: string;
  accessory: string;
  tone: string;
  rows: InsightRow[];
  hasInsights: boolean;
  emptyCopy: string;
}) {
  return (
    <Rack
      label={
        <h2>
          <MonoLabel className={cn("tracking-[0.18em]", tone)}>{label}</MonoLabel>
        </h2>
      }
      accessory={
        hasInsights ? (
          <MonoLabel className="tracking-[0.12em]">{accessory}</MonoLabel>
        ) : null
      }
    >
      {hasInsights ? (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.category}
              className="flex items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5"
            >
              <span className="truncate text-sm text-brand-text">{row.label}</span>
              <span
                className={cn(
                  "shrink-0 font-mono text-xs font-bold",
                  getScoreColor(row.avgScore ?? 0)
                )}
              >
                {Math.round(row.avgScore ?? 0)}
                <span className="font-normal text-brand-subtle">/100</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-brand-muted">{emptyCopy}</p>
      )}
    </Rack>
  );
}

function CategoryCard({
  category,
  attempted,
  solved,
  avgScore,
}: {
  category: ProblemCategory;
  attempted: number;
  solved: number;
  avgScore: number;
}) {
  const score = Math.round(avgScore);
  const isUntouched = attempted === 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-brand-border bg-brand-surface px-4 py-3.5",
        isUntouched && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-text">
            {CATEGORY_LABELS[category]}
          </p>
          <MonoLabel className="mt-1 block">
            {attempted} attempted · {solved} solved
          </MonoLabel>
        </div>
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-md border border-brand-border bg-brand-card font-mono text-[11px] text-brand-subtle"
        >
          {CATEGORY_ICONS[category]}
        </span>
      </div>

      {/* Flat meter over a recessed well, matching the dashboard racks. */}
      <div className="mt-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <MonoLabel className="text-[9px]">Avg score</MonoLabel>
          <span
            className={cn(
              "font-mono text-xs font-bold",
              score === 0 ? "text-brand-subtle" : getScoreColor(score)
            )}
          >
            {score === 0 ? (
              "—"
            ) : (
              <>
                {score}
                <span className="font-normal text-brand-subtle">/100</span>
              </>
            )}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="mt-2 h-1.5 overflow-hidden rounded-sm bg-brand-border"
        >
          {score > 0 ? (
            <div
              className={cn("h-full rounded-sm", getScoreBgColor(score))}
              style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
