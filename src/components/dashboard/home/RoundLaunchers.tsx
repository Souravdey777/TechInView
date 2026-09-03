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

const STATUS_TONES: Record<PracticeAvailability, { label: string; className: string }> = {
  live: { label: "Live", className: "border-brand-green/30 text-brand-green" },
  beta: { label: "Beta", className: "border-brand-cyan/30 text-brand-cyan" },
  planned: { label: "Planned", className: "border-brand-amber/30 text-brand-amber" },
  coming_soon: { label: "Soon", className: "border-brand-border text-brand-subtle" },
};

const CELL_BASE =
  "flex min-h-[132px] flex-col rounded-xl border border-brand-border bg-brand-surface px-4 py-3.5";

function CellHead({ config }: { config: PracticeCardConfig }) {
  const tone = STATUS_TONES[config.status];

  return (
    <div className="flex items-center justify-between gap-2">
      <MonoLabel>{DASHBOARD_FILTER_LABELS[config.kind]}</MonoLabel>
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em]",
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
      label={<MonoLabel className="tracking-[0.18em]">Start a round</MonoLabel>}
      accessory={
        <MonoLabel className="tracking-[0.12em]">
          {hasCredits
            ? "Rounds available"
            : canPreview
              ? "Audio preview unused"
              : "Practice is always free"}
        </MonoLabel>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRACTICE_CARD_CONFIGS.map((config) => {
          const isLocked = config.status !== "live";

          if (isLocked) {
            return (
              <div
                key={config.kind}
                className={cn(CELL_BASE, "opacity-60")}
                aria-disabled="true"
              >
                <CellHead config={config} />
                <p className="mt-2.5 text-xs leading-relaxed text-brand-muted">
                  {config.shortDescription}
                </p>
                <span className="mt-auto flex items-center gap-1.5 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle">
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
                <p className="mt-2.5 text-xs leading-relaxed text-brand-muted">
                  Solve solo for free, or spend a round on the scored voice
                  interview.
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
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
                "transition-colors hover:border-brand-cyan/40 hover:bg-brand-card",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-card"
              )}
            >
              <CellHead config={config} />
              <p className="mt-2.5 text-xs leading-relaxed text-brand-muted">
                {config.shortDescription}
              </p>
              <span className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium text-brand-cyan">
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
