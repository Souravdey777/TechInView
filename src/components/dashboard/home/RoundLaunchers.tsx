import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonoLabel, Rack } from "@/components/shared/Rack";
import {
  DASHBOARD_FILTER_LABELS,
  PRACTICE_CARD_CONFIGS,
  type PracticeAvailability,
  type PracticeCardConfig,
} from "@/lib/dashboard/models";
import { cn } from "@/lib/utils";
import { CELL } from "@/components/marketing/ds";

const STATUS_TONES: Record<PracticeAvailability, { label: string; className: string }> = {
  live: { label: "Live", className: "border-brand-green/30 text-brand-green" },
  beta: { label: "Beta", className: "border-white/[0.18] text-brand-text" },
  planned: { label: "Planned", className: "border-brand-amber/30 text-brand-amber" },
  coming_soon: { label: "Soon", className: "border-white/[0.1] text-brand-subtle" },
};

/** Hairline grid cell; the grid's -mb/-mr tucks the outer edges under the rack border. */
const CELL_BASE = cn(CELL, "flex min-h-[156px] flex-col px-5 py-5 sm:px-6");

function CellHead({ config }: { config: PracticeCardConfig }) {
  const tone = STATUS_TONES[config.status];

  return (
    <div className="flex items-center justify-between gap-2">
      <MonoLabel>{DASHBOARD_FILTER_LABELS[config.kind]}</MonoLabel>
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
          tone.className
        )}
      >
        {tone.label}
      </span>
    </div>
  );
}

type RoundLaunchersProps = {
  hasCredits: boolean;
  /** An unused audio preview covers a DSA round even with no credits. */
  canPreview: boolean;
};

/** Every round type in one rack: live ones launchable, the rest visibly parked. */
export function RoundLaunchers({ hasCredits, canPreview }: RoundLaunchersProps) {
  const canStartDsaRound = hasCredits || canPreview;
  return (
    <Rack
      label={<MonoLabel>Start a round</MonoLabel>}
      accessory={
        <MonoLabel>
          {hasCredits
            ? "Rounds available"
            : canPreview
              ? "Audio preview unused"
              : "Practice is always free"}
        </MonoLabel>
      }
      bodyClassName="p-0"
    >
      <div className="-mb-px -mr-px grid sm:grid-cols-2 lg:grid-cols-3">
        {PRACTICE_CARD_CONFIGS.map((config) => {
          const isLocked = config.status !== "live";

          if (isLocked) {
            return (
              <div
                key={config.kind}
                className={cn(CELL_BASE, "opacity-50")}
                aria-disabled="true"
              >
                <CellHead config={config} />
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                  {config.shortDescription}
                </p>
                <span className="mt-auto flex items-center gap-1.5 pt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">
                  <Lock className="h-3 w-3" />
                  Not open yet
                </span>
              </div>
            );
          }

          if (config.kind === "dsa") {
            return (
              <div key={config.kind} className={CELL_BASE}>
                <CellHead config={config} />
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                  Solve solo for free, or spend a round on the scored voice
                  interview.
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/interview/setup?dsaExperience=practice">
                      Practice free
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link
                      href={
                        canStartDsaRound
                          ? "/interview/setup?dsaExperience=ai_interview"
                          : "/settings#rounds"
                      }
                    >
                      {hasCredits
                        ? "AI interview"
                        : canPreview
                          ? "Audio preview"
                          : "Buy rounds"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={config.kind}
              href={hasCredits ? config.href : "/settings#rounds"}
              className={cn(
                CELL_BASE,
                "transition-colors hover:bg-white/[0.03]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan"
              )}
            >
              <CellHead config={config} />
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                {config.shortDescription}
              </p>
              <span className="mt-auto flex items-center gap-2 pt-4 font-mono text-xs uppercase tracking-[0.08em] text-brand-cyan">
                {hasCredits ? config.ctaLabel : "Buy rounds to start"}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </Rack>
  );
}
