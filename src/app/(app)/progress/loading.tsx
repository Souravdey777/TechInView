import { cn } from "@/lib/utils";
import { CELL, GRID } from "@/components/marketing/ds";

/** Hairline pulse block; the shared Skeleton still carries the old card fill. */
function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.04]", className)} />;
}

/** Mirrors the hero, the trend rack, the category grid, and the insight pair. */
export default function ProgressLoading() {
  return (
    <div className="space-y-14">
      {/* Hero */}
      <div className="space-y-4">
        <Pulse className="h-3 w-20" />
        <Pulse className="h-12 w-72 max-w-full" />
        <Pulse className="h-4 w-full max-w-xl" />
      </div>

      {/* Score trend: ScoreTrendPanel's hairline rack, label row then the plot. */}
      <div className="overflow-hidden rounded-[20px] border border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <Pulse className="h-3 w-24" />
          <Pulse className="h-3 w-40" />
        </div>
        <div className="p-5 sm:p-6">
          <Pulse className="h-52 w-full" />
        </div>
      </div>

      {/* Category breakdown grid */}
      <div>
        <div className="mb-6 flex items-end justify-between gap-6">
          <Pulse className="h-8 w-56" />
          <Pulse className="h-3 w-28" />
        </div>
        <div className={cn(GRID, "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3")}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={cn(CELL, "space-y-3 px-5 py-6 sm:px-7")}>
              <Pulse className="h-5 w-32" />
              <div className="flex items-center justify-between">
                <Pulse className="h-2.5 w-32" />
                <Pulse className="h-3 w-20" />
              </div>
              <Pulse className="!mt-5 h-[3px] w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & weaknesses */}
      <div className={cn(GRID, "grid-cols-1 md:grid-cols-2")}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={cn(CELL, "px-5 py-6 sm:px-7")}>
            <div className="flex items-center justify-between">
              <Pulse className="h-5 w-28" />
              <Pulse className="h-3 w-28" />
            </div>
            <div className="mt-4 divide-y divide-white/[0.08] border-t border-white/[0.08]">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between py-3.5">
                  <Pulse className="h-4 w-28" />
                  <Pulse className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
