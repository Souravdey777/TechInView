"use client";

import { useState } from "react";
import { PrepGuruShell } from "@/components/prep-plans/PrepGuruShell";
import { PrepGuruChat } from "@/components/prep-plans/PrepGuruChat";
import { usePrepPlans } from "@/hooks/usePrepPlans";
import type { PrepPlanSummary } from "@/lib/dashboard/models";

/**
 * Prep Guru's conversation surface: the plan-history rail plus one thread. The
 * page opens on a fresh composer; picking a plan from the rail replays that
 * plan's thread without leaving the page.
 */
export function PrepPlansIndex() {
  const { plans, isLoaded, savePlan, deletePlan } = usePrepPlans();
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  // Remounting the thread is how "New plan" clears a draft or a failed send,
  // including when no plan was selected in the first place.
  const [threadKey, setThreadKey] = useState(0);

  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? null;

  const handleNewPlan = () => {
    setActivePlanId(null);
    setThreadKey((current) => current + 1);
  };

  const handlePlanGenerated = (plan: PrepPlanSummary) => {
    const savedPlan = savePlan(plan);
    setActivePlanId(savedPlan.id);
  };

  const handleDeletePlan = (planId: string) => {
    deletePlan(planId);
    setActivePlanId((current) => (current === planId ? null : current));
  };

  return (
    <PrepGuruShell
      plans={plans}
      isLoaded={isLoaded}
      activePlanId={activePlanId}
      onSelectPlan={setActivePlanId}
      onNewPlan={handleNewPlan}
      onDeletePlan={handleDeletePlan}
    >
      <PrepGuruChat
        key={threadKey}
        activePlan={activePlan}
        onPlanGenerated={handlePlanGenerated}
      />
    </PrepGuruShell>
  );
}
