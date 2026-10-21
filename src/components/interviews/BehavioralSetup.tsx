"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  Loader2,
  NotebookPen,
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
import { MicrophoneSetupCheck } from "@/components/interviews/MicrophoneSetupCheck";
import { ValueLensPicker } from "@/components/interviews/setup/ValueLensPicker";
import { useApplyPrepPlanRound } from "@/hooks/usePrepPlans";
import { useInterviewStore } from "@/stores/interview-store";
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
  resolveLoopValueLens,
  type ValueFrameworkId,
} from "@/lib/interview-values";
import { cn } from "@/lib/utils";

type StartResponse = {
  data?: {
    interviewId?: string;
    isFreeInterview?: boolean;
    startedAt?: string;
  };
};

type BehavioralSetupProps = {
  initialCompany?: string | null;
  initialRoleTitle?: string | null;
  /** Prep Guru loop this round was opened from; its choices prefill the page. */
  planId?: string | null;
};

const STRONG_ANSWER_INGREDIENTS = [
  "One specific situation, with a date range and a scope",
  "What you personally did, not what the team did",
  "The tradeoff you made and the option you rejected",
  "A measured result, and how it was measured",
  "What you would do differently with hindsight",
];

/** Option cell inside a hairline grid; selected cells get the cyan ring and tint. */
const OPTION_CELL =
  "flex h-full w-full items-start justify-between gap-3 px-5 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan disabled:cursor-not-allowed disabled:opacity-40";

function trimOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function BehavioralSetup({
  initialCompany = null,
  initialRoleTitle = null,
  planId = null,
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
  const [isCreating, setIsCreating] = useState(false);
  const loopPlan = useApplyPrepPlanRound(planId, "behavioral", (plan, track) => {
    const lens = resolveLoopValueLens(
      track?.setup?.valueFrameworkId,
      track?.setup?.valueCompetencyIds,
      plan.company
    );
    const scenarios = BEHAVIORAL_SCENARIO_OPTIONS.map((option) => option.value).filter(
      (value) => track?.setup?.scenarioFocus.includes(value)
    );

    setCompany(plan.company);
    setRoleTitle(plan.role);
    setValueFrameworkId(lens.frameworkId);
    setValueCompetencyIds(lens.competencyIds);
    if (scenarios.length > 0) setScenarioFocus(scenarios.slice(0, MAX_BEHAVIORAL_SCENARIOS));
  });
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
          company: trimmedCompany,
          roleTitle: trimmedRoleTitle,
          generatedLoopRoundSnapshot: roundContext,
          fromPlanId: planId,
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

  const contextLabel =
    [trimOrNull(company), trimOrNull(roleTitle)].filter(Boolean).join(" · ") || null;

  return (
    <InterviewSetupLayout
      supportingText="Behavioral · Interview setup"
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
                "Short calibration on your current scope",
                "Four to six \u201ctell me about a time\u201d questions",
                "Follow-ups on your role, the metric, and the hindsight",
                "Wrap-up with one strength and one realistic gap",
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
                  : "No scenario context selected. The interviewer will pick the situations."}
              </p>
            </div>
          </InterviewSetupAsideCard>

          <InterviewSetupAsideCard
            title="What strong answers contain"
            icon={<NotebookPen className="h-3.5 w-3.5" />}
          >
            <ul className="mt-4 divide-y divide-white/[0.08]">
              {STRONG_ANSWER_INGREDIENTS.map((ingredient) => (
                <li
                  key={ingredient}
                  className="py-2.5 text-sm leading-relaxed text-brand-muted first:pt-0 last:pb-0"
                >
                  {ingredient}
                </li>
              ))}
            </ul>
          </InterviewSetupAsideCard>
        </>
      }
    >
      <header>
        <Eyebrow className="mb-4">
          {["Live", `${BEHAVIORAL_DURATION_MINUTES} min`, "Voice chat", "No coding", contextLabel]
            .filter(Boolean)
            .join(" · ")}
        </Eyebrow>
        <h1 className="text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
          Behavioral Setup
        </h1>
        <p className={cn(LEAD, "mt-4 max-w-3xl")}>
          Build a voice-first behavioural round around the value system you will actually be
          graded against. The interviewer asks one competency at a time, expects STAR-shaped
          stories from your real work, and keeps following up until your own contribution, the
          hard part, the result, and your hindsight are clear.
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
                placeholder="Amazon, Google, Stripe..."
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
          <div className={cn(GRID, "mt-4 sm:grid-cols-2")}>
            {BEHAVIORAL_SCENARIO_OPTIONS.map((option) => {
              const selected = scenarioFocus.includes(option.value);
              const disabled = !selected && scenarioFocus.length >= MAX_BEHAVIORAL_SCENARIOS;

              return (
                <div key={option.value} className={CELL}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    disabled={disabled}
                    onClick={() => toggleScenario(option.value)}
                    className={cn(
                      OPTION_CELL,
                      selected
                        ? "bg-brand-cyan/[0.06] text-brand-text ring-1 ring-inset ring-brand-cyan/40"
                        : "text-brand-muted hover:bg-white/[0.03] hover:text-brand-text"
                    )}
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
              Start Behavioral Round
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/prep-guru">Ask Prep Guru</Link>
        </Button>
      </div>

      {error ? <p className="mt-4 text-sm text-brand-rose">{error}</p> : null}
    </InterviewSetupLayout>
  );
}
