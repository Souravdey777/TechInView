import { PROBLEM_ROW_GRID } from "@/components/dashboard/problems/ProblemRow";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ProblemsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Hero */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="space-y-3">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-9 w-72 sm:w-96" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 w-36 rounded-md" />
          <Skeleton className="h-12 w-32 rounded-md" />
        </div>
      </div>

      {/* Meters */}
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-brand-border bg-brand-border sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3.5 bg-brand-card px-5 py-5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-9 w-14" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Facet chips */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-[26px] w-24 rounded-md" />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-brand-border/60 pt-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[26px] w-24 rounded-md" />
          ))}
        </div>
      </div>

      {/* Bank */}
      <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-border bg-brand-surface px-4 py-3 sm:px-5">
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[26px] w-16 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-8 w-full rounded-md sm:w-64" />
        </div>

        <div
          className={cn(
            "hidden border-b border-brand-border bg-brand-surface/60 px-4 py-2.5 sm:px-5",
            PROBLEM_ROW_GRID,
            "lg:grid"
          )}
        >
          <span />
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-2.5 w-14" />
          <Skeleton className="h-2.5 w-16 lg:ml-auto" />
          <Skeleton className="h-2.5 w-12 lg:ml-auto" />
        </div>

        <div className="divide-y divide-brand-border/60">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className={cn("px-4 py-3 sm:px-5", PROBLEM_ROW_GRID)}
            >
              <div className="flex flex-col gap-2 lg:contents">
                <Skeleton className="hidden h-[7px] w-[7px] rounded-full lg:block" />
                <Skeleton className="h-4 w-56 max-w-full" />
                <Skeleton className="hidden h-3 w-20 lg:block" />
                <Skeleton className="hidden h-3 w-14 lg:block" />
                <Skeleton className="hidden h-3 w-12 lg:block lg:ml-auto" />
                <Skeleton className="h-3 w-24 lg:ml-auto" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-brand-border bg-brand-surface/40 px-4 py-3 sm:px-5">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-2.5 w-40" />
        </div>
      </div>
    </div>
  );
}
