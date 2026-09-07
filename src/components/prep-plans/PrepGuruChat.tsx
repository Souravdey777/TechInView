"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonoLabel } from "@/components/shared/Rack";
import {
  PrepPlanBuilder,
  type PrepPlanRequest,
} from "@/components/prep-plans/PrepPlanBuilder";
import {
  AssistantTurn,
  TargetTurn,
  UserTurn,
} from "@/components/prep-plans/PrepGuruTurn";
import { PrepPlanRoundGrid } from "@/components/prep-plans/PrepPlanRoundGrid";
import {
  INFERENCE_NOTE,
  PlanStatusTag,
  Tag,
  formatRelativeDay,
} from "@/components/prep-plans/PrepPlanMeta";
import type { PrepPlanSummary } from "@/lib/dashboard/models";
import { cn } from "@/lib/utils";

const RESEARCH_STEPS = [
  {
    label: "Reading your target context",
    detail: "Pulling out the company, role, seniority, and the strongest JD signals.",
  },
  {
    label: "Mapping the likely loop",
    detail: "Shaping rounds around this role instead of a generic checklist.",
  },
  {
    label: "Preparing round questions",
    detail: "Writing realistic possibilities and keeping AI inferences labelled.",
  },
  {
    label: "Checking reviewed reports",
    detail: "Matching community-reported patterns from the reviewed corpus.",
  },
] as const;

type GenerateResponse = {
  success: boolean;
  data?: PrepPlanSummary;
  error?: string;
};

type PrepGuruChatProps = {
  activePlan: PrepPlanSummary | null;
  onPlanGenerated: (plan: PrepPlanSummary) => void;
};

/* ─── Turn bodies ─── */

function PlanTurn({ plan }: { plan: PrepPlanSummary }) {
  const roundCount = plan.tracks.length;

  return (
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
      <h2 className="font-heading text-lg font-semibold tracking-tight text-brand-text sm:text-xl">
        {roundCount === 1
          ? "A single-round loop"
          : `A ${roundCount}-round loop`}{" "}
        for {plan.role} at {plan.company}
      </h2>

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

      <div className="mt-4">
        <MonoLabel className="text-[9px]">The rounds</MonoLabel>
        <PrepPlanRoundGrid
          className="mt-2"
          planId={plan.id}
          tracks={plan.tracks}
          showStatus
        />
      </div>

      {plan.researchNote ? (
        <p className="mt-4 border-t border-brand-border pt-3 text-xs leading-relaxed text-brand-subtle">
          {plan.researchNote}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-brand-border pt-4">
        <Button asChild size="sm">
          <Link href={`/prep-guru/${plan.id}`}>
            Open the full loop
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <p className="text-xs leading-relaxed text-brand-subtle">
          Questions, reported patterns, and per-round setup live there.
        </p>
      </div>
    </AssistantTurn>
  );
}

function ResearchingTurn({ target, step }: { target: string; step: number }) {
  return (
    <AssistantTurn
      accessory={
        <MonoLabel className="text-[9px] tracking-[0.12em]">
          Step {step + 1} of {RESEARCH_STEPS.length}
        </MonoLabel>
      }
    >
      <div aria-live="polite" aria-atomic="true">
        <h2 className="font-heading text-base font-semibold tracking-tight text-brand-text">
          Mapping the loop for {target}
        </h2>

        <ol className="mt-3 flex flex-col divide-y divide-brand-border/60">
          {RESEARCH_STEPS.map((activity, index) => {
            const isActive = index === step;

            return (
              <li
                key={activity.label}
                className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    isActive ? "bg-brand-cyan" : "bg-brand-border"
                  )}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      isActive ? "text-brand-text" : "text-brand-subtle"
                    )}
                  >
                    {activity.label}
                  </span>
                  {isActive ? (
                    <span className="mt-1 block text-xs leading-relaxed text-brand-muted">
                      {activity.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex gap-1" aria-hidden="true">
          {RESEARCH_STEPS.map((activity, index) => (
            <span
              key={activity.label}
              className={cn(
                "h-1 flex-1 rounded-sm transition-colors duration-500",
                index === step ? "bg-brand-cyan" : "bg-brand-border"
              )}
            />
          ))}
        </div>
      </div>
    </AssistantTurn>
  );
}

function ErrorTurn({ message }: { message: string }) {
  return (
    <AssistantTurn accessory={<Tag tone="amber">Not generated</Tag>}>
      <div className="flex gap-3">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
        <div className="min-w-0">
          <p role="alert" className="text-sm leading-relaxed text-brand-text">
            {message}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-brand-muted">
            Nothing was saved. Add a bit more of the posting, or name the company
            and role explicitly, and send it again.
          </p>
        </div>
      </div>
    </AssistantTurn>
  );
}

/* ─── The conversation ─── */

/**
 * One conversation per plan: the target you sent, then Prep Guru's loop. A new
 * send replaces the thread and lands in the sidebar's history.
 */
export function PrepGuruChat({ activePlan, onPlanGenerated }: PrepGuruChatProps) {
  const [pendingRequest, setPendingRequest] = useState<PrepPlanRequest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchStep, setResearchStep] = useState(0);
  const [resetToken, setResetToken] = useState(0);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const activePlanId = activePlan?.id ?? null;

  // Switching plans from the sidebar (or starting a new one) drops any leftover
  // draft turn so the thread always matches the selected plan.
  useEffect(() => {
    setPendingRequest(null);
    setError(null);
  }, [activePlanId]);

  useEffect(() => {
    if (!isGenerating) return;

    const intervalId = window.setInterval(() => {
      setResearchStep((current) => (current + 1) % RESEARCH_STEPS.length);
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, [isGenerating]);

  useEffect(() => {
    if (!pendingRequest && !activePlanId) return;

    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [pendingRequest, activePlanId, isGenerating]);

  const handleSubmit = async (request: PrepPlanRequest) => {
    setPendingRequest(request);
    setError(null);
    setResearchStep(0);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/prep-guru/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: request.prompt,
          company: request.company,
          role: request.role,
          jdText: request.prompt.length >= 40 ? request.prompt : "",
        }),
      });
      const result = (await response.json()) as GenerateResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Prep Guru could not create this plan.");
      }

      onPlanGenerated(result.data);
      setPendingRequest(null);
      setResetToken((current) => current + 1);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Prep Guru could not create this plan."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const pendingTarget = pendingRequest
    ? pendingRequest.company && pendingRequest.role
      ? `${pendingRequest.role} at ${pendingRequest.company}`
      : pendingRequest.prompt.split("\n")[0]?.slice(0, 72) || "your target role"
    : "";

  const hasThread = Boolean(pendingRequest || activePlan);

  if (!hasThread) {
    return (
      <div className="flex min-h-[58vh] flex-col justify-center gap-6 py-6">
        <div className="text-center">
          <MonoLabel className="tracking-[0.18em]">Prep Guru</MonoLabel>
          <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
            What interview are you preparing for?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-muted">
            Paste the posting, or just name the role and company. Prep Guru maps
            the rounds you are likely to face, drafts the questions each one
            tends to ask, and flags which of them reviewed candidate reports
            actually mention.
          </p>
        </div>

        <PrepPlanBuilder
          variant="hero"
          onSubmit={(request) => void handleSubmit(request)}
          isGenerating={isGenerating}
          error={error}
          resetToken={resetToken}
        />

        <p className="mx-auto flex max-w-xl gap-2.5 rounded-xl border border-brand-border px-4 py-3">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-amber" />
          <span className="text-xs leading-relaxed text-brand-subtle">
            {INFERENCE_NOTE}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-6">
        {pendingRequest ? (
          <>
            <UserTurn>
              <MonoLabel className="text-[9px]">
                {pendingRequest.prompt.length >= 40 ? "Posting pasted" : "Target"}
              </MonoLabel>
              <p className="mt-2 max-h-44 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-brand-text">
                {pendingRequest.prompt ||
                  `${pendingRequest.role} at ${pendingRequest.company}`}
              </p>
            </UserTurn>

            {isGenerating ? (
              <ResearchingTurn target={pendingTarget} step={researchStep} />
            ) : error ? (
              <ErrorTurn message={error} />
            ) : null}
          </>
        ) : activePlan ? (
          <>
            <TargetTurn plan={activePlan} />
            <PlanTurn plan={activePlan} />
          </>
        ) : null}
      </div>

      <div ref={threadEndRef} />

      <div className="sticky bottom-0 z-10 -mx-1 bg-brand-deep px-1 pb-3 pt-3">
        <PrepPlanBuilder
          onSubmit={(request) => void handleSubmit(request)}
          isGenerating={isGenerating}
          error={pendingRequest ? null : error}
          resetToken={resetToken}
        />
      </div>
    </div>
  );
}
