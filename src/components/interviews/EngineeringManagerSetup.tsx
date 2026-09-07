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
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InterviewSetupAsideCard,
  InterviewSetupHero,
  InterviewSetupLayout,
  InterviewSetupSection,
} from "@/components/interviews/InterviewSetupLayout";
import { useInterviewStore } from "@/stores/interview-store";
import {
  DEFAULT_INTERVIEWER_PERSONA,
  INTERVIEWER_PERSONAS,
  getInterviewerPersona,
  type InterviewerPersonaId,
} from "@/lib/interviewer-personas";
import {
  DEFAULT_ENGINEERING_MANAGER_FOCUS_AREAS,
  DEFAULT_ENGINEERING_MANAGER_REPORTING_SCOPE,
  ENGINEERING_MANAGER_DURATION_MINUTES,
  ENGINEERING_MANAGER_FOCUS_OPTIONS,
  ENGINEERING_MANAGER_REPORTING_SCOPES,
  buildEngineeringManagerRoundContext,
  getEngineeringManagerFocusLabels,
  type EngineeringManagerReportingScopeId,
} from "@/lib/engineering-manager";
import {
  DEFAULT_VALUE_FRAMEWORK_ID,
  MAX_VALUE_COMPETENCIES,
  MIN_VALUE_COMPETENCIES,
  getValueFramework,
  type ValueFrameworkId,
} from "@/lib/interview-values";
import { ValueLensPicker } from "@/components/interviews/setup/ValueLensPicker";
import { cn } from "@/lib/utils";
import { MicrophoneSetupCheck } from "@/components/interviews/MicrophoneSetupCheck";

type StartResponse = {
  data?: {
    interviewId?: string;
    isFreeInterview?: boolean;
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
  const [reportingScope, setReportingScope] = useState<EngineeringManagerReportingScopeId>(
    DEFAULT_ENGINEERING_MANAGER_REPORTING_SCOPE
  );
  const [valueFrameworkId, setValueFrameworkId] = useState<ValueFrameworkId>(
    DEFAULT_VALUE_FRAMEWORK_ID
  );
  const [valueCompetencyIds, setValueCompetencyIds] = useState<string[]>(() => [
    ...getValueFramework(DEFAULT_VALUE_FRAMEWORK_ID).defaultCompetencyIds,
  ]);
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
        reportingScope,
        valueFrameworkId,
        valueCompetencyIds,
      }),
    [company, focusAreas, reportingScope, roleTitle, valueCompetencyIds, valueFrameworkId]
  );
  const selectedPersona = getInterviewerPersona(interviewerPersona);
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
        isFreeInterview: payload.data?.isFreeInterview ?? false,
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
    <InterviewSetupLayout
      supportingText="Engineering Manager · Interview setup"
      aside={
        <>
          <InterviewSetupAsideCard title="Interview preview">
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
          </InterviewSetupAsideCard>

          <InterviewSetupAsideCard title="Session shape">
            <div className="mt-4 space-y-3 text-sm text-brand-muted">
              <p>1. Role-context calibration on what you own today</p>
              <p>2. Decision-making and leadership deep dive</p>
              <p>3. Outcome, prioritization, and stakeholder follow-ups</p>
              <p>4. Role fit, then your questions for the manager</p>
            </div>
            <div className="mt-5 rounded-2xl border border-brand-border bg-brand-surface p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">
                Selected setup
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
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-brand-muted">
                Value lens
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-text">
                {selectedFramework.label}
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                {selectedCompetencyLabels.length > 0
                  ? selectedCompetencyLabels.join(", ")
                  : "Pick at least one competency to continue."}
              </p>
              <p className="mt-3 text-xs text-brand-muted">
                Interviewer: {selectedPersona.name}
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
      <InterviewSetupHero
        title="Engineering Manager Setup"
        description="Build the voice-first hiring-manager round around the company, role, and value lens you want to be graded against. This full-length flow skips coding and focuses on role fit, prioritization, stakeholder judgment, and concrete examples from your own work — then closes with your questions for the manager."
        metadata={[`${ENGINEERING_MANAGER_DURATION_MINUTES} min`, "Voice chat", "Leadership"]}
        contextLabel={
          [trimOrNull(company), trimOrNull(roleTitle)].filter(Boolean).join(" · ") || null
        }
      />

      <div className="mt-8 grid gap-6">
              <InterviewSetupSection title="Role context" icon={<Building2 className="h-3.5 w-3.5" />}>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
                      Company
                    </label>
                    <Input
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      placeholder="Meta, Google, Stripe..."
                      className="mt-2 h-11 rounded-2xl bg-brand-card px-4"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
                      Role Title
                    </label>
                    <Input
                      value={roleTitle}
                      onChange={(event) => setRoleTitle(event.target.value)}
                      placeholder="Senior Backend Engineer"
                      className="mt-2 h-11 rounded-2xl bg-brand-card px-4"
                    />
                  </div>
                </div>
                <p className="mt-3 text-sm text-brand-muted">
                  These are optional, but they help the round feel more like a real role-fit or
                  hiring-manager conversation.
                </p>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
                    What you lead today
                  </p>
                  <p className="mt-2 text-sm text-brand-muted">
                    A hiring manager calibrates on this in the first two minutes. It decides
                    whether team health and performance questions are on the table at all.
                  </p>
                  <div
                    role="radiogroup"
                    aria-label="Reporting scope"
                    className="mt-4 grid gap-3 sm:grid-cols-3"
                  >
                    {ENGINEERING_MANAGER_REPORTING_SCOPES.map((scope) => {
                      const selected = reportingScope === scope.value;

                      return (
                        <Button
                          key={scope.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setReportingScope(scope.value)}
                          variant="outline"
                          className={cn(
                            "h-auto w-full flex-col items-start whitespace-normal rounded-2xl px-4 py-4 text-left",
                            selected
                              ? "border-brand-cyan bg-brand-cyan/10 text-brand-text hover:bg-brand-cyan/10"
                              : "border-brand-border bg-brand-card text-brand-muted hover:border-brand-cyan/30 hover:text-brand-text"
                          )}
                        >
                          <p className="text-sm font-semibold">{scope.label}</p>
                          <p className="mt-2 text-xs leading-relaxed">{scope.description}</p>
                        </Button>
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
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {ENGINEERING_MANAGER_FOCUS_OPTIONS.map((option) => {
                    const selected = focusAreas.includes(option.value);

                    return (
                      <Button
                        key={option.value}
                        type="button"
                        onClick={() => toggleFocusArea(option.value)}
                        variant="outline"
                        className={cn(
                          "h-auto w-full items-start justify-between whitespace-normal rounded-2xl px-4 py-4 text-left",
                          selected
                            ? "border-brand-cyan bg-brand-cyan/10 text-brand-text hover:bg-brand-cyan/10"
                            : "border-brand-border bg-brand-card text-brand-muted hover:border-brand-cyan/30 hover:text-brand-text"
                        )}
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
                      </Button>
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

              <InterviewSetupSection title="Interview persona" icon={<MessageSquareText className="h-3.5 w-3.5" />}>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {INTERVIEWER_PERSONAS.map((persona) => {
                    const selected = interviewerPersona === persona.id;

                    return (
                      <Button
                        key={persona.id}
                        type="button"
                        onClick={() => setInterviewerPersona(persona.id)}
                        variant="outline"
                        className={cn(
                          "h-auto w-full flex-col items-start whitespace-normal rounded-2xl px-4 py-4 text-left",
                          selected
                            ? "border-brand-cyan bg-brand-cyan/10 text-brand-text hover:bg-brand-cyan/10"
                            : "border-brand-border bg-brand-card text-brand-muted hover:border-brand-cyan/30 hover:text-brand-text"
                        )}
                      >
                        <p className="text-sm font-semibold">{persona.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-brand-muted">
                          {persona.companyLabel}
                        </p>
                        <p className="mt-3 text-xs leading-relaxed">
                          {persona.shortStyleSummary}
                        </p>
                      </Button>
                    );
                  })}
                </div>
              </InterviewSetupSection>
              <MicrophoneSetupCheck />
      </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-brand-border pt-6">
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
