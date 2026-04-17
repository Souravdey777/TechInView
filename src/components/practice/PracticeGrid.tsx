"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_CONFIG,
  PROBLEM_CATEGORIES,
} from "@/lib/constants";
import type { DifficultyLevel, ProblemCategory } from "@/lib/constants";
import { Search, Building2, ChevronRight, ChevronDown } from "lucide-react";

type Problem = {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  companyTags: string[];
  isFreeSolverEnabled: boolean;
};

type PracticeGridProps = {
  problems: Problem[];
};

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

function DifficultyBadge({ difficulty }: { difficulty: DifficultyLevel }) {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
        cfg.bgColor,
        cfg.color
      )}
    >
      {cfg.label}
    </span>
  );
}

export function PracticeGrid({ problems }: PracticeGridProps) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "all">("all");
  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    return problems
      .filter((p) => {
      if (difficulty !== "all" && p.difficulty !== difficulty) return false;
      if (category !== "all" && p.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesCompany = p.companyTags.some((t) =>
          t.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesCompany) return false;
      }
      return true;
      })
      .sort((left, right) => {
        if (left.isFreeSolverEnabled === right.isFreeSolverEnabled) return 0;
        return left.isFreeSolverEnabled ? -1 : 1;
      });
  }, [problems, difficulty, category, search]);

  return (
    <section>
      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-brand-border bg-brand-card p-4">
        <div className="relative basis-full min-w-0 sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            type="text"
            placeholder="Search problems or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-brand-surface border border-brand-border text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-cyan/50 transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as DifficultyLevel | "all")
            }
            style={{ colorScheme: "dark" }}
            className="w-full cursor-pointer appearance-none rounded-lg border border-brand-border bg-brand-surface pl-3 pr-8 py-2 text-sm text-brand-text transition-colors focus:outline-none focus:border-brand-cyan/50 sm:w-auto"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
        </div>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ colorScheme: "dark" }}
            className="w-full cursor-pointer appearance-none rounded-lg border border-brand-border bg-brand-surface pl-3 pr-8 py-2 text-sm text-brand-text transition-colors focus:outline-none focus:border-brand-cyan/50 sm:w-auto"
          >
            <option value="all">All Categories</option>
            {PROBLEM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-brand-muted mb-4">
        Showing {filtered.length} of {problems.length} problems
      </p>

      {/* Grid */}
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 list-none p-0 m-0">
        {filtered.map((p) => (
          <li key={p.slug} className="min-w-0">
            <div className="group flex h-full flex-col glass-card p-5 transition-all hover:border-brand-cyan/30 hover:-translate-y-0.5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <DifficultyBadge
                  difficulty={p.difficulty as DifficultyLevel}
                />
                <span className="text-xs text-brand-muted">
                  {CATEGORY_LABELS[p.category as ProblemCategory] ?? p.category}
                </span>
              </div>
              <h2 className="mb-2 line-clamp-2 text-base font-semibold text-brand-text transition-colors group-hover:text-brand-cyan">
                <Link href={`/practice/${p.slug}`} className="hover:text-brand-cyan">
                  {p.title}
                </Link>
              </h2>
              <div className="mt-auto pt-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    p.isFreeSolverEnabled
                      ? "border-brand-green/20 bg-brand-green/10 text-brand-green"
                      : "border-brand-amber/20 bg-brand-amber/10 text-brand-amber"
                  )}
                >
                  {p.isFreeSolverEnabled ? "Free Practice" : "AI Interview Only"}
                </span>
              </div>
              {p.companyTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-3">
                  <Building2 className="w-3 h-3 text-brand-muted shrink-0" />
                  {p.companyTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-1.5 py-0.5 rounded bg-brand-surface border border-brand-border text-brand-muted"
                    >
                      {tag}
                    </span>
                  ))}
                  {p.companyTags.length > 3 && (
                    <span className="text-[11px] text-brand-muted">
                      +{p.companyTags.length - 3}
                    </span>
                  )}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-border pt-3">
                <Link
                  href={
                    p.isFreeSolverEnabled
                      ? `/practice/solve/${p.slug}`
                      : `/interview/setup?problem=${p.slug}&dsaExperience=ai_interview`
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-cyan hover:underline"
                >
                  {p.isFreeSolverEnabled ? "Practice" : "AI Interview"}
                  <ChevronRight className="w-3 h-3" />
                </Link>
                <Link
                  href={`/interview/setup?problem=${p.slug}&dsaExperience=ai_interview`}
                  className="text-[11px] font-medium text-brand-muted hover:text-brand-cyan"
                >
                  AI Interview
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-brand-muted text-sm">
            No problems match your filters. Try adjusting your search.
          </p>
        </div>
      )}
    </section>
  );
}
