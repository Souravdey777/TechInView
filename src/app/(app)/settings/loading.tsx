import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CELL, GRID } from "@/components/marketing/ds";

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.04]", className)} />;
}

function RackSkeleton({
  danger = false,
  children,
}: {
  danger?: boolean;
  children: ReactNode;
}) {
  const border = danger ? "border-brand-rose/25" : "border-white/[0.08]";
  return (
    <div className={cn("overflow-hidden rounded-[20px] border", border)}>
      <div className={cn("flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6", border)}>
        <Pulse className="h-3 w-24" />
        <Pulse className="hidden h-3 w-36 sm:block" />
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div>
      {/* Eyebrow + title */}
      <Pulse className="h-3 w-20" />
      <Pulse className="mt-4 h-12 w-56" />

      <div className="mt-8 grid items-start gap-6 sm:mt-12 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        {/* Section nav */}
        <div className="flex gap-4 overflow-hidden lg:flex-col lg:gap-5 lg:border-l lg:border-white/[0.08] lg:pl-4 lg:pt-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Pulse key={i} className="h-3 w-20 shrink-0 lg:w-28" />
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {/* Profile */}
          <RackSkeleton>
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Pulse className="h-3 w-24" />
                  <Pulse className="h-12 w-full rounded-full" />
                </div>
              ))}
            </div>
          </RackSkeleton>

          {/* Rounds and billing */}
          <RackSkeleton>
            <Pulse className="h-12 w-24" />
            <Pulse className="mt-3 h-4 w-72 max-w-full" />
            <div className={cn(GRID, "mt-6 sm:grid-cols-3")}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={cn(CELL, "space-y-5 p-5")}>
                  <Pulse className="h-3 w-20" />
                  <Pulse className="h-10 w-24" />
                  <Pulse className="h-4 w-36" />
                  <Pulse className="h-10 w-full rounded-full" />
                </div>
              ))}
            </div>
          </RackSkeleton>

          {/* Danger zone */}
          <RackSkeleton danger>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <Pulse className="h-5 w-32" />
                <Pulse className="h-4 w-72 max-w-full" />
              </div>
              <Pulse className="h-10 w-36 shrink-0 rounded-full" />
            </div>
          </RackSkeleton>
        </div>
      </div>
    </div>
  );
}
