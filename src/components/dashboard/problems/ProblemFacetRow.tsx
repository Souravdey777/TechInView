"use client";

import { FacetChip } from "@/components/dashboard/problems/FacetChip";
import { MonoLabel } from "@/components/shared/Rack";
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
 * The scope row above the rack: which slice of the bank you are looking at.
 * Categories on the first line, your own progress and the free-solver gate on
 * the second.
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
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Filter by category"
        className="flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
      >
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-brand-border/60 pt-3">
        {showProgress ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2">
            <MonoLabel className="text-[9px]">Your progress</MonoLabel>
            <div
              role="group"
              aria-label="Filter by your progress"
              className="flex flex-wrap gap-1.5"
            >
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
                    toneClassName={
                      isActive
                        ? PROGRESS_CONFIG[progress].textClassName
                        : undefined
                    }
                    onClick={() => onProgressChange(progress)}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2.5 sm:ml-auto">
          <FacetChip
            label="Free to solve"
            count={counts.free}
            isActive={facets.freeOnly}
            disabled={counts.free === 0 && !facets.freeOnly}
            toneClassName={facets.freeOnly ? "text-brand-green" : undefined}
            title="Problems with the solo editor unlocked — solving them never spends a round"
            onClick={() => onFreeOnlyChange(!facets.freeOnly)}
          />
        </div>
      </div>
    </div>
  );
}
