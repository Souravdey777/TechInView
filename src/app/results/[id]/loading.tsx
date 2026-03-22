import { Skeleton } from "@/components/ui/skeleton";

export default function ResultsLoading() {
  return (
    <main className="min-h-screen bg-brand-deep text-brand-text">
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
        {/* Top Nav */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-48 rounded-full" />
        </div>

        {/* Page Title */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Score Summary Card */}
        <div className="bg-brand-card rounded-xl border border-brand-border p-6 space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-4 w-full max-w-lg" />
              <Skeleton className="h-4 w-3/4 max-w-md" />
            </div>
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>

        {/* Radar Chart */}
        <Skeleton className="h-72 w-full rounded-xl" />

        {/* Feedback Cards */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-brand-card rounded-xl border border-brand-border p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
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
