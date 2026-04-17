import Link from "next/link";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { SetupPageHeader } from "@/components/interviews/SetupPageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SetupPageShellProps = {
  title: string;
  status: "live" | "beta" | "planned";
  description: string;
  setupHighlights: string[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  contextLabel?: string | null;
};

const STATUS_STYLES = {
  live: "border-brand-green/25 bg-brand-green/10 text-brand-green",
  beta: "border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan",
  planned: "border-brand-amber/25 bg-brand-amber/10 text-brand-amber",
} as const;

export function SetupPageShell({
  title,
  status,
  description,
  setupHighlights,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  contextLabel,
}: SetupPageShellProps) {
  return (
    <div className="min-h-screen bg-brand-deep text-brand-text">
      <SetupPageHeader
        containerClassName="max-w-4xl"
        supportingText={contextLabel ?? "Dedicated interview setup"}
      />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-brand-border bg-brand-card p-7 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                STATUS_STYLES[status]
              )}
            >
              {status}
            </span>
            <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
              Dedicated setup route
            </span>
            {contextLabel ? (
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
                {contextLabel}
              </span>
            ) : null}
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-brand-text">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted">
            {description}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {setupHighlights.map((item) => (
              <span
                key={`${title}-${item}`}
                className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
              <div className="flex items-center gap-2 text-brand-cyan">
                <Sparkles className="h-4 w-4" />
                <p className="text-sm font-semibold">What this setup will own</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                This page exists so each interview format can evolve independently instead of
                overloading one generic setup flow.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
              <div className="flex items-center gap-2 text-brand-amber">
                <Clock3 className="h-4 w-4" />
                <p className="text-sm font-semibold">Current phase</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                {status === "live"
                  ? "This route is live and points into the current working setup flow."
                  : "This route is part of the new IA shell. The dedicated runtime for this format is still being built."}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {secondaryHref && secondaryLabel ? (
              <Button asChild variant="secondary">
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
