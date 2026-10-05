"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PROBLEM_CATEGORIES } from "@/lib/constants";
import type { DifficultyLevel, ProblemCategory } from "@/lib/constants";
import { CHIP, CHIP_ACTIVE, FIELD, LABEL, LINK_ARROW } from "@/components/marketing/ds";
import { DifficultyMark } from "@/components/practice/ProblemStatement";

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

/** Rows rendered per step. Every row is still in the page's ItemList JSON-LD for crawlers. */
const PAGE_SIZE = 40;

const DIFFICULTIES: (DifficultyLevel | "all")[] = ["all", "easy", "medium", "hard"];

/** Shared column template: header and rows must agree. */
const COLS = "md:grid md:grid-cols-[44px_minmax(0,1fr)_96px_140px_minmax(0,180px)_150px] md:items-center md:gap-6";

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cn(CHIP, active && CHIP_ACTIVE)}>
      {children}
    </button>
  );
}

export function PracticeGrid({ problems }: PracticeGridProps) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "all">("all");
  const [category, setCategory] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return problems
      .filter((p) => {
        if (difficulty !== "all" && p.difficulty !== difficulty) return false;
        if (category !== "all" && p.category !== category) return false;
        if (search) {
          const q = search.toLowerCase();
          const matchesTitle = p.title.toLowerCase().includes(q);
          const matchesCompany = p.companyTags.some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesCompany) return false;
        }
        return true;
      })
      .sort((left, right) => {
        if (left.isFreeSolverEnabled === right.isFreeSolverEnabled) return 0;
        return left.isFreeSolverEnabled ? -1 : 1;
      });
  }, [problems, difficulty, category, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // New filters start back at the first page.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [difficulty, category, search]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) => count + PAGE_SIZE);
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  const isFiltered = search !== "" || difficulty !== "all" || category !== "all";
  const reset = () => {
    setSearch("");
    setDifficulty("all");
    setCategory("all");
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-10 space-y-5">
        <input
          type="search"
          placeholder="Search by problem or company"
          aria-label="Search problems by title or company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(FIELD, "md:max-w-[520px]")}
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by difficulty">
          <span className={cn(LABEL, "mr-2 w-full sm:w-20")}>Difficulty</span>
          {DIFFICULTIES.map((d) => (
            <FilterChip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
              {d === "all" ? "All" : d}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
          <span className={cn(LABEL, "mr-2 w-full sm:w-20")}>Topic</span>
          <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
            All
          </FilterChip>
          {PROBLEM_CATEGORIES.map((cat) => (
            <FilterChip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
              {CATEGORY_LABELS[cat]}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <p className={LABEL} aria-live="polite">
          {filtered.length === problems.length
            ? `All ${problems.length} problems`
            : `${filtered.length} of ${problems.length} problems`}
        </p>
        {isFiltered && (
          <button
            type="button"
            onClick={reset}
            className={LINK_ARROW}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table head (desktop only; rows stack on small screens) */}
      <div className={cn(COLS, "hidden border-t border-white/[0.08] py-3", LABEL)} aria-hidden>
        <span>#</span>
        <span>Problem</span>
        <span>Level</span>
        <span>Topic</span>
        <span>Companies</span>
        <span className="text-right">Start</span>
      </div>

      <ul className="m-0 list-none border-t border-white/[0.08] p-0">
        {visible.map((p, i) => {
          const interviewHref = `/interview/setup?problem=${p.slug}&dsaExperience=ai_interview`;
          return (
            <li
              key={p.slug}
              className={cn(COLS, "group border-b border-white/[0.08] py-5 transition-colors hover:bg-white/[0.02]")}
            >
              <span className={cn(LABEL, "hidden md:block")}>{String(i + 1).padStart(2, "0")}</span>

              <div className="min-w-0">
                <h3 className="text-[17px] font-normal tracking-[-0.01em] text-brand-text">
                  <Link href={`/practice/${p.slug}`} className="transition-colors hover:text-brand-cyan">
                    {p.title}
                  </Link>
                </h3>
                <p
                  className={cn(
                    "mt-1 font-mono text-[11px] uppercase tracking-[0.08em]",
                    p.isFreeSolverEnabled ? "text-brand-muted" : "text-brand-subtle"
                  )}
                >
                  {p.isFreeSolverEnabled ? "Free practice" : "Locked · AI interview only"}
                </p>
              </div>

              {/* Mobile: level + topic + companies on one wrapping meta line */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 md:contents">
                <DifficultyMark difficulty={p.difficulty} />
                <span className={cn(LABEL, "text-brand-muted")}>
                  {CATEGORY_LABELS[p.category as ProblemCategory] ?? p.category}
                </span>
                <span className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-brand-subtle">
                  {p.companyTags.length > 0
                    ? `${p.companyTags.slice(0, 3).join(", ")}${p.companyTags.length > 3 ? ` +${p.companyTags.length - 3}` : ""}`
                    : <span className="hidden md:inline">-</span>}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 md:mt-0 md:justify-end">
                {p.isFreeSolverEnabled ? (
                  <>
                    <Link
                      href={`/practice/solve/${p.slug}`}
                      className={LINK_ARROW}
                      aria-label={`Practice: ${p.title}`}
                    >
                      Practice <span aria-hidden>→</span>
                    </Link>
                    <Link
                      href={interviewHref}
                      className="font-mono text-xs uppercase tracking-[0.08em] text-brand-muted transition-colors hover:text-brand-text"
                      aria-label={`AI interview: ${p.title}`}
                    >
                      Interview
                    </Link>
                  </>
                ) : (
                  <Link href={interviewHref} className={LINK_ARROW} aria-label={`AI interview: ${p.title}`}>
                    Interview <span aria-hidden>→</span>
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <div ref={sentinelRef} className="flex flex-col items-center gap-3 py-8">
          <p className={LABEL} aria-live="polite">
            Showing {visible.length} of {filtered.length}
          </p>
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className={cn(CHIP, "px-5 py-2")}
          >
            Load more
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="border-b border-white/[0.08] py-16 text-center">
          <p className="text-[15px] text-brand-muted">No problems match these filters.</p>
          <button
            type="button"
            onClick={reset}
            className={cn(LINK_ARROW, "mt-4")}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
