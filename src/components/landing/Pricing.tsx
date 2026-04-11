"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus, Sparkles } from "lucide-react";
import {
  CREDIT_PACKS,
  FREE_TRIAL_DURATION_MINUTES,
  FULL_INTERVIEW_DURATION_MINUTES,
  PACK_IDS,
  type CreditPackId,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type PricingFeature = {
  text: string;
  included: boolean;
};

type PricingTone = "slate" | "cyan" | "amber";

type PricingTier = {
  name: string;
  tagline: string;
  prices: { usd: number; inr: number; ppp: number };
  originalPrices?: { usd: number; inr: number; ppp: number };
  perInterview?: { usd: number; inr: number; ppp: number };
  badge?: string;
  saveBadge?: string;
  saveBadgeColor: string;
  features: PricingFeature[];
  ctaText: string;
  ctaVariant: "default" | "primary";
  tone: PricingTone;
  valueLabel: string;
  miniStats: string[];
};

type PricingRegion = "usd" | "inr" | "ppp";

type PricingProps = {
  defaultRegion?: PricingRegion;
  refParam?: string;
};

const REGION_SYMBOLS: Record<PricingRegion, string> = {
  usd: "$",
  inr: "\u20B9",
  ppp: "$",
};

const TONE_STYLES: Record<
  PricingTone,
  {
    action: string;
    card: string;
    glow: string;
    eyebrow: string;
    pricePanel: string;
    statChip: string;
  }
> = {
  slate: {
    action:
      "border border-white/10 bg-white/[0.02] text-brand-text hover:border-white/18 hover:bg-white/[0.06]",
    card:
      "border-white/8 bg-[linear-gradient(180deg,rgba(17,24,32,0.96),rgba(11,15,22,0.98))] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_28px_90px_-48px_rgba(0,0,0,0.72)]",
    glow: "bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_52%)]",
    eyebrow: "text-brand-muted",
    pricePanel: "border-white/8 bg-brand-deep/60",
    statChip: "border-white/8 bg-white/[0.04] text-brand-muted",
  },
  cyan: {
    action:
      "border border-brand-cyan/30 bg-brand-cyan text-brand-deep hover:bg-cyan-300 hover:shadow-[0_12px_40px_-22px_rgba(34,211,238,0.7)]",
    card:
      "border-brand-cyan/22 bg-[linear-gradient(180deg,rgba(17,24,32,0.98),rgba(7,12,18,0.98))] shadow-[0_0_0_1px_rgba(34,211,238,0.05),0_32px_110px_-56px_rgba(34,211,238,0.36)]",
    glow: "bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.22),transparent_52%)]",
    eyebrow: "text-brand-cyan",
    pricePanel: "border-brand-cyan/16 bg-brand-cyan/[0.08]",
    statChip: "border-brand-cyan/16 bg-brand-cyan/[0.10] text-brand-cyan",
  },
  amber: {
    action:
      "border border-brand-amber/22 bg-brand-amber/[0.08] text-brand-text hover:border-brand-amber/32 hover:bg-brand-amber/[0.14]",
    card:
      "border-brand-amber/20 bg-[linear-gradient(180deg,rgba(17,24,32,0.97),rgba(16,13,8,0.98))] shadow-[0_0_0_1px_rgba(251,191,36,0.04),0_28px_96px_-52px_rgba(251,191,36,0.26)]",
    glow: "bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_54%)]",
    eyebrow: "text-brand-amber",
    pricePanel: "border-brand-amber/14 bg-brand-amber/[0.07]",
    statChip: "border-brand-amber/16 bg-brand-amber/[0.10] text-brand-amber",
  },
};

const FREE_TIER: PricingTier = {
  name: "Free Trial",
  tagline: "Test the voice workflow before you commit",
  prices: { usd: 0, inr: 0, ppp: 0 },
  saveBadge: "TRY IT",
  saveBadgeColor: "bg-brand-card text-brand-muted",
  features: [
    { text: `1 x ${FREE_TRIAL_DURATION_MINUTES}-minute voice trial`, included: true },
    { text: "Easy problem + live coding", included: true },
    { text: "Basic score summary", included: true },
    { text: "All difficulties", included: false },
    { text: "Detailed 5-dimension report", included: false },
    { text: "Specific problem selection", included: false },
  ],
  ctaText: "Start Free",
  ctaVariant: "default",
  tone: "slate",
  valueLabel: "Quick workflow preview",
  miniStats: ["No card needed", "Live voice + coding"],
};

const TIER_CONFIG: Record<
  CreditPackId,
  Omit<
    PricingTier,
    "name" | "prices" | "originalPrices" | "perInterview"
  >
> = {
  single: {
    tagline: "One full mock interview, no subscription",
    saveBadge: "STARTER",
    saveBadgeColor: "bg-brand-cyan/20 text-brand-cyan",
    features: [
      { text: `1 x ${FULL_INTERVIEW_DURATION_MINUTES}-minute full interview`, included: true },
      { text: "All difficulties", included: true },
      { text: "Detailed AI report", included: true },
      { text: "Transcript + scorecard", included: true },
      { text: "All 4 languages", included: true },
      { text: "Specific problem selection", included: true },
    ],
    ctaText: "Buy 1 Interview",
    ctaVariant: "default",
    tone: "slate",
    valueLabel: "Full-length interview",
    miniStats: ["45-minute round", "Detailed AI report"],
  },
  "3pack": {
    tagline: "Best for active prep weeks and focused interview sprints",
    badge: "Popular",
    saveBadgeColor: "bg-brand-green/20 text-brand-green",
    features: [
      { text: `3 x ${FULL_INTERVIEW_DURATION_MINUTES}-minute full interviews`, included: true },
      { text: "All difficulties", included: true },
      { text: "Detailed AI report", included: true },
      { text: "Transcript + scorecard", included: true },
      { text: "Progress tracking", included: true },
      { text: "Specific problem selection", included: true },
    ],
    ctaText: "Buy 3 Interviews",
    ctaVariant: "primary",
    tone: "cyan",
    valueLabel: "Most balanced pack",
    miniStats: ["Most chosen", "Great for serious prep"],
  },
  "6pack": {
    tagline: "For serious interview loops and repeat practice",
    badge: "Best Value",
    saveBadgeColor: "bg-brand-amber/20 text-brand-amber",
    features: [
      { text: `6 x ${FULL_INTERVIEW_DURATION_MINUTES}-minute full interviews`, included: true },
      { text: "All difficulties", included: true },
      { text: "Detailed AI report", included: true },
      { text: "Transcript + scorecard", included: true },
      { text: "Progress tracking", included: true },
      { text: "Best effective price per round", included: true },
    ],
    ctaText: "Buy 6 Interviews",
    ctaVariant: "default",
    tone: "amber",
    valueLabel: "Deep repetition pack",
    miniStats: ["Lowest cost per round", "Best for repeat drills"],
  },
};

const SINGLE_PRICES = CREDIT_PACKS.single.displayPrices;

const tiers: PricingTier[] = [
  FREE_TIER,
  ...PACK_IDS.map((packId) => {
    const pack = CREDIT_PACKS[packId];
    const config = TIER_CONFIG[packId];
    const hasBundleDiscount = pack.credits > 1;
    const originalPrices = hasBundleDiscount
      ? {
          usd: SINGLE_PRICES.usd * pack.credits,
          inr: SINGLE_PRICES.inr * pack.credits,
          ppp: SINGLE_PRICES.ppp * pack.credits,
        }
      : undefined;
    const saveBadge = hasBundleDiscount
      ? `SAVE ${Math.round((1 - pack.displayPrices.usd / (SINGLE_PRICES.usd * pack.credits)) * 100)}%`
      : config.saveBadge;
    const perInterview = hasBundleDiscount
      ? {
          usd: Number((pack.displayPrices.usd / pack.credits).toFixed(2)),
          inr: Number((pack.displayPrices.inr / pack.credits).toFixed(2)),
          ppp: Number((pack.displayPrices.ppp / pack.credits).toFixed(2)),
        }
      : undefined;

    return {
      name: pack.label,
      prices: pack.displayPrices,
      originalPrices,
      perInterview,
      saveBadge,
      ...config,
    };
  }),
];

export function Pricing({ defaultRegion = "usd", refParam }: PricingProps) {
  const ctaHref = refParam ? `/signup?ref=${refParam}` : "/signup";
  const [activeRegion, setActiveRegion] = useState<PricingRegion>(defaultRegion);

  const symbol = REGION_SYMBOLS[activeRegion];
  const locale = activeRegion === "inr" ? "en-IN" : "en-US";

  function formatPrice(amount: number) {
    return amount.toLocaleString(locale, { maximumFractionDigits: 2 });
  }

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-brand-surface px-4 py-24 sm:px-6"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[min(80vw,56rem)] -translate-x-1/2 rounded-full bg-brand-cyan/[0.08] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-brand-amber/[0.07] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Pricing
          </p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-brand-text sm:text-5xl">
            Buy interview packs, not a subscription
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-brand-muted">
            Start with a 5-minute trial, then unlock full mock interviews when you&apos;re ready.
            Pay once, use the rounds when you want, and keep the feedback trail.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {[
              "5-minute free trial",
              "45-minute full interview rounds",
              "One-time packs, no recurring billing",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-brand-muted"
              >
                <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
                {item}
              </span>
            ))}
          </div>

          {defaultRegion === "inr" && (
            <div className="mt-8 inline-flex flex-col items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-brand-card/70 p-1 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.8)]">
                {[
                  { value: "usd" as const, label: "USD ($)" },
                  { value: "inr" as const, label: "INR (₹)" },
                ].map((region) => (
                  <button
                    key={region.value}
                    type="button"
                    onClick={() => setActiveRegion(region.value)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-all",
                      activeRegion === region.value
                        ? "bg-brand-cyan text-brand-deep shadow-[0_10px_30px_-18px_rgba(34,211,238,0.8)]"
                        : "text-brand-muted hover:text-brand-text"
                    )}
                  >
                    {region.label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-brand-muted">
                India pricing detected. Switch anytime if you prefer USD.
              </p>
            </div>
          )}
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-4">
          {tiers.map((tier) => {
            const price = tier.prices[activeRegion];
            const originalPrice = tier.originalPrices?.[activeRegion];
            const perInterview = tier.perInterview?.[activeRegion];
            const style = TONE_STYLES[tier.tone];
            const isFeatured = tier.ctaVariant === "primary";

            return (
              <div
                key={tier.name}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-[1.85rem] border p-6 transition-all duration-300",
                  style.card,
                  isFeatured && "lg:-translate-y-4 lg:scale-[1.02]"
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500",
                    style.glow,
                    !isFeatured && "opacity-0 group-hover:opacity-100"
                  )}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  aria-hidden
                />

                <div className="relative flex h-full flex-col">
                  <div className="flex min-h-[2.75rem] flex-wrap items-start gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {tier.saveBadge ? (
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
                            tier.saveBadgeColor
                          )}
                        >
                          {tier.saveBadge}
                        </span>
                      ) : null}
                      {tier.badge ? (
                        <span className="inline-flex rounded-full bg-brand-cyan/18 px-3 py-1 text-xs font-semibold text-brand-cyan">
                          {tier.badge}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-6 min-h-[9.5rem]">
                    <p
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-[0.22em]",
                        style.eyebrow
                      )}
                    >
                      {tier.valueLabel}
                    </p>
                    <div className="mt-3 min-h-[4rem]">
                      <h3 className="text-[1.9rem] font-semibold tracking-tight text-brand-text">
                        {tier.name}
                      </h3>
                    </div>
                    <p className="mt-1 max-w-[24ch] text-sm leading-relaxed text-brand-muted">
                      {tier.tagline}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "mt-6 flex min-h-[15rem] flex-col rounded-[1.35rem] border p-4",
                      style.pricePanel
                    )}
                  >
                    <div>
                      <div className="flex min-h-[4rem] flex-wrap items-end gap-2">
                        {originalPrice ? (
                          <span className="text-xl text-brand-muted line-through">
                            {symbol}
                            {formatPrice(originalPrice)}
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            "font-bold tracking-tight text-brand-text",
                            isFeatured ? "text-5xl" : "text-4xl"
                          )}
                        >
                          {symbol}
                          {formatPrice(price)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2">
                        {tier.miniStats.map((stat) => (
                          <span
                            key={stat}
                            className={cn(
                              "inline-flex min-h-[2.25rem] items-center rounded-full border px-3 py-1 text-xs font-medium",
                              style.statChip
                            )}
                          >
                            {stat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="mt-auto pt-4 text-sm leading-relaxed text-brand-muted">
                      {perInterview !== undefined ? (
                        <>
                          Effective price:{" "}
                          <span className="font-semibold text-brand-text">
                            {symbol}
                            {formatPrice(perInterview)}
                          </span>{" "}
                          per interview
                        </>
                      ) : price === 0 ? (
                        "No card required. Jump in and test the workflow before paying."
                      ) : (
                        "One purchase unlocks one complete full-length mock interview."
                      )}
                    </p>
                  </div>

                  <ul className="mt-6 flex flex-1 flex-col space-y-3 border-t border-white/8 pt-6 text-sm">
                    {tier.features.map((feature) => (
                      <li
                        key={feature.text}
                        className={cn(
                          "flex items-start gap-3 leading-relaxed",
                          feature.included ? "text-brand-text" : "text-brand-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            feature.included
                              ? "border-brand-green/20 bg-brand-green/10 text-brand-green"
                              : "border-white/8 bg-white/[0.03] text-brand-muted"
                          )}
                        >
                          {feature.included ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Minus className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={ctaHref}
                    className={cn(
                      "mt-6 inline-flex w-full items-center justify-between rounded-[1.1rem] px-4 py-3.5 text-sm font-semibold transition-all",
                      style.action
                    )}
                  >
                    <span>{tier.ctaText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-brand-muted">
          <span className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">
            One-time packs
          </span>
          <span className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">
            No subscription
          </span>
          <span className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">
            No card required for free trial
          </span>
          {activeRegion === "inr" ? (
            <span className="rounded-full border border-brand-cyan/18 bg-brand-cyan/[0.08] px-4 py-2 text-brand-cyan">
              India pricing active
            </span>
          ) : null}
          {activeRegion === "ppp" ? (
            <span className="rounded-full border border-brand-cyan/18 bg-brand-cyan/[0.08] px-4 py-2 text-brand-cyan">
              Regional pricing active
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
