import Link from "next/link";
import { ArrowRight, Mic, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";

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

export function MarketingFooter({ signupHref }: MarketingFooterProps) {
  const year = new Date().getFullYear();

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
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Brand + CTA */}
          <div className="lg:col-span-5">
            <Link
              href="/"
              className="inline-flex"
            >
              <BrandLogo size="sm" wordmarkClassName="text-xl font-bold" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-muted">
              Voice-first AI mock interviews for software engineers. Practice DSA
              like it&apos;s the real room—then get scored like one.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={signupHref}
                className="group inline-flex items-center gap-2 rounded-xl bg-brand-cyan px-4 py-2.5 text-sm font-semibold text-brand-deep transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
              >
                Start free interview
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-brand-muted transition-colors hover:text-brand-text"
              >
                Log in
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-xs text-brand-muted">
              <span className="inline-flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5 text-brand-cyan" aria-hidden />
                Real-time voice
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-cyan" aria-hidden />
                FAANG-style feedback
              </span>
            </div>
          </div>

          {/* Product */}
          <div className="grid grid-cols-2 gap-10 sm:gap-12 lg:col-span-4 lg:grid-cols-2">
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
          </div>

          {/* Mini pitch card */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-brand-border bg-brand-card/60 p-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
                Why teams prep here
              </p>
              <p className="mt-3 text-sm leading-relaxed text-brand-text">
                One full session: voice back-and-forth, live code, and a
                five-dimension scorecard—so you know what to fix before the real
                loop.
              </p>
              <Link
                href="/#pricing"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-cyan transition-colors hover:text-cyan-300"
              >
                View plans
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-brand-border/80 pt-8 sm:flex-row sm:items-start">
          <p className="text-center text-xs text-brand-muted sm:text-left">
            &copy; {year} TechInView. All rights reserved.
          </p>
          <p className="text-center text-[11px] text-brand-muted/80 sm:text-right">
            Built for engineers preparing for technical interviews.
          </p>
        </div>
      </div>
    </footer>
  );
}
