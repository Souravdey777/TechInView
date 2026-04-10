"use client";

import { useState } from "react";
import Link from "next/link";
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
};

const TIER_CONFIG: Record<
  CreditPackId,
  Omit<PricingTier, "name" | "prices" | "originalPrices" | "perInterview">
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
  },
  "3pack": {
    tagline: "Best for active prep weeks",
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
  const ctaHref = refParam ? `/signup?ref=${refParam}` : "/login";
  const [activeRegion, setActiveRegion] = useState<PricingRegion>(defaultRegion);

  const symbol = REGION_SYMBOLS[activeRegion];
  const locale = activeRegion === "inr" ? "en-IN" : "en-US";

  function formatPrice(amount: number) {
    return amount.toLocaleString(locale, { maximumFractionDigits: 2 });
  }

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 bg-brand-surface">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
            Buy interview packs, not a subscription
          </h2>
          <p className="text-brand-muted text-lg mb-8">
            Start with a 5-minute trial, then unlock full mock interviews when you&apos;re ready.
          </p>

          {defaultRegion === "inr" && (
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-brand-border bg-brand-card/60">
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  activeRegion === "usd" ? "text-brand-text" : "text-brand-muted"
                )}
              >
                USD ($)
              </span>
              <button
                onClick={() => setActiveRegion(activeRegion === "inr" ? "usd" : "inr")}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  activeRegion === "inr" ? "bg-brand-cyan" : "bg-brand-border"
                )}
                aria-label="Toggle India pricing"
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                    activeRegion === "inr" && "translate-x-5"
                  )}
                />
              </button>
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  activeRegion === "inr" ? "text-brand-text" : "text-brand-muted"
                )}
              >
                INR (₹)
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tiers.map((tier) => {
            const price = tier.prices[activeRegion];
            const originalPrice = tier.originalPrices?.[activeRegion];
            const perInterview = tier.perInterview?.[activeRegion];

            return (
              <div
                key={tier.name}
                className={cn(
                  "glass-card p-7 flex flex-col gap-5 relative",
                  tier.ctaVariant === "primary" && "border-brand-cyan/40 glow-cyan"
                )}
              >
                {tier.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 rounded-full bg-brand-cyan/20 text-brand-cyan text-xs font-semibold">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div>
                  {tier.saveBadge && (
                    <span
                      className={cn(
                        "inline-block px-2.5 py-1 rounded-full text-xs font-semibold mb-3",
                        tier.saveBadgeColor
                      )}
                    >
                      {tier.saveBadge}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-brand-text mb-1">
                    {tier.name}
                  </h3>
                  <p className="text-brand-muted text-xs">{tier.tagline}</p>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    {originalPrice ? (
                      <>
                        <span className="text-lg text-brand-muted line-through">
                          {symbol}{formatPrice(originalPrice)}
                        </span>
                        <span className="text-3xl font-bold text-brand-text">
                          {symbol}{formatPrice(price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-brand-text">
                        {symbol}{formatPrice(price)}
                      </span>
                    )}
                  </div>
                  {perInterview !== undefined && (
                    <p className="text-brand-muted text-xs mt-1">
                      {symbol}{formatPrice(perInterview)}/each
                    </p>
                  )}
                </div>

                <ul className="flex flex-col gap-2.5 text-sm">
                  {tier.features.map((feature) => (
                    <li
                      key={feature.text}
                      className={cn(
                        "flex items-center gap-2",
                        feature.included ? "text-brand-text" : "text-brand-muted"
                      )}
                    >
                      <span
                        className={
                          feature.included ? "text-brand-green" : "text-brand-muted"
                        }
                      >
                        {feature.included ? "\u2713" : "\u2013"}
                      </span>
                      {feature.text}
                    </li>
                  ))}
                </ul>

                <Link
                  href={ctaHref}
                  className={cn(
                    "mt-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-sm transition-all",
                    tier.ctaVariant === "primary"
                      ? "bg-brand-cyan text-brand-deep hover:bg-cyan-300 hover:scale-105"
                      : "border border-brand-border text-brand-text hover:bg-brand-card"
                  )}
                >
                  {tier.ctaText}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-brand-muted text-sm mt-8">
          One-time packs. No subscription.{" "}
          {activeRegion === "inr" && (
            <span className="text-brand-cyan">
              You&apos;re seeing India pricing.{" "}
            </span>
          )}
          {activeRegion === "ppp" && (
            <span className="text-brand-cyan">
              Regional pricing applied.{" "}
            </span>
          )}
          No card required for free trial.
        </p>
      </div>
    </section>
  );
}
