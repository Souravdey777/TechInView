import { MonoLabel } from "@/components/shared/Rack";
import { cn } from "@/lib/utils";
import type { ProblemBankSummary } from "@/components/dashboard/problems/catalogue";

type Meter = {
  label: string;
  value: number;
  caption: string;
  valueClassName?: string;
};

function buildMeters(summary: ProblemBankSummary): Meter[] {
  return [
    {
      label: "In the bank",
      value: summary.total,
      caption: `${summary.easy} easy · ${summary.medium} medium · ${summary.hard} hard`,
    },
    {
      label: "Solved",
      value: summary.solved,
      caption:
        summary.solved > 0
          ? `${summary.untouched} still untouched`
          : "Nothing solved yet",
      valueClassName: summary.solved > 0 ? "text-brand-green" : undefined,
    },
    {
      label: "In progress",
      value: summary.inProgress,
      caption:
        summary.inProgress > 0 ? "Tests still failing" : "No saved attempts",
      valueClassName: summary.inProgress > 0 ? "text-brand-amber" : undefined,
    },
    {
      label: "Free to solve",
      value: summary.free,
      caption: "No round spent",
      valueClassName: summary.free > 0 ? "text-brand-cyan" : undefined,
    },
  ];
}

/**
 * Hairline strip of bank totals. Cells share one border so the strip reads as
 * a single instrument panel, matching the dashboard's meters.
 */
export function ProblemBankMeters({
  summary,
}: {
  summary: ProblemBankSummary;
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-brand-border bg-brand-border lg:grid-cols-4">
      {buildMeters(summary).map((meter) => (
        <div key={meter.label} className="bg-brand-card px-4 py-4 sm:px-5 sm:py-5">
          <MonoLabel className="text-[9px] sm:text-[10px]">
            {meter.label}
          </MonoLabel>

          <p
            className={cn(
              "mt-3 font-heading text-3xl font-bold leading-none tracking-tight sm:mt-3.5 sm:text-4xl",
              meter.valueClassName ?? "text-brand-text"
            )}
          >
            {meter.value}
          </p>

          <p className="mt-2 text-[11px] text-brand-subtle sm:mt-2.5 sm:text-xs">
            {meter.caption}
          </p>
        </div>
      ))}
    </div>
  );
}
