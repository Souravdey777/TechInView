import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the hero, the trend rack, the category rack, and the insight pair. */
export default function ProgressLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Hero */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      {/* Score trend — ScoreTrendPanel's rack: chrome header, then the plot. */}
      <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-card">
        <div className="flex items-center justify-between border-b border-brand-border bg-brand-surface px-4 py-3 sm:px-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="p-4 sm:p-5">
          <Skeleton className="h-52 w-full rounded-md" />
        </div>
      </div>

      {/* Category breakdown rack */}
      <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-card">
        <div className="flex items-center justify-between border-b border-brand-border bg-brand-surface px-4 py-3.5 sm:px-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-brand-border bg-brand-surface px-4 py-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-2.5 w-32" />
                </div>
                <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
              </div>
              <div className="mt-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & weaknesses */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-brand-border bg-brand-card"
          >
            <div className="flex items-center justify-between border-b border-brand-border bg-brand-surface px-4 py-3.5 sm:px-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="space-y-2 p-4 sm:p-5">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5"
                >
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
