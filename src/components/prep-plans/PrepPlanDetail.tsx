"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonoLabel } from "@/components/shared/Rack";
import { DeletePrepPlanButton } from "@/components/prep-plans/DeletePrepPlanButton";
import { PrepGuruShell } from "@/components/prep-plans/PrepGuruShell";
import { AssistantTurn, TargetTurn } from "@/components/prep-plans/PrepGuruTurn";
import {
  AvailabilityTag,
  INFERENCE_NOTE,
  PlanStatusTag,
  PriorityTag,
  Tag,
  TrackStatusDot,
  formatRelativeDay,
  isRoundLive,
} from "@/components/prep-plans/PrepPlanMeta";
import { usePrepPlans } from "@/hooks/usePrepPlans";
import {
  getPracticeCard,
  getPracticeKindLabel,
  type PracticeInterviewKind,
  type PrepPlanTrack,
} from "@/lib/dashboard/models";
import { cn } from "@/lib/utils";

type PrepPlanDetailProps = {
  planId: string;
};

function buildLaunchHref(
  planId: string,
  kind: PracticeInterviewKind,
  company: string,
  role: string
) {
  const card = getPracticeCard(kind);
  const params = new URLSearchParams({
    planId,
    company,
    role,
  });

  return `${card?.href ?? "/dashboard"}?${params.toString()}`;
}

/** One round of the loop: why it is here, what it tends to ask, how to start it. */
function RoundPanel({
  track,
  index,
  onLaunch,
}: {
  track: PrepPlanTrack;
  index: number;
  onLaunch: (kind: PracticeInterviewKind) => void;
}) {
  const isLive = isRoundLive(track.kind);
  const kindLabel = getPracticeKindLabel(track.kind);
  const likelyQuestions = track.likelyQuestions ?? [];
  const historicalQuestions = track.historicalQuestions ?? [];

  return (
    <div className="overflow-hidden rounded-xl border border-brand-border">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-brand-border bg-brand-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <MonoLabel
            className={cn(
              "tracking-[0.18em]",
              isLive ? "text-brand-cyan" : "text-brand-subtle"
            )}
          >
            Round {index + 1}
          </MonoLabel>
          <PriorityTag priority={track.priority} />
          <AvailabilityTag kind={track.kind} />
        </div>
        <TrackStatusDot status={track.status} />
      </div>

      <div className="bg-brand-card px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h3
              className={cn(
                "font-heading text-lg font-semibold tracking-tight",
                isLive ? "text-brand-text" : "text-brand-muted"
              )}
            >
              {track.title ?? kindLabel}
            </h3>
            <MonoLabel className="mt-1.5 block text-[9px]">{kindLabel}</MonoLabel>
            {track.rationale ? (
              <p className="mt-2.5 text-sm leading-relaxed text-brand-muted">
                {track.rationale}
              </p>
            ) : null}
            <p className="mt-2.5 text-xs font-medium leading-relaxed text-brand-cyan">
              Recommended: {track.nextActionLabel}
            </p>
            {isLive ? null : (
              <p className="mt-2.5 text-xs leading-relaxed text-brand-subtle">
                This round is in your loop, but the round type is not open yet.
                Its setup page opens as a preview rather than a scored round.
              </p>
            )}
          </div>

          <Button
            onClick={() => onLaunch(track.kind)}
            size="sm"
            variant={isLive ? "default" : "secondary"}
            className="shrink-0"
          >
            {isLive ? `Open ${kindLabel} setup` : "Preview setup"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-px border-t border-brand-border bg-brand-border xl:grid-cols-2">
        <div className="bg-brand-surface px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MonoLabel className="text-[9px]">Possible questions</MonoLabel>
            <Tag tone="cyan">AI inferred</Tag>
          </div>
          {likelyQuestions.length > 0 ? (
            <ul className="mt-3 flex flex-col divide-y divide-brand-border/60">
              {likelyQuestions.map((question) => (
                <li
                  key={question}
                  className="py-2.5 text-sm leading-relaxed text-brand-text first:pt-0 last:pb-0"
                >
                  {question}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              No reliable AI-inferred questions came back for this round.
            </p>
          )}
        </div>

        <div className="bg-brand-surface px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MonoLabel className="text-[9px]">Reported patterns</MonoLabel>
            <Tag tone="green">Reviewed corpus</Tag>
          </div>
          {historicalQuestions.length > 0 ? (
            <ul className="mt-3 flex flex-col divide-y divide-brand-border/60">
              {historicalQuestions.map((question) => (
                <li key={question.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm leading-relaxed text-brand-text">
                    {question.prompt}
                  </p>
                  {question.topics.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {question.topics.map((topic) => (
                        <span
                          key={`${question.id}-${topic}`}
                          className="rounded-full border border-brand-border px-2 py-0.5 font-mono text-[10px] text-brand-muted"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-brand-subtle">
                    {question.sourceLabel} ·{" "}
                    {Math.round(question.confidence * 100)}% confidence
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-brand-subtle">
                    {question.provenance}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              No reviewed company report covers this round yet. Prep Guru will
              not dress an AI guess up as history.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A saved loop, read back as the thread that produced it: the target that was
 * sent, Prep Guru's plan, then every round with its questions and its setup
 * route.
 */
export function PrepPlanDetail({ planId }: PrepPlanDetailProps) {
  const router = useRouter();
  const { plans, getPlanById, isLoaded, markTrackStarted, deletePlan } =
    usePrepPlans();
  const plan = getPlanById(planId);

  const handleLaunch = (kind: PracticeInterviewKind) => {
    if (!plan) return;

    markTrackStarted(plan.id, kind);
    router.push(buildLaunchHref(plan.id, kind, plan.company, plan.role));
  };

  const handleDelete = (deletedPlanId: string) => {
    deletePlan(deletedPlanId);

    if (deletedPlanId === planId) {
      router.replace("/prep-guru");
    }
  };

  const shellProps = {
    plans,
    isLoaded,
    activePlanId: planId,
    onDeletePlan: handleDelete,
  };

  if (!isLoaded) {
    return (
      <PrepGuruShell {...shellProps} mainClassName="max-w-4xl">
        <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
          <MonoLabel>Reading this browser</MonoLabel>
          <div className="mt-4 flex flex-col gap-2.5" aria-hidden="true">
            <span className="block h-2 w-40 rounded-sm bg-brand-border" />
            <span className="block h-2 w-full rounded-sm bg-brand-border/60" />
            <span className="block h-2 w-2/3 rounded-sm bg-brand-border/60" />
          </div>
        </div>
      </PrepGuruShell>
    );
  }

  if (!plan) {
    return (
      <PrepGuruShell {...shellProps} mainClassName="max-w-4xl">
        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 text-center sm:p-8">
          <MonoLabel>Not in this browser</MonoLabel>
          <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-brand-text">
            That plan is not here
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-muted">
            Plans are stored per device, so this one may have been generated in
            another browser or cleared from this one. Generating it again takes a
            few seconds.
          </p>
          <div className="mt-5">
            <Button asChild>
              <Link href="/prep-guru">
                Back to Prep Guru
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </PrepGuruShell>
    );
  }

  const roundCount = plan.tracks.length;
  const recommendedIndex = (() => {
    const preferred = plan.tracks.findIndex(
      (track) => track.kind === plan.nextRecommendedKind && isRoundLive(track.kind)
    );
    if (preferred >= 0) return preferred;

    const nextLive = plan.tracks.findIndex(
      (track) => isRoundLive(track.kind) && track.status !== "completed"
    );
    if (nextLive >= 0) return nextLive;

    return plan.tracks.findIndex((track) => track.kind === plan.nextRecommendedKind);
  })();
  const recommendedTrack =
    recommendedIndex >= 0 ? plan.tracks[recommendedIndex] : null;

  return (
    <PrepGuruShell {...shellProps} mainClassName="max-w-4xl">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/prep-guru"
            className="inline-flex items-center gap-2 text-sm text-brand-muted transition-colors hover:text-brand-text"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Prep Guru
          </Link>
          <DeletePrepPlanButton
            planLabel={plan.label}
            onConfirm={() => handleDelete(plan.id)}
            triggerLabel="Delete loop"
          />
        </div>

        <TargetTurn plan={plan} />

        <AssistantTurn
          accessory={
            <span className="flex items-center gap-2.5">
              <PlanStatusTag status={plan.status} />
              <MonoLabel className="text-[9px] tracking-[0.12em]">
                Generated {formatRelativeDay(plan.createdAt)}
              </MonoLabel>
            </span>
          }
        >
          <h1 className="font-heading text-xl font-bold tracking-tight text-brand-text sm:text-2xl">
            {roundCount === 1 ? "A single-round loop" : `A ${roundCount}-round loop`} for{" "}
            {plan.role} at {plan.company}
          </h1>

          {plan.planSummary ? (
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              {plan.planSummary}
            </p>
          ) : null}

          {plan.jdSignals.length > 0 ? (
            <div className="mt-4">
              <MonoLabel className="text-[9px]">Signals read from this JD</MonoLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {plan.jdSignals.map((signal, index) => (
                  <span
                    key={`${plan.id}-${signal}`}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-[0.08em]",
                      index === 0
                        ? "border-brand-cyan/30 bg-brand-cyan/5 text-brand-cyan"
                        : "border-brand-border text-brand-muted"
                    )}
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {plan.researchNote ? (
            <p className="mt-4 border-t border-brand-border pt-3 text-xs leading-relaxed text-brand-subtle">
              {plan.researchNote}
            </p>
          ) : null}
        </AssistantTurn>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-brand-border pb-2">
            <MonoLabel className="tracking-[0.18em]">The rounds</MonoLabel>
            <MonoLabel className="text-[9px] tracking-[0.12em]">
              {roundCount} round{roundCount === 1 ? "" : "s"} · weighted by the JD
            </MonoLabel>
          </div>

          {plan.tracks.map((track, index) => (
            <RoundPanel
              key={`${plan.id}-${track.kind}`}
              track={track}
              index={index}
              onLaunch={handleLaunch}
            />
          ))}
        </div>

        {recommendedTrack ? (
          <div className="flex flex-col gap-3 rounded-xl border border-brand-border bg-brand-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="font-heading text-base font-semibold tracking-tight text-brand-text">
                Start with Round {recommendedIndex + 1}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                {recommendedTrack.title ?? getPracticeKindLabel(recommendedTrack.kind)} ·{" "}
                {recommendedTrack.nextActionLabel}
              </p>
            </div>
            <Button
              onClick={() => handleLaunch(recommendedTrack.kind)}
              className="shrink-0"
            >
              {isRoundLive(recommendedTrack.kind) ? "Start round" : "Preview setup"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <p className="flex gap-2.5 rounded-xl border border-brand-border px-4 py-3">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-amber" />
          <span className="text-xs leading-relaxed text-brand-subtle">
            {INFERENCE_NOTE}
          </span>
        </p>
      </div>
    </PrepGuruShell>
  );
}
