import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getScoreColor } from "@/lib/utils";
import { PROBLEM_CATEGORIES } from "@/lib/constants";
import type { ProblemCategory } from "@/lib/constants";
import {
  TrendingUp,
  BarChart2,
  Star,
  AlertCircle,
  LineChart,
} from "lucide-react";
import { ScoreTrendChart } from "@/components/dashboard/ScoreTrendChart";

export const dynamic = "force-dynamic";

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
};

type ProgressData = {
  category: string;
  problems_attempted: number;
  problems_solved: number;
  avg_score: number | null;
};

type InterviewForTrend = {
  overall_score: number | null;
  completed_at: string | null;
  started_at: string;
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
  const [{ data: progressRows }, { data: trendInterviews }] = await Promise.all([
    supabase
      .from("progress")
      .select("category, problems_attempted, problems_solved, avg_score")
      .eq("user_id", user.id),
    supabase
      .from("interviews")
      .select("overall_score, completed_at, started_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .not("overall_score", "is", null)
      .order("completed_at", { ascending: true })
      .limit(20),
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

  const trendData = (trendInterviews || []) as InterviewForTrend[];
  const hasTrendData = trendData.length >= 2;

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-brand-text mb-1">
          Your Progress
        </h1>
        <p className="text-brand-muted text-sm">
          Track your improvement across all problem categories.
        </p>
      </div>

      {/* Score Trend */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-brand-cyan" />
          <h2 className="text-base font-semibold text-brand-text">
            Score Trend
          </h2>
        </div>
        {hasTrendData ? (
          <ScoreTrendChart
            data={trendData.map((item) => {
              const d = new Date(item.completed_at || item.started_at);
              return {
                score: item.overall_score ?? 0,
                date: `${d.getMonth() + 1}/${d.getDate()}`,
                label: d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
              };
            })}
          />
        ) : (
          <div className="bg-brand-card rounded-xl border border-brand-border p-8 flex flex-col items-center justify-center min-h-[220px] text-center">
            <div className="w-14 h-14 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mb-4">
              <LineChart className="w-7 h-7 text-brand-cyan opacity-60" />
            </div>
            <p className="text-brand-muted text-sm max-w-xs">
              Score trend will appear here after completing at least 2 interviews.
            </p>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-brand-cyan" />
          <h2 className="text-base font-semibold text-brand-text">
            Category Breakdown
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-brand-card rounded-xl border border-brand-green/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-brand-green" />
            <h3 className="text-sm font-semibold text-brand-text">
              Strengths
            </h3>
          </div>
          {hasInsights ? (
            <div className="space-y-2.5">
              {strengths.map((s) => (
                <div
                  key={s.category}
                  className="flex items-center justify-between bg-brand-surface rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-brand-text">{s.label}</span>
                  <span className={cn("text-sm font-semibold", getScoreColor(s.avgScore ?? 0))}>
                    {Math.round(s.avgScore ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-brand-muted text-sm">
              Complete interviews across different categories to see your strengths.
            </p>
          )}
        </div>

        {/* Weaknesses */}
        <div className="bg-brand-card rounded-xl border border-brand-rose/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-brand-rose" />
            <h3 className="text-sm font-semibold text-brand-text">
              Areas to Improve
            </h3>
          </div>
          {hasInsights ? (
            <div className="space-y-2.5">
              {weaknesses.map((w) => (
                <div
                  key={w.category}
                  className="flex items-center justify-between bg-brand-surface rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-brand-text">{w.label}</span>
                  <span className={cn("text-sm font-semibold", getScoreColor(w.avgScore ?? 0))}>
                    {Math.round(w.avgScore ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-brand-muted text-sm">
              Your weak spots will be identified after completing several interviews.
            </p>
          )}
        </div>
      </div>
    </div>
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
  return (
    <div className="bg-brand-card rounded-xl border border-brand-border p-4 hover:border-brand-border/80 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center text-brand-muted text-xs font-mono select-none">
          {CATEGORY_ICONS[category]}
        </div>
        <div className="min-w-0">
          <p className="text-brand-text text-sm font-semibold truncate">
            {CATEGORY_LABELS[category]}
          </p>
          <p className="text-brand-muted text-xs">
            {attempted} attempted · {solved} solved
          </p>
        </div>
      </div>

      {/* Score Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-brand-muted text-xs">Avg Score</span>
          <span
            className={cn(
              "text-xs font-semibold",
              avgScore === 0 ? "text-brand-muted" : getScoreColor(avgScore)
            )}
          >
            {avgScore === 0 ? "—" : `${Math.round(avgScore)}/100`}
          </span>
        </div>
        <div className="h-1.5 bg-brand-surface rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              avgScore >= 70 ? "bg-brand-green" : avgScore >= 55 ? "bg-brand-amber" : avgScore > 0 ? "bg-brand-rose" : "bg-brand-surface"
            )}
            style={{ width: `${avgScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}
