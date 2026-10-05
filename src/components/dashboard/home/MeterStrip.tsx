import { cn } from "@/lib/utils";
import { CELL, GRID, LABEL } from "@/components/marketing/ds";
import type { DashboardMeter } from "@/lib/dashboard/home-metrics";

/**
 * Hairline grid of headline numbers. Cells share one border so the strip
 * reads as a single instrument panel rather than four floating cards.
 */
export function MeterStrip({ meters }: { meters: readonly DashboardMeter[] }) {
  return (
    <div className={cn(GRID, "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}>
      {meters.map((meter) => (
        <div key={meter.label} className={cn(CELL, "px-5 py-6 sm:px-7 sm:py-7")}>
          <span className={LABEL}>{meter.label}</span>

          <div className="mt-4 flex items-baseline gap-2.5">
            <p className="text-[clamp(36px,3.6vw,48px)] font-normal leading-none tracking-[-0.04em] tabular-nums text-brand-text">
              {meter.value}
              {meter.suffix ? (
                <span className="text-xl tracking-[-0.02em] text-brand-subtle">{meter.suffix}</span>
              ) : null}
            </p>
            {meter.delta ? (
              <span
                className={cn(
                  "font-mono text-xs tabular-nums",
                  meter.delta.tone === "green" ? "text-brand-green" : "text-brand-rose"
                )}
              >
                {meter.delta.label}
              </span>
            ) : null}
          </div>

          {meter.segments ? (
            <div className="mt-4 flex gap-0.5" aria-hidden="true">
              {Array.from({ length: meter.segments.total }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    index < meter.segments!.filled
                      ? "bg-brand-green"
                      : "bg-white/[0.08]"
                  )}
                />
              ))}
            </div>
          ) : null}

          {meter.caption ? (
            <p className="mt-3 text-[13px] text-brand-subtle">{meter.caption}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
