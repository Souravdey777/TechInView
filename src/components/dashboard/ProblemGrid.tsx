"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonoLabel, Rack } from "@/components/shared/Rack";
import { DIFFICULTY_CONFIG, PROBLEM_CATEGORIES } from "@/lib/constants";
import type { DifficultyLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FacetChip } from "@/components/dashboard/problems/FacetChip";
import { ProblemBankMeters } from "@/components/dashboard/problems/ProblemBankMeters";
import { ProblemFacetRow } from "@/components/dashboard/problems/ProblemFacetRow";
import {
  PROBLEM_ROW_GRID,
  ProblemRow,
} from "@/components/dashboard/problems/ProblemRow";
import {
  DIFFICULTY_TONE,
  EMPTY_FACETS,
  computeFacetCounts,
  filterProblems,
  hasActiveFacets,
  summarizeBank,
  type BankProblem,
  type ProblemBankSummary,
  type ProblemFacets,
} from "@/components/dashboard/problems/catalogue";

const DIFFICULTY_ORDER: readonly (DifficultyLevel | "all")[] = [
  "all",
  "easy",
  "medium",
  "hard",
];

const FOOTER_LINK =
  "font-mono text-[10px] uppercase tracking-[0.12em] text-brand-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface";

type ProblemGridProps = {
  problems: BankProblem[];
  /** Computed on the server where possible; derived here when a caller omits it. */
  summary?: ProblemBankSummary;
};

/**
 * The problem bank: totals, facets, and one hairline row per problem. Kept as
 * a list rather than a card grid because seventy cards stop being scannable.
 */
export function ProblemGrid({ problems, summary }: ProblemGridProps) {
  const [facets, setFacets] = useState<ProblemFacets>(EMPTY_FACETS);

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
    () => computeFacetCounts(problems, facets),
    [problems, facets]
  );
  const filtered = useMemo(
    () => filterProblems(problems, facets),
    [problems, facets]
  );

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
  }

  return (
    <div className="space-y-5">
      {problems.length > 0 ? <ProblemBankMeters summary={bank} /> : null}

      {problems.length > 0 ? (
        <ProblemFacetRow
          facets={facets}
          counts={counts}
          categories={categories}
          showProgress={bank.hasProgress}
          onCategoryChange={(category) => update("category", category)}
          onProgressChange={(progress) => update("progress", progress)}
          onFreeOnlyChange={(freeOnly) => update("freeOnly", freeOnly)}
        />
      ) : null}

      <Rack
        label={
          <div
            role="group"
            aria-label="Filter by difficulty"
            className="flex flex-wrap items-center gap-1"
          >
            {DIFFICULTY_ORDER.map((level) => {
              const count =
                level === "all"
                  ? counts.difficulty.all
                  : counts.difficulty[level];
              const isActive = facets.difficulty === level;

              return (
                <FacetChip
                  key={level}
                  bare
                  label={level === "all" ? "All" : DIFFICULTY_CONFIG[level].label}
                  count={count}
                  isActive={isActive}
                  disabled={count === 0 && !isActive}
                  toneClassName={
                    level === "all" && !isActive
                      ? undefined
                      : DIFFICULTY_TONE[level]
                  }
                  className="focus-visible:ring-offset-brand-surface"
                  onClick={() => update("difficulty", level)}
                />
              );
            })}
          </div>
        }
        accessory={
          <div className="relative w-full sm:w-64">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-subtle"
            />
            <input
              type="text"
              value={facets.search}
              onChange={(event) => update("search", event.target.value)}
              aria-label="Search problems, categories, or companies"
              placeholder="Search problems or companies"
              className="h-8 w-full rounded-md border border-brand-border bg-brand-deep pl-8 pr-8 font-mono text-[11px] text-brand-text placeholder:text-brand-subtle focus:border-brand-cyan/50 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => update("search", "")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-subtle hover:text-brand-text"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        }
        bodyClassName="p-0"
      >
        {problems.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <MonoLabel>Bank is empty</MonoLabel>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-brand-muted">
              No problems came back from the catalogue. Reload in a moment —
              nothing you have already solved is lost.
            </p>
          </div>
        ) : (
          <>
            {filtered.length > 0 ? (
              <div
                className={cn(
                  "hidden border-b border-brand-border bg-brand-surface/60 px-4 py-2.5 sm:px-5",
                  PROBLEM_ROW_GRID,
                  "lg:grid"
                )}
              >
                <span aria-hidden="true" />
                <MonoLabel className="text-[9px]">Problem</MonoLabel>
                <MonoLabel className="text-[9px]">Category</MonoLabel>
                <MonoLabel className="text-[9px]">Difficulty</MonoLabel>
                <MonoLabel className="text-[9px] lg:text-right">
                  Your tests
                </MonoLabel>
                <MonoLabel className="text-[9px] lg:text-right">
                  Launch
                </MonoLabel>
              </div>
            ) : null}

            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <MonoLabel>No match</MonoLabel>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-brand-muted">
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
                  className="mt-4"
                  onClick={clearFacets}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-brand-border/60">
                {filtered.map((problem) => (
                  <ProblemRow key={problem.id} problem={problem} />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-brand-border bg-brand-surface/40 px-4 py-3 sm:px-5">
              <MonoLabel>
                {filtered.length === problems.length
                  ? `All ${problems.length} problems`
                  : `${filtered.length} of ${problems.length} problems`}
              </MonoLabel>
              {isFiltered ? (
                <button type="button" onClick={clearFacets} className={FOOTER_LINK}>
                  Clear filters
                </button>
              ) : (
                <MonoLabel className="text-[9px] normal-case tracking-[0.08em]">
                  Python and JavaScript run · Java and C++ are coming
                </MonoLabel>
              )}
            </div>
          </>
        )}
      </Rack>
    </div>
  );
}
