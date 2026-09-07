"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  Loader2,
  MessageSquareText,
  NotebookPen,
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
import { MicrophoneSetupCheck } from "@/components/interviews/MicrophoneSetupCheck";
import { ValueLensPicker } from "@/components/interviews/setup/ValueLensPicker";
import { useInterviewStore } from "@/stores/interview-store";
import {
  DEFAULT_INTERVIEWER_PERSONA,
  INTERVIEWER_PERSONAS,
  getInterviewerPersona,
  type InterviewerPersonaId,
} from "@/lib/interviewer-personas";
import {
  BEHAVIORAL_DURATION_MINUTES,
  BEHAVIORAL_SCENARIO_OPTIONS,
  DEFAULT_BEHAVIORAL_SCENARIO_FOCUS,
  MAX_BEHAVIORAL_SCENARIOS,
  buildBehavioralRoundContext,
  getBehavioralScenarioLabels,
} from "@/lib/behavioral";
import {
  DEFAULT_VALUE_FRAMEWORK_ID,
  MAX_VALUE_COMPETENCIES,
  getValueCompetencyLabels,
  getValueFramework,
  type ValueFrameworkId,
} from "@/lib/interview-values";
import { cn } from "@/lib/utils";

type StartResponse = {
  data?: {
    interviewId?: string;
    isFreeInterview?: boolean;
    interviewerPersona?: InterviewerPersonaId;
    startedAt?: string;
  };
};

type BehavioralSetupProps = {
  initialCompany?: string | null;
  initialRoleTitle?: string | null;
};

const STRONG_ANSWER_INGREDIENTS = [
  "One specific situation, with a date range and a scope",
  "What you personally did, not what the team did",
  "The tradeoff you made and the option you rejected",
  "A measured result, and how it was measured",
  "What you would do differently with hindsight",
];

function trimOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function BehavioralSetup({
  initialCompany = null,
  initialRoleTitle = null,
}: BehavioralSetupProps) {
  const router = useRouter();
  const initFromSetup = useInterviewStore((state) => state.initFromSetup);
  const [company, setCompany] = useState(initialCompany ?? "");
  const [roleTitle, setRoleTitle] = useState(initialRoleTitle ?? "");
  const [valueFrameworkId, setValueFrameworkId] = useState<ValueFrameworkId>(
    DEFAULT_VALUE_FRAMEWORK_ID
  );
  const [valueCompetencyIds, setValueCompetencyIds] = useState<string[]>(
    getValueFramework(DEFAULT_VALUE_FRAMEWORK_ID).defaultCompetencyIds
  );
  const [scenarioFocus, setScenarioFocus] = useState<string[]>(
    DEFAULT_BEHAVIORAL_SCENARIO_FOCUS
  );
  const [interviewerPersona, setInterviewerPersona] =
    useState<InterviewerPersonaId>(DEFAULT_INTERVIEWER_PERSONA);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roundContext = useMemo(
    () =>
      buildBehavioralRoundContext({
        company,
        roleTitle,
        valueFrameworkId,
        valueCompetencyIds,
        scenarioFocus,
      }),
    [company, roleTitle, scenarioFocus, valueCompetencyIds, valueFrameworkId]
  );
  const selectedPersona = getInterviewerPersona(interviewerPersona);
  const selectedCompetencyLabels = useMemo(
    () => getValueCompetencyLabels(valueFrameworkId, valueCompetencyIds),
    [valueCompetencyIds, valueFrameworkId]
  );
  const selectedScenarioLabels = useMemo(
    () => getBehavioralScenarioLabels(scenarioFocus),
    [scenarioFocus]
  );
  const isDisabled = valueCompetencyIds.length === 0 || isCreating;

  // Competency ids are framework-scoped, so a framework switch has to reset the
  // selection to that framework's defaults rather than keep stale ids around.
  const handleFrameworkChange = useCallback((nextFrameworkId: ValueFrameworkId) => {
    setValueFrameworkId(nextFrameworkId);
    setValueCompetencyIds(
      getValueFramework(nextFrameworkId).defaultCompetencyIds.slice(
        0,
        MAX_VALUE_COMPETENCIES
      )
    );
  }, []);

  const handleCompetencyToggle = useCallback((competencyId: string) => {
    setValueCompetencyIds((current) => {
      if (current.includes(competencyId)) {
        return current.filter((item) => item !== competencyId);
      }

      if (current.length >= MAX_VALUE_COMPETENCIES) {
        return current;
      }

      return [...current, competencyId];
    });
  }, []);

  function toggleScenario(value: string) {
    setScenarioFocus((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }

      if (current.length >= MAX_BEHAVIORAL_SCENARIOS) {
        return current;
      }

      return [...current, value];
    });
  }

  async function handleStartInterview() {
    if (valueCompetencyIds.length === 0 || isCreating) return;

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
          roundType: "behavioral",
          language: "javascript",
          maxDurationSeconds: BEHAVIORAL_DURATION_MINUTES * 60,
          interviewerPersona,
          company: trimmedCompany,
          roleTitle: trimmedRoleTitle,
          generatedLoopRoundSnapshot: roundContext,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to start behavioral interview");
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
        roundType: "behavioral",
        problem: null,
        roundContext,
        language: "javascript",
        maxDurationSeconds: BEHAVIORAL_DURATION_MINUTES * 60,
        difficulty: "medium",
        category: null,
        interviewerPersona: payload.data?.interviewerPersona ?? interviewerPersona,
        company: trimmedCompany,
        roleTitle: trimmedRoleTitle,
        startedAt: payload.data?.startedAt ?? new Date().toISOString(),
      });

      router.push(`/interviews/behavioral/${interviewId}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to start behavioral interview"
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <InterviewSetupLayout
      supportingText="Behavioral · Interview setup"
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
              <p>1. Short calibration on your current scope</p>
              <p>2. Four to six &ldquo;tell me about a time&rdquo; questions</p>
              <p>3. Follow-ups on your role, the metric, and the hindsight</p>
              <p>4. Wrap-up with one strength and one realistic gap</p>
            </div>
            <div className="mt-5 rounded-2xl border border-brand-border bg-brand-surface p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">
                Selected setup
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-text">
                {[trimOrNull(roleTitle), trimOrNull(company)].filter(Boolean).join(" · ") ||
                  "General behavioural round"}
              </p>
              <p className="mt-2 text-sm text-brand-muted">
                {selectedCompetencyLabels.length > 0
                  ? selectedCompetencyLabels.join(", ")
                  : "Choose at least one competency to continue."}
              </p>
              <p className="mt-2 text-sm text-brand-muted">
                {selectedScenarioLabels.length > 0
                  ? selectedScenarioLabels.join(", ")
                  : "No scenario context selected — the interviewer will pick the situations."}
              </p>
              <p className="mt-3 text-xs text-brand-muted">
                Interviewer: {selectedPersona.name}
              </p>
            </div>
          </InterviewSetupAsideCard>

          <InterviewSetupAsideCard
            title="What strong answers contain"
            icon={<NotebookPen className="h-3.5 w-3.5" />}
          >
            <ul className="mt-4 space-y-3">
              {STRONG_ANSWER_INGREDIENTS.map((ingredient) => (
                <li
                  key={ingredient}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm leading-relaxed text-brand-muted"
                >
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </InterviewSetupAsideCard>
        </>
      }
    >
      <InterviewSetupHero
        title="Behavioral Setup"
        description="Build a voice-first behavioural round around the value system you will actually be graded against. The interviewer asks one competency at a time, expects STAR-shaped stories from your real work, and keeps following up until your own contribution, the hard part, the result, and your hindsight are clear."
        metadata={[`${BEHAVIORAL_DURATION_MINUTES} min`, "Voice chat", "No coding"]}
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
                placeholder="Amazon, Google, Stripe..."
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
            Both are optional. They let the interviewer pitch questions at the right level and
            pull company-specific behavioural prompts when we have reviewed ones.
          </p>
        </InterviewSetupSection>

        <ValueLensPicker
          frameworkId={valueFrameworkId}
          competencyIds={valueCompetencyIds}
          onFrameworkChange={handleFrameworkChange}
          onCompetencyToggle={handleCompetencyToggle}
          description="Behavioural rounds are graded against a value system. Pick the one your target company actually uses, then the competencies you want probed live."
        />

        <InterviewSetupSection
          title="Story context"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          description={`Which part of your history do you want to rehearse? The interviewer pulls stories from these when they fit the competency being probed. Up to ${MAX_BEHAVIORAL_SCENARIOS}.`}
        >
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {BEHAVIORAL_SCENARIO_OPTIONS.map((option) => {
              const selected = scenarioFocus.includes(option.value);
              const disabled = !selected && scenarioFocus.length >= MAX_BEHAVIORAL_SCENARIOS;

              return (
                <Button
                  key={option.value}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => toggleScenario(option.value)}
                  variant="outline"
                  className={cn(
                    "h-auto w-full items-start justify-between gap-3 whitespace-normal rounded-2xl px-4 py-4 text-left",
                    selected
                      ? "border-brand-cyan bg-brand-cyan/10 text-brand-text hover:bg-brand-cyan/10"
                      : "border-brand-border bg-brand-card text-brand-muted hover:border-brand-cyan/30 hover:text-brand-text",
                    disabled && "cursor-not-allowed opacity-40"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="mt-2 block text-xs leading-relaxed">
                      {option.description}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-brand-cyan bg-brand-cyan text-brand-deep"
                        : "border-brand-border bg-brand-surface"
                    )}
                  >
                    {selected ? <Check className="h-3 w-3" /> : null}
                  </span>
                </Button>
              );
            })}
          </div>
        </InterviewSetupSection>

        <InterviewSetupSection
          title="Interview persona"
          icon={<MessageSquareText className="h-3.5 w-3.5" />}
        >
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
                  <p className="mt-3 text-xs leading-relaxed">{persona.shortStyleSummary}</p>
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
              Start Behavioral Round
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <Button asChild variant="secondary">
          <Link href="/prep-guru">Ask Prep Guru</Link>
        </Button>
      </div>

      {error ? <p className="mt-4 text-sm text-brand-rose">{error}</p> : null}
    </InterviewSetupLayout>
  );
}
