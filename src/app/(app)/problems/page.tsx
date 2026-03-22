import Link from "next/link";
import { cn } from "@/lib/utils";
import { DIFFICULTY_CONFIG, PROBLEM_CATEGORIES } from "@/lib/constants";
import type { DifficultyLevel, ProblemCategory } from "@/lib/constants";
import { Search, ArrowRight, Building2, Filter } from "lucide-react";

type SampleProblem = {
  id: string;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  category: ProblemCategory;
  companyTags: string[];
};

const SAMPLE_PROBLEMS: SampleProblem[] = [
  {
    id: "1",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "easy",
    category: "arrays",
    companyTags: ["Google", "Amazon", "Meta"],
  },
  {
    id: "2",
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "easy",
    category: "stacks-queues",
    companyTags: ["Google", "Microsoft"],
  },
  {
    id: "3",
    title: "Merge Intervals",
    slug: "merge-intervals",
    difficulty: "medium",
    category: "arrays",
    companyTags: ["Google", "Meta", "Apple"],
  },
  {
    id: "4",
    title: "LRU Cache",
    slug: "lru-cache",
    difficulty: "medium",
    category: "linked-lists",
    companyTags: ["Amazon", "Meta", "Microsoft"],
  },
  {
    id: "5",
    title: "Word Search II",
    slug: "word-search-ii",
    difficulty: "hard",
    category: "backtracking",
    companyTags: ["Google", "Uber"],
  },
  {
    id: "6",
    title: "Binary Tree Maximum Path Sum",
    slug: "binary-tree-max-path",
    difficulty: "hard",
    category: "trees",
    companyTags: ["Amazon", "Meta"],
  },
];

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

function DifficultyBadge({ difficulty }: { difficulty: DifficultyLevel }) {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border",
        cfg.bgColor,
        cfg.color,
        "border-current/20"
      )}
    >
      {cfg.label}
    </span>
  );
}

export default function ProblemsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-text mb-1">
            Problem Bank
          </h1>
          <p className="text-brand-muted text-sm">
            {SAMPLE_PROBLEMS.length} problems available &mdash; more coming soon
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-brand-card rounded-xl border border-brand-border">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            type="text"
            placeholder="Search problems..."
            readOnly
            className="w-full pl-9 pr-4 py-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-cyan/50 cursor-not-allowed"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
          <select
            disabled
            className="pl-8 pr-8 py-2 bg-brand-surface border border-brand-border rounded-lg text-brand-muted text-sm appearance-none cursor-not-allowed focus:outline-none"
          >
            <option>All Difficulties</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            disabled
            className="pl-3 pr-8 py-2 bg-brand-surface border border-brand-border rounded-lg text-brand-muted text-sm appearance-none cursor-not-allowed focus:outline-none"
          >
            <option>All Categories</option>
            {PROBLEM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        <span className="text-brand-muted text-xs ml-auto">
          Filters coming soon
        </span>
      </div>

      {/* Problem Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SAMPLE_PROBLEMS.map((problem) => (
          <div
            key={problem.id}
            className="bg-brand-card rounded-xl border border-brand-border hover:border-brand-cyan/30 transition-all duration-150 flex flex-col p-5 group"
          >
            {/* Title + Difficulty */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-brand-text font-semibold text-sm leading-snug">
                {problem.title}
              </h3>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>

            {/* Category */}
            <div className="mb-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-brand-surface border border-brand-border text-brand-muted text-xs">
                {CATEGORY_LABELS[problem.category]}
              </span>
            </div>

            {/* Company Tags */}
            {problem.companyTags.length > 0 && (
              <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                <Building2 className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                {problem.companyTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-brand-muted font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="mt-auto pt-3 border-t border-brand-border">
              <Link
                href={`/interview/setup?problem=${problem.slug}`}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-sm font-semibold hover:bg-brand-cyan/20 transition-colors group-hover:border-brand-cyan/40"
              >
                Start Interview
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
