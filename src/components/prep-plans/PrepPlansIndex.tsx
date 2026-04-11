"use client";

import { FolderKanban, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrepPlanCard } from "@/components/prep-plans/PrepPlanCard";
import { usePrepPlans } from "@/hooks/usePrepPlans";

export function PrepPlansIndex() {
  const { plans, isLoaded, deletePlan } = usePrepPlans();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm uppercase tracking-[0.22em] text-brand-cyan">Prep Plans</p>
            <span className="rounded-full border border-brand-amber/25 bg-brand-amber/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber">
              Coming Soon
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-text">
            Structured prep is coming back here soon.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted">
            The Prep Plans workspace is being refined so company, role, and JD inputs produce a
            tighter planning experience before it reopens.
          </p>
        </div>
        <Button variant="outline" disabled>
          Prep Plans coming soon
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>

      {!isLoaded ? (
        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 text-sm text-brand-muted">
          Loading prep plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-brand-border bg-brand-card p-10 text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-brand-cyan" />
          <h2 className="mt-5 text-xl font-semibold text-brand-text">
            Prep Plans are coming soon
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-muted">
            We&apos;re rebuilding the planning flow so company-matched prep loops feel sharper before
            the feature goes live again.
          </p>
          <div className="mt-6">
            <Button variant="outline" disabled>
              <Sparkles className="h-4 w-4" />
              Prep Plans coming soon
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <PrepPlanCard key={plan.id} plan={plan} onDelete={deletePlan} />
          ))}
        </div>
      )}
    </div>
  );
}
