import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CELL, GRID } from "@/components/marketing/ds";

/** Faint pulse block standing in for a line of text, a number or a pill. */
function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-full bg-white/[0.04]", className)} />;
}

/** Hairline rack outline with a label row, matching the shared Rack. */
function RackShell({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-[20px] border border-white/[0.08]", className)}>
      <div className="border-b border-white/[0.08] px-5 py-4 sm:px-6">
        <Pulse className="h-3 w-24" />
      </div>
      {children}
    </div>
  );
}

/** Mirrors DashboardHome: hero, meter grid, hairline racks, session log. */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex flex-col gap-8 pb-4 pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <Pulse className="h-3 w-20" />
          <Pulse className="h-12 w-80 max-w-full" />
          <Pulse className="h-5 w-[28rem] max-w-full" />
        </div>
        <div className="flex gap-3">
          <Pulse className="h-[52px] w-40" />
          <Pulse className="h-[52px] w-36" />
        </div>
      </div>

      {/* Meters */}
      <div className={cn(GRID, "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={cn(CELL, "space-y-4 px-5 py-6 sm:px-7 sm:py-7")}>
            <Pulse className="h-3 w-20" />
            <Pulse className="h-11 w-20" />
            <Pulse className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Trend and dimensions */}
      <div className="grid gap-6 lg:grid-cols-12">
        <RackShell className="lg:col-span-7">
          <div className="h-60 animate-pulse bg-white/[0.02]" />
        </RackShell>
        <RackShell className="lg:col-span-5">
          <div className="h-60 animate-pulse bg-white/[0.02]" />
        </RackShell>
      </div>

      {/* Launchers */}
      <RackShell>
        <div className="h-64 animate-pulse bg-white/[0.02]" />
      </RackShell>

      {/* Session log */}
      <RackShell>
        <div className="divide-y divide-white/[0.08]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-4 sm:px-6">
              <Pulse className="h-3 w-6 shrink-0" />
              <div className="flex-1 space-y-2">
                <Pulse className="h-4 w-44" />
                <Pulse className="h-3 w-24" />
              </div>
              <Pulse className="h-5 w-10" />
              <Pulse className="h-3 w-16" />
            </div>
          ))}
        </div>
      </RackShell>
    </div>
  );
}
