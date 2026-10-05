"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FIELD, FOCUS, LABEL, LINK_ARROW } from "@/components/marketing/ds";
import { DIFFICULTY_CONFIG, PROBLEM_CATEGORIES } from "@/lib/constants";
import type { DifficultyLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FacetChip } from "@/components/dashboard/problems/FacetChip";
import { ProblemBankMeters } from "@/components/dashboard/problems/ProblemBankMeters";
import {
  FACET_ROW_LABEL,
  ProblemFacetRow,
} from "@/components/dashboard/problems/ProblemFacetRow";
import {
  PROBLEM_ROW_GRID,
  ProblemRow,
} from "@/components/dashboard/problems/ProblemRow";
import {
  EMPTY_FACETS,
  SORT_LABELS,
  computeFacetCounts,
  sortProblems,
  filterProblems,
  hasActiveFacets,
  summarizeBank,
  type BankProblem,
  type ProblemBankSummary,
  type ProblemFacets,
  type ProblemSort,
} from "@/components/dashboard/problems/catalogue";

const DIFFICULTY_ORDER: readonly (DifficultyLevel | "all")[] = [
  "all",
  "easy",
  "medium",
  "hard",
];

/** Rows rendered per scroll step; the full bank is filtered client-side, only rendering is paged. */
const PAGE_SIZE = 40;

type ProblemGridProps = {
  problems: BankProblem[];
  /** Computed on the server where possible; derived here when a caller omits it. */
  summary?: ProblemBankSummary;
};

/**
 * The problem bank: a hairline grid of totals, search and chip facets, then a
 * hairline table with one row per problem (mirrors the public /practice list).
 * Kept as a list rather than a card grid because seventy cards stop being
 * scannable.
 */
export function ProblemGrid({ problems, summary }: ProblemGridProps) {
  const [facets, setFacets] = useState<ProblemFacets>(EMPTY_FACETS);
  const [sort, setSort] = useState<ProblemSort>("default");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Typing stays responsive while 2,000 rows re-filter behind it.
  const deferredFacets = useDeferredValue(facets);

  const derivedSummary = useMemo(() => summarizeBank(problems), [problems]);
  const bank = summary ?? derivedSummary;

  const categories = useMemo(() => {
    const present = new Set(problems.map((problem) => problem.category));
    const known = (PROBLEM_CATEGORIES as readonly string[]).filter((category) =>
      present.has(category)
    );
    const extra = [...present]
      .filter(
        (category) =>
          !(PROBLEM_CATEGORIES as readonly string[]).includes(category)
      )
      .sort();
    return [...known, ...extra];
  }, [problems]);

  const counts = useMemo(
    () => computeFacetCounts(problems, deferredFacets),
    [problems, deferredFacets]
  );
  const filtered = useMemo(
    () => sortProblems(filterProblems(problems, deferredFacets), sort),
    [problems, deferredFacets, sort]
  );
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // New filters or sort start back at the first page.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [deferredFacets, sort]);

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

  const isFiltered = hasActiveFacets(facets);
  const query = facets.search.trim();

  function update<K extends keyof ProblemFacets>(
    key: K,
    value: ProblemFacets[K]
  ) {
    setFacets((previous) => ({ ...previous, [key]: value }));
  }

  function clearFacets() {
    setFacets(EMPTY_FACETS);
    setSort("default");
  }

  return (
    <div className="space-y-12">
      {problems.length > 0 ? <ProblemBankMeters summary={bank} /> : null}

      {problems.length > 0 ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 md:max-w-[520px]">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-subtle"
            />
            <input
              type="text"
              value={facets.search}
              onChange={(event) => update("search", event.target.value)}
              aria-label="Search problems, categories, or companies"
              placeholder="Search problems or companies"
              className={cn(FIELD, "pl-12 pr-12")}
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => update("search", "")}
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 p-1 text-brand-subtle transition-colors hover:text-brand-text",
                  FOCUS
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <label className="flex items-center gap-3">
            <span className={LABEL}>Sort</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ProblemSort)}
              aria-label="Sort problems"
              className={cn(FIELD, "w-auto cursor-pointer bg-brand-deep py-2.5 pr-10")}
            >
              {(Object.keys(SORT_LABELS) as ProblemSort[]).map((value) => (
                <option key={value} value={value}>
                  {SORT_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          </div>

          <div
            role="group"
            aria-label="Filter by difficulty"
            className="flex flex-wrap items-center gap-2"
          >
            <span className={FACET_ROW_LABEL}>Difficulty</span>
            {DIFFICULTY_ORDER.map((level) => {
              const count =
                level === "all"
                  ? counts.difficulty.all
                  : counts.difficulty[level];
              const isActive = facets.difficulty === level;

              return (
                <FacetChip
                  key={level}
                  label={level === "all" ? "All" : DIFFICULTY_CONFIG[level].label}
                  count={count}
                  isActive={isActive}
                  disabled={count === 0 && !isActive}
                  onClick={() => update("difficulty", level)}
                />
              );
            })}
          </div>

          <ProblemFacetRow
            facets={facets}
            counts={counts}
            categories={categories}
            showProgress={bank.hasProgress}
            onCategoryChange={(category) => update("category", category)}
            onProgressChange={(progress) => update("progress", progress)}
            onFreeOnlyChange={(freeOnly) => update("freeOnly", freeOnly)}
            onCompanyChange={(company) => update("company", company)}
          />
        </div>
      ) : null}

      {problems.length === 0 ? (
        <div className="border-y border-white/[0.08] py-16 text-center">
          <p className={LABEL}>Bank is empty</p>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-brand-muted">
            No problems came back from the catalogue. Reload in a moment.
            Nothing you have already solved is lost.
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className={LABEL}>
              {filtered.length === problems.length
                ? `All ${problems.length} problems`
                : `${filtered.length} of ${problems.length} problems`}
            </p>
            {isFiltered ? (
              <button type="button" onClick={clearFacets} className={LINK_ARROW}>
                Clear filters
              </button>
            ) : (
              <p className={cn(LABEL, "normal-case tracking-[0.04em]")}>
                Python and JavaScript run · Java and C++ are coming
              </p>
            )}
          </div>

          {filtered.length > 0 ? (
            <>
              <div
                className={cn(
                  "hidden border-t border-white/[0.08] py-3",
                  LABEL,
                  PROBLEM_ROW_GRID,
                  "lg:grid"
                )}
              >
                <span aria-hidden="true" />
                <span>Problem</span>
                <span>Category</span>
                <span>Difficulty</span>
                <span className="lg:text-right">Your tests</span>
                <span className="lg:text-right">Launch</span>
              </div>

              <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {visible.map((problem) => (
                  <ProblemRow key={problem.id} problem={problem} />
                ))}
              </div>

              {hasMore ? (
                <div
                  ref={sentinelRef}
                  className="flex flex-col items-center gap-3 py-8"
                >
                  <p className={LABEL} aria-live="polite">
                    Showing {visible.length} of {filtered.length}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  >
                    Load more
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="border-y border-white/[0.08] py-16 text-center">
              <p className={LABEL}>No match</p>
              <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-brand-muted">
                {query ? (
                  <>
                    Nothing matches{" "}
                    <span className="text-brand-text">
                      &ldquo;{query}&rdquo;
                    </span>{" "}
                    with these filters.
                  </>
                ) : (
                  "Nothing in the bank fits these filters."
                )}{" "}
                Widen one, or clear them all.
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-5"
                onClick={clearFacets}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
