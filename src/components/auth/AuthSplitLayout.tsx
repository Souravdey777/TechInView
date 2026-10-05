"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { VoiceVisualizer } from "@/components/interview/VoiceVisualizer";
import { CELL, GRID, H3, Kicker, LABEL, LEAD } from "@/components/marketing/ds";
import { INTERVIEWER_PERSONAS } from "@/lib/interviewer-personas";
import { FREE_TRIAL_DURATION_MINUTES, FULL_INTERVIEW_DURATION_MINUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Only stats derived from code constants, so they cannot drift from the product.
const PANEL_STATS: ReadonlyArray<{ value: string; label: string }> = [
  { value: String(INTERVIEWER_PERSONAS.length), label: "Interviewers" },
  { value: `${FULL_INTERVIEW_DURATION_MINUTES}m`, label: "Full round" },
  { value: `${FREE_TRIAL_DURATION_MINUTES}m`, label: "Free preview" },
];

/** Inline cyan text link for auth footers and legal lines. */
export const AUTH_LINK =
  "rounded-sm text-brand-cyan transition-colors hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep";

type AuthSplitLayoutProps = {
  /** Cyan bracketed kicker above the brand panel headline. */
  kicker: string;
  /** Small mono eyebrow above the form heading. */
  eyebrow: string;
  /** The page's one h1, in the form column. */
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
  reassurance: ReactNode;
  className?: string;
};

export function AuthSplitLayout({
  kicker,
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
    <div className={cn("flex min-h-screen w-full lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]", className)}>
      {/* Brand panel (desktop only) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.08] px-[clamp(32px,4vw,64px)] py-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[20%] -top-[10%] h-[90%] w-[90%] rounded-full bg-[radial-gradient(circle,rgb(var(--brand-cyan)/0.14)_0%,rgb(var(--brand-cyan)/0.04)_35%,transparent_65%)]"
        />

        <Link href="/" className="relative w-fit rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan">
          <BrandLogo size="sm" />
        </Link>

        <div className="relative">
          {/* VoiceVisualizer's orb is 76px; scale the wrapper, never the component. */}
          <div aria-hidden className="mb-14 flex h-[200px] w-[200px] items-center justify-center">
            <div className="scale-[2.2] brightness-125">
              <VoiceVisualizer state="speaking" className="h-[76px] w-[76px]" />
            </div>
          </div>
          <Kicker>{kicker}</Kicker>
          <p className="max-w-[14ch] text-balance text-[clamp(36px,4vw,60px)] font-normal leading-[1.0] tracking-[-0.04em]">
            {panelHeadline}
          </p>
          <p className={cn(LEAD, "mt-6 max-w-[440px]")}>{panelSupporting}</p>
        </div>

        <dl className={cn(GRID, "relative grid-cols-3")}>
          {PANEL_STATS.map((stat) => (
            <div key={stat.label} className={cn(CELL, "flex flex-col-reverse gap-2 px-5 py-4")}>
              <dt className={LABEL}>{stat.label}</dt>
              <dd className="font-mono text-2xl tracking-[-0.02em] text-brand-text">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </aside>

      {/* Form column */}
      <div className="flex w-full flex-col justify-center px-5 py-12 sm:px-10 lg:px-[clamp(40px,6vw,96px)]">
        <div className="mx-auto w-full max-w-[420px]">
          <Link href="/" className="mb-12 block w-fit rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan lg:hidden">
            <BrandLogo size="sm" />
          </Link>

          <p className={LABEL}>{eyebrow}</p>
          <h1 className="mt-4 text-[clamp(40px,5vw,56px)] font-normal leading-none tracking-[-0.045em]">{heading}</h1>

          {intro}

          <div className="mt-10">{children}</div>

          <p className="mt-8 text-[15px] text-brand-muted">{footer}</p>

          <p className="mt-10 border-t border-white/[0.08] pt-6 text-[13px] leading-relaxed text-brand-subtle">
            {reassurance}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Inline auth error, announced to assistive tech as soon as it appears. */
export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-5 rounded-[16px] border border-brand-rose/30 bg-brand-rose/[0.08] px-5 py-3 text-sm text-brand-rose"
    >
      {message}
    </div>
  );
}

/** Hairline "or" divider used between the auth providers. */
export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 py-1" aria-hidden="true">
      <span className="h-px flex-1 bg-white/[0.08]" />
      <span className={LABEL}>{label}</span>
      <span className="h-px flex-1 bg-white/[0.08]" />
    </div>
  );
}

/** Small cyan-outlined callout for the form column (e.g. beta invite). */
export function AuthNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-8 border-l border-brand-cyan/60 pl-5">
      <p className={cn(H3, "text-base")}>{title}</p>
      <p className="mt-1 text-[15px] leading-relaxed text-brand-muted">{children}</p>
    </div>
  );
}
