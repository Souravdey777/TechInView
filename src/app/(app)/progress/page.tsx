import { cn } from "@/lib/utils";
import { PROBLEM_CATEGORIES } from "@/lib/constants";
import type { ProblemCategory } from "@/lib/constants";
import {
  TrendingUp,
  BarChart2,
  Star,
  AlertCircle,
  LineChart,
} from "lucide-react";

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

export default function ProgressPage() {
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

      {/* Score Trend Chart Placeholder */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-brand-cyan" />
          <h2 className="text-base font-semibold text-brand-text">
            Score Trend
          </h2>
        </div>
        <div className="bg-brand-card rounded-xl border border-brand-border p-8 flex flex-col items-center justify-center min-h-[220px] text-center">
          <div className="w-14 h-14 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mb-4">
            <LineChart className="w-7 h-7 text-brand-cyan opacity-60" />
          </div>
          <p className="text-brand-muted text-sm max-w-xs">
            Score trend will appear here after your first completed interview.
            Complete at least 3 interviews to see meaningful data.
          </p>
        </div>
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
          {PROBLEM_CATEGORIES.map((category) => (
            <CategoryCard key={category} category={category} />
          ))}
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
          <p className="text-brand-muted text-sm">
            Complete more interviews to see your strongest topics highlighted
            here.
          </p>
          <div className="mt-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-7 rounded-lg bg-brand-surface animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="bg-brand-card rounded-xl border border-brand-rose/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-brand-rose" />
            <h3 className="text-sm font-semibold text-brand-text">
              Areas to Improve
            </h3>
          </div>
          <p className="text-brand-muted text-sm">
            Your weak spots will be identified after completing several
            interviews across different categories.
          </p>
          <div className="mt-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-7 rounded-lg bg-brand-surface animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ category }: { category: ProblemCategory }) {
  // Zero-state placeholder data
  const attempted = 0;
  const avgScore = 0;

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
            {attempted} attempted
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
              avgScore === 0 ? "text-brand-muted" : "text-brand-cyan"
            )}
          >
            {avgScore === 0 ? "—" : `${avgScore}/100`}
          </span>
        </div>
        <div className="h-1.5 bg-brand-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-cyan rounded-full transition-all duration-500"
            style={{ width: `${avgScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}
