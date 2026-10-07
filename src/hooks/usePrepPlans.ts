"use client";

import { useEffect, useRef, useState } from "react";
import { markPrepPlanTrackStarted } from "@/lib/dashboard/prep-plan-generator";
import type {
  PracticeInterviewKind,
  PrepPlanSummary,
  PrepPlanTrack,
} from "@/lib/dashboard/models";

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

/**
 * For a setup page opened from a Prep Guru loop (`?planId=`): once the plan has
 * loaded from storage, calls `apply` a single time with the plan and its round
 * of `kind`, so later edits on the page are never overwritten.
 */
export function useApplyPrepPlanRound(
  planId: string | null | undefined,
  kind: PracticeInterviewKind,
  apply: (plan: PrepPlanSummary, track: PrepPlanTrack | null) => void
) {
  const { isLoaded, getPlanById } = usePrepPlans();
  const plan = planId && isLoaded ? getPlanById(planId) : null;
  const appliedPlanId = useRef<string | null>(null);
  const applyRef = useRef(apply);
  applyRef.current = apply;

  useEffect(() => {
    if (!plan || appliedPlanId.current === plan.id) return;
    appliedPlanId.current = plan.id;
    applyRef.current(plan, plan.tracks.find((track) => track.kind === kind) ?? null);
  }, [plan, kind]);

  return plan;
}
