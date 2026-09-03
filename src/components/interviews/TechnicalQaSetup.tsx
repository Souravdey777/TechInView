"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SetupPageHeader } from "@/components/interviews/SetupPageHeader";
import {
  SetupMonoLabel,
  SetupRack,
} from "@/components/interviews/setup/SetupRack";
import {
  SetupCheckboxGrid,
  SetupRadioGrid,
} from "@/components/interviews/setup/SetupChoiceGrid";
import { InterviewerPersonaPicker } from "@/components/interviews/setup/InterviewerPersonaPicker";
import { MicrophoneRack } from "@/components/interviews/setup/MicrophoneRack";
import {
  InterviewerVoiceCard,
  SessionFactsCard,
  SessionStepsCard,
  type SessionFact,
} from "@/components/interviews/setup/SessionSummaryCards";
import { useInterviewStore } from "@/stores/interview-store";
import { useSupabase } from "@/hooks/useSupabase";
import { ROUND_SCORING_DIMENSIONS } from "@/lib/constants";
import {
  DEFAULT_INTERVIEWER_PERSONA,
  INTERVIEWER_PERSONAS,
  getDefaultInterviewerPersona,
  getInterviewerPersona,
  type InterviewerPersonaId,
} from "@/lib/interviewer-personas";
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
    interviewerPersona?: InterviewerPersonaId;
    startedAt?: string;
  };
};

export function TechnicalQaSetup() {
  const router = useRouter();
  const initFromSetup = useInterviewStore((state) => state.initFromSetup);
  const { supabase, user } = useSupabase();
  const [language, setLanguage] = useState<TechnicalQaLanguage>("javascript");
  const [frameworks, setFrameworks] = useState<string[]>(["react", "nextjs"]);
  const [interviewerPersona, setInterviewerPersona] =
    useState<InterviewerPersonaId>(DEFAULT_INTERVIEWER_PERSONA);
  const [credits, setCredits] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const personaTouchedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("interview_credits, target_company")
        .eq("id", user.id)
        .single();

      if (!data) return;

      setCredits(data.interview_credits ?? 0);
      if (!personaTouchedRef.current) {
        setInterviewerPersona(
          getDefaultInterviewerPersona(data.target_company ?? null, false)
        );
      }
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
  const selectedPersona = getInterviewerPersona(interviewerPersona);
  const scoringDimensionCount = Object.keys(ROUND_SCORING_DIMENSIONS).length;
  const hasFrameworks = frameworks.length > 0;
  const isLocked = credits === 0;
  const isDisabled = !hasFrameworks || isCreating;

  const sessionFacts: SessionFact[] = [
    { label: "Duration", value: `${TECHNICAL_QA_DURATION_MINUTES} min` },
    { label: "Stack", value: getTechnicalQaLanguageShortLabel(language) },
    {
      label: "Frameworks",
      value: hasFrameworks ? `${frameworks.length} selected` : "None yet",
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

  function toggleFramework(frameworkValue: string) {
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
    if (frameworks.length === 0 || isCreating) return;

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
          interviewerPersona,
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
        interviewerPersona: payload.data?.interviewerPersona ?? interviewerPersona,
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
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="min-w-0">
            <SetupMonoLabel>New session</SetupMonoLabel>
            <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
              Set up the room.
            </h1>
          </div>
          <p className="text-sm leading-relaxed text-brand-muted lg:max-w-sm lg:text-right">
            Technical Q&amp;A is voice-only — no editor, no coding. Pick the stack
            you actually work in and the interviewer probes internals, debugging,
            and production tradeoffs for {TECHNICAL_QA_DURATION_MINUTES} minutes,
            then scores you on {scoringDimensionCount} dimensions.
          </p>
        </header>

        {isLocked && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-rose/30 bg-brand-rose/5 px-5 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-rose" />
            <div>
              <p className="text-sm font-semibold text-brand-text">
                Technical Q&amp;A needs an interview credit
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                This round runs the full {TECHNICAL_QA_DURATION_MINUTES} minutes
                with voice and scoring.{" "}
                <Link href="/settings" className="text-brand-cyan hover:underline">
                  Buy an interview pack
                </Link>{" "}
                to start one.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-12 lg:items-start">
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
                className="mt-5 border-t border-brand-border pt-5"
                label="Frameworks of expertise"
                note={
                  hasFrameworks
                    ? `${frameworks.length} selected`
                    : "Pick at least one"
                }
                ariaLabel="Frameworks of expertise"
                values={frameworks}
                onToggle={toggleFramework}
                options={frameworkOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />

              <div className="mt-5 rounded-xl border border-brand-border bg-brand-surface px-4 py-3">
                <SetupMonoLabel>
                  Round brief ·{" "}
                  {selectedFrameworkLabels.length > 0
                    ? selectedFrameworkLabels.join(" · ")
                    : getTechnicalQaLanguageLabel(language)}
                </SetupMonoLabel>
                <p className="mt-2 text-xs leading-relaxed text-brand-muted">
                  {roundContext.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {roundContext.focusAreas.map((focus) => (
                    <span
                      key={focus}
                      className="rounded-full border border-brand-border bg-brand-card px-2.5 py-1 text-[11px] text-brand-muted"
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              </div>
            </SetupRack>

            <SetupRack
              index="02"
              label="Interviewer"
              note="Each has its own voice and scoring emphasis"
            >
              <InterviewerPersonaPicker
                personas={INTERVIEWER_PERSONAS}
                value={interviewerPersona}
                isPersonaLocked={() => false}
                onSelect={(personaId) => {
                  personaTouchedRef.current = true;
                  setInterviewerPersona(personaId);
                }}
              />

              <div className="mt-4 rounded-xl border border-brand-border bg-brand-surface px-4 py-3">
                <SetupMonoLabel>
                  Calibration · {selectedPersona.name} ·{" "}
                  {selectedPersona.companyLabel}
                </SetupMonoLabel>
                <p className="mt-2 text-xs leading-relaxed text-brand-muted">
                  {selectedPersona.calibrationNotes}
                </p>
              </div>
            </SetupRack>

            <MicrophoneRack index="03" interviewerName={selectedPersona.name} />
          </div>

          {/* ─── Summary rail ─── */}
          <div className="lg:col-span-4">
            <div className="flex flex-col gap-5 lg:sticky lg:top-8">
              <InterviewerVoiceCard persona={selectedPersona} />

              <SessionFactsCard title="This session" facts={sessionFacts} />

              <SessionStepsCard title="How it runs" steps={SESSION_STEPS} />

              {error ? (
                <div className="flex items-start gap-3 rounded-lg border border-brand-rose/30 bg-brand-rose/5 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" />
                  <p className="text-sm text-brand-rose">{error}</p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                {isLocked ? (
                  <Button asChild size="lg" className="w-full gap-2 text-base font-semibold">
                    <Link href="/settings">
                      Unlock Technical Q&amp;A
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => void handleStartInterview()}
                    disabled={isDisabled}
                    className="w-full gap-2 text-base font-semibold"
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
                  className="w-full gap-2 text-sm font-medium"
                >
                  <Link href="/prep-guru">
                    <MessageSquare className="h-4 w-4" />
                    Ask Prep Guru instead
                  </Link>
                </Button>

                {!hasFrameworks && !isLocked ? (
                  <p className="text-center text-xs text-brand-amber">
                    Select at least one framework above to continue.
                  </p>
                ) : null}

                <p className="text-center text-xs text-brand-muted">
                  By starting, you agree to live microphone processing by our
                  voice provider. TechInView stores transcripts, timing, scores,
                  and results—not raw microphone audio. See our{" "}
                  <Link href="/privacy" className="text-brand-cyan hover:underline">
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
