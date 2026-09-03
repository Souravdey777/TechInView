import { cn } from "@/lib/utils";
import { MonoLabel } from "@/components/shared/Rack";
import type { DashboardMeter } from "@/lib/dashboard/home-metrics";

/**
 * Hairline strip of headline numbers. Cells share one border so the strip
 * reads as a single instrument panel rather than four floating cards.
 */
export function MeterStrip({ meters }: { meters: readonly DashboardMeter[] }) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-brand-border bg-brand-border sm:grid-cols-2 lg:grid-cols-4">
      {meters.map((meter) => (
        <div key={meter.label} className="bg-brand-card px-5 py-5">
          <MonoLabel>{meter.label}</MonoLabel>

          <div className="mt-3.5 flex items-baseline gap-2.5">
            <p className="font-heading text-4xl font-bold leading-none tracking-tight text-brand-text">
              {meter.value}
              {meter.suffix ? (
                <span className="text-xl text-brand-subtle">{meter.suffix}</span>
              ) : null}
            </p>
            {meter.delta ? (
              <span
                className={cn(
                  "font-mono text-xs font-bold",
                  meter.delta.tone === "green" ? "text-brand-green" : "text-brand-rose"
                )}
              >
                {meter.delta.label}
              </span>
            ) : null}
          </div>

          {meter.segments ? (
            <div className="mt-3.5 flex gap-0.5" aria-hidden="true">
              {Array.from({ length: meter.segments.total }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1 flex-1 rounded-sm",
                    index < meter.segments!.filled
                      ? "bg-brand-green"
                      : "bg-brand-border"
                  )}
                />
              ))}
            </div>
          ) : null}

          {meter.caption ? (
            <p className="mt-2.5 text-xs text-brand-subtle">{meter.caption}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
