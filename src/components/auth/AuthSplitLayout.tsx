"use client";

import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { VoiceVisualizer } from "@/components/interview/VoiceVisualizer";
import { INTERVIEWER_PERSONAS } from "@/lib/interviewer-personas";
import { FULL_INTERVIEW_DURATION_MINUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Number of DSA problems shipped in the catalog.
 * Verified against the `.json` file count in `src/data/problems`.
 */
const DSA_PROBLEM_COUNT = 70;

const PANEL_STATS: ReadonlyArray<{ value: string; label: string }> = [
  { value: String(DSA_PROBLEM_COUNT), label: "DSA problems" },
  { value: String(INTERVIEWER_PERSONAS.length), label: "Interviewers" },
  { value: `${FULL_INTERVIEW_DURATION_MINUTES}m`, label: "Full round" },
];

type AuthSplitLayoutProps = {
  /** Small mono eyebrow above the heading. */
  eyebrow: string;
  /** Large tight-tracked heading for the form column. */
  heading: string;
  /** Headline for the brand panel. */
  panelHeadline: string;
  /** One supporting line under the brand panel headline. */
  panelSupporting: string;
  /** Optional slot between the heading and the providers (badges, callouts). */
  intro?: ReactNode;
  /** The auth form / provider buttons. */
  children: ReactNode;
  /** Link across to the opposite auth page. */
  footer: ReactNode;
  /** Small reassurance line pinned below a hairline. */
  reassurance: string;
  className?: string;
};

export function AuthSplitLayout({
  eyebrow,
  heading,
  panelHeadline,
  panelSupporting,
  intro,
  children,
  footer,
  reassurance,
  className,
}: AuthSplitLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen w-full bg-brand-deep lg:grid lg:grid-cols-2",
        className
      )}
    >
      {/* ── Brand panel (desktop only) ── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-brand-border bg-brand-surface px-14 py-12 lg:flex">
        <div
          className="pointer-events-none absolute left-1/2 top-[16%] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-brand-cyan/[0.11] blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40"
          aria-hidden="true"
        />

        <div className="relative">
          <BrandLogo size="sm" />
        </div>

        <div className="relative flex flex-col items-center gap-8">
          {/* VoiceVisualizer is a fixed 76px orb whose glow overflows its box.
              Scale on this wrapper only — never inside the component. */}
          <div className="flex h-[260px] w-[260px] shrink-0 items-center justify-center">
            <div className="scale-[1.9]">
              <VoiceVisualizer state="listening" />
            </div>
          </div>

          <div className="max-w-[26rem] text-center">
            <p className="font-heading text-[1.875rem] font-bold leading-[1.18] tracking-[-0.03em] text-brand-text">
              {panelHeadline}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-brand-muted">
              {panelSupporting}
            </p>
          </div>
        </div>

        <dl className="relative flex gap-10">
          {PANEL_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse gap-1.5">
              <dt className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-brand-subtle">
                {stat.label}
              </dt>
              <dd className="font-heading text-[1.375rem] font-bold tracking-[-0.03em] text-brand-text">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </aside>

      {/* ── Form column ── */}
      <main className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <BrandLogo size="sm" />
          </div>

          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-brand-subtle">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-heading text-3xl font-bold leading-none tracking-[-0.04em] text-brand-text sm:text-[2.5rem]">
            {heading}
          </h1>

          {intro}

          <div className="mt-9">{children}</div>

          <div className="mt-7 text-sm text-brand-muted">{footer}</div>

          <p className="mt-8 border-t border-brand-border pt-6 text-xs leading-relaxed text-brand-subtle">
            {reassurance}
          </p>
        </div>
      </main>
    </div>
  );
}

/** Inline auth error, announced to assistive tech as soon as it appears. */
export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-5 rounded-xl border border-brand-rose/30 bg-brand-rose/10 px-4 py-3 text-sm text-brand-rose"
    >
      {message}
    </div>
  );
}

/** Hairline "or" divider used between the auth providers. */
export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 py-1" aria-hidden="true">
      <span className="h-px flex-1 bg-brand-border" />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-subtle">
        {label}
      </span>
      <span className="h-px flex-1 bg-brand-border" />
    </div>
  );
}
