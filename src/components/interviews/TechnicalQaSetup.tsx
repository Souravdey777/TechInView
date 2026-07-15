"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  Loader2,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  TECHNICAL_QA_DURATION_MINUTES,
  TECHNICAL_QA_LANGUAGE_OPTIONS,
  buildTechnicalQaRoundContext,
  getFrameworkLabels,
  getTechnicalQaFrameworkOptions,
  getTechnicalQaLanguageLabel,
  type TechnicalQaLanguage,
} from "@/lib/technical-qa";
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

export function TechnicalQaSetup() {
  const router = useRouter();
  const initFromSetup = useInterviewStore((state) => state.initFromSetup);
  const [language, setLanguage] = useState<TechnicalQaLanguage>("javascript");
  const [frameworks, setFrameworks] = useState<string[]>(["react", "nextjs"]);
  const [interviewerPersona, setInterviewerPersona] =
    useState<InterviewerPersonaId>(DEFAULT_INTERVIEWER_PERSONA);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const isDisabled = frameworks.length === 0 || isCreating;

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
    <InterviewSetupLayout
      supportingText="Technical Q&A · Interview setup"
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
              <p>1. Warm intro and stack calibration</p>
              <p>2. Voice-led technical depth questions</p>
              <p>3. Debugging and scenario follow-ups</p>
              <p>4. Tradeoffs, production judgment, and wrap-up</p>
            </div>
            <div className="mt-5 rounded-2xl border border-brand-border bg-brand-surface p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">
                Selected setup
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-text">
                {getTechnicalQaLanguageLabel(language)}
              </p>
              <p className="mt-2 text-sm text-brand-muted">
                {selectedFrameworkLabels.length > 0
                  ? selectedFrameworkLabels.join(", ")
                  : "Choose at least one framework to continue."}
              </p>
              <p className="mt-3 text-xs text-brand-muted">
                Interviewer: {selectedPersona.name}
              </p>
            </div>
          </InterviewSetupAsideCard>
        </>
      }
    >
      <InterviewSetupHero
        title="Technical Q&A Setup"
        description="Build a voice-first technical depth interview around the language and frameworks you actually use. This full-length flow skips coding and focuses on practical stack knowledge, debugging, runtime behavior, and engineering tradeoffs."
        metadata={[`${TECHNICAL_QA_DURATION_MINUTES} min`, "Voice chat", "No coding"]}
      />

      <div className="mt-8 grid gap-6">
              <InterviewSetupSection title="Primary language" icon={<BrainCircuit className="h-3.5 w-3.5" />}>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {TECHNICAL_QA_LANGUAGE_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      onClick={() => handleChangeLanguage(option.value)}
                      variant="outline"
                      className={cn(
                        "h-auto w-full flex-col items-start whitespace-normal rounded-2xl px-4 py-4 text-left",
                        language === option.value
                          ? "border-brand-cyan bg-brand-cyan/10 text-brand-text hover:bg-brand-cyan/10"
                          : "border-brand-border bg-brand-card text-brand-muted hover:border-brand-cyan/30 hover:text-brand-text"
                      )}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="mt-2 text-xs leading-relaxed">
                        Use this as the base stack the interviewer should probe first.
                      </p>
                    </Button>
                  ))}
                </div>
              </InterviewSetupSection>

              <InterviewSetupSection
                title="Frameworks of expertise"
                icon={<Sparkles className="h-3.5 w-3.5" />}
                description="Pick the tools you want the interviewer to go deep on. You can choose multiple."
              >
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {frameworkOptions.map((option) => {
                    const selected = frameworks.includes(option.value);

                    return (
                      <Button
                        key={option.value}
                        type="button"
                        onClick={() => toggleFramework(option.value)}
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
                            Include realistic follow-ups and production tradeoffs.
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
                    Start Technical Q&A
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <Button asChild variant="secondary">
                <Link href="/prep-plans">Use inside a prep plan</Link>
              </Button>
            </div>

            {error ? <p className="mt-4 text-sm text-brand-rose">{error}</p> : null}
    </InterviewSetupLayout>
  );
}
