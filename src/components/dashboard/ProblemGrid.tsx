"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DIFFICULTY_CONFIG, PROBLEM_CATEGORIES } from "@/lib/constants";
import type { DifficultyLevel, ProblemCategory } from "@/lib/constants";
import { Search, ArrowRight, Building2 } from "lucide-react";

type Problem = {
  id: string;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  category: string;
  companyTags: string[];
};

type ProblemGridProps = {
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

export function ProblemGrid({ problems }: ProblemGridProps) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "all">("all");
  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    return problems.filter((p) => {
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
    });
  }, [problems, difficulty, category, search]);

  const counts = useMemo(() => {
    const easy = problems.filter((p) => p.difficulty === "easy").length;
    const medium = problems.filter((p) => p.difficulty === "medium").length;
    const hard = problems.filter((p) => p.difficulty === "hard").length;
    return { easy, medium, hard, total: problems.length };
  }, [problems]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-brand-text mb-1">
          Problem Bank
        </h1>
        <p className="text-brand-muted text-sm">
          {counts.total} problems &mdash;{" "}
          <span className="text-brand-green">{counts.easy} easy</span>,{" "}
          <span className="text-brand-amber">{counts.medium} medium</span>,{" "}
          <span className="text-brand-rose">{counts.hard} hard</span>
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-brand-card rounded-xl border border-brand-border">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            type="text"
            placeholder="Search problems or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-cyan/50"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="flex gap-1.5">
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                difficulty === d
                  ? d === "easy"
                    ? "bg-brand-green/10 text-brand-green border-brand-green/30"
                    : d === "medium"
                    ? "bg-brand-amber/10 text-brand-amber border-brand-amber/30"
                    : d === "hard"
                    ? "bg-brand-rose/10 text-brand-rose border-brand-rose/30"
                    : "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30"
                  : "bg-brand-surface text-brand-muted border-brand-border hover:border-brand-border/80"
              )}
            >
              {d === "all" ? "All" : DIFFICULTY_CONFIG[d].label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="pl-3 pr-8 py-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text text-sm appearance-none focus:outline-none focus:border-brand-cyan/50"
        >
          <option value="all">All Categories</option>
          {PROBLEM_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      {(search || difficulty !== "all" || category !== "all") && (
        <p className="text-brand-muted text-sm">
          Showing {filtered.length} of {problems.length} problems
          {search && (
            <>
              {" "}matching &quot;{search}&quot;
            </>
          )}
        </p>
      )}

      {/* Problem Grid */}
      {filtered.length === 0 ? (
        <div className="bg-brand-card rounded-xl border border-brand-border p-12 text-center">
          <p className="text-brand-muted text-sm mb-2">
            No problems match your filters.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setDifficulty("all");
              setCategory("all");
            }}
            className="text-brand-cyan text-sm hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((problem) => (
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
                  {CATEGORY_LABELS[problem.category as ProblemCategory] || problem.category}
                </span>
              </div>

              {/* Company Tags */}
              {problem.companyTags.length > 0 && (
                <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                  <Building2 className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                  {problem.companyTags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-brand-muted"
                    >
                      {tag}
                    </span>
                  ))}
                  {problem.companyTags.length > 4 && (
                    <span className="text-xs text-brand-muted">
                      +{problem.companyTags.length - 4}
                    </span>
                  )}
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
      )}
    </div>
  );
}
