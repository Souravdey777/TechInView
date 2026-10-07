"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CELL, Eyebrow, GRID, LABEL, LEAD } from "@/components/marketing/ds";
import {
  InterviewSetupAsideCard,
  InterviewSetupLayout,
  InterviewSetupSection,
} from "@/components/interviews/InterviewSetupLayout";
import { useApplyPrepPlanRound } from "@/hooks/usePrepPlans";
import { useInterviewStore } from "@/stores/interview-store";
import {
  DEFAULT_ENGINEERING_MANAGER_FOCUS_AREAS,
  DEFAULT_ENGINEERING_MANAGER_REPORTING_SCOPE,
  ENGINEERING_MANAGER_DURATION_MINUTES,
  ENGINEERING_MANAGER_FOCUS_OPTIONS,
  ENGINEERING_MANAGER_REPORTING_SCOPES,
  buildEngineeringManagerRoundContext,
  getEngineeringManagerFocusLabels,
  getEngineeringManagerReportingScope,
  type EngineeringManagerReportingScopeId,
} from "@/lib/engineering-manager";
import {
  DEFAULT_VALUE_FRAMEWORK_ID,
  MAX_VALUE_COMPETENCIES,
  MIN_VALUE_COMPETENCIES,
  getValueFramework,
  resolveLoopValueLens,
  type ValueFrameworkId,
} from "@/lib/interview-values";
import { ValueLensPicker } from "@/components/interviews/setup/ValueLensPicker";
import { cn } from "@/lib/utils";
import { MicrophoneSetupCheck } from "@/components/interviews/MicrophoneSetupCheck";

type StartResponse = {
  data?: {
    interviewId?: string;
    isFreeInterview?: boolean;
    startedAt?: string;
  };
};

type EngineeringManagerSetupProps = {
  initialCompany?: string | null;
  initialRoleTitle?: string | null;
  /** Prep Guru loop this round was opened from; its choices prefill the page. */
  planId?: string | null;
};

/** Option cell inside a hairline grid; selected cells get the cyan ring and tint. */
const OPTION_CELL =
  "flex h-full w-full items-start justify-between gap-3 px-5 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan";
const OPTION_SELECTED = "bg-brand-cyan/[0.06] text-brand-text ring-1 ring-inset ring-brand-cyan/40";
const OPTION_IDLE = "text-brand-muted hover:bg-white/[0.03] hover:text-brand-text";

function trimOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function EngineeringManagerSetup({
  initialCompany = null,
  initialRoleTitle = null,
  planId = null,
}: EngineeringManagerSetupProps) {
  const router = useRouter();
  const initFromSetup = useInterviewStore((state) => state.initFromSetup);
  const [company, setCompany] = useState(initialCompany ?? "");
  const [roleTitle, setRoleTitle] = useState(initialRoleTitle ?? "");
  const [focusAreas, setFocusAreas] = useState<string[]>(
    DEFAULT_ENGINEERING_MANAGER_FOCUS_AREAS
  );
  const [reportingScope, setReportingScope] = useState<EngineeringManagerReportingScopeId>(
    DEFAULT_ENGINEERING_MANAGER_REPORTING_SCOPE
  );
  const [valueFrameworkId, setValueFrameworkId] = useState<ValueFrameworkId>(
    DEFAULT_VALUE_FRAMEWORK_ID
  );
  const [valueCompetencyIds, setValueCompetencyIds] = useState<string[]>(() => [
    ...getValueFramework(DEFAULT_VALUE_FRAMEWORK_ID).defaultCompetencyIds,
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const loopPlan = useApplyPrepPlanRound(planId, "engineering_manager", (plan, track) => {
    const lens = resolveLoopValueLens(
      track?.setup?.valueFrameworkId,
      track?.setup?.valueCompetencyIds,
      plan.company
    );
    const loopFocusAreas = ENGINEERING_MANAGER_FOCUS_OPTIONS.map((option) => option.value).filter(
      (value) => track?.setup?.managerFocusAreas.includes(value)
    );

    setCompany(plan.company);
    setRoleTitle(plan.role);
    setValueFrameworkId(lens.frameworkId);
    setValueCompetencyIds(lens.competencyIds);
    if (loopFocusAreas.length > 0) setFocusAreas(loopFocusAreas);
    if (track?.setup?.reportingScope) {
      setReportingScope(getEngineeringManagerReportingScope(track.setup.reportingScope).value);
    }
  });
  const [error, setError] = useState<string | null>(null);

  const roundContext = useMemo(
    () =>
      buildEngineeringManagerRoundContext({
        company,
        roleTitle,
        focusAreas,
        reportingScope,
        valueFrameworkId,
        valueCompetencyIds,
      }),
    [company, focusAreas, reportingScope, roleTitle, valueCompetencyIds, valueFrameworkId]
  );
  const selectedFocusLabels = useMemo(
    () => getEngineeringManagerFocusLabels(focusAreas),
    [focusAreas]
  );
  const selectedFramework = getValueFramework(valueFrameworkId);
  const selectedCompetencyLabels = useMemo(
    () =>
      selectedFramework.competencies
        .filter((competency) => valueCompetencyIds.includes(competency.id))
        .map((competency) => competency.label),
    [selectedFramework, valueCompetencyIds]
  );
  const hasRequiredSelections =
    focusAreas.length > 0 && valueCompetencyIds.length >= MIN_VALUE_COMPETENCIES;
  const isDisabled = !hasRequiredSelections || isCreating;

  function toggleFocusArea(value: string) {
    setFocusAreas((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  // Competency ids are framework-scoped, so switching lenses has to reset the
  // selection to the new framework's own defaults rather than keep stale ids.
  function handleFrameworkChange(nextFrameworkId: ValueFrameworkId) {
    if (nextFrameworkId === valueFrameworkId) return;

    setValueFrameworkId(nextFrameworkId);
    setValueCompetencyIds([...getValueFramework(nextFrameworkId).defaultCompetencyIds]);
  }

  function toggleValueCompetency(competencyId: string) {
    setValueCompetencyIds((current) => {
      if (current.includes(competencyId)) {
        return current.filter((item) => item !== competencyId);
      }

      if (current.length >= MAX_VALUE_COMPETENCIES) {
        return current;
      }

      return [...current, competencyId];
    });
  }

  async function handleStartInterview() {
    if (!hasRequiredSelections || isCreating) return;

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
        isFreeInterview: payload.data?.isFreeInterview ?? false,
        mode: "targeted_loop",
        roundType: "hiring_manager",
        problem: null,
        roundContext,
        language: "javascript",
        maxDurationSeconds: ENGINEERING_MANAGER_DURATION_MINUTES * 60,
        difficulty: "medium",
        category: null,
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

  const contextLabel =
    [trimOrNull(company), trimOrNull(roleTitle)].filter(Boolean).join(" · ") || null;

  return (
    <InterviewSetupLayout
      supportingText="Engineering Manager · Interview setup"
      aside={
        <>
          <InterviewSetupAsideCard title="Interview preview">
            <h2 className="mt-3 text-xl font-medium tracking-[-0.02em] text-brand-text">
              {roundContext.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              {roundContext.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {roundContext.focusAreas.map((focus) => (
                <span
                  key={focus}
                  className="rounded-full border border-white/[0.1] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-muted"
                >
                  {focus}
                </span>
              ))}
            </div>
          </InterviewSetupAsideCard>

          <InterviewSetupAsideCard title="Session shape">
            <ol className="mt-4 space-y-3 text-sm text-brand-muted">
              {[
                "Role-context calibration on what you own today",
                "Decision-making and leadership deep dive",
                "Outcome, prioritization, and stakeholder follow-ups",
                "Role fit, then your questions for the manager",
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="font-mono text-[11px] leading-5 text-brand-subtle">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-5">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 border-t border-white/[0.08] pt-4">
              <p className={LABEL}>Selected setup</p>
              <p className="mt-2 text-sm font-medium text-brand-text">
                {[trimOrNull(roleTitle), trimOrNull(company)].filter(Boolean).join(" · ") ||
                  "General engineering leadership round"}
              </p>
              <p className="mt-2 text-sm text-brand-muted">
                {selectedFocusLabels.length > 0
                  ? selectedFocusLabels.join(", ")
                  : "Choose at least one focus area to continue."}
              </p>
              <p className={cn(LABEL, "mt-4")}>Value lens</p>
              <p className="mt-1 text-sm font-medium text-brand-text">
                {selectedFramework.label}
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                {selectedCompetencyLabels.length > 0
                  ? selectedCompetencyLabels.join(", ")
                  : "Pick at least one competency to continue."}
              </p>
            </div>
          </InterviewSetupAsideCard>

          <InterviewSetupAsideCard
            title="What this round optimizes for"
            icon={<BriefcaseBusiness className="h-3.5 w-3.5" />}
          >
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              This is the go/no-go conversation with the manager who would own your work. Strong
              rounds sound specific and calm: name your own contribution, why the call was hard,
              the number that moved, and what you would do differently. Technical questions here
              test judgment, not implementation.
            </p>
          </InterviewSetupAsideCard>
        </>
      }
    >
      <header>
        <Eyebrow className="mb-4">
          {[
            "Live",
            `${ENGINEERING_MANAGER_DURATION_MINUTES} min`,
            "Voice chat",
            "Leadership",
            contextLabel,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Eyebrow>
        <h1 className="text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
          Engineering Manager Setup
        </h1>
        <p className={cn(LEAD, "mt-4 max-w-3xl")}>
          Build the voice-first hiring-manager round around the company, role, and value lens
          you want to be graded against. This full-length flow skips coding and focuses on role
          fit, prioritization, stakeholder judgment, and concrete examples from your own work,
          then closes with your questions for the manager.
        </p>
        {loopPlan ? (
          <p className="mt-4 text-sm text-brand-muted">
            Prefilled from your{" "}
            <Link href={`/prep-guru/${loopPlan.id}`} className="text-brand-cyan hover:underline">
              {loopPlan.label}
            </Link>{" "}
            loop. Change anything before you start.
          </p>
        ) : null}
      </header>

      <div className="mt-10 grid gap-6">
        <InterviewSetupSection title="Role context" icon={<Building2 className="h-3.5 w-3.5" />}>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Company</label>
              <Input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Meta, Google, Stripe..."
                className="mt-2"
              />
            </div>
            <div>
              <label className={LABEL}>Role Title</label>
              <Input
                value={roleTitle}
                onChange={(event) => setRoleTitle(event.target.value)}
                placeholder="Senior Backend Engineer"
                className="mt-2"
              />
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted">
            These are optional, but they help the round feel more like a real role-fit or
            hiring-manager conversation.
          </p>

          <div className="mt-8 border-t border-white/[0.08] pt-6">
            <p className={LABEL}>What you lead today</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              A hiring manager calibrates on this in the first two minutes. It decides
              whether team health and performance questions are on the table at all.
            </p>
            <div
              role="radiogroup"
              aria-label="Reporting scope"
              className={cn(GRID, "mt-4 sm:grid-cols-3")}
            >
              {ENGINEERING_MANAGER_REPORTING_SCOPES.map((scope) => {
                const selected = reportingScope === scope.value;

                return (
                  <div key={scope.value} className={CELL}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setReportingScope(scope.value)}
                      className={cn(OPTION_CELL, selected ? OPTION_SELECTED : OPTION_IDLE)}
                    >
                      <span className="min-w-0">
                        <span className="block text-[15px] font-medium tracking-[-0.01em]">
                          {scope.label}
                        </span>
                        <span className="mt-1.5 block text-[13px] leading-relaxed text-brand-muted">
                          {scope.description}
                        </span>
                      </span>
                      {selected ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-cyan" />
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </InterviewSetupSection>

        <InterviewSetupSection
          title="Interview focus"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          description="Pick the leadership signals you want the interviewer to probe. You can choose multiple."
        >
          <div className={cn(GRID, "mt-4 sm:grid-cols-2")}>
            {ENGINEERING_MANAGER_FOCUS_OPTIONS.map((option) => {
              const selected = focusAreas.includes(option.value);

              return (
                <div key={option.value} className={CELL}>
                  <button
                    type="button"
                    onClick={() => toggleFocusArea(option.value)}
                    aria-pressed={selected}
                    className={cn(OPTION_CELL, selected ? OPTION_SELECTED : OPTION_IDLE)}
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium tracking-[-0.01em]">
                        {option.label}
                      </span>
                      <span className="mt-1.5 block text-[13px] leading-relaxed text-brand-muted">
                        {option.description}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border",
                        selected
                          ? "border-brand-cyan bg-brand-cyan text-brand-deep"
                          : "border-white/[0.18]"
                      )}
                    >
                      {selected ? <Check className="h-3 w-3" /> : null}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </InterviewSetupSection>

        <ValueLensPicker
          frameworkId={valueFrameworkId}
          competencyIds={valueCompetencyIds}
          onFrameworkChange={handleFrameworkChange}
          onCompetencyToggle={toggleValueCompetency}
          description="Choose the value system the hiring manager grades you against. It shapes the leadership questions asked live and the competency report you get afterwards."
        />

        <MicrophoneSetupCheck />
      </div>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-white/[0.08] pt-6">
        <Button size="lg" onClick={() => void handleStartInterview()} disabled={isDisabled}>
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
        <Button asChild size="lg" variant="secondary">
          <Link href="/prep-guru">Ask Prep Guru</Link>
        </Button>
      </div>

      {!hasRequiredSelections && !isCreating ? (
        <p className="mt-4 text-sm text-brand-muted">
          Pick at least one focus area and one value competency to start the round.
        </p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-brand-rose">{error}</p> : null}
    </InterviewSetupLayout>
  );
}
