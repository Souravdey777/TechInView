"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PricingFeature = {
  text: string;
  included: boolean;
};

type PricingTier = {
  name: string;
  tagline: string;
  usd: number;
  inr: number;
  originalUsd?: number;
  originalInr?: number;
  perInterviewUsd?: number;
  perInterviewInr?: number;
  badge?: string;
  saveBadge?: string;
  saveBadgeColor: string;
  features: PricingFeature[];
  ctaText: string;
  ctaVariant: "default" | "primary";
};

const tiers: PricingTier[] = [
  {
    name: "Free Trial",
    tagline: "See what it feels like",
    usd: 0,
    inr: 0,
    saveBadge: "TRY IT",
    saveBadgeColor: "bg-brand-card text-brand-muted",
    features: [
      { text: "1 interview", included: true },
      { text: "20-min session", included: true },
      { text: "Easy problems only", included: true },
      { text: "Basic score report", included: true },
      { text: "Advanced report", included: false },
      { text: "FAANG personas", included: false },
    ],
    ctaText: "Try Free",
    ctaVariant: "default",
  },
  {
    name: "1 Interview",
    tagline: "One-off practice session",
    usd: 8,
    inr: 349,
    saveBadge: "SINGLE",
    saveBadgeColor: "bg-brand-cyan/20 text-brand-cyan",
    features: [
      { text: "1 full interview", included: true },
      { text: "45-min session", included: true },
      { text: "All difficulties", included: true },
      { text: "Advanced AI report", included: true },
      { text: "All 4 languages", included: true },
      { text: "FAANG personas", included: false },
    ],
    ctaText: "Buy Now",
    ctaVariant: "default",
  },
  {
    name: "3-Pack",
    tagline: "For focused prep sprints",
    usd: 18,
    inr: 799,
    originalUsd: 24,
    originalInr: 1047,
    perInterviewUsd: 6,
    perInterviewInr: 266,
    badge: "Popular",
    saveBadge: "SAVE 25%",
    saveBadgeColor: "bg-brand-green/20 text-brand-green",
    features: [
      { text: "3 full interviews", included: true },
      { text: "45-min sessions", included: true },
      { text: "All difficulties", included: true },
      { text: "Advanced AI report", included: true },
      { text: "All 4 languages", included: true },
      { text: "Progress tracking", included: true },
    ],
    ctaText: "Buy 3-Pack",
    ctaVariant: "primary",
  },
  {
    name: "5-Pack",
    tagline: "For serious candidates",
    usd: 24,
    inr: 1099,
    originalUsd: 40,
    originalInr: 1745,
    perInterviewUsd: 4.8,
    perInterviewInr: 220,
    saveBadge: "SAVE 40%",
    saveBadgeColor: "bg-brand-amber/20 text-brand-amber",
    badge: "Best Value",
    features: [
      { text: "5 full interviews", included: true },
      { text: "45-min sessions", included: true },
      { text: "All difficulties", included: true },
      { text: "Advanced AI report", included: true },
      { text: "All 4 languages", included: true },
      { text: "Progress tracking", included: true },
    ],
    ctaText: "Buy 5-Pack",
    ctaVariant: "default",
  },
];

type PricingProps = {
  defaultRegion?: "usd" | "inr";
};

export function Pricing({ defaultRegion = "usd" }: PricingProps) {
  const [isIndia, setIsIndia] = useState(defaultRegion === "inr");

  const symbol = isIndia ? "\u20B9" : "$";

  function formatPrice(amount: number) {
    return amount.toLocaleString(isIndia ? "en-IN" : "en-US");
  }

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 bg-brand-surface">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
            Pay per interview, not per month
          </h2>
          <p className="text-brand-muted text-lg mb-8">
            Buy what you need. No subscriptions, no commitments.
          </p>

          {/* Region Toggle */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-brand-border bg-brand-card/60">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                !isIndia ? "text-brand-text" : "text-brand-muted"
              )}
            >
              USD ($)
            </span>
            <button
              onClick={() => setIsIndia(!isIndia)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                isIndia ? "bg-brand-cyan" : "bg-brand-border"
              )}
              aria-label="Toggle India pricing"
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                  isIndia && "translate-x-5"
                )}
              />
            </button>
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                isIndia ? "text-brand-text" : "text-brand-muted"
              )}
            >
              INR (₹)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tiers.map((tier) => {
            const price = isIndia ? tier.inr : tier.usd;
            const originalPrice = isIndia ? tier.originalInr : tier.originalUsd;
            const perInterview = isIndia
              ? tier.perInterviewInr
              : tier.perInterviewUsd;

            return (
              <div
                key={tier.name}
                className={cn(
                  "glass-card p-7 flex flex-col gap-5 relative",
                  tier.ctaVariant === "primary" &&
                    "border-brand-cyan/40 glow-cyan"
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
                        feature.included
                          ? "text-brand-text"
                          : "text-brand-muted"
                      )}
                    >
                      <span
                        className={
                          feature.included
                            ? "text-brand-green"
                            : "text-brand-muted"
                        }
                      >
                        {feature.included ? "\u2713" : "\u2013"}
                      </span>
                      {feature.text}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
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
          Credits never expire.{" "}
          {isIndia && (
            <span className="text-brand-cyan">
              You&apos;re seeing India pricing &mdash; up to 50% off.{" "}
            </span>
          )}
          No card required for free trial.
        </p>
      </div>
    </section>
  );
}
