"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FIELD, FOCUS, LABEL } from "@/components/marketing/ds";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import type { DifficultyLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FacetChip } from "@/components/dashboard/problems/FacetChip";
import { FACET_ROW_LABEL, ProblemFacetRow } from "@/components/dashboard/problems/ProblemFacetRow";
import { SORT_LABELS, type ProblemSort } from "@/components/dashboard/problems/catalogue";
import type { ProblemFilters } from "@/components/dashboard/problems/useProblemFilters";

const DIFFICULTY_ORDER: readonly (DifficultyLevel | "all")[] = ["all", "easy", "medium", "hard"];

/** Search, sort, and the chip facets above a problem list. */
export function ProblemFilterBar({
  filters,
  showProgress = false,
}: {
  filters: ProblemFilters;
  /** Progress chips only earn their place once something has been attempted. */
  showProgress?: boolean;
}) {
  const { facets, counts, update, sort, setSort } = filters;

  return (
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
            aria-label="Search problems, topics, or companies"
            placeholder="Search problems or companies"
            className={cn(FIELD, "pl-12 pr-12")}
          />
          {facets.search ? (
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
            className={cn(FIELD, "w-auto cursor-pointer bg-brand-deep py-2.5 pr-10 [color-scheme:dark]")}
          >
            {(Object.keys(SORT_LABELS) as ProblemSort[]).map((value) => (
              <option key={value} value={value}>
                {SORT_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div role="group" aria-label="Filter by difficulty" className="flex flex-wrap items-center gap-2">
        <span className={FACET_ROW_LABEL}>Difficulty</span>
        {DIFFICULTY_ORDER.map((level) => {
          const count = counts.difficulty[level];
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
        categories={filters.categories}
        showProgress={showProgress}
        onCategoryChange={(category) => update("category", category)}
        onProgressChange={(progress) => update("progress", progress)}
        onFreeOnlyChange={(freeOnly) => update("freeOnly", freeOnly)}
        onCompanyChange={(company) => update("company", company)}
      />
    </div>
  );
}

/** "Showing X of Y" + Load more; doubles as the scroll sentinel that fetches the next page. */
export function LoadMore({ filters }: { filters: ProblemFilters }) {
  if (!filters.hasMore) return null;
  return (
    // overflow-anchor: none stops scroll anchoring from pinning this sentinel in view as rows append.
    <div ref={filters.sentinelRef} className="flex flex-col items-center gap-3 py-8 [overflow-anchor:none]">
      <p className={LABEL} aria-live="polite">
        {filters.error
          ? "Couldn't load more problems"
          : `Showing ${filters.visible.length} of ${filters.total}`}
      </p>
      <Button size="sm" variant="secondary" disabled={filters.loading} onClick={filters.loadMore}>
        {filters.loading ? "Loading…" : filters.error ? "Try again" : "Load more"}
      </Button>
    </div>
  );
}
