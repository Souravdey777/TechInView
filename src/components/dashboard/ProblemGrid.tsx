"use client";

import { Button } from "@/components/ui/button";
import { LABEL, LINK_ARROW } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";
import { ProblemBankMeters } from "@/components/dashboard/problems/ProblemBankMeters";
import { LoadMore, ProblemFilterBar } from "@/components/dashboard/problems/ProblemFilterBar";
import {
  PROBLEM_ROW_GRID,
  ProblemRow,
} from "@/components/dashboard/problems/ProblemRow";
import type { ProblemBankSummary } from "@/components/dashboard/problems/catalogue";
import type { ProblemPage } from "@/lib/problem-list";
import { useProblemFilters } from "@/components/dashboard/problems/useProblemFilters";

type ProblemGridProps = {
  /** First page, rendered on the server; later pages are fetched as the list scrolls. */
  initial: ProblemPage;
  /** Totals for the whole bank, computed on the server. */
  summary: ProblemBankSummary;
};

/**
 * The problem bank: a hairline grid of totals, search and chip facets, then a
 * hairline table with one row per problem (mirrors the public /practice list).
 */
export function ProblemGrid({ initial, summary: bank }: ProblemGridProps) {
  const filters = useProblemFilters(initial);
  const { total, bankTotal, visible, isFiltered, clear: clearFacets } = filters;
  const query = filters.facets.search.trim();

  return (
    <div className="space-y-12">
      {bankTotal > 0 ? <ProblemBankMeters summary={bank} /> : null}

      {bankTotal > 0 ? (
        <ProblemFilterBar filters={filters} showProgress={bank.hasProgress} />
      ) : null}

      {bankTotal === 0 ? (
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
              {total === bankTotal
                ? `All ${bankTotal} problems`
                : `${total} of ${bankTotal} problems`}
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

          {total > 0 ? (
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

              <LoadMore filters={filters} />
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
