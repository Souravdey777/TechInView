"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { MonoLabel } from "@/components/shared/Rack";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BODY, ButtonLink, Eyebrow, LEAD } from "@/components/marketing/ds";
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
  /** No captured payment: open the upgrade prompt on arrival. */
  isPaid: boolean;
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
          <MonoLabel>
            Generated {formatRelativeDay(plan.createdAt)}
          </MonoLabel>
        </span>
      }
    >
      <h2 className="text-balance text-2xl font-normal leading-[1.1] tracking-[-0.03em] text-brand-text sm:text-3xl">
        {roundCount === 1
          ? "A single-round loop"
          : `A ${roundCount}-round loop`}{" "}
        for {plan.role} at {plan.company}
      </h2>

      {plan.planSummary ? (
        <p className={cn(BODY, "mt-4")}>
          {plan.planSummary}
        </p>
      ) : null}

      {plan.jdSignals.length > 0 ? (
        <div className="mt-6">
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

      <div className="mt-6">
        <MonoLabel>The rounds</MonoLabel>
        <PrepPlanRoundGrid
          className="mt-3"
          planId={plan.id}
          tracks={plan.tracks}
          showStatus
        />
      </div>

      {plan.researchNote ? (
        <p className="mt-6 text-xs leading-relaxed text-brand-subtle">
          {plan.researchNote}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/[0.08] pt-5">
        <ButtonLink href={`/prep-guru/${plan.id}`} size="sm" className="gap-2">
          Open the full loop
          <ArrowRight className="h-3.5 w-3.5" />
        </ButtonLink>
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
        <MonoLabel>
          Step {step + 1} of {RESEARCH_STEPS.length}
        </MonoLabel>
      }
    >
      <div aria-live="polite" aria-atomic="true">
        <h2 className="text-xl font-medium tracking-[-0.02em] text-brand-text">
          Mapping the loop for {target}
        </h2>

        <ol className="mt-4 flex flex-col divide-y divide-white/[0.08]">
          {RESEARCH_STEPS.map((activity, index) => {
            const isActive = index === step;

            return (
              <li
                key={activity.label}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    isActive ? "bg-brand-cyan" : "bg-white/[0.18]"
                  )}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[15px]",
                      isActive ? "text-brand-text" : "text-brand-subtle"
                    )}
                  >
                    {activity.label}
                  </span>
                  {isActive ? (
                    <span className="mt-1 block text-sm leading-relaxed text-brand-muted">
                      {activity.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 flex gap-1" aria-hidden="true">
          {RESEARCH_STEPS.map((activity, index) => (
            <span
              key={activity.label}
              className={cn(
                "h-px flex-1 transition-colors duration-500",
                index === step ? "bg-brand-cyan" : "bg-white/[0.12]"
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
          <p role="alert" className="text-[15px] leading-relaxed text-brand-text">
            {message}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted">
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
export function PrepGuruChat({ activePlan, isPaid, onPlanGenerated }: PrepGuruChatProps) {
  const [pendingRequest, setPendingRequest] = useState<PrepPlanRequest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(!isPaid);
  const [researchStep, setResearchStep] = useState(0);
  const [resetToken, setResetToken] = useState(0);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const activePlanId = activePlan?.id ?? null;
  const ph = usePostHog();

  useEffect(() => {
    if (paywallOpen) ph?.capture("prep_guru_upgrade_shown");
  }, [paywallOpen, ph]);

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
      // 403 = signed in but no purchase yet (see /api/prep-plans/generate).
      if (response.status === 403) {
        setPendingRequest(null);
        setPaywallOpen(true);
        return;
      }

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

  const paywall = (
    <Dialog open={paywallOpen} onOpenChange={setPaywallOpen}>
      {/* Portaled outside the themed layout, so it re-applies the theme itself. */}
      <DialogContent className="rounded-[20px] border-white/[0.08] bg-brand-deep shadow-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-normal tracking-[-0.03em]">
            Prep Guru is for paid accounts
          </DialogTitle>
          <DialogDescription className="text-[15px]">
            Buy any interview pack to unlock Prep Guru. It maps the loop for your target
            role and drafts the questions each round tends to ask.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-white/[0.08]">
          <Button type="button" variant="secondary" onClick={() => setPaywallOpen(false)}>
            Not now
          </Button>
          <Button asChild>
            <Link
              href="/settings#rounds"
              onClick={() => ph?.capture("prep_guru_upgrade_clicked")}
            >
              Buy rounds
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (!hasThread) {
    return (
      <div className="flex min-h-[58vh] flex-col justify-center gap-8 py-6">
        {paywall}
        <div className="text-center">
          <Eyebrow className="mb-4">Prep Guru</Eyebrow>
          <h1 className="mx-auto max-w-[18ch] text-balance text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
            What interview are you preparing for?
          </h1>
          <p className={cn(LEAD, "mx-auto mt-5 max-w-xl")}>
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

        <p className="mx-auto flex max-w-xl gap-2.5 border-t border-white/[0.08] pt-4">
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
      {paywall}
      <div className="flex flex-col gap-8">
        {pendingRequest ? (
          <>
            <UserTurn>
              <MonoLabel>
                {pendingRequest.prompt.length >= 40 ? "Posting pasted" : "Target"}
              </MonoLabel>
              <p className="mt-2 max-h-44 overflow-y-auto whitespace-pre-wrap text-[15px] leading-relaxed text-brand-text">
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
