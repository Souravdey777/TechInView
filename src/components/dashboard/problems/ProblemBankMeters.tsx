import { CELL, GRID, LABEL } from "@/components/marketing/ds";
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
    },
  ];
}

/**
 * Hairline grid of bank totals: one big number per cell. Only solved and
 * in-progress carry a status colour.
 */
export function ProblemBankMeters({
  summary,
}: {
  summary: ProblemBankSummary;
}) {
  return (
    <div className={cn(GRID, "grid-cols-2 lg:grid-cols-4")}>
      {buildMeters(summary).map((meter) => (
        <div key={meter.label} className={cn(CELL, "min-w-0 p-5 sm:p-6")}>
          <p className={LABEL}>{meter.label}</p>

          <p
            className={cn(
              "mt-6 text-[clamp(36px,4vw,56px)] font-normal leading-none tracking-[-0.04em] tabular-nums",
              meter.valueClassName ?? "text-brand-text"
            )}
          >
            {meter.value}
          </p>

          <p className="mt-3 text-[13px] leading-snug text-brand-subtle">
            {meter.caption}
          </p>
        </div>
      ))}
    </div>
  );
}
