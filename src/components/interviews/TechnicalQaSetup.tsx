"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHIP, Eyebrow, FOCUS, LEAD } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";
import { SetupPageHeader } from "@/components/interviews/SetupPageHeader";
import {
  SetupMonoLabel,
  SetupRack,
} from "@/components/interviews/setup/SetupRack";
import {
  SetupCheckboxGrid,
  SetupRadioGrid,
} from "@/components/interviews/setup/SetupChoiceGrid";
import { MicrophoneRack } from "@/components/interviews/setup/MicrophoneRack";
import {
  SessionFactsCard,
  SessionStepsCard,
  type SessionFact,
} from "@/components/interviews/setup/SessionSummaryCards";
import { useInterviewStore } from "@/stores/interview-store";
import { useApplyPrepPlanRound } from "@/hooks/usePrepPlans";
import { useSupabase } from "@/hooks/useSupabase";
import { ROUND_SCORING_DIMENSIONS } from "@/lib/constants";
import { INTERVIEWER } from "@/lib/interviewer";
import {
  TECHNICAL_QA_DURATION_MINUTES,
  TECHNICAL_QA_LANGUAGE_OPTIONS,
  buildTechnicalQaRoundContext,
  getFrameworkLabels,
  getTechnicalQaFrameworkOptions,
  getTechnicalQaLanguageLabel,
  getTechnicalQaLanguageShortLabel,
  type TechnicalQaLanguage,
} from "@/lib/technical-qa";

const SESSION_STEPS = [
  "Warm intro and one calibration question about your hands-on experience.",
  "Voice-led depth questions on the language and frameworks you picked.",
  "Debugging and production-incident scenarios, one at a time.",
  "Tradeoffs, rollout judgment, and a wrap-up before scoring.",
] as const;

type StartResponse = {
  data?: {
    interviewId?: string;
    isFreeInterview?: boolean;
    startedAt?: string;
  };
};

/** Grid value for "no frameworks, core language only"; never sent as a framework. */
const BASICS_ONLY = "__basics";

type TechnicalQaSetupProps = {
  /** Prep Guru loop this round was opened from; its stack prefills the page. */
  planId?: string | null;
};

export function TechnicalQaSetup({ planId = null }: TechnicalQaSetupProps) {
  const router = useRouter();
  const initFromSetup = useInterviewStore((state) => state.initFromSetup);
  const { supabase, user } = useSupabase();
  const [language, setLanguage] = useState<TechnicalQaLanguage>("javascript");
  const [frameworks, setFrameworks] = useState<string[]>(["react", "nextjs"]);
  const [basicsOnly, setBasicsOnly] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loopPlan = useApplyPrepPlanRound(planId, "technical_qa", (_plan, track) => {
    const loopLanguage = TECHNICAL_QA_LANGUAGE_OPTIONS.find(
      (option) => option.value === track?.setup?.technicalQaLanguage
    )?.value;
    if (!loopLanguage) return;

    // Framework ids are a union across languages; keep the ones this language offers.
    const loopFrameworks = getTechnicalQaFrameworkOptions(loopLanguage)
      .map((option) => option.value as string)
      .filter((value) => track?.setup?.technicalQaFrameworks?.includes(value));

    setLanguage(loopLanguage);
    setFrameworks(loopFrameworks);
    setBasicsOnly(loopFrameworks.length === 0);
  });

  useEffect(() => {
    if (!user) return;

    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("interview_credits")
        .eq("id", user.id)
        .single();

      if (!data) return;

      setCredits(data.interview_credits ?? 0);
    })();
  }, [supabase, user]);

  const frameworkOptions = useMemo(
    () => getTechnicalQaFrameworkOptions(language),
    [language]
  );
  const selectedFrameworkLabels = useMemo(
    () => getFrameworkLabels(language, frameworks),
    [language, frameworks]
  );
  const roundContext = useMemo(
    () => buildTechnicalQaRoundContext({ language, frameworks }),
    [language, frameworks]
  );
  const scoringDimensionCount = Object.keys(ROUND_SCORING_DIMENSIONS).length;
  const hasFrameworks = frameworks.length > 0;
  const hasStack = basicsOnly || hasFrameworks;
  const isLocked = credits === 0;
  const isDisabled = !hasStack || isCreating;

  const sessionFacts: SessionFact[] = [
    { label: "Duration", value: `${TECHNICAL_QA_DURATION_MINUTES} min` },
    { label: "Stack", value: getTechnicalQaLanguageShortLabel(language) },
    {
      label: "Frameworks",
      value: basicsOnly ? "Basics only" : hasFrameworks ? `${frameworks.length} selected` : "None yet",
    },
    { label: "Scored on", value: `${scoringDimensionCount} dimensions` },
    {
      label: "Cost",
      value: isLocked
        ? "Interview pack needed"
        : credits === null
          ? "1 interview credit"
          : `1 of ${credits} credit${credits === 1 ? "" : "s"}`,
      emphasis: true,
    },
  ];

  // "Basics only" and specific frameworks are mutually exclusive.
  function toggleFramework(frameworkValue: string) {
    if (frameworkValue === BASICS_ONLY) {
      setBasicsOnly((current) => !current);
      setFrameworks([]);
      return;
    }

    setBasicsOnly(false);
    setFrameworks((current) =>
      current.includes(frameworkValue)
        ? current.filter((item) => item !== frameworkValue)
        : [...current, frameworkValue]
    );
  }

  function handleChangeLanguage(nextLanguage: TechnicalQaLanguage) {
    setLanguage(nextLanguage);
    const nextOptions = new Set<string>(
      getTechnicalQaFrameworkOptions(nextLanguage).map((option) => option.value)
    );
    setFrameworks((current) => current.filter((item) => nextOptions.has(item)));
  }

  async function handleStartInterview() {
    if (!hasStack || isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "targeted_loop",
          roundType: "technical_qa",
          language,
          maxDurationSeconds: TECHNICAL_QA_DURATION_MINUTES * 60,
          generatedLoopRoundSnapshot: roundContext,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to start Technical Q&A interview");
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
        roundType: "technical_qa",
        problem: null,
        roundContext,
        language,
        maxDurationSeconds: TECHNICAL_QA_DURATION_MINUTES * 60,
        difficulty: "medium",
        category: null,
        startedAt: payload.data?.startedAt ?? new Date().toISOString(),
      });

      router.push(`/interviews/technical-qa/${interviewId}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to start Technical Q&A interview"
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-deep text-brand-text">
      <SetupPageHeader
        containerClassName="max-w-6xl"
        supportingText="Technical Q&A · Interview setup"
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="min-w-0">
            <Eyebrow className="mb-4">New session</Eyebrow>
            <h1 className="text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
              Set up the room.
            </h1>
          </div>
          <p className={cn(LEAD, "lg:max-w-md")}>
            Technical Q&amp;A is voice-only: no editor, no coding. Pick the stack
            you actually work in and the interviewer probes internals, debugging,
            and production tradeoffs for {TECHNICAL_QA_DURATION_MINUTES} minutes,
            then scores you on {scoringDimensionCount} dimensions.
          </p>
        </header>
        {loopPlan ? (
          <p className="mt-4 text-sm text-brand-muted">
            Prefilled from your{" "}
            <Link href={`/prep-guru/${loopPlan.id}`} className="text-brand-cyan hover:underline">
              {loopPlan.label}
            </Link>{" "}
            loop. Change anything before you start.
          </p>
        ) : null}

        {isLocked && (
          <div className="mt-8 flex items-start gap-3 rounded-[20px] border border-brand-rose/30 bg-brand-rose/[0.04] px-5 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-rose" />
            <div>
              <p className="text-sm font-medium text-brand-text">
                Technical Q&amp;A needs an interview credit
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-brand-muted">
                This round runs the full {TECHNICAL_QA_DURATION_MINUTES} minutes
                with voice and scoring.{" "}
                <Link href="/settings#rounds" className={cn("text-brand-cyan transition-colors hover:text-brand-text", FOCUS)}>
                  Buy an interview pack
                </Link>{" "}
                to start one.
              </p>
            </div>
          </div>
        )}

        <div className="mt-10 grid gap-5 lg:grid-cols-12 lg:items-start">
          {/* ─── Configuration racks ─── */}
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
            <SetupRack index="01" label="Stack" note="Voice only · no coding">
              <SetupRadioGrid<TechnicalQaLanguage>
                label="Primary language"
                ariaLabel="Primary language"
                value={language}
                onChange={handleChangeLanguage}
                options={TECHNICAL_QA_LANGUAGE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                  caption: option.hint,
                }))}
              />

              <SetupCheckboxGrid
                className="mt-5 border-t border-white/[0.08] pt-5"
                label="Frameworks of expertise"
                note={
                  basicsOnly
                    ? "Language basics only"
                    : hasFrameworks
                      ? `${frameworks.length} selected`
                      : "Pick one, or basics only"
                }
                ariaLabel="Frameworks of expertise"
                values={basicsOnly ? [BASICS_ONLY] : frameworks}
                onToggle={toggleFramework}
                options={[
                  {
                    value: BASICS_ONLY,
                    label: "Language basics only",
                    caption: `Core ${getTechnicalQaLanguageShortLabel(language)} only, no frameworks.`,
                  },
                  ...frameworkOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  })),
                ]}
              />

              <div className="mt-5 rounded-[16px] border border-white/[0.08] px-4 py-3">
                <SetupMonoLabel>
                  Round brief ·{" "}
                  {selectedFrameworkLabels.length > 0
                    ? selectedFrameworkLabels.join(" · ")
                    : getTechnicalQaLanguageLabel(language)}
                </SetupMonoLabel>
                <p className="mt-2 text-[13px] leading-relaxed text-brand-muted">
                  {roundContext.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {roundContext.focusAreas.map((focus) => (
                    <span
                      key={focus}
                      className={CHIP}
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              </div>
            </SetupRack>

            <MicrophoneRack index="02" interviewerName={INTERVIEWER.name} />
          </div>

          {/* ─── Summary rail ─── */}
          <div className="lg:col-span-4">
            <div className="flex flex-col gap-5 lg:sticky lg:top-8">
              <SessionFactsCard title="This session" facts={sessionFacts} />

              <SessionStepsCard title="How it runs" steps={SESSION_STEPS} />

              {error ? (
                <div className="flex items-start gap-3 rounded-[16px] border border-brand-rose/30 bg-brand-rose/[0.04] px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" />
                  <p className="text-sm text-brand-rose">{error}</p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                {isLocked ? (
                  <Button asChild size="lg" className="w-full gap-2 text-base">
                    <Link href="/settings#rounds">
                      Get Technical Q&amp;A
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => void handleStartInterview()}
                    disabled={isDisabled}
                    className="w-full gap-2 text-base"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Setting up your interview…
                      </>
                    ) : (
                      <>
                        Start Technical Q&amp;A
                        <ChevronRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                )}

                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="w-full gap-2 text-sm"
                >
                  <Link href="/prep-guru">
                    <MessageSquare className="h-4 w-4" />
                    Ask Prep Guru instead
                  </Link>
                </Button>

                {!hasStack && !isLocked ? (
                  <p className="text-center text-xs text-brand-amber">
                    Pick a framework above, or choose language basics only.
                  </p>
                ) : null}

                <p className="text-center text-xs leading-relaxed text-brand-subtle">
                  By starting, you agree to live microphone processing by our
                  voice provider. TechInView stores transcripts, timing, scores,
                  and results, but not raw microphone audio. See our{" "}
                  <Link href="/privacy" className={cn("text-brand-cyan transition-colors hover:text-brand-text", FOCUS)}>
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
