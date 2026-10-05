import { cn } from "@/lib/utils";
import { CELL, GRID, LABEL } from "@/components/marketing/ds";
import type { PublicProfilePracticeActivity } from "@/lib/public-profile";

const HEATMAP_LEVEL_STYLES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-white/[0.03] border-white/[0.06]",
  1: "bg-brand-cyan/20 border-brand-cyan/20",
  2: "bg-brand-cyan/40 border-brand-cyan/35",
  3: "bg-brand-cyan/70 border-brand-cyan/60",
  4: "bg-brand-cyan border-brand-cyan",
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

  const stats = [
    { label: "Total sessions", value: activity.totalSessions },
    { label: "Active days", value: activity.activeDays },
    { label: "Current streak", value: `${activity.currentStreak}d` },
  ];

  return (
    <div>
      <dl className={cn(GRID, "grid-cols-3")}>
        {stats.map((stat) => (
          <div key={stat.label} className={cn(CELL, "flex flex-col-reverse gap-2 px-4 py-4 sm:px-5")}>
            <dt className={LABEL}>{stat.label}</dt>
            <dd className="font-mono text-xl tracking-[-0.02em] text-brand-text">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 overflow-x-auto pb-2">
        <div className="min-w-[860px]">
          <div className="flex">
            <div className="w-8 shrink-0" />
            <div className="relative h-5" style={{ width }}>
              {activity.monthLabels.map((month) => (
                <span
                  key={`${month.label}-${month.column}`}
                  className="absolute top-0 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-subtle"
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
                  className="absolute font-mono text-[10px] text-brand-subtle"
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
                        "h-3 w-3 rounded-[3px] border transition-colors",
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

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4 text-[13px] text-brand-subtle">
        <p className="max-w-[60ch]">
          Built from completed and abandoned practice rounds, so the grid reflects real usage instead of only polished outcomes.
        </p>

        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em]">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className={cn(
                  "h-3 w-3 rounded-[3px] border",
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
