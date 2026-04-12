import { cn } from "@/lib/utils";
import type { PublicProfilePracticeActivity } from "@/lib/public-profile";

const HEATMAP_LEVEL_STYLES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-brand-surface border-brand-border/80",
  1: "bg-brand-cyan/20 border-brand-cyan/20",
  2: "bg-brand-cyan/40 border-brand-cyan/35",
  3: "bg-brand-green/55 border-brand-green/40",
  4: "bg-brand-green border-brand-green/80",
};

const DAY_LABELS = [
  { label: "M", row: 0 },
  { label: "W", row: 2 },
  { label: "F", row: 4 },
] as const;

const COLUMN_WIDTH = 16;

type PracticeHeatmapProps = {
  activity: PublicProfilePracticeActivity;
};

function formatTooltip(date: string, count: number): string {
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));

  if (count === 0) {
    return `No practice on ${dateLabel}`;
  }

  return `${count} practice session${count === 1 ? "" : "s"} on ${dateLabel}`;
}

export function PracticeHeatmap({ activity }: PracticeHeatmapProps) {
  const width = activity.weeks.length * COLUMN_WIDTH;

  return (
    <div className="rounded-3xl border border-brand-border bg-brand-card p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-text">
            Practice Activity
          </h2>
          <p className="mt-1 text-sm leading-6 text-brand-muted">
            A year-long view of how consistently this candidate has been practicing on TechInView.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-brand-muted">
          <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1">
            {activity.totalSessions} total sessions
          </span>
          <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1">
            {activity.activeDays} active days
          </span>
          <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1">
            {activity.currentStreak} day current streak
          </span>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="min-w-[860px]">
          <div className="flex">
            <div className="w-8 shrink-0" />
            <div className="relative h-5" style={{ width }}>
              {activity.monthLabels.map((month) => (
                <span
                  key={`${month.label}-${month.column}`}
                  className="absolute top-0 text-[11px] text-brand-muted"
                  style={{ left: `${month.column * COLUMN_WIDTH}px` }}
                >
                  {month.label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-3">
            <div className="relative h-[108px] w-5 shrink-0">
              {DAY_LABELS.map((day) => (
                <span
                  key={day.label}
                  className="absolute text-[10px] text-brand-muted"
                  style={{ top: `${day.row * COLUMN_WIDTH}px` }}
                >
                  {day.label}
                </span>
              ))}
            </div>

            <div className="flex gap-1">
              {activity.weeks.map((week) => (
                <div key={week.key} className="flex flex-col gap-1">
                  {week.days.map((day) => (
                    <div
                      key={day.date}
                      title={formatTooltip(day.date, day.count)}
                      className={cn(
                        "h-3 w-3 rounded-[4px] border transition-colors",
                        day.isFuture
                          ? "bg-transparent border-transparent"
                          : HEATMAP_LEVEL_STYLES[day.level]
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-brand-muted">
        <p>
          Built from completed and abandoned practice rounds, so the grid reflects real usage instead of only polished outcomes.
        </p>

        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className={cn(
                  "h-3 w-3 rounded-[4px] border",
                  HEATMAP_LEVEL_STYLES[level as 0 | 1 | 2 | 3 | 4]
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
