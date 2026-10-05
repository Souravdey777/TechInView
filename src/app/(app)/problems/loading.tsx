import { PROBLEM_ROW_GRID } from "@/components/dashboard/problems/ProblemRow";
import { CELL, GRID } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

/** Pulse block for the hairline layout. */
const PULSE = "animate-pulse rounded-md bg-white/[0.04]";

export default function ProblemsLoading() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="space-y-5">
          <div className={cn(PULSE, "h-3 w-28")} />
          <div className={cn(PULSE, "h-12 w-72 max-w-full sm:w-[28rem]")} />
          <div className={cn(PULSE, "h-5 w-full max-w-xl")} />
        </div>
        <div className="flex gap-3">
          <div className={cn(PULSE, "h-[52px] w-40 rounded-full")} />
          <div className={cn(PULSE, "h-[52px] w-36 rounded-full")} />
        </div>
      </div>

      {/* Meters */}
      <div className={cn(GRID, "grid-cols-2 lg:grid-cols-4")}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={cn(CELL, "p-5 sm:p-6")}>
            <div className={cn(PULSE, "h-3 w-20")} />
            <div className={cn(PULSE, "mt-6 h-12 w-16")} />
            <div className={cn(PULSE, "mt-3 h-3 w-32 max-w-full")} />
          </div>
        ))}
      </div>

      {/* Search + facet rows */}
      <div className="space-y-5">
        <div className={cn(PULSE, "h-[50px] w-full rounded-full md:max-w-[520px]")} />
        {[4, 9, 1].map((chips, row) => (
          <div key={row} className="flex flex-wrap items-center gap-2">
            <div className={cn(PULSE, "mr-2 h-3 w-20 sm:w-28")} />
            {Array.from({ length: chips }).map((_, index) => (
              <div key={index} className={cn(PULSE, "h-[26px] w-20 rounded-full")} />
            ))}
          </div>
        ))}
      </div>

      {/* Bank */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className={cn(PULSE, "h-3 w-28")} />
          <div className={cn(PULSE, "h-3 w-48")} />
        </div>

        <div
          className={cn(
            "hidden border-t border-white/[0.08] py-3",
            PROBLEM_ROW_GRID,
            "lg:grid"
          )}
        >
          <span />
          <div className={cn(PULSE, "h-3 w-16")} />
          <div className={cn(PULSE, "h-3 w-16")} />
          <div className={cn(PULSE, "h-3 w-14")} />
          <div className={cn(PULSE, "h-3 w-16 lg:ml-auto")} />
          <div className={cn(PULSE, "h-3 w-12 lg:ml-auto")} />
        </div>

        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className={cn("py-5", PROBLEM_ROW_GRID)}>
              <div className="flex flex-col gap-3 lg:contents">
                <div className={cn(PULSE, "hidden h-1.5 w-1.5 rounded-full lg:block")} />
                <div className={cn(PULSE, "h-5 w-56 max-w-full")} />
                <div className={cn(PULSE, "hidden h-3 w-20 lg:block")} />
                <div className={cn(PULSE, "hidden h-3 w-16 lg:block")} />
                <div className={cn(PULSE, "hidden h-3 w-12 lg:ml-auto lg:block")} />
                <div className={cn(PULSE, "h-3 w-28 lg:ml-auto")} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
