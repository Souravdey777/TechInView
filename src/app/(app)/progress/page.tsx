import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cn, getScoreColor } from "@/lib/utils";
import { PROBLEM_CATEGORIES } from "@/lib/constants";
import type { ProblemCategory } from "@/lib/constants";
import { CELL, Eyebrow, GRID, LABEL, LEAD } from "@/components/marketing/ds";
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
    <div className="animate-fade-in space-y-14">
      {/* ─── Hero ─── */}
      <header>
        <Eyebrow>Progress</Eyebrow>
        <h1 className="text-balance text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
          Your Progress
        </h1>
        <p className={cn(LEAD, "mt-4 max-w-xl")}>
          Track your improvement across all problem categories.
        </p>
      </header>

      {/* ─── Score trend ─── */}
      {/* Same panel the dashboard uses, so a take reads identically on both
          surfaces: hoverable points, per-take cards, and its own empty state. */}
      <ScoreTrendPanel trend={trend} />

      {/* ─── Category breakdown ─── */}
      <section aria-labelledby="category-breakdown">
        <SectionHead
          id="category-breakdown"
          title="Category breakdown"
          accessory={`${attemptedCategories} of ${PROBLEM_CATEGORIES.length} attempted`}
        />
        <div className={cn(GRID, "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3")}>
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
      </section>

      {/* ─── Strengths & weaknesses ─── */}
      <div className={cn(GRID, "grid-cols-1 md:grid-cols-2")}>
        <InsightCell
          label="Strengths"
          accessory={`Top ${strengths.length} by average`}
          rows={strengths}
          hasInsights={hasInsights}
          emptyCopy="Complete interviews across different categories to see your strengths."
        />
        <InsightCell
          label="Areas to Improve"
          accessory={`Weakest ${weaknesses.length} by average`}
          rows={weaknesses}
          hasInsights={hasInsights}
          emptyCopy="Your weak spots will be identified after completing several interviews."
        />
      </div>
    </div>
  );
}

/** Section title on the left, mono metadata on the right, over a hairline grid. */
function SectionHead({
  id,
  title,
  accessory,
}: {
  id: string;
  title: string;
  accessory: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <h2
        id={id}
        className="text-2xl font-normal tracking-[-0.03em] text-brand-text sm:text-3xl"
      >
        {title}
      </h2>
      <span className={LABEL}>{accessory}</span>
    </div>
  );
}

type InsightRow = {
  category: ProblemCategory;
  label: string;
  avgScore: number | null;
};

function InsightCell({
  label,
  accessory,
  rows,
  hasInsights,
  emptyCopy,
}: {
  label: string;
  accessory: string;
  rows: InsightRow[];
  hasInsights: boolean;
  emptyCopy: string;
}) {
  return (
    <section className={cn(CELL, "px-5 py-6 sm:px-7")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-xl font-medium tracking-[-0.02em] text-brand-text">
          {label}
        </h2>
        {hasInsights ? <span className={LABEL}>{accessory}</span> : null}
      </div>
      {hasInsights ? (
        <ul className="mt-4 divide-y divide-white/[0.08] border-t border-white/[0.08]">
          {rows.map((row) => (
            <li
              key={row.category}
              className="flex items-center justify-between gap-3 py-3"
            >
              <span className="truncate text-[15px] text-brand-text">{row.label}</span>
              <span
                className={cn(
                  "shrink-0 font-mono text-sm tabular-nums",
                  getScoreColor(row.avgScore ?? 0)
                )}
              >
                {Math.round(row.avgScore ?? 0)}
                <span className="text-brand-subtle">/100</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-brand-muted">{emptyCopy}</p>
      )}
    </section>
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
    <div className={cn(CELL, "px-5 py-6 sm:px-7", isUntouched && "opacity-60")}>
      <p className="truncate text-xl font-medium tracking-[-0.02em] text-brand-text">
        {CATEGORY_LABELS[category]}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className={LABEL}>
          {attempted} attempted · {solved} solved
        </span>
        <span className="flex items-baseline gap-2">
          <span className={LABEL}>Avg score</span>
          <span
            className={cn(
              "font-mono text-sm tabular-nums",
              score === 0 ? "text-brand-subtle" : getScoreColor(score)
            )}
          >
            {score === 0 ? (
              "–"
            ) : (
              <>
                {score}
                <span className="text-brand-subtle">/100</span>
              </>
            )}
          </span>
        </span>
      </div>

      {/* Thin avg-score meter: cyan fill on a hairline track. */}
      <div
        aria-hidden="true"
        className="mt-5 h-[3px] overflow-hidden rounded-full bg-white/[0.06]"
      >
        {score > 0 ? (
          <div
            className="h-full rounded-full bg-brand-cyan"
            style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}
