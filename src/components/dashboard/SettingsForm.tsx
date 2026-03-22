"use client";

import { useState } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";

const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior (0–2 years)" },
  { value: "mid", label: "Mid-level (3–5 years)" },
  { value: "senior", label: "Senior (5–8 years)" },
  { value: "staff", label: "Staff / Principal (8+ years)" },
];

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

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python 3",
  javascript: "JavaScript (Node)",
  java: "Java",
  cpp: "C++",
};

type SaveStatus = "idle" | "saving" | "success" | "error";

type Props = {
  initialProfile: {
    display_name: string | null;
    email: string;
    target_company: string | null;
    experience_level: string | null;
    preferred_language: string | null;
  };
};

export function SettingsForm({ initialProfile }: Props) {
  const { supabase, user } = useSupabase();

  const [displayName, setDisplayName] = useState(
    initialProfile.display_name ?? ""
  );
  const [targetCompany, setTargetCompany] = useState(
    initialProfile.target_company ?? ""
  );
  const [experienceLevel, setExperienceLevel] = useState(
    initialProfile.experience_level ?? ""
  );
  const [preferredLanguage, setPreferredLanguage] = useState(
    initialProfile.preferred_language ?? ""
  );

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;

    setSaveStatus("saving");
    setErrorMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        target_company: targetCompany || null,
        experience_level: experienceLevel || null,
        preferred_language: preferredLanguage || null,
      })
      .eq("id", user.id);

    if (error) {
      setSaveStatus("error");
      setErrorMessage(error.message);
      setTimeout(() => setSaveStatus("idle"), 4000);
    } else {
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Display Name */}
      <div className="space-y-1.5">
        <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-lg text-brand-text text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-cyan/50 transition-colors"
        />
      </div>

      {/* Email (read-only) */}
      <div className="space-y-1.5">
        <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
          Email
        </label>
        <input
          type="email"
          value={initialProfile.email}
          readOnly
          disabled
          className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-lg text-brand-muted text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <p className="text-brand-muted text-xs">
          Email is managed through your OAuth provider.
        </p>
      </div>

      {/* Target Company */}
      <div className="space-y-1.5">
        <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
          Target Company
        </label>
        <select
          value={targetCompany}
          onChange={(e) => setTargetCompany(e.target.value)}
          className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-lg text-brand-text text-sm appearance-none focus:outline-none focus:border-brand-cyan/50 transition-colors"
        >
          <option value="">Select a company</option>
          {TARGET_COMPANIES.map((company) => (
            <option key={company} value={company.toLowerCase()}>
              {company}
            </option>
          ))}
        </select>
      </div>

      {/* Experience Level */}
      <div className="space-y-1.5">
        <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
          Experience Level
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EXPERIENCE_LEVELS.map((level) => {
            const isSelected = experienceLevel === level.value;
            return (
              <label
                key={level.value}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors",
                  isSelected
                    ? "border-brand-cyan/40 bg-brand-cyan/5 text-brand-cyan"
                    : "border-brand-border bg-brand-surface text-brand-muted hover:border-brand-cyan/20 hover:text-brand-text"
                )}
              >
                <input
                  type="radio"
                  name="experience"
                  value={level.value}
                  checked={isSelected}
                  onChange={() => setExperienceLevel(level.value)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors",
                    isSelected
                      ? "border-brand-cyan bg-brand-cyan"
                      : "border-brand-border"
                  )}
                />
                <span>{level.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Preferred Language */}
      <div className="space-y-1.5">
        <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
          Preferred Language
        </label>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = preferredLanguage === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setPreferredLanguage(lang)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                  isSelected
                    ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan"
                    : "border-brand-border bg-brand-surface text-brand-muted hover:border-brand-cyan/20 hover:text-brand-text"
                )}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 bg-brand-cyan text-brand-deep font-semibold text-sm rounded-lg transition-opacity",
            saveStatus === "saving"
              ? "opacity-70 cursor-not-allowed"
              : "hover:opacity-90"
          )}
        >
          {saveStatus === "saving" && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {saveStatus === "saving" ? "Saving…" : "Save Changes"}
        </button>

        {saveStatus === "success" && (
          <span className="inline-flex items-center gap-1.5 text-brand-green text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Saved successfully
          </span>
        )}

        {saveStatus === "error" && (
          <span className="text-brand-rose text-sm">
            {errorMessage ?? "Failed to save. Please try again."}
          </span>
        )}
      </div>
    </div>
  );
}
