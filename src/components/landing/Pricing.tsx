"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type PricingFeature = {
  text: string;
  included: boolean;
};

type PricingPlan = {
  name: string;
  tagline: string;
  price: number;
  badge?: string;
  features: PricingFeature[];
  ctaVariant: "default" | "primary";
};

const plans: PricingPlan[] = [
  {
    name: "Starter",
    tagline: "For consistent practice",
    price: 19,
    features: [
      { text: "10 interviews per month", included: true },
      { text: "Full AI feedback & scoring", included: true },
      { text: "All 4 languages (Python, JS, Java, C++)", included: true },
      { text: "Progress tracking & history", included: true },
      { text: "Company-specific personas", included: false },
    ],
    ctaVariant: "default",
  },
  {
    name: "Pro",
    tagline: "For serious candidates",
    price: 29,
    badge: "Most Popular",
    features: [
      { text: "Unlimited interviews", included: true },
      { text: "Full AI feedback & scoring", included: true },
      { text: "All 4 languages (Python, JS, Java, C++)", included: true },
      { text: "Progress tracking & history", included: true },
      {
        text: "Company-specific personas (Google, Meta, Amazon...)",
        included: true,
      },
      { text: "Priority support", included: true },
    ],
    ctaVariant: "primary",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-brand-surface">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-brand-muted text-lg">
            Start free, upgrade when you&apos;re ready.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "glass-card p-8 flex flex-col gap-6 relative",
                plan.ctaVariant === "primary" && "border-brand-cyan/40 glow-cyan"
              )}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <span className="px-2.5 py-1 rounded-full bg-brand-cyan/20 text-brand-cyan text-xs font-semibold">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-brand-text mb-1">
                  {plan.name}
                </h3>
                <p className="text-brand-muted text-sm">{plan.tagline}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-brand-text">
                  ${plan.price}
                </span>
                <span className="text-brand-muted">/month</span>
              </div>

              <ul className="flex flex-col gap-3 text-sm">
                {plan.features.map((feature) => (
                  <li
                    key={feature.text}
                    className={cn(
                      "flex items-start gap-2",
                      feature.included ? "text-brand-text" : "text-brand-muted"
                    )}
                  >
                    <span
                      className={
                        feature.included
                          ? "text-brand-green mt-0.5"
                          : "text-brand-muted mt-0.5"
                      }
                    >
                      {feature.included ? "✓" : "–"}
                    </span>
                    {feature.text}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={cn(
                  "mt-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all",
                  plan.ctaVariant === "primary"
                    ? "bg-brand-cyan text-brand-deep hover:bg-cyan-300 hover:scale-105"
                    : "border border-brand-border text-brand-text hover:bg-brand-card"
                )}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-brand-muted text-sm mt-8">
          1 free interview per week &mdash; no card required. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
