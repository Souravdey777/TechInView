"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSupabase } from "@/hooks/useSupabase";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import {
  PUBLIC_PROFILE_BIO_MAX_LENGTH,
  PUBLIC_PROFILE_LINK_CONFIG,
  PUBLIC_PROFILE_LINK_ORDER,
  PUBLIC_PROFILE_USERNAME_MAX_LENGTH,
  PUBLIC_PROFILE_USERNAME_MIN_LENGTH,
  getPublicProfilePath,
  getPublicProfileUrl,
  isReservedPublicUsername,
  isValidPublicUsername,
  normalizePublicProfileLink,
  normalizePublicProfileLinks,
  normalizePublicUsername,
  type PublicProfileLinks,
} from "@/lib/public-profile";
import { cn } from "@/lib/utils";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

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
    username: string | null;
    public_bio: string | null;
    public_links: PublicProfileLinks | null;
    is_public_profile: boolean;
    email: string;
    target_company: string | null;
    experience_level: string | null;
    preferred_language: string | null;
  };
  shareBaseUrl: string;
};

export function SettingsForm({ initialProfile, shareBaseUrl }: Props) {
  const { supabase, user } = useSupabase();

  const [displayName, setDisplayName] = useState(
    initialProfile.display_name ?? ""
  );
  const [username, setUsername] = useState(initialProfile.username ?? "");
  const [publicBio, setPublicBio] = useState(initialProfile.public_bio ?? "");
  const [publicLinks, setPublicLinks] = useState<PublicProfileLinks>(
    initialProfile.public_links ?? {}
  );
  const [isPublicProfile, setIsPublicProfile] = useState(
    initialProfile.is_public_profile ?? false
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
  const [savedUsername, setSavedUsername] = useState(
    normalizePublicUsername(initialProfile.username ?? "")
  );
  const [savedIsPublicProfile, setSavedIsPublicProfile] = useState(
    initialProfile.is_public_profile ?? false
  );

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const normalizedUsername = normalizePublicUsername(username);
  const hasValidUsernamePreview = isValidPublicUsername(normalizedUsername);
  const publicProfilePath = hasValidUsernamePreview
    ? getPublicProfilePath(normalizedUsername)
    : null;
  const publicProfileUrl = hasValidUsernamePreview
    ? getPublicProfileUrl(shareBaseUrl, normalizedUsername)
    : null;
  const hasSavedPublicProfile =
    savedIsPublicProfile &&
    savedUsername === normalizedUsername &&
    hasValidUsernamePreview;

  const handleSave = async () => {
    if (!user) return;

    setSaveStatus("saving");
    setErrorMessage(null);

    const trimmedBio = publicBio.trim();
    const normalizedLinks: PublicProfileLinks = {};

    if (normalizedUsername && !isValidPublicUsername(normalizedUsername)) {
      setSaveStatus("error");
      setErrorMessage(
        isReservedPublicUsername(normalizedUsername)
          ? "That username is reserved by the app. Pick a different one."
          : `Username must be ${PUBLIC_PROFILE_USERNAME_MIN_LENGTH}-${PUBLIC_PROFILE_USERNAME_MAX_LENGTH} characters and use only lowercase letters, numbers, or hyphens.`
      );
      setTimeout(() => setSaveStatus("idle"), 4000);
      return;
    }

    if (isPublicProfile && !normalizedUsername) {
      setSaveStatus("error");
      setErrorMessage("Choose a username before turning on your public profile.");
      setTimeout(() => setSaveStatus("idle"), 4000);
      return;
    }

    if (trimmedBio.length > PUBLIC_PROFILE_BIO_MAX_LENGTH) {
      setSaveStatus("error");
      setErrorMessage(
        `Bio must be ${PUBLIC_PROFILE_BIO_MAX_LENGTH} characters or less.`
      );
      setTimeout(() => setSaveStatus("idle"), 4000);
      return;
    }

    for (const key of PUBLIC_PROFILE_LINK_ORDER) {
      const rawValue = publicLinks[key]?.trim() ?? "";
      const normalizedLink = normalizePublicProfileLink(key, rawValue);

      if (rawValue && !normalizedLink) {
        setSaveStatus("error");
        setErrorMessage(
          `Add a valid ${PUBLIC_PROFILE_LINK_CONFIG[key].label} URL or handle.`
        );
        setTimeout(() => setSaveStatus("idle"), 4000);
        return;
      }

      if (normalizedLink) {
        normalizedLinks[key] = normalizedLink;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        username: normalizedUsername || null,
        public_bio: trimmedBio || null,
        public_links:
          Object.keys(normalizedLinks).length > 0
            ? normalizePublicProfileLinks(normalizedLinks)
            : null,
        is_public_profile: isPublicProfile,
        target_company: targetCompany || null,
        experience_level: experienceLevel || null,
        preferred_language: preferredLanguage || null,
      })
      .eq("id", user.id);

    if (error) {
      setSaveStatus("error");
      if (
        error.code === "23505" &&
        error.message.toLowerCase().includes("username")
      ) {
        setErrorMessage("That username is already taken. Try another one.");
      } else if (
        error.code === "42703" &&
        (
          error.message.toLowerCase().includes("username") ||
          error.message.toLowerCase().includes("public_links")
        )
      ) {
        setErrorMessage("Public profile fields are not in your database yet. Run the latest migrations and try again.");
      } else {
        setErrorMessage(error.message);
      }
      setTimeout(() => setSaveStatus("idle"), 4000);
    } else {
      setUsername(normalizedUsername);
      setPublicBio(trimmedBio);
      setPublicLinks(normalizedLinks);
      setSavedUsername(normalizedUsername);
      setSavedIsPublicProfile(isPublicProfile);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="space-y-5 p-5 sm:p-6">
      {/* Display Name */}
      <div className="space-y-1.5">
        <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
          Display Name
        </label>
        <Input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
        />
        <p className="text-brand-muted text-xs">
          This is the name shown at the top of your public profile.
        </p>
      </div>

      {/* Email (read-only) */}
      <div className="space-y-1.5">
        <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
          Email
        </label>
        <Input
          type="email"
          value={initialProfile.email}
          readOnly
          disabled
          className="text-brand-muted"
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
        <Select
          value={targetCompany}
          onChange={(e) => setTargetCompany(e.target.value)}
        >
          <SelectOption value="">Select a company</SelectOption>
          {TARGET_COMPANIES.map((company) => (
            <SelectOption key={company} value={company.toLowerCase()}>
              {company}
            </SelectOption>
          ))}
        </Select>
      </div>

      {/* Experience Level */}
      <div className="space-y-1.5">
        <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
          Experience Level
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
              <Button
                key={lang}
                type="button"
                onClick={() => setPreferredLanguage(lang)}
                variant="outline"
                size="sm"
                className={cn(
                  "h-auto rounded-lg px-3 py-1.5 text-xs",
                  isSelected
                    ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan"
                    : "border-brand-border bg-brand-surface text-brand-muted hover:border-brand-cyan/20 hover:text-brand-text"
                )}
              >
                {LANGUAGE_LABELS[lang]}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-brand-border bg-brand-surface/60 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <label className="block text-brand-text text-sm font-semibold">
              Public Profile
            </label>
            <p className="text-brand-muted text-xs leading-5 max-w-md">
              Create a shareable TechInView page with your handle, headline, and high-level interview progress.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-brand-muted">
              {isPublicProfile ? "Public" : "Private"}
            </span>
            <span
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors",
                isPublicProfile
                  ? "border-brand-cyan/50 bg-brand-cyan/20"
                  : "border-brand-border bg-brand-card"
              )}
            >
              <Input
                type="checkbox"
                checked={isPublicProfile}
                onChange={(e) => setIsPublicProfile(e.target.checked)}
                className="sr-only"
                aria-label="Toggle public profile visibility"
              />
              <span
                className={cn(
                  "inline-block h-4 w-4 rounded-full bg-brand-text transition-transform",
                  isPublicProfile ? "translate-x-6" : "translate-x-1"
                )}
              />
            </span>
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
            Username
          </label>
          <div className="rounded-lg border border-brand-border bg-brand-card px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-brand-muted">{shareBaseUrl.replace(/^https?:\/\//, "")}/u/</span>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-handle"
                maxLength={PUBLIC_PROFILE_USERNAME_MAX_LENGTH + 10}
                className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 focus:ring-0 focus:ring-offset-0 hover:border-transparent"
              />
            </div>
          </div>
          <p className="text-brand-muted text-xs leading-5">
            Lowercase letters, numbers, and hyphens only. We normalize spaces and capitals for you on save.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
            Bio
          </label>
          <Textarea
            value={publicBio}
            onChange={(e) => setPublicBio(e.target.value)}
            placeholder="What are you preparing for right now?"
            maxLength={PUBLIC_PROFILE_BIO_MAX_LENGTH}
            rows={3}
            className="min-h-[5.75rem] bg-brand-card"
          />
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-brand-muted">
              Keep it short and focused on your interview goals.
            </span>
            <span className={cn(publicBio.length > PUBLIC_PROFILE_BIO_MAX_LENGTH ? "text-brand-rose" : "text-brand-muted")}>
              {publicBio.length}/{PUBLIC_PROFILE_BIO_MAX_LENGTH}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
              Links
            </label>
            <p className="mt-1 text-xs leading-5 text-brand-muted">
              Add the profiles you want people to discover from your public page.
            </p>
          </div>

          <div className="grid gap-3">
            {PUBLIC_PROFILE_LINK_ORDER.map((key) => {
              const config = PUBLIC_PROFILE_LINK_CONFIG[key];

              return (
                <div key={key} className="space-y-1.5">
                  <label className="block text-brand-text text-sm font-medium">
                    {config.label}
                  </label>
                  <Input
                    type="text"
                    value={publicLinks[key] ?? ""}
                    onChange={(e) =>
                      setPublicLinks((current) => ({
                        ...current,
                        [key]: e.target.value,
                      }))
                    }
                    placeholder={config.placeholder}
                    className="bg-brand-card"
                  />
                  <p className="text-xs leading-5 text-brand-muted">
                    {config.helpText}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-brand-border bg-brand-card px-3 py-3">
          <p className="text-brand-muted text-xs font-medium uppercase tracking-wide">
            Share Link
          </p>
          {publicProfileUrl ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <code className="overflow-x-auto text-sm text-brand-text">
                {publicProfileUrl}
              </code>
              {hasSavedPublicProfile ? (
                <a
                  href={publicProfilePath ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan hover:text-brand-cyan/90"
                >
                  Open profile
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="text-sm font-medium text-brand-muted">
                  Save as public to open
                </span>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-brand-muted">
              Pick a username to generate your shareable profile link.
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col items-start gap-3 pt-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saveStatus === "saving"}
        >
          {saveStatus === "saving" && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {saveStatus === "saving" ? "Saving…" : "Save Changes"}
        </Button>

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
