"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Loader2,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInterviewStore } from "@/stores/interview-store";
import {
  DEFAULT_INTERVIEWER_PERSONA,
  INTERVIEWER_PERSONAS,
  getInterviewerPersona,
  type InterviewerPersonaId,
} from "@/lib/interviewer-personas";
import {
  DEFAULT_ENGINEERING_MANAGER_FOCUS_AREAS,
  ENGINEERING_MANAGER_DURATION_MINUTES,
  ENGINEERING_MANAGER_FOCUS_OPTIONS,
  buildEngineeringManagerRoundContext,
  getEngineeringManagerFocusLabels,
} from "@/lib/engineering-manager";

type StartResponse = {
  data?: {
    interviewId?: string;
    interviewerPersona?: InterviewerPersonaId;
    startedAt?: string;
  };
};

type EngineeringManagerSetupProps = {
  initialCompany?: string | null;
  initialRoleTitle?: string | null;
};

function trimOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function EngineeringManagerSetup({
  initialCompany = null,
  initialRoleTitle = null,
}: EngineeringManagerSetupProps) {
  const router = useRouter();
  const initFromSetup = useInterviewStore((state) => state.initFromSetup);
  const [company, setCompany] = useState(initialCompany ?? "");
  const [roleTitle, setRoleTitle] = useState(initialRoleTitle ?? "");
  const [focusAreas, setFocusAreas] = useState<string[]>(
    DEFAULT_ENGINEERING_MANAGER_FOCUS_AREAS
  );
  const [interviewerPersona, setInterviewerPersona] =
    useState<InterviewerPersonaId>(DEFAULT_INTERVIEWER_PERSONA);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roundContext = useMemo(
    () =>
      buildEngineeringManagerRoundContext({
        company,
        roleTitle,
        focusAreas,
      }),
    [company, focusAreas, roleTitle]
  );
  const selectedPersona = getInterviewerPersona(interviewerPersona);
  const selectedFocusLabels = useMemo(
    () => getEngineeringManagerFocusLabels(focusAreas),
    [focusAreas]
  );
  const isDisabled = focusAreas.length === 0 || isCreating;

  function toggleFocusArea(value: string) {
    setFocusAreas((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  async function handleStartInterview() {
    if (focusAreas.length === 0 || isCreating) return;

    setIsCreating(true);
    setError(null);

    const trimmedCompany = trimOrNull(company);
    const trimmedRoleTitle = trimOrNull(roleTitle);

    try {
      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "targeted_loop",
          roundType: "hiring_manager",
          language: "javascript",
          maxDurationSeconds: ENGINEERING_MANAGER_DURATION_MINUTES * 60,
          interviewerPersona,
          company: trimmedCompany,
          roleTitle: trimmedRoleTitle,
          generatedLoopRoundSnapshot: roundContext,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to start Engineering Manager interview");
      }

      const payload = (await response.json()) as StartResponse;
      const interviewId = payload.data?.interviewId;

      if (!interviewId) {
        throw new Error("No interview ID returned");
      }

      initFromSetup({
        interviewId,
        mode: "targeted_loop",
        roundType: "hiring_manager",
        problem: null,
        roundContext,
        language: "javascript",
        maxDurationSeconds: ENGINEERING_MANAGER_DURATION_MINUTES * 60,
        difficulty: "medium",
        category: null,
        interviewerPersona: payload.data?.interviewerPersona ?? interviewerPersona,
        company: trimmedCompany,
        roleTitle: trimmedRoleTitle,
        startedAt: payload.data?.startedAt ?? new Date().toISOString(),
      });

      router.push(`/interviews/engineering-manager/${interviewId}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to start Engineering Manager interview"
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-deep text-brand-text">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-brand-muted transition-colors hover:text-brand-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="rounded-3xl border border-brand-border bg-brand-card p-7 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-brand-green/25 bg-brand-green/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-green">
                live
              </span>
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
                Dedicated setup route
              </span>
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
                {ENGINEERING_MANAGER_DURATION_MINUTES} min
              </span>
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
                Voice chat
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-brand-text">
              Engineering Manager Setup
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-brand-muted">
              Build a voice-first leadership and role-fit interview around the company, role, and
              signal areas you want to rehearse. This flow skips coding and focuses on impact,
              prioritization, stakeholder judgment, and concrete examples from your own work.
            </p>

            <div className="mt-8 grid gap-6">
              <section className="rounded-2xl border border-brand-border bg-brand-surface p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                  <Building2 className="h-3.5 w-3.5" />
                  Role Context
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
                      Company
                    </label>
                    <input
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      placeholder="Meta, Google, Stripe..."
                      className="mt-2 w-full rounded-2xl border border-brand-border bg-brand-card px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted/60 focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
                      Role Title
                    </label>
                    <input
                      value={roleTitle}
                      onChange={(event) => setRoleTitle(event.target.value)}
                      placeholder="Senior Backend Engineer"
                      className="mt-2 w-full rounded-2xl border border-brand-border bg-brand-card px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted/60 focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                    />
                  </div>
                </div>
                <p className="mt-3 text-sm text-brand-muted">
                  These are optional, but they help the round feel more like a real role-fit or
                  hiring-manager conversation.
                </p>
              </section>

              <section className="rounded-2xl border border-brand-border bg-brand-surface p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                  <Sparkles className="h-3.5 w-3.5" />
                  Interview Focus
                </div>
                <p className="mt-3 text-sm text-brand-muted">
                  Pick the leadership signals you want the interviewer to probe. You can choose
                  multiple.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {ENGINEERING_MANAGER_FOCUS_OPTIONS.map((option) => {
                    const selected = focusAreas.includes(option.value);

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleFocusArea(option.value)}
                        className={`flex items-start justify-between rounded-2xl border px-4 py-4 text-left transition-colors ${
                          selected
                            ? "border-brand-cyan bg-brand-cyan/10 text-brand-text"
                            : "border-brand-border bg-brand-card text-brand-muted hover:border-brand-cyan/30 hover:text-brand-text"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className="mt-2 text-xs leading-relaxed">
                            {option.description}
                          </p>
                        </div>
                        <span
                          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                            selected
                              ? "border-brand-cyan bg-brand-cyan text-brand-deep"
                              : "border-brand-border bg-brand-surface"
                          }`}
                        >
                          {selected ? <Check className="h-3 w-3" /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-brand-border bg-brand-surface p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Interview Persona
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {INTERVIEWER_PERSONAS.map((persona) => {
                    const selected = interviewerPersona === persona.id;

                    return (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => setInterviewerPersona(persona.id)}
                        className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                          selected
                            ? "border-brand-cyan bg-brand-cyan/10 text-brand-text"
                            : "border-brand-border bg-brand-card text-brand-muted hover:border-brand-cyan/30 hover:text-brand-text"
                        }`}
                      >
                        <p className="text-sm font-semibold">{persona.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-brand-muted">
                          {persona.companyLabel}
                        </p>
                        <p className="mt-3 text-xs leading-relaxed">
                          {persona.shortStyleSummary}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => void handleStartInterview()} disabled={isDisabled}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting interview...
                  </>
                ) : (
                  <>
                    Start Engineering Manager Round
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <Button asChild variant="secondary">
                <Link href="/prep-plans">Use inside a prep plan</Link>
              </Button>
            </div>

            {error ? <p className="mt-4 text-sm text-brand-rose">{error}</p> : null}
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-brand-border bg-brand-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                Interview Preview
              </p>
              <h2 className="mt-3 text-xl font-semibold text-brand-text">
                {roundContext.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                {roundContext.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {roundContext.focusAreas.map((focus) => (
                  <span
                    key={focus}
                    className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted"
                  >
                    {focus}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-brand-border bg-brand-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                Session Shape
              </p>
              <div className="mt-4 space-y-3 text-sm text-brand-muted">
                <p>1. Warm intro and role-context calibration</p>
                <p>2. Leadership and prioritization questions</p>
                <p>3. Stakeholder, conflict, and judgment follow-ups</p>
                <p>4. Role-fit close with realistic wrap-up feedback</p>
              </div>
              <div className="mt-5 rounded-2xl border border-brand-border bg-brand-surface p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">
                  Selected Setup
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-text">
                  {[trimOrNull(roleTitle), trimOrNull(company)].filter(Boolean).join(" · ") ||
                    "General engineering leadership round"}
                </p>
                <p className="mt-2 text-sm text-brand-muted">
                  {selectedFocusLabels.length > 0
                    ? selectedFocusLabels.join(", ")
                    : "Choose at least one focus area to continue."}
                </p>
                <p className="mt-3 text-xs text-brand-muted">
                  Interviewer: {selectedPersona.name}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-brand-border bg-brand-card p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                What This Round Optimizes For
              </div>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                Strong rounds sound specific, grounded, and calm under pressure. Bring measurable
                outcomes, tradeoff logic, and your actual role in the story rather than generic
                leadership language.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
