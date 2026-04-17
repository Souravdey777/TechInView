"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/hooks/useSupabase";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/BrandLogo";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
  Building2,
  Briefcase,
  Code2,
  Sparkles,
} from "lucide-react";

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

const STEPS = [
  { icon: User, label: "Name" },
  { icon: Building2, label: "Company" },
  { icon: Briefcase, label: "Experience" },
  { icon: Code2, label: "Language" },
];

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
      <div className="min-h-screen bg-brand-deep flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-deep flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center">
          <BrandLogo size="lg" wordmarkClassName="text-2xl font-bold" />
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center justify-center gap-1.5 sm:mb-8 sm:gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300",
                    "sm:w-9 sm:h-9 w-8 h-8",
                    isActive
                      ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan"
                      : isDone
                        ? "border-brand-green bg-brand-green/10 text-brand-green"
                        : "border-brand-border bg-brand-surface text-brand-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-5 rounded-full transition-colors duration-300 sm:w-8",
                      isDone ? "bg-brand-green" : "bg-brand-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="glass-card p-6 sm:p-8">
          {/* Step 0: Display Name */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-xl font-bold text-brand-text mb-1">
                  Welcome to TechInView
                </h1>
                <p className="text-brand-muted text-sm">
                  What should we call you?
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  className="w-full px-4 py-3 bg-brand-surface border border-brand-border rounded-lg text-brand-text text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-cyan/50 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canContinue()) handleNext();
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 1: Target Company */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-xl font-bold text-brand-text mb-1">
                  Dream Company
                </h1>
                <p className="text-brand-muted text-sm">
                  Which company are you preparing for?
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {TARGET_COMPANIES.map((company) => {
                  const val = company.toLowerCase();
                  const isSelected = targetCompany === val;
                  return (
                    <button
                      key={company}
                      type="button"
                      onClick={() => setTargetCompany(val)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-150",
                        isSelected
                          ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan"
                          : "border-brand-border bg-brand-surface text-brand-muted hover:border-brand-cyan/30 hover:text-brand-text"
                      )}
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
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-xl font-bold text-brand-text mb-1">
                  Experience Level
                </h1>
                <p className="text-brand-muted text-sm">
                  This helps us calibrate interview difficulty and preselect the right persona.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {EXPERIENCE_LEVELS.map((level) => {
                  const isSelected = experienceLevel === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setExperienceLevel(level.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border px-4 py-4 transition-all duration-150",
                        isSelected
                          ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan ring-1 ring-brand-cyan/30"
                          : "border-brand-border bg-brand-surface text-brand-muted hover:border-brand-cyan/30 hover:text-brand-text"
                      )}
                    >
                      <span className="text-sm font-semibold">{level.label}</span>
                      <span className="text-xs opacity-70">{level.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Preferred Language */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-xl font-bold text-brand-text mb-1">
                  Preferred Language
                </h1>
                <p className="text-brand-muted text-sm">
                  Pick your go-to language for coding interviews.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {LANGUAGES.map((lang) => {
                  const isSelected = preferredLanguage === lang.value;
                  return (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => setPreferredLanguage(lang.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border px-4 py-4 transition-all duration-150",
                        isSelected
                          ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan ring-1 ring-brand-cyan/30"
                          : "border-brand-border bg-brand-surface text-brand-muted hover:border-brand-cyan/30 hover:text-brand-text"
                      )}
                    >
                      <span className="font-mono text-xs opacity-60">{lang.ext}</span>
                      <span className="text-sm font-semibold">{lang.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand-border px-4 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:border-brand-subtle hover:text-brand-text sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canContinue() || isSaving}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all sm:flex-1",
                canContinue() && !isSaving
                  ? "bg-brand-cyan text-brand-deep hover:opacity-90"
                  : "bg-brand-border text-brand-muted cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up...
                </>
              ) : step === 3 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get Started
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step label */}
        <p className="text-center text-brand-muted text-xs mt-6">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
