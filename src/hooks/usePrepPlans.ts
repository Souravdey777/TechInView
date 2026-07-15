"use client";

import { useEffect, useState } from "react";
import { markPrepPlanTrackStarted } from "@/lib/dashboard/prep-plan-generator";
import type { PracticeInterviewKind, PrepPlanSummary } from "@/lib/dashboard/models";

const STORAGE_KEY = "techinview-prep-plans-v1";

type StoredPrepPlans = {
  version: 1 | 2;
  plans: PrepPlanSummary[];
};

type LegacyPrepPlanTrack = PrepPlanSummary["tracks"][number] & {
  progressPercent?: number;
  questionCount?: number;
};

function normalizeStoredPlans(plans: PrepPlanSummary[]) {
  return plans
    .filter(
      (plan) =>
        plan.company.trim().toLowerCase() !== "target company" &&
        !(plan.company.trim() === "" || plan.role.trim() === "")
    )
    .map((plan) => ({
      ...plan,
      tracks: plan.tracks.map((track) => {
        const legacyTrack = track as LegacyPrepPlanTrack;
        const { progressPercent, questionCount: _questionCount, ...currentTrack } = legacyTrack;
        const wasSyntheticStart =
          currentTrack.status === "in_progress" && progressPercent === 15;

        return {
          ...currentTrack,
          status: wasSyntheticStart ? ("not_started" as const) : currentTrack.status,
        };
      }),
    }));
}

function readStoredPlans(): PrepPlanSummary[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as StoredPrepPlans;
    if (!Array.isArray(parsed.plans)) return [];

    const plans = normalizeStoredPlans(parsed.plans);
    if (parsed.version !== 2 || plans.length !== parsed.plans.length) {
      writeStoredPlans(plans);
    }

    return plans;
  } catch {
    return [];
  }
}

function writeStoredPlans(plans: PrepPlanSummary[]) {
  if (typeof window === "undefined") return;

  const payload: StoredPrepPlans = {
    version: 2,
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
    markTrackStarted,
    deletePlan,
    getPlanById,
  };
}
