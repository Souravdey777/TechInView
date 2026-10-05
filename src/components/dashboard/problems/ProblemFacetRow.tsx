"use client";

import { FacetChip } from "@/components/dashboard/problems/FacetChip";
import { LABEL } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";
import {
  PROGRESS_CONFIG,
  categoryLabel,
  type FacetCounts,
  type ProblemFacets,
  type ProblemProgress,
} from "@/components/dashboard/problems/catalogue";

const PROGRESS_ORDER: readonly ProblemProgress[] = [
  "solved",
  "in_progress",
  "untouched",
];

/** Mono row header, sized to line up with the difficulty row in ProblemGrid. */
export const FACET_ROW_LABEL = cn(LABEL, "mr-2 w-full sm:w-28");

type ProblemFacetRowProps = {
  facets: ProblemFacets;
  counts: FacetCounts;
  /** Category slugs actually present in the bank, in catalogue order. */
  categories: readonly string[];
  /** Progress chips only earn their place once something has been attempted. */
  showProgress: boolean;
  onCategoryChange: (category: string) => void;
  onProgressChange: (progress: ProblemProgress | "all") => void;
  onFreeOnlyChange: (freeOnly: boolean) => void;
};

/**
 * The scope rows under the search: topic, your own progress, and the
 * free-solver gate, each behind a mono label like the public /practice list.
 */
export function ProblemFacetRow({
  facets,
  counts,
  categories,
  showProgress,
  onCategoryChange,
  onProgressChange,
  onFreeOnlyChange,
}: ProblemFacetRowProps) {
  return (
    <>
      <div
        role="group"
        aria-label="Filter by category"
        className="flex flex-wrap items-center gap-2"
      >
        <span className={FACET_ROW_LABEL}>Topic</span>
        <FacetChip
          label="All"
          count={counts.category.all}
          isActive={facets.category === "all"}
          onClick={() => onCategoryChange("all")}
        />
        {categories.map((category) => {
          const count = counts.category[category] ?? 0;
          const isActive = facets.category === category;

          return (
            <FacetChip
              key={category}
              label={categoryLabel(category)}
              count={count}
              isActive={isActive}
              disabled={count === 0 && !isActive}
              onClick={() => onCategoryChange(category)}
            />
          );
        })}
      </div>

      {showProgress ? (
        <div
          role="group"
          aria-label="Filter by your progress"
          className="flex flex-wrap items-center gap-2"
        >
          <span className={FACET_ROW_LABEL}>Your progress</span>
          <FacetChip
            label="Any"
            isActive={facets.progress === "all"}
            onClick={() => onProgressChange("all")}
          />
          {PROGRESS_ORDER.map((progress) => {
            const count = counts.progress[progress];
            const isActive = facets.progress === progress;

            return (
              <FacetChip
                key={progress}
                label={PROGRESS_CONFIG[progress].label}
                count={count}
                isActive={isActive}
                disabled={count === 0 && !isActive}
                onClick={() => onProgressChange(progress)}
              />
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className={FACET_ROW_LABEL}>Access</span>
        <FacetChip
          label="Free to solve"
          count={counts.free}
          isActive={facets.freeOnly}
          disabled={counts.free === 0 && !facets.freeOnly}
          title="Problems open in the solo editor. Solving them never spends a round."
          onClick={() => onFreeOnlyChange(!facets.freeOnly)}
        />
      </div>
    </>
  );
}
