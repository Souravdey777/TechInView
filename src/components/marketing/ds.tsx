import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Marketing design system primitives. Every public page (landing, blog,
 * practice, legal, how-ai-evaluates, auth, public profiles) builds from these
 * inside <MarketingShell>, which applies .theme-landing (ink, cool greys, one
 * cyan accent) and Geist / Geist Mono. Reference: /design-system and src/app/page.tsx.
 *
 * Rules: one accent (brand-cyan). Hairline borders (white/[0.08]) instead of
 * boxed cards with shadows. No gradient text, no icon tiles as decoration, no
 * em dashes in copy. Headings are font-normal with tight negative tracking.
 */

/** Horizontal page padding used by every section. */
export const PAD = "px-5 sm:px-[clamp(20px,4vw,48px)]";
/** Content width. */
export const CONTAINER = "mx-auto w-full max-w-[1320px]";
/** Narrow reading column for long-form text (blog posts, legal). */
export const READING = "mx-auto w-full max-w-[720px]";

export const HAIRLINE = "border-white/[0.08]";
/** Hairline grid: put CELL on each child. Borders are drawn once, no doubles. */
export const GRID = "grid border-l border-t border-white/[0.08]";
export const CELL = "border-b border-r border-white/[0.08]";
/** The one framed surface, for demos and specimens (not generic content cards). */
export const PANEL = "rounded-[20px] border border-white/[0.09] bg-brand-surface";

export const H1 = "text-balance text-[clamp(40px,6.4vw,96px)] font-normal leading-[0.98] tracking-[-0.045em]";
export const H2 = "text-balance text-[clamp(32px,4.4vw,60px)] font-normal leading-[1.02] tracking-[-0.035em]";
export const H3 = "text-xl font-medium tracking-[-0.02em]";
export const LEAD = "text-pretty text-[17px] leading-relaxed text-brand-muted";
export const BODY = "text-[15px] leading-relaxed text-brand-muted";
/** Mono uppercase label for metadata, table heads and small captions. */
export const LABEL = "font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle";

export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-3 rounded-full bg-brand-cyan px-[26px] py-4 text-[15px] font-medium text-brand-deep transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.97] [&_svg]:transition-transform hover:[&_svg:last-child]:translate-x-0.5 [&>[aria-hidden]]:transition-transform hover:[&>[aria-hidden]]:translate-x-0.5 hover:bg-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep disabled:pointer-events-none disabled:opacity-50";
export const BTN_GHOST =
  "inline-flex items-center justify-center gap-3 rounded-full border border-white/[0.18] px-[26px] py-4 text-[15px] text-brand-text transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.97] [&_svg]:transition-transform hover:[&_svg:last-child]:translate-x-0.5 [&>[aria-hidden]]:transition-transform hover:[&>[aria-hidden]]:translate-x-0.5 hover:border-brand-cyan hover:text-brand-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan disabled:pointer-events-none disabled:opacity-50";
/** Compact sizes for nav, cards and inline actions. */
export const BTN_SM = "px-4 py-[9px] text-sm";
/** Visible focus ring for text links and icon buttons (pills already include one). */
export const FOCUS =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep";
/** Mono uppercase text link with an arrow, e.g. "How we score a round →". */
export const LINK_ARROW = `inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-brand-cyan transition-colors hover:text-brand-text [&>[aria-hidden]]:transition-transform hover:[&>[aria-hidden]]:translate-x-1 ${FOCUS}`;
/** Pill tag / filter chip. Add CHIP_ACTIVE when selected. */
export const CHIP =
  "inline-flex items-center rounded-full border border-white/[0.1] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-muted transition-colors hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep";
export const CHIP_ACTIVE = "border-brand-cyan/40 bg-brand-cyan/[0.08] text-brand-cyan";
/** Text inputs and selects. */
export const FIELD =
  "w-full rounded-full border border-white/[0.12] bg-transparent px-5 py-3 text-[15px] text-brand-text placeholder:text-brand-subtle focus:border-brand-cyan focus:outline-none";

/** Long-form typography for MDX posts and legal pages. */
export const PROSE =
  "prose prose-invert max-w-none prose-headings:font-normal prose-headings:tracking-[-0.025em] prose-headings:text-brand-text prose-h2:mt-14 prose-h2:text-[28px] prose-h3:text-xl prose-p:text-[17px] prose-p:leading-[1.75] prose-p:text-brand-muted prose-li:text-[17px] prose-li:text-brand-muted prose-strong:font-medium prose-strong:text-brand-text prose-a:font-normal prose-a:text-brand-cyan prose-a:no-underline hover:prose-a:text-brand-text prose-code:rounded prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:text-brand-text prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-[16px] prose-pre:border prose-pre:border-white/[0.08] prose-pre:bg-[#0B0C0F] prose-hr:border-white/[0.08] prose-blockquote:border-l-brand-cyan prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-brand-text prose-th:text-left prose-th:font-mono prose-th:text-[11px] prose-th:uppercase prose-th:tracking-[0.1em] prose-th:text-brand-subtle prose-td:text-brand-muted prose-table:border-white/[0.08]";

/** Section eyebrow: "01 · Interview room". */
export function Eyebrow({ n, children, className }: { n?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-5 font-mono text-xs uppercase tracking-[0.14em] text-brand-subtle", className)}>
      {n ? `${n} · ` : null}
      {children}
    </div>
  );
}

/** Bracketed cyan kicker above a hero headline: "[ Voice-first AI mock interviews ]". */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-7 font-mono text-xs uppercase tracking-[0.14em] text-brand-cyan", className)}>
      [ {children} ]
    </div>
  );
}

/** Eyebrow + H2 on the left, short description on the right. */
export function SectionHeader({
  n,
  eyebrow,
  title,
  description,
  className,
}: {
  n?: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-14 flex flex-wrap items-end justify-between gap-6", className)}>
      <div>
        <Eyebrow n={n}>{eyebrow}</Eyebrow>
        <h2 className={cn(H2, "max-w-[18ch]")}>{title}</h2>
      </div>
      {description ? <p className={cn(BODY, "max-w-[380px]")}>{description}</p> : null}
    </div>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: "primary" | "ghost"; size?: "md" | "sm" };

/** Pill CTA. Primary is the one cyan action on a surface; ghost is everything else. */
export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={cn(variant === "primary" ? BTN_PRIMARY : BTN_GHOST, size === "sm" && BTN_SM, className)}
    />
  );
}
