"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/hooks/useSupabase";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { AuthErrorBanner } from "@/components/auth/AuthSplitLayout";
import { BTN_GHOST, BTN_PRIMARY, CHIP, CHIP_ACTIVE, FIELD, LABEL, LEAD } from "@/components/marketing/ds";
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

const HEADING = "text-balance text-[clamp(32px,4.4vw,48px)] font-normal leading-[1.02] tracking-[-0.04em]";
/** CHIP sized up for a primary choice: bigger hit area, same visual language. */
const CHOICE = cn(CHIP, "gap-2 px-4 py-2.5 text-xs");

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className={HEADING}>{title}</h1>
      <p className={cn(LEAD, "mt-4")}>{description}</p>
    </div>
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" aria-label="Loading" />
      </div>
    );
  }

  const ready = canContinue() && !isSaving;

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
      <div className="w-full max-w-[560px]">
        <BrandLogo size="sm" />

        {/* Progress */}
        <div className="mt-14">
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
        </div>

        <div className="mt-12">
          {/* Step 0: Display Name */}
          {step === 0 && (
            <div className="space-y-10">
              <StepHeader title="Welcome to TechInView." description="What should we call you?" />
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
              <div className="flex flex-wrap gap-2">
                {TARGET_COMPANIES.map((company) => {
                  const val = company.toLowerCase();
                  const isSelected = targetCompany === val;
                  return (
                    <button
                      key={company}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setTargetCompany(val)}
                      className={cn(CHOICE, isSelected && CHIP_ACTIVE)}
                    >
                      {company}
                    </button>
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
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((level) => {
                  const isSelected = experienceLevel === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setExperienceLevel(level.value)}
                      className={cn(CHOICE, isSelected && CHIP_ACTIVE)}
                    >
                      {level.label}
                      <span className="text-brand-subtle">{level.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Preferred Language */}
          {step === 3 && (
            <div className="space-y-10">
              <StepHeader
                title="Preferred language."
                description="The language you plan to code in. Running code currently works in Python and JavaScript."
              />
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => {
                  const isSelected = preferredLanguage === lang.value;
                  return (
                    <button
                      key={lang.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setPreferredLanguage(lang.value)}
                      className={cn(CHOICE, isSelected && CHIP_ACTIVE)}
                    >
                      {lang.label}
                      <span className="text-brand-subtle">{lang.ext}</span>
                    </button>
                  );
                })}
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
  );
}
