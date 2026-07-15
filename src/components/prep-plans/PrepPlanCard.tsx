"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, CalendarClock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeletePrepPlanButton } from "@/components/prep-plans/DeletePrepPlanButton";
import { cn } from "@/lib/utils";
import { getPracticeKindLabel, type PrepPlanSummary } from "@/lib/dashboard/models";

type PrepPlanCardProps = {
  plan: PrepPlanSummary;
  compact?: boolean;
  onDelete?: (planId: string) => void;
};

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function PrepPlanCard({
  plan,
  compact = false,
  onDelete,
}: PrepPlanCardProps) {
  const visibleTracks = compact ? plan.tracks.slice(0, 4) : plan.tracks;

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-cyan">
              <Sparkles className="h-3.5 w-3.5" />
              Prep Guru
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
              <Building2 className="h-3.5 w-3.5" />
              {plan.company}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              {plan.role}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-semibold text-brand-text">{plan.label}</h3>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted">
            Next recommended step: {getPracticeKindLabel(plan.nextRecommendedKind)}. {plan.nextActionLabel}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
            <CalendarClock className="h-3.5 w-3.5" />
            Updated {formatDateLabel(plan.updatedAt)}
          </span>
          <div className="flex flex-wrap gap-2">
            {onDelete ? (
              <DeletePrepPlanButton
                planLabel={plan.label}
                onConfirm={() => onDelete(plan.id)}
                triggerLabel={compact ? "Delete" : "Delete plan"}
              />
            ) : null}
            <Button asChild size="sm">
              <Link href={`/prep-guru/${plan.id}`}>
                Continue Plan
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className={cn("mt-5 grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3")}>
        {visibleTracks.map((track) => (
          <div key={`${plan.id}-${track.kind}`} className="rounded-xl border border-brand-border bg-brand-surface p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-brand-text">
                  {track.title ?? getPracticeKindLabel(track.kind)}
                </p>
                <p className="mt-1 text-[11px] text-brand-muted">
                  {getPracticeKindLabel(track.kind)}
                </p>
              </div>
              <span className="rounded-full border border-brand-border bg-brand-deep px-2.5 py-0.5 text-[11px] text-brand-muted">
                {track.priority === "core" ? "Core focus" : "Supporting"}
              </span>
            </div>
            <p className="mt-3 line-clamp-2 text-[11px] leading-relaxed text-brand-muted">
              {track.rationale}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
