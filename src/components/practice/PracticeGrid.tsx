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

  return (
    <section>
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-brand-card rounded-xl border border-brand-border mb-6">
        <div className="relative flex-1 min-w-48">
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
            className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-brand-surface border border-brand-border text-sm text-brand-text focus:outline-none focus:border-brand-cyan/50 transition-colors cursor-pointer"
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
            className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-brand-surface border border-brand-border text-sm text-brand-text focus:outline-none focus:border-brand-cyan/50 transition-colors cursor-pointer"
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
            <Link
              href={`/practice/${p.slug}`}
              className="group flex h-full flex-col glass-card p-5 transition-all hover:border-brand-cyan/30 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <DifficultyBadge
                  difficulty={p.difficulty as DifficultyLevel}
                />
                <span className="text-xs text-brand-muted">
                  {CATEGORY_LABELS[p.category as ProblemCategory] ?? p.category}
                </span>
              </div>
              <h2 className="text-base font-semibold text-brand-text group-hover:text-brand-cyan transition-colors mb-2 line-clamp-2">
                {p.title}
              </h2>
              {p.companyTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-3">
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
              <span className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-brand-cyan group-hover:underline">
                Practice with AI <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
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
