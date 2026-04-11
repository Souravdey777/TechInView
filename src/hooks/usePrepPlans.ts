"use client";

import { useEffect, useState } from "react";
import { createPrepPlan, markPrepPlanTrackStarted } from "@/lib/dashboard/prep-plan-generator";
import type { PracticeInterviewKind, PrepPlanSummary } from "@/lib/dashboard/models";

const STORAGE_KEY = "techinview-prep-plans-v1";

type StoredPrepPlans = {
  version: 1;
  plans: PrepPlanSummary[];
};

function readStoredPlans(): PrepPlanSummary[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as StoredPrepPlans;
    return Array.isArray(parsed.plans) ? parsed.plans : [];
  } catch {
    return [];
  }
}

function writeStoredPlans(plans: PrepPlanSummary[]) {
  if (typeof window === "undefined") return;

  const payload: StoredPrepPlans = {
    version: 1,
    plans,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function upsertPlan(plans: PrepPlanSummary[], plan: PrepPlanSummary) {
  return [plan, ...plans.filter((existingPlan) => existingPlan.id !== plan.id)];
}

export function usePrepPlans() {
  const [plans, setPlans] = useState<PrepPlanSummary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPlans(readStoredPlans());
    setIsLoaded(true);

    const handleStorage = () => {
      setPlans(readStoredPlans());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const savePlan = (plan: PrepPlanSummary) => {
    let savedPlan = plan;

    setPlans((currentPlans) => {
      const nextPlans = upsertPlan(currentPlans, plan);
      savedPlan = nextPlans[0] ?? plan;
      writeStoredPlans(nextPlans);
      return nextPlans;
    });

    return savedPlan;
  };

  const createPlanFromInput = (input: {
    company: string;
    role: string;
    jdText: string;
  }) => {
    const plan = createPrepPlan(input);
    return savePlan(plan);
  };

  const markTrackStarted = (planId: string, kind: PracticeInterviewKind) => {
    setPlans((currentPlans) => {
      const nextPlans = currentPlans.map((plan) =>
        plan.id === planId ? markPrepPlanTrackStarted(plan, kind) : plan
      );
      writeStoredPlans(nextPlans);
      return nextPlans;
    });
  };

  const deletePlan = (planId: string) => {
    setPlans((currentPlans) => {
      const nextPlans = currentPlans.filter((plan) => plan.id !== planId);
      writeStoredPlans(nextPlans);
      return nextPlans;
    });
  };

  const getPlanById = (planId: string) =>
    plans.find((plan) => plan.id === planId) ?? null;

  return {
    plans,
    isLoaded,
    savePlan,
    createPlanFromInput,
    markTrackStarted,
    deletePlan,
    getPlanById,
  };
}
