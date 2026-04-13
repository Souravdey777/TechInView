import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  LifeBuoy,
  Mail,
  Mic,
  Sparkles,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LEGAL_LINKS, SUPPORT_EMAIL, createSupportMailto } from "@/lib/legal";

type MarketingFooterProps = {
  signupHref: string;
};

const productLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
] as const;

const resourceLinks = [
  { href: "/practice", label: "Practice Problems" },
  { href: "/how-ai-evaluates", label: "How TechInView Evaluates You" },
  { href: "/blog", label: "Blog" },
] as const;

type FooterSignal = {
  icon: LucideIcon;
  label: string;
};

const platformSignals: readonly FooterSignal[] = [
  { icon: Mic, label: "Real-time voice interviews" },
  { icon: Sparkles, label: "Five-dimension feedback" },
  { icon: Ticket, label: "One-time interview packs" },
] as const;

export function MarketingFooter({ signupHref }: MarketingFooterProps) {
  const year = new Date().getFullYear();
  const supportHref = createSupportMailto({
    subject: "TechInView support request",
  });

  return (
    <footer className="relative overflow-hidden border-t border-brand-border bg-brand-deep">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.12]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/35 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[min(90vw,42rem)] -translate-x-1/2 rounded-full bg-brand-cyan/[0.06] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pb-12 sm:pt-16 lg:pb-14 lg:pt-20">
        <div className="rounded-[28px] border border-brand-border bg-[linear-gradient(180deg,rgba(17,24,32,0.92),rgba(7,8,10,0.96))] shadow-[0_24px_80px_-48px_rgba(34,211,238,0.32)]">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:p-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-cyan">
                Practice With Pressure
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex"
              >
                <BrandLogo size="md" wordmarkClassName="text-2xl font-bold" />
              </Link>
              <h2 className="mt-5 max-w-2xl text-2xl font-semibold leading-tight text-brand-text sm:text-3xl">
                The closest thing to a live coding round before the real one.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
                Start with free DSA practice, then switch into voice-based mock
                interviews when you want the full loop: communication, coding,
                testing, and a sharper post-round debrief.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={signupHref}
                  className="group inline-flex items-center gap-2 rounded-xl bg-brand-cyan px-4 py-2.5 text-sm font-semibold text-brand-deep transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
                >
                  Practice free
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <Link
                  href="/practice"
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-brand-card/60 px-4 py-2.5 text-sm font-medium text-brand-text transition-colors hover:border-brand-cyan/30 hover:bg-brand-card"
                >
                  <BookOpen className="h-4 w-4 text-brand-cyan" aria-hidden />
                  Browse practice problems
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                {platformSignals.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface/70 px-3.5 py-2 text-xs text-brand-muted"
                  >
                    <Icon className="h-3.5 w-3.5 text-brand-cyan" aria-hidden />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-brand-border bg-brand-card/70 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                  Need Help?
                </p>
                <h3 className="mt-3 text-lg font-semibold text-brand-text">
                  Support for billing, credits, and access issues
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  Questions before buying, missing credits after payment, or
                  trouble logging in? Reach us directly by email.
                </p>
                <a
                  href={supportHref}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-deep transition-colors hover:bg-cyan-300"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {SUPPORT_EMAIL}
                </a>
                <Link
                  href="/contact"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-cyan transition-colors hover:text-cyan-300"
                >
                  <LifeBuoy className="h-4 w-4" aria-hidden />
                  Open support page
                </Link>
              </div>

              <div className="rounded-2xl border border-brand-border bg-brand-surface/60 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                  Before You Start
                </p>
                <h3 className="mt-3 text-lg font-semibold text-brand-text">
                  Understand the scoring bar first
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  See how TechInView evaluates problem solving, code quality,
                  communication, technical depth, and testing before you jump
                  into a full round.
                </p>
                <Link
                  href="/how-ai-evaluates"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-cyan transition-colors hover:text-cyan-300"
                >
                  Review the rubric
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 border-t border-brand-border/80 pt-8 md:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,0.8fr))] md:gap-10">
          <div className="max-w-sm">
            <p className="text-sm font-semibold text-brand-text">
              Built for engineers preparing for technical interviews.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              Free practice stays open. Paid rounds are available as one-time
              packs when you want live voice pressure and score-driven review.
            </p>
            <a
              href="https://builders.to/projects/techinview?utm_source=badge"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex transition-opacity hover:opacity-100"
            >
              <Image
                src="https://builders.to/badges/featured-on-builders-small.svg"
                alt="TechInView - Featured on Builders.to"
                width={130}
                height={40}
                className="opacity-90"
              />
            </a>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-cyan">
              Product
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {productLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-brand-muted transition-colors hover:text-brand-text"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-cyan">
              Resources
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {resourceLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-brand-muted transition-colors hover:text-brand-text"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-cyan">
              Legal & Support
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {LEGAL_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-brand-muted transition-colors hover:text-brand-text"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={supportHref}
                  className="text-sm text-brand-muted transition-colors hover:text-brand-text"
                >
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-brand-border/80 pt-6 sm:flex-row sm:items-start">
          <p className="text-center text-xs text-brand-muted sm:text-left">
            &copy; {year} TechInView. All rights reserved.
          </p>
          <p className="text-center text-[11px] text-brand-muted/80 sm:text-right">
            Voice-powered interview prep with public legal pages and direct
            founder-stage support.
          </p>
        </div>
      </div>
    </footer>
  );
}
