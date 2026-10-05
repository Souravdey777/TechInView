"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonoLabel } from "@/components/shared/Rack";
import {
  BODY,
  ButtonLink,
  CELL,
  Eyebrow,
  FOCUS,
  GRID,
  H3,
  LABEL,
  LEAD,
} from "@/components/marketing/ds";
import { DeletePrepPlanButton } from "@/components/prep-plans/DeletePrepPlanButton";
import { PrepGuruShell } from "@/components/prep-plans/PrepGuruShell";
import { TargetTurn } from "@/components/prep-plans/PrepGuruTurn";
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
    <div className={CELL}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/[0.08] px-5 py-3.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <MonoLabel>Round {index + 1}</MonoLabel>
          <PriorityTag priority={track.priority} />
          <AvailabilityTag kind={track.kind} />
        </div>
        <TrackStatusDot status={track.status} />
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h3
              className={cn(
                H3,
                isLive ? "text-brand-text" : "text-brand-muted"
              )}
            >
              {track.title ?? kindLabel}
            </h3>
            <MonoLabel className="mt-1.5 block">{kindLabel}</MonoLabel>
            {track.rationale ? (
              <p className={cn(BODY, "mt-3")}>{track.rationale}</p>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-brand-text">
              Recommended: {track.nextActionLabel}
            </p>
            {isLive ? null : (
              <p className="mt-3 text-xs leading-relaxed text-brand-subtle">
                This round is in your loop, but the round type is not open yet.
                Its setup page opens as a preview rather than a scored round.
              </p>
            )}
          </div>

          <Button
            onClick={() => onLaunch(track.kind)}
            size="sm"
            variant={isLive ? "default" : "secondary"}
            className="shrink-0 self-start lg:self-auto"
          >
            {isLive ? `Open ${kindLabel} setup` : "Preview setup"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid divide-y divide-white/[0.08] border-t border-white/[0.08] xl:grid-cols-2 xl:divide-x xl:divide-y-0">
        <div className="px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MonoLabel>Possible questions</MonoLabel>
            <Tag>AI inferred</Tag>
          </div>
          {likelyQuestions.length > 0 ? (
            <ul className="mt-3 flex flex-col divide-y divide-white/[0.08]">
              {likelyQuestions.map((question) => (
                <li
                  key={question}
                  className="py-3 text-[15px] leading-relaxed text-brand-text first:pt-0 last:pb-0"
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

        <div className="px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MonoLabel>Reported patterns</MonoLabel>
            <Tag tone="green">Reviewed corpus</Tag>
          </div>
          {historicalQuestions.length > 0 ? (
            <ul className="mt-3 flex flex-col divide-y divide-white/[0.08]">
              {historicalQuestions.map((question) => (
                <li key={question.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-[15px] leading-relaxed text-brand-text">
                    {question.prompt}
                  </p>
                  {question.topics.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {question.topics.map((topic) => (
                        <span
                          key={`${question.id}-${topic}`}
                          className="rounded-full border border-white/[0.1] px-2.5 py-0.5 font-mono text-[10px] text-brand-muted"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-brand-subtle">
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
 * A saved loop: the plan as a page title with its metadata in a hairline grid,
 * the target that was sent, then every round (a hairline grid row each) with
 * its questions and its setup route.
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
        <div className="flex flex-col gap-6" aria-hidden="true">
          <span className="block h-3 w-32 animate-pulse rounded-full bg-white/[0.04]" />
          <span className="block h-10 w-3/4 animate-pulse rounded-full bg-white/[0.04]" />
          <div className={cn(GRID, "grid-cols-2 sm:grid-cols-4")}>
            {[0, 1, 2, 3].map((cell) => (
              <div key={cell} className={cn(CELL, "px-5 py-4")}>
                <span className="block h-2 w-16 animate-pulse rounded-full bg-white/[0.04]" />
                <span className="mt-3 block h-3 w-24 animate-pulse rounded-full bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </div>
        <MonoLabel className="mt-6 block">Reading this browser</MonoLabel>
      </PrepGuruShell>
    );
  }

  if (!plan) {
    return (
      <PrepGuruShell {...shellProps} mainClassName="max-w-4xl">
        <div className="py-10 text-center sm:py-16">
          <Eyebrow>Not in this browser</Eyebrow>
          <h1 className="text-balance text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
            That plan is not here
          </h1>
          <p className={cn(BODY, "mx-auto mt-5 max-w-md")}>
            Plans are stored per device, so this one may have been generated in
            another browser or cleared from this one. Generating it again takes a
            few seconds.
          </p>
          <div className="mt-8">
            <ButtonLink href="/prep-guru" size="sm" className="gap-2">
              Back to Prep Guru
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
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
      <div className="flex flex-col gap-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/prep-guru"
            className={cn(
              "inline-flex items-center gap-2 text-sm text-brand-muted transition-colors hover:text-brand-text",
              FOCUS
            )}
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

        <header>
          <Eyebrow>Prep Guru · Loop</Eyebrow>
          <h1 className="text-balance text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
            {roundCount === 1 ? "A single-round loop" : `A ${roundCount}-round loop`} for{" "}
            {plan.role} at {plan.company}
          </h1>

          {plan.planSummary ? (
            <p className={cn(LEAD, "mt-6 max-w-[62ch]")}>{plan.planSummary}</p>
          ) : null}

          <dl className={cn(GRID, "mt-8 grid-cols-2 sm:grid-cols-4")}>
            <div className={cn(CELL, "min-w-0 px-5 py-4")}>
              <dt className={LABEL}>Company</dt>
              <dd className="mt-2 break-words text-[15px] text-brand-text">{plan.company}</dd>
            </div>
            <div className={cn(CELL, "min-w-0 px-5 py-4")}>
              <dt className={LABEL}>Role</dt>
              <dd className="mt-2 break-words text-[15px] text-brand-text">{plan.role}</dd>
            </div>
            <div className={cn(CELL, "min-w-0 px-5 py-4")}>
              <dt className={LABEL}>Rounds</dt>
              <dd className="mt-2 text-[15px] tabular-nums text-brand-text">{roundCount}</dd>
            </div>
            <div className={cn(CELL, "min-w-0 px-5 py-4")}>
              <dt className={LABEL}>Generated</dt>
              <dd className="mt-2 flex flex-wrap items-center gap-2 text-[15px] text-brand-text">
                {formatRelativeDay(plan.createdAt)}
                <PlanStatusTag status={plan.status} />
              </dd>
            </div>
          </dl>

          {plan.jdSignals.length > 0 ? (
            <div className="mt-8">
              <MonoLabel>Signals read from this JD</MonoLabel>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {plan.jdSignals.map((signal, index) => (
                  <span
                    key={`${plan.id}-${signal}`}
                    className={cn(
                      "rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em]",
                      index === 0
                        ? "border-white/[0.18] text-brand-text"
                        : "border-white/[0.1] text-brand-muted"
                    )}
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {plan.researchNote ? (
            <p className="mt-6 text-xs leading-relaxed text-brand-subtle">
              {plan.researchNote}
            </p>
          ) : null}
        </header>

        <TargetTurn plan={plan} />

        <section>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-2xl font-normal tracking-[-0.03em] text-brand-text">The rounds</h2>
            <MonoLabel>
              {roundCount} round{roundCount === 1 ? "" : "s"} · weighted by the JD
            </MonoLabel>
          </div>

          <div className={cn(GRID, "grid-cols-1")}>
            {plan.tracks.map((track, index) => (
              <RoundPanel
                key={`${plan.id}-${track.kind}`}
                track={track}
                index={index}
                onLaunch={handleLaunch}
              />
            ))}
          </div>
        </section>

        {recommendedTrack ? (
          <div className="flex flex-col gap-4 border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-2xl font-normal tracking-[-0.03em] text-brand-text">
                Start with Round {recommendedIndex + 1}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-brand-muted">
                {recommendedTrack.title ?? getPracticeKindLabel(recommendedTrack.kind)} ·{" "}
                {recommendedTrack.nextActionLabel}
              </p>
            </div>
            <Button
              onClick={() => handleLaunch(recommendedTrack.kind)}
              className="shrink-0 self-start sm:self-auto"
            >
              {isRoundLive(recommendedTrack.kind) ? "Start round" : "Preview setup"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <p className="flex gap-2.5 border-t border-white/[0.08] pt-4">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-amber" />
          <span className="text-xs leading-relaxed text-brand-subtle">
            {INFERENCE_NOTE}
          </span>
        </p>
      </div>
    </PrepGuruShell>
  );
}
