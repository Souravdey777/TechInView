import { MonoLabel, Rack } from "@/components/shared/Rack";
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
      className="flex h-full flex-col"
      bodyClassName="flex flex-1 flex-col"
      label={<MonoLabel className="tracking-[0.18em]">Dimension average</MonoLabel>}
      accessory={<MonoLabel className="tracking-[0.12em]">{note}</MonoLabel>}
    >
      {dimensions.length > 0 ? (
        <div className="flex flex-col gap-4 pb-5">
          {dimensions.map((dimension) => {
            const isWeakest = dimension.key === weakestKey;

            return (
              <div key={dimension.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={cn(
                      "text-sm",
                      isWeakest
                        ? "font-semibold text-brand-text"
                        : "font-medium text-brand-text"
                    )}
                  >
                    {dimension.label}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xs font-bold",
                      getScoreColor(dimension.average)
                    )}
                  >
                    {dimension.average}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-brand-border">
                  <div
                    className={cn("h-full", getScoreBgColor(dimension.average))}
                    style={{ width: `${Math.max(2, dimension.average)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-brand-muted">
          Dimension averages need one scored round. They break your weighted
          score into the parts an interviewer actually watches.
        </p>
      )}

      {footnote ? (
        <p className="mt-auto border-t border-brand-border pt-4 text-xs leading-relaxed text-brand-muted">
          {footnote}
        </p>
      ) : null}
      <p className="sr-only">The hire line sits at {HIRE_LINE}.</p>
    </Rack>
  );
}
