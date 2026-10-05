import { Skeleton } from "@/components/ui/skeleton";
import { CELL, CONTAINER, GRID, PAD } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

/** Mirrors the report: header, big score row, radar rack, hairline dimension grid. */
export default function ResultsLoading() {
  return (
    <main className={cn("min-h-screen bg-brand-deep text-brand-text", PAD)}>
      <div className={cn(CONTAINER, "max-w-[1100px] space-y-16 py-10 sm:py-14")}>
        {/* Top nav + header */}
        <div>
          <div className="mb-12 flex items-center justify-between">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="mb-5 h-3 w-28" />
          <Skeleton className="h-12 w-72 max-w-full" />
          <Skeleton className="mt-4 h-4 w-96 max-w-full" />
        </div>

        {/* Score summary */}
        <div className="grid gap-8 border-y border-white/[0.08] py-10 md:grid-cols-[auto_minmax(0,1fr)] md:items-end md:gap-14">
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-28 w-48" />
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-4 w-3/4 max-w-md" />
          </div>
        </div>

        {/* Dimension breakdown */}
        <div>
          <Skeleton className="mb-6 h-8 w-56" />
          <Skeleton className="mb-8 h-[380px] w-full rounded-[20px]" />
          <div className={cn(GRID, "sm:grid-cols-2 lg:grid-cols-3")}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cn(CELL, "space-y-4 p-6")}>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-0.5 w-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
