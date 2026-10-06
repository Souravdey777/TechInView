import type { CSSProperties } from "react";
import { MonoLabel, Rack } from "@/components/shared/Rack";
import { BODY } from "@/components/marketing/ds";
import { HIRE_LINE, type DimensionAverage } from "@/lib/dashboard/home-metrics";
import { cn, getScoreBgColor, getScoreColor } from "@/lib/utils";

type DimensionAveragesProps = {
  dimensions: readonly DimensionAverage[];
  note: string;
  footnote: string | null;
};

/** Per-dimension bars over the recent rounds, weakest dimension called out. */
export function DimensionAverages({
  dimensions,
  note,
  footnote,
}: DimensionAveragesProps) {
  const weakestKey =
    dimensions.length > 0 ? dimensions[dimensions.length - 1].key : null;

  return (
    <Rack
      label={<MonoLabel>Dimension average</MonoLabel>}
      accessory={<MonoLabel>{note}</MonoLabel>}
    >
      {dimensions.length > 0 ? (
        <div className="flex flex-col gap-4">
          {dimensions.map((dimension, index) => {
            const isWeakest = dimension.key === weakestKey;

            return (
              <div key={dimension.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={cn(
                      "text-sm",
                      isWeakest
                        ? "font-medium text-brand-text"
                        : "text-brand-muted"
                    )}
                  >
                    {dimension.label}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      getScoreColor(dimension.average)
                    )}
                  >
                    {dimension.average}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className={cn("grow-x h-full", getScoreBgColor(dimension.average))}
                    style={{
                      width: `${Math.max(2, dimension.average)}%`,
                      "--d": `${300 + index * 70}ms`,
                    } as CSSProperties}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={BODY}>
          Dimension averages need one scored round. They break your weighted
          score into the parts an interviewer actually watches.
        </p>
      )}

      {footnote ? (
        <p className="mt-5 border-t border-white/[0.08] pt-4 text-[13px] leading-relaxed text-brand-muted">
          {footnote}
        </p>
      ) : null}
      <p className="sr-only">The hire line sits at {HIRE_LINE}.</p>
    </Rack>
  );
}
