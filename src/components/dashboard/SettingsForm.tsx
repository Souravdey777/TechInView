"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  SettingsField,
  SettingsMonoLabel,
  SettingsRack,
  SettingsToggleRow,
} from "@/components/dashboard/settings/SettingsRack";
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

  const shareHost = shareBaseUrl.replace(/^https?:\/\//, "");

  return (
    <>
      <SettingsRack
        id="profile"
        label="Profile"
        note="Used across every round"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SettingsField
            label="Display name"
            htmlFor="settings-display-name"
            hint="Shown at the top of your public profile and scorecards."
          >
            <Input
              id="settings-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </SettingsField>

          <SettingsField
            label="Email"
            htmlFor="settings-email"
            hint="Managed through your sign-in provider."
          >
            <Input
              id="settings-email"
              type="email"
              value={initialProfile.email}
              readOnly
              disabled
              className="text-brand-muted"
            />
          </SettingsField>

          <SettingsField
            label="Target company"
            htmlFor="settings-target-company"
            hint="Tunes the interviewer persona suggested on setup."
          >
            <Select
              id="settings-target-company"
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
          </SettingsField>

          <SettingsField
            label="Years of experience"
            htmlFor="settings-experience"
            hint="Sets the bar your rounds are scored against."
          >
            <Select
              id="settings-experience"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            >
              <SelectOption value="">Select a level</SelectOption>
              {EXPERIENCE_LEVELS.map((level) => (
                <SelectOption key={level.value} value={level.value}>
                  {level.label}
                </SelectOption>
              ))}
            </Select>
          </SettingsField>

          <SettingsField
            label="Preferred language"
            hint="Pre-selected in the editor when a round starts."
            className="sm:col-span-2"
          >
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = preferredLanguage === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setPreferredLanguage(lang)}
                    aria-pressed={isSelected}
                    className={cn(
                      "h-9 rounded-md border px-3 text-xs font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-card",
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
          </SettingsField>
        </div>
      </SettingsRack>

      <SettingsRack
        id="public-page"
        label="Public page"
        note="Private until you turn it on"
        bodyClassName="p-0 sm:p-0"
      >
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <SettingsToggleRow
            title="Publish my profile"
            description="Creates a shareable page with your handle, headline, and high-level interview progress."
            checked={isPublicProfile}
            onCheckedChange={setIsPublicProfile}
            label="Toggle public profile visibility"
          />
        </div>

        <div className="grid gap-5 border-t border-brand-border px-4 py-5 sm:px-5">
          <SettingsField
            label="Username"
            htmlFor="settings-username"
            hint="Lowercase letters, numbers, and hyphens only. Changing it breaks old links."
          >
            <div className="flex h-10 items-center rounded-md border border-brand-border bg-brand-surface px-3 transition-colors focus-within:border-brand-cyan/50 focus-within:ring-2 focus-within:ring-brand-cyan focus-within:ring-offset-2 focus-within:ring-offset-brand-card">
              <span className="shrink-0 font-mono text-sm text-brand-subtle">
                {shareHost}/u/
              </span>
              <input
                id="settings-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-handle"
                maxLength={PUBLIC_PROFILE_USERNAME_MAX_LENGTH + 10}
                className="min-w-0 flex-1 border-0 bg-transparent font-mono text-sm text-brand-text placeholder:text-brand-subtle focus:outline-none"
              />
            </div>
          </SettingsField>

          <SettingsField label="Bio" htmlFor="settings-bio">
            <Textarea
              id="settings-bio"
              value={publicBio}
              onChange={(e) => setPublicBio(e.target.value)}
              placeholder="What are you preparing for right now?"
              maxLength={PUBLIC_PROFILE_BIO_MAX_LENGTH}
              rows={3}
              className="min-h-[5.75rem]"
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
              <span className="text-brand-subtle">
                Keep it short and focused on your interview goals.
              </span>
              <span
                className={cn(
                  "font-mono",
                  publicBio.length > PUBLIC_PROFILE_BIO_MAX_LENGTH
                    ? "text-brand-rose"
                    : "text-brand-subtle"
                )}
              >
                {publicBio.length}/{PUBLIC_PROFILE_BIO_MAX_LENGTH}
              </span>
            </div>
          </SettingsField>

          <div>
            <SettingsMonoLabel>Links</SettingsMonoLabel>
            <p className="mt-2 text-xs leading-relaxed text-brand-subtle">
              Add the profiles you want people to discover from your public page.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {PUBLIC_PROFILE_LINK_ORDER.map((key) => {
                const config = PUBLIC_PROFILE_LINK_CONFIG[key];

                return (
                  <SettingsField
                    key={key}
                    label={config.label}
                    htmlFor={`settings-link-${key}`}
                    hint={config.helpText}
                  >
                    <Input
                      id={`settings-link-${key}`}
                      type="text"
                      value={publicLinks[key] ?? ""}
                      onChange={(e) =>
                        setPublicLinks((current) => ({
                          ...current,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder={config.placeholder}
                    />
                  </SettingsField>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-brand-border bg-brand-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <SettingsMonoLabel>Share link</SettingsMonoLabel>
            {publicProfileUrl ? (
              <p className="mt-1.5 truncate font-mono text-sm text-brand-text">
                {publicProfileUrl}
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-brand-subtle">
                Pick a username to generate your shareable link.
              </p>
            )}
          </div>

          {publicProfileUrl ? (
            hasSavedPublicProfile ? (
              <a
                href={publicProfilePath ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-cyan transition-colors hover:text-brand-cyan/80"
              >
                Open profile
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span className="shrink-0 text-sm text-brand-subtle">
                Save as public to open
              </span>
            )
          ) : null}
        </div>
      </SettingsRack>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-brand-subtle">
          Saves your profile and public page together.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {saveStatus === "success" && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-green">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}

          {saveStatus === "error" && (
            <span className="text-sm text-brand-rose">
              {errorMessage ?? "Failed to save. Please try again."}
            </span>
          )}

          <Button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {saveStatus === "saving" ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
