"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrepPlanBuilder() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/prep-plans"
        className="inline-flex items-center gap-2 text-sm text-brand-muted transition-colors hover:text-brand-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Prep Plans
      </Link>

      <div className="rounded-3xl border border-brand-border bg-brand-card p-7 sm:p-8">
        <p className="text-sm uppercase tracking-[0.22em] text-brand-cyan">New Prep Plan</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-text">
          Prep plan creation is coming soon.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted">
          The Prep Plans workspace is staying visible, but the create flow is temporarily paused
          while we tighten how company, role, and JD signals turn into a structured prep sequence.
        </p>

        <div className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-6">
          <div className="flex items-center gap-2 text-brand-cyan">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-semibold">What&apos;s coming back</p>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-muted">
            <p>Company- and JD-shaped round planning instead of a fixed format checklist.</p>
            <p>Historical-question clustering across the interview types that actually matter.</p>
            <p>Cleaner launch paths from a plan into the matching interview setup pages.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="outline" disabled>
            <Sparkles className="h-4 w-4" />
            Creation coming soon
          </Button>
          <Button asChild variant="secondary">
            <Link href="/prep-plans">Open Prep Plans</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
