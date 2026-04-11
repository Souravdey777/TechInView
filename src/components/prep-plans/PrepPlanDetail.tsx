"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, BriefcaseBusiness, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeletePrepPlanButton } from "@/components/prep-plans/DeletePrepPlanButton";
import { usePrepPlans } from "@/hooks/usePrepPlans";
import { getPracticeCard, getPracticeKindLabel, type PracticeInterviewKind } from "@/lib/dashboard/models";
import { cn } from "@/lib/utils";

type PrepPlanDetailProps = {
  planId: string;
};

const TRACK_STATUS_STYLES = {
  not_started: "border-brand-border bg-brand-surface text-brand-muted",
  in_progress: "border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan",
  completed: "border-brand-green/25 bg-brand-green/10 text-brand-green",
} as const;

function buildLaunchHref(planId: string, kind: PracticeInterviewKind, company: string, role: string) {
  const card = getPracticeCard(kind);
  const params = new URLSearchParams({
    planId,
    company,
    role,
  });

  return `${card?.href ?? "/dashboard"}?${params.toString()}`;
}

export function PrepPlanDetail({ planId }: PrepPlanDetailProps) {
  const router = useRouter();
  const { getPlanById, isLoaded, markTrackStarted, deletePlan } = usePrepPlans();
  const plan = getPlanById(planId);
  const sortedTracks = plan?.tracks ?? [];

  const handleLaunch = (kind: PracticeInterviewKind) => {
    if (!plan) return;
    markTrackStarted(plan.id, kind);
    router.push(buildLaunchHref(plan.id, kind, plan.company, plan.role));
  };

  const handleDelete = async () => {
    if (!plan) return;
    deletePlan(plan.id);
    router.replace("/prep-plans");
  };

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border border-brand-border bg-brand-card p-6 text-sm text-brand-muted">
        Loading prep plan...
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-brand-border bg-brand-card p-8 text-center">
        <h1 className="text-2xl font-semibold text-brand-text">Prep plan not found</h1>
        <p className="mt-3 text-sm text-brand-muted">
          This plan may have been cleared from local storage or created in another browser.
        </p>
        <div className="mt-5">
          <Button asChild>
            <Link href="/prep-plans">Back to Prep Plans</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/prep-plans"
          className="inline-flex items-center gap-2 text-sm text-brand-muted transition-colors hover:text-brand-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prep Plans
        </Link>
        <DeletePrepPlanButton
          planLabel={plan.label}
          onConfirm={handleDelete}
        />
      </div>

      <div className="rounded-3xl border border-brand-border bg-brand-card p-7 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-cyan">
            Prep Plan
          </span>
          <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
            {plan.status}
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-text">{plan.label}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
            <Building2 className="h-3.5 w-3.5" />
            {plan.company}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            {plan.role}
          </span>
          {plan.jdSignals.map((signal) => (
            <span
              key={`${plan.id}-${signal}`}
              className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted"
            >
              {signal}
            </span>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-5">
          <div className="flex items-center gap-2 text-brand-cyan">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-semibold">Why this plan exists</p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted">
            {plan.planSummary ??
              "The prep plan organizes likely interview work by format first, then launches each format into its own setup page. This keeps planning separate from runtime configuration."}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedTracks.map((track) => (
          <div key={`${plan.id}-${track.kind}`} className="rounded-2xl border border-brand-border bg-brand-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold text-brand-text">
                    {track.title ?? getPracticeKindLabel(track.kind)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-medium",
                      TRACK_STATUS_STYLES[track.status]
                    )}
                  >
                    {track.status.replace(/_/g, " ")}
                  </span>
                  <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
                    {track.priority}
                  </span>
                  <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
                    {getPracticeKindLabel(track.kind)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                  {track.questionCount} likely questions surfaced for this track. Next action: {track.nextActionLabel}
                </p>
                {track.rationale ? (
                  <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                    {track.rationale}
                  </p>
                ) : null}
              </div>

              <Button onClick={() => handleLaunch(track.kind)}>
                Open {getPracticeKindLabel(track.kind)} Setup
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 h-2 rounded-full bg-brand-deep">
              <div
                className={cn(
                  "h-full rounded-full",
                  track.status === "completed"
                    ? "bg-brand-green"
                    : track.status === "in_progress"
                      ? "bg-brand-cyan"
                      : "bg-brand-border"
                )}
                style={{ width: `${track.progressPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <div className="flex items-center gap-2 text-brand-muted">
          <FileText className="h-4 w-4" />
          <p className="text-sm font-semibold text-brand-text">JD Snapshot</p>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">
          {plan.jdText}
        </p>
      </div>
    </div>
  );
}
