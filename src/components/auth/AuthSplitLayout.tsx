"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { VoiceVisualizer, type VoiceState } from "@/components/interview/VoiceVisualizer";
import { BODY, H3, LABEL } from "@/components/marketing/ds";
import { PHASE_LABELS, PHASE_ORDER } from "@/lib/interview-phases";
import { FREE_TRIAL_DURATION_MINUTES, FULL_INTERVIEW_DURATION_MINUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
  /** An auth redirect is in flight; Tia shows "thinking". */
  busy?: boolean;
  className?: string;
};

const TYPE_DELAY_MS = 500;
const TYPE_CHAR_MS = 38;

/** Types `text` out like Tia saying it. Reduced motion shows it all at once. */
function useTypedLine(text: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let id = window.setTimeout(function tick() {
      setCount((c) => {
        if (c + 1 < text.length) id = window.setTimeout(tick, TYPE_CHAR_MS);
        return c + 1;
      });
    }, TYPE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [text]);

  return { typed: text.slice(0, count), done: count >= text.length };
}

/** Full text holds the space (no layout shift) and is what screen readers get; the typed copy sits on top. */
function TypedText({ text, typed, done }: { text: string; typed: string; done: boolean }) {
  return (
    <span className="grid">
      <span className="invisible col-start-1 row-start-1">{text}</span>
      <span aria-hidden className="col-start-1 row-start-1">
        {typed}
        {!done && <span className="ml-0.5 inline-block h-[0.8em] w-[0.08em] translate-y-[0.08em] animate-pulse bg-brand-cyan" />}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

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
  busy = false,
  className,
}: AuthSplitLayoutProps) {
  const line = useTypedLine(panelHeadline);
  const [attentive, setAttentive] = useState(false);
  // Tia talks first, then listens while you're on the sign-in options, and thinks while you're redirected.
  const orbState: VoiceState = busy ? "thinking" : !line.done ? "speaking" : attentive ? "listening" : "idle";
  const listen = {
    onPointerEnter: () => setAttentive(true),
    onPointerLeave: () => setAttentive(false),
    onFocus: () => setAttentive(true),
    onBlur: () => setAttentive(false),
  };

  return (
    <div className={cn("flex min-h-screen w-full lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]", className)}>
      <AuthBrandPanel kicker={kicker} headline={panelHeadline} supporting={panelSupporting} line={line} orbState={orbState} />

      {/* Form column */}
      <div className="flex w-full flex-col justify-center px-5 py-12 sm:px-10 lg:px-[clamp(40px,6vw,96px)]">
        <div className="mx-auto w-full max-w-[420px]">
          <Link href="/" className="mb-12 block w-fit rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan lg:hidden">
            <BrandLogo size="sm" />
          </Link>

          {/* Mobile has no brand panel, so Tia greets you here instead. */}
          <div aria-hidden className="mb-10 flex items-center gap-4 lg:hidden">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center">
              <div className="scale-[0.62]">
                <VoiceVisualizer state={orbState} className="h-[76px] w-[76px]" />
              </div>
            </div>
            <p className="text-[15px] leading-snug text-brand-muted">
              <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.1em] text-brand-cyan">Tia</span>
              <TypedText text={panelHeadline} {...line} />
            </p>
          </div>

          <p className={LABEL}>{eyebrow}</p>
          <h1 className="mt-4 text-[clamp(40px,5vw,56px)] font-normal leading-none tracking-[-0.045em]">{heading}</h1>

          {intro}

          <div className="mt-10" {...listen}>
            {children}
          </div>

          <p className="mt-8 text-[15px] text-brand-muted">{footer}</p>

          <p className="mt-10 border-t border-white/[0.08] pt-6 text-[13px] leading-relaxed text-brand-subtle">
            {reassurance}
          </p>
        </div>
      </div>
    </div>
  );
}

const STATE_LABEL: Record<VoiceState, string> = {
  idle: "Waiting on you",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

const pad = (n: number) => String(n).padStart(2, "0");
const clock = (secs: number) => `${pad(Math.floor(secs / 60) % 60)}:${pad(secs % 60)}`;

/** Seconds since mount; starts at 0 on server and client so hydration matches. */
function useElapsed() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => setSecs(Math.floor((performance.now() - start) / 1000)), 250);
    return () => window.clearInterval(id);
  }, []);
  return secs;
}

/**
 * Desktop-only brand column shared by login, signup and onboarding.
 * Framed as an interview that has already started: Tia's opening line is the
 * headline, the candidate's turn is the form, and the footer is the real phase rail.
 */
export function AuthBrandPanel({
  kicker,
  headline,
  supporting,
  line,
  orbState,
}: {
  kicker: string;
  headline: string;
  supporting: string;
  /** Shared with the form column on login/signup; standalone (onboarding) the panel types its own. */
  line?: { typed: string; done: boolean };
  orbState?: VoiceState;
}) {
  const ownLine = useTypedLine(headline);
  const shown = line ?? ownLine;
  const state = orbState ?? (shown.done ? "idle" : "speaking");
  const secs = useElapsed();

  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.08] px-[clamp(32px,4vw,64px)] py-12 lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[20%] -top-[10%] h-[90%] w-[90%] rounded-full bg-[radial-gradient(circle,rgb(var(--brand-cyan)/0.14)_0%,rgb(var(--brand-cyan)/0.04)_35%,transparent_65%)]"
      />

      <div className="relative flex items-center justify-between">
        <Link href="/" className="w-fit rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan">
          <BrandLogo size="sm" />
        </Link>
        <span aria-hidden className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-rose" />
          Live · {clock(secs)}
        </span>
      </div>

      <div className="relative">
        {/* Name plate: orb + who is on the call and what she is doing. */}
        <div className="mb-12 flex items-center gap-8">
          {/* VoiceVisualizer's orb is 76px; scale the wrapper, never the component. */}
          <div aria-hidden className="flex h-[150px] w-[150px] shrink-0 items-center justify-center">
            <div className="scale-[1.7] brightness-125">
              <VoiceVisualizer state={state} followCursor className="h-[76px] w-[76px]" />
            </div>
          </div>
          <div>
            <p className="text-2xl tracking-[-0.02em]">Tia</p>
            <p className={cn(LABEL, "mt-1.5")}>AI interviewer</p>
            <p aria-hidden className="mt-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {STATE_LABEL[state]}
            </p>
          </div>
        </div>

        {/* Transcript */}
        <p className={cn(LABEL, "mb-6")}>{kicker}</p>
        <ol className="space-y-7 border-l border-white/[0.1] pl-6">
          <li>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-cyan">
              <span className="text-brand-subtle">00:00</span> · Tia
            </p>
            <p className="max-w-[20ch] text-balance text-[clamp(30px,3.2vw,46px)] font-normal leading-[1.05] tracking-[-0.035em]">
              <TypedText text={headline} {...shown} />
            </p>
            <p className={cn(BODY, "mt-4 max-w-[440px]")}>{supporting}</p>
          </li>
          <li
            aria-hidden
            className="transition-opacity duration-500 motion-reduce:transition-none"
            style={{ opacity: shown.done ? 1 : 0 }}
          >
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-text">
              <span className="text-brand-subtle">{clock(secs)}</span> · You
            </p>
            <p className="flex items-center gap-3 text-lg text-brand-muted">
              {state === "listening" ? (
                <span className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              ) : state === "thinking" ? (
                "Connecting…"
              ) : (
                <>
                  Your turn <span className="text-brand-cyan">→</span>
                </>
              )}
            </p>
          </li>
        </ol>
      </div>

      {/* The real interview track, from code constants so it cannot drift. */}
      <div className="relative">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <p className={LABEL}>
            Phase 1 / {PHASE_ORDER.length} · <span className="text-brand-text">{PHASE_LABELS[PHASE_ORDER[0]]}</span>
          </p>
          <p className={LABEL}>
            {FULL_INTERVIEW_DURATION_MINUTES}m round · {FREE_TRIAL_DURATION_MINUTES}m free
          </p>
        </div>
        <ol className="flex gap-1.5">
          {PHASE_ORDER.map((phase, i) => (
            <li key={phase} title={PHASE_LABELS[phase]} className="flex-1">
              <span
                className={cn("block h-[3px] rounded-full", i === 0 ? "animate-pulse bg-brand-cyan" : "bg-white/[0.1]")}
              />
              <span className="sr-only">{PHASE_LABELS[phase]}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
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
