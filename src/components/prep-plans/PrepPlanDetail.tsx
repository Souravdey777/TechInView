"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Bot, Building2, BriefcaseBusiness, CheckCircle2, FileQuestion, FileText, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeletePrepPlanButton } from "@/components/prep-plans/DeletePrepPlanButton";
import { usePrepPlans } from "@/hooks/usePrepPlans";
import { getPracticeCard, getPracticeKindLabel, type PracticeInterviewKind } from "@/lib/dashboard/models";

type PrepPlanDetailProps = {
  planId: string;
};

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
    router.replace("/prep-guru");
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
            <Link href="/prep-guru">Back to Prep Guru</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
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
          onConfirm={handleDelete}
        />
      </div>

      <div className="ml-auto max-w-3xl rounded-3xl rounded-br-md border border-brand-border bg-brand-surface p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
          <UserRound className="h-4 w-4" /> Your target
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-text">
          {plan.jdText || `${plan.role} at ${plan.company}`}
        </p>
      </div>

      <div className="relative rounded-3xl rounded-tl-md border border-brand-cyan/20 bg-brand-card p-7 sm:p-8">
        <div className="absolute -left-3 -top-3 flex h-9 w-9 items-center justify-center rounded-xl border border-brand-cyan/25 bg-brand-deep text-brand-cyan">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-cyan">
            Prep Guru research
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
          {plan.researchNote ? (
            <p className="mt-3 border-t border-brand-border pt-3 text-xs leading-relaxed text-brand-muted">
              {plan.researchNote}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4">
        {sortedTracks.map((track, index) => (
          <div key={`${plan.id}-${track.kind}`} className="rounded-2xl border border-brand-border bg-brand-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                    Round {index + 1}
                  </span>
                  <span className="text-lg font-semibold text-brand-text">
                    {track.title ?? getPracticeKindLabel(track.kind)}
                  </span>
                  <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
                    {track.priority}
                  </span>
                  <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
                    {getPracticeKindLabel(track.kind)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">{track.rationale}</p>
                {track.rationale ? (
                  <p className="mt-2 text-xs font-medium text-brand-cyan">Recommended: {track.nextActionLabel}</p>
                ) : null}
              </div>

              <Button onClick={() => handleLaunch(track.kind)}>
                Open {getPracticeKindLabel(track.kind)} Setup
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 grid gap-4 border-t border-brand-border pt-5 lg:grid-cols-2">
              <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-cyan" />
                  <h3 className="text-sm font-semibold text-brand-text">Possible questions</h3>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-brand-muted">AI inferred</span>
                </div>
                <div className="mt-3 space-y-3">
                  {(track.likelyQuestions ?? []).length > 0 ? (
                    track.likelyQuestions?.map((question) => (
                      <div key={question} className="flex gap-2 text-sm leading-relaxed text-brand-muted">
                        <FileQuestion className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                        <p>{question}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-relaxed text-brand-muted">
                      No reliable AI-inferred questions were returned for this round.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-brand-green/20 bg-brand-green/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-green" />
                  <h3 className="text-sm font-semibold text-brand-text">Reported question patterns</h3>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-brand-green">Reviewed corpus</span>
                </div>
                <div className="mt-3 space-y-4">
                  {(track.historicalQuestions ?? []).length > 0 ? (
                    track.historicalQuestions?.map((question) => (
                      <div key={question.id}>
                        <p className="text-sm leading-relaxed text-brand-text">{question.prompt}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {question.topics.map((topic) => (
                            <span key={`${question.id}-${topic}`} className="rounded-full border border-brand-border bg-brand-deep px-2 py-0.5 text-[10px] text-brand-muted">
                              {topic}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-[10px] leading-relaxed text-brand-muted">
                          {question.sourceLabel} · {Math.round(question.confidence * 100)}% corpus confidence
                        </p>
                        <p className="mt-1 text-[10px] leading-relaxed text-brand-muted">{question.provenance}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-relaxed text-brand-muted">
                      No reviewed company-specific report is in the corpus for this round. Prep Guru won&apos;t present an AI guess as historical fact.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <div className="flex items-center gap-2 text-brand-muted">
          <FileText className="h-4 w-4" />
          <p className="text-sm font-semibold text-brand-text">Source context</p>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">
          {plan.jdText}
        </p>
      </div>
    </div>
  );
}
