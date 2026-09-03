import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Hero */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-11 w-36" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>

      {/* Meters */}
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-brand-border bg-brand-border sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 bg-brand-card px-5 py-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Trend and dimensions */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="h-72 animate-pulse rounded-2xl border border-brand-border bg-brand-card lg:col-span-7" />
        <div className="h-72 animate-pulse rounded-2xl border border-brand-border bg-brand-card lg:col-span-5" />
      </div>

      {/* Launchers */}
      <div className="h-64 animate-pulse rounded-2xl border border-brand-border bg-brand-card" />

      {/* Session log */}
      <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-card">
        <div className="border-b border-brand-border bg-brand-surface px-5 py-3">
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="divide-y divide-brand-border/60">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-3 w-6 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
