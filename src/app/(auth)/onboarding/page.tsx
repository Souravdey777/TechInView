"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/hooks/useSupabase";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { AuthBrandPanel, AuthErrorBanner } from "@/components/auth/AuthSplitLayout";
import { BTN_GHOST, BTN_PRIMARY, CELL, FIELD, GRID, LABEL, LEAD } from "@/components/marketing/ds";
import { Loader2 } from "lucide-react";

type ExperienceLevel = "junior" | "mid" | "senior" | "staff";

const TARGET_COMPANIES = [
  "Google",
  "Meta",
  "Amazon",
  "Apple",
  "Microsoft",
  "Netflix",
  "Uber",
  "Airbnb",
  "Stripe",
  "OpenAI",
  "Other",
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: "junior", label: "Junior", desc: "0-2 years" },
  { value: "mid", label: "Mid-level", desc: "3-5 years" },
  { value: "senior", label: "Senior", desc: "5-8 years" },
  { value: "staff", label: "Staff+", desc: "8+ years" },
];

const LANGUAGES: { value: string; label: string; ext: string }[] = [
  { value: "python", label: "Python", ext: ".py" },
  { value: "javascript", label: "JavaScript", ext: ".js" },
  { value: "java", label: "Java", ext: ".java" },
  { value: "cpp", label: "C++", ext: ".cpp" },
];

const STEPS = ["Name", "Company", "Experience", "Language"] as const;

const PANEL = {
  kicker: "Account setup",
  headline: "Four answers, then your first round.",
  supporting:
    "These become the defaults for every round: who you are targeting, how senior the bar is, and which language opens in the editor. Change any of them later in Settings.",
};

/** Same scale as the login and signup form heading. */
const HEADING = "text-balance text-[clamp(40px,5vw,56px)] font-normal leading-none tracking-[-0.045em]";

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className={HEADING}>{title}</h1>
      <p className={cn(LEAD, "mt-5")}>{description}</p>
    </div>
  );
}

/** A selectable hairline grid cell, matching the option cards on the setup pages. */
function OptionCell({
  selected,
  onClick,
  label,
  meta,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        CELL,
        "flex min-h-[72px] flex-col items-start justify-center gap-1 px-5 py-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan",
        selected
          ? "bg-brand-cyan/[0.06] text-brand-cyan ring-1 ring-inset ring-brand-cyan/40"
          : "text-brand-text hover:bg-white/[0.03]"
      )}
    >
      <span className="text-[15px] tracking-[-0.01em]">{label}</span>
      {meta ? (
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-subtle">{meta}</span>
      ) : null}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const { supabase, user, isLoading: authLoading } = useSupabase();

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!user || prefilled) return;
    const name =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      "";
    setDisplayName(name);
    setPrefilled(true);
  }, [user, prefilled]);

  const canContinue = () => {
    switch (step) {
      case 0:
        return displayName.trim().length > 0;
      case 1:
        return targetCompany.length > 0;
      case 2:
        return experienceLevel.length > 0;
      case 3:
        return preferredLanguage.length > 0;
      default:
        return false;
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        target_company: targetCompany.toLowerCase(),
        experience_level: experienceLevel,
        preferred_language: preferredLanguage,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    posthog?.capture("onboarding_completed", {
      target_company: targetCompany.toLowerCase(),
      experience_level: experienceLevel,
      preferred_language: preferredLanguage,
    });

    router.push("/dashboard");
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <AuthBrandPanel kicker={PANEL.kicker} headline={PANEL.headline} supporting={PANEL.supporting} />
        <div
          role="status"
          aria-label="Loading"
          className="flex w-full flex-col justify-center px-5 py-12 sm:px-10 lg:px-[clamp(40px,6vw,96px)]"
        >
          <div className="mx-auto w-full max-w-[520px] animate-pulse">
            <div className="h-2.5 w-36 rounded-full bg-white/[0.04]" />
            <div className="mt-4 grid grid-cols-4 gap-2">
              {STEPS.map((label) => (
                <div key={label} className="h-px bg-white/[0.12]" />
              ))}
            </div>
            <div className="mt-12 h-12 w-56 rounded-full bg-white/[0.04]" />
            <div className="mt-5 h-4 w-64 rounded-full bg-white/[0.04]" />
            <div className="mt-10 h-2.5 w-24 rounded-full bg-white/[0.04]" />
            <div className="mt-3 h-12 w-full rounded-full border border-white/[0.08]" />
            <div className="mt-12 flex justify-end border-t border-white/[0.08] pt-8">
              <div className="h-12 w-36 rounded-full bg-white/[0.04]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ready = canContinue() && !isSaving;

  return (
    <div className="flex min-h-screen w-full lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <AuthBrandPanel kicker={PANEL.kicker} headline={PANEL.headline} supporting={PANEL.supporting} />

      <div className="flex w-full flex-col justify-center px-5 py-12 sm:px-10 lg:px-[clamp(40px,6vw,96px)]">
        <div className="mx-auto w-full max-w-[520px]">
          <div className="mb-12 lg:hidden">
            <BrandLogo size="sm" />
          </div>

          {/* Progress */}
          <p className={LABEL} aria-live="polite">
            Step {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")} · {STEPS[step]}
          </p>
          <ol className="mt-4 grid grid-cols-4 gap-2" aria-hidden="true">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={cn(
                  "h-px transition-colors duration-300",
                  i <= step ? "bg-brand-cyan" : "bg-white/[0.12]"
                )}
              />
            ))}
          </ol>

          <div className="mt-12">
            {/* Step 0: Display Name */}
            {step === 0 && (
              <div className="space-y-10">
                <StepHeader title="Welcome." description="What should Tia call you?" />
                <div className="space-y-3">
                  <label htmlFor="onboarding-display-name" className={cn(LABEL, "block")}>
                    Display name
                  </label>
                  <input
                    id="onboarding-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    autoFocus
                    autoComplete="name"
                    className={FIELD}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canContinue()) handleNext();
                    }}
                  />
                </div>
              </div>
            )}

            {/* Step 1: Target Company */}
            {step === 1 && (
              <div className="space-y-10">
                <StepHeader
                  title="Target company."
                  description="Which company are you preparing for? Pick Other if it is not listed."
                />
                <div className={cn(GRID, "grid-cols-2 sm:grid-cols-3")}>
                  {TARGET_COMPANIES.map((company) => {
                    const val = company.toLowerCase();
                    return (
                      <OptionCell
                        key={company}
                        label={company}
                        selected={targetCompany === val}
                        onClick={() => setTargetCompany(val)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Experience Level */}
            {step === 2 && (
              <div className="space-y-10">
                <StepHeader
                  title="Experience level."
                  description="We use this as the default level for your interviews. You can change it before any round."
                />
                <div className={cn(GRID, "grid-cols-2")}>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <OptionCell
                      key={level.value}
                      label={level.label}
                      meta={level.desc}
                      selected={experienceLevel === level.value}
                      onClick={() => setExperienceLevel(level.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Preferred Language */}
            {step === 3 && (
              <div className="space-y-10">
                <StepHeader
                  title="Preferred language."
                  description="It opens by default in the editor. Running code currently works in Python and JavaScript."
                />
                <div className={cn(GRID, "grid-cols-2")}>
                  {LANGUAGES.map((lang) => (
                    <OptionCell
                      key={lang.value}
                      label={lang.label}
                      meta={lang.ext}
                      selected={preferredLanguage === lang.value}
                      onClick={() => setPreferredLanguage(lang.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-8">
                <AuthErrorBanner message={error} />
              </div>
            )}

            {/* Navigation */}
            <div className="mt-12 flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-center sm:justify-between">
              {step > 0 ? (
                <button type="button" onClick={handleBack} className={cn(BTN_GHOST, "w-full sm:w-auto")}>
                  <span aria-hidden>←</span>
                  Back
                </button>
              ) : (
                <span className="hidden sm:block" />
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!ready}
                className={cn(BTN_PRIMARY, "w-full sm:w-auto")}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Setting up...
                  </>
                ) : step === 3 ? (
                  "Finish setup"
                ) : (
                  <>
                    Continue
                    <span aria-hidden>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
