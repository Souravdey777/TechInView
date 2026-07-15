"use client";

import { History } from "lucide-react";
import { PrepPlanBuilder } from "@/components/prep-plans/PrepPlanBuilder";
import { PrepPlanCard } from "@/components/prep-plans/PrepPlanCard";
import { usePrepPlans } from "@/hooks/usePrepPlans";

export function PrepPlansIndex() {
  const { plans, isLoaded, deletePlan } = usePrepPlans();

  return (
    <div className="space-y-12">
      <PrepPlanBuilder />

      {isLoaded && plans.length > 0 ? (
        <section className="mx-auto max-w-5xl border-t border-brand-border pt-10">
          <div className="mb-5 flex items-center gap-2">
            <History className="h-4 w-4 text-brand-cyan" />
            <h2 className="text-lg font-semibold text-brand-text">Previous Prep Guru plans</h2>
            <span className="rounded-full border border-brand-border bg-brand-surface px-2.5 py-0.5 text-[11px] text-brand-muted">
              {plans.length}
            </span>
          </div>
          <div className="grid gap-4">
            {plans.map((plan) => (
              <PrepPlanCard key={plan.id} plan={plan} onDelete={deletePlan} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
