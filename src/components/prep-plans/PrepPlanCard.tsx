"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonoLabel, Rack } from "@/components/shared/Rack";
import { DeletePrepPlanButton } from "@/components/prep-plans/DeletePrepPlanButton";
import { PrepPlanRoundGrid } from "@/components/prep-plans/PrepPlanRoundGrid";
import {
  PlanStatusTag,
  formatShortDate,
} from "@/components/prep-plans/PrepPlanMeta";
import { getPracticeKindLabel, type PrepPlanSummary } from "@/lib/dashboard/models";

type PrepPlanCardProps = {
  plan: PrepPlanSummary;
  compact?: boolean;
  onDelete?: (planId: string) => void;
};

/**
 * A saved loop at a glance: the target in the chrome header, the next round to
 * take, and the per-round breakdown underneath. `compact` trims the rounds for
 * the dashboard rack; the full form is used wherever the loop is the subject.
 */
export function PrepPlanCard({
  plan,
  compact = false,
  onDelete,
}: PrepPlanCardProps) {
  return (
    <Rack
      bodyClassName="flex flex-col gap-4 p-4 sm:p-4"
      label={
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <MonoLabel className="tracking-[0.18em]">Loop</MonoLabel>
          <span className="truncate font-mono text-[11px] text-brand-muted">
            {plan.company} · {plan.role}
          </span>
        </span>
      }
      accessory={
        <span className="flex items-center gap-2.5">
          <PlanStatusTag status={plan.status} />
          <MonoLabel className="text-[9px] tracking-[0.12em]">
            Updated {formatShortDate(plan.updatedAt)}
          </MonoLabel>
        </span>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <MonoLabel className="text-[9px]">Next round</MonoLabel>
          <p className="mt-1.5 font-heading text-sm font-semibold tracking-tight text-brand-text">
            {getPracticeKindLabel(plan.nextRecommendedKind)}
          </p>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-brand-muted">
            {plan.nextActionLabel}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {onDelete ? (
            <DeletePrepPlanButton
              planLabel={plan.label}
              onConfirm={() => onDelete(plan.id)}
              triggerLabel={compact ? "Delete" : "Delete loop"}
            />
          ) : null}
          <Button asChild size="sm">
            <Link href={`/prep-guru/${plan.id}`}>
              Open loop
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <PrepPlanRoundGrid
        planId={plan.id}
        tracks={plan.tracks}
        limit={compact ? 4 : undefined}
        columnsClassName={compact ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"}
      />
    </Rack>
  );
}
