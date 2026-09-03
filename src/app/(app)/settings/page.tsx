import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { cn } from "@/lib/utils";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import {
  SettingsMonoLabel,
  SettingsRack,
} from "@/components/dashboard/settings/SettingsRack";
import {
  SettingsSectionNav,
  type SettingsSection,
} from "@/components/dashboard/settings/SettingsSectionNav";
import { RazorpayCheckout } from "@/components/shared/RazorpayCheckout";
import {
  CREDIT_PACKS,
  FULL_INTERVIEW_DURATION_MINUTES,
  PACK_IDS,
  getDisplayPricingKey,
  getRegionForCountry,
} from "@/lib/constants";
import { Mail } from "lucide-react";
import { DeleteAccountButton } from "@/components/dashboard/DeleteAccountButton";
import { LEGAL_LINKS, SUPPORT_EMAIL, createSupportMailto } from "@/lib/legal";

const PACK_COLORS: Record<string, string> = {
  single: "brand-cyan",
  "3pack": "brand-green",
  "6pack": "brand-amber",
};

const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  { id: "profile", label: "Profile" },
  { id: "public-page", label: "Public page" },
  { id: "rounds", label: "Rounds and billing" },
  { id: "support", label: "Support" },
  { id: "danger", label: "Danger zone", tone: "danger" },
];

function resolveAppUrl(headersList: { get(name: string): string | null }): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  const host = headersList.get("host");

  if (!host) {
    return "http://localhost:3000";
  }

  const protocol = headersList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, public_bio, public_links, is_public_profile, target_company, experience_level, preferred_language, interview_credits, has_used_free_trial, interviews_completed")
    .eq("id", user.id)
    .single();

  const credits = profile?.interview_credits ?? 0;
  const hasUsedTrial = profile?.has_used_free_trial ?? false;
  const interviewsCompleted = profile?.interviews_completed ?? 0;

  const headersList = headers();
  const country = (headersList.get("x-vercel-ip-country") ?? "US").toUpperCase();
  const { region, symbol } = getRegionForCountry(country);
  const displayKey = getDisplayPricingKey(region);
  const appUrl = resolveAppUrl(headersList);
  const supportHref = createSupportMailto({
    subject: "TechInView support request",
  });

  return (
    <div className="animate-fade-in">
      <header>
        <SettingsMonoLabel className="tracking-[0.18em]">
          Settings
        </SettingsMonoLabel>
        <h1 className="mt-3 font-heading text-3xl font-bold leading-none tracking-[-0.04em] text-brand-text sm:text-[2.5rem]">
          Account.
        </h1>
      </header>

      <div className="mt-8 grid items-start gap-6 sm:mt-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
        <SettingsSectionNav sections={SETTINGS_SECTIONS} />

        <div className="flex min-w-0 flex-col gap-5">
          <SettingsForm
            initialProfile={{
              display_name: profile?.display_name ?? null,
              username: profile?.username ?? null,
              public_bio: profile?.public_bio ?? null,
              public_links: profile?.public_links ?? null,
              is_public_profile: profile?.is_public_profile ?? false,
              email: user.email ?? "",
              target_company: profile?.target_company ?? null,
              experience_level: profile?.experience_level ?? null,
              preferred_language: profile?.preferred_language ?? null,
            }}
            shareBaseUrl={appUrl}
          />

          <SettingsRack
            id="rounds"
            label="Rounds and billing"
            note="One-time packs, nothing renews"
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span
                      className={cn(
                        "font-heading text-[2.5rem] font-bold leading-none tracking-[-0.04em]",
                        credits > 0 ? "text-brand-text" : "text-brand-subtle"
                      )}
                    >
                      {credits}
                    </span>
                    <span className="text-sm text-brand-muted">
                      round{credits === 1 ? "" : "s"} remaining
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-brand-subtle">
                    {interviewsCompleted} round
                    {interviewsCompleted === 1 ? "" : "s"} completed. Rounds never
                    expire.
                    {!hasUsedTrial && " A 5-minute audio preview is still available."}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {PACK_IDS.map((packId) => {
                  const pack = CREDIT_PACKS[packId];
                  const color = PACK_COLORS[packId] ?? "brand-cyan";
                  const price = pack.displayPrices[displayKey];

                  return (
                    <div
                      key={packId}
                      className="flex flex-col gap-3 rounded-xl border border-brand-border bg-brand-surface p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <SettingsMonoLabel>{pack.label}</SettingsMonoLabel>
                        {pack.badge && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              color === "brand-green"
                                ? "bg-brand-green/15 text-brand-green"
                                : "bg-brand-amber/15 text-brand-amber"
                            )}
                          >
                            {pack.badge}
                          </span>
                        )}
                      </div>

                      <span className="font-heading text-xl font-bold tracking-[-0.03em] text-brand-text">
                        {symbol}
                        {price.toLocaleString(region === "INR" ? "en-IN" : "en-US")}
                      </span>

                      <p className="text-xs leading-relaxed text-brand-subtle">
                        {pack.credits} x {FULL_INTERVIEW_DURATION_MINUTES}-minute
                        full round{pack.credits > 1 ? "s" : ""}
                      </p>

                      <RazorpayCheckout
                        packId={packId}
                        countryCode={country}
                        userName={profile?.display_name ?? undefined}
                        userEmail={user.email ?? undefined}
                        className={cn(
                          "mt-auto h-9 rounded-md border text-xs font-semibold transition-colors",
                          color === "brand-cyan" && "border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20",
                          color === "brand-green" && "border-brand-green/30 bg-brand-green/10 text-brand-green hover:bg-brand-green/20",
                          color === "brand-amber" && "border-brand-amber/30 bg-brand-amber/10 text-brand-amber hover:bg-brand-amber/20",
                        )}
                      >
                        Buy pack
                      </RazorpayCheckout>
                    </div>
                  );
                })}
              </div>

              <p className="border-t border-brand-border pt-4 text-xs leading-relaxed text-brand-subtle">
                Practice Mode stays free. Rounds are only spent in AI Interview
                Mode. One-time packs, no subscription, secure payments via
                Razorpay.
                {region === "INR" && (
                  <span className="ml-1 text-brand-cyan">India pricing applied.</span>
                )}
                {region === "PPP" && (
                  <span className="ml-1 text-brand-cyan">Regional pricing applied.</span>
                )}
              </p>
            </div>
          </SettingsRack>

          <SettingsRack id="support" label="Support" note="Replies from a human">
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-medium text-brand-text">
                  Need help with billing, rounds, account access, or privacy?
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-brand-subtle">
                  Email the TechInView team directly. Include your account email
                  and any order ID, payment ID, or page URL that helps us verify
                  the request quickly.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={supportHref}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-cyan px-4 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-cyan/90"
                >
                  <Mail className="h-4 w-4" />
                  Email support
                </a>
                <Link
                  href="/contact"
                  className="inline-flex h-10 items-center rounded-md border border-brand-border px-4 text-sm font-medium text-brand-text transition-colors hover:border-brand-cyan/40 hover:bg-brand-surface"
                >
                  Support page
                </Link>
                <span className="font-mono text-xs text-brand-subtle">
                  {SUPPORT_EMAIL}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-brand-border pt-4">
                {LEGAL_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs text-brand-muted transition-colors hover:border-brand-cyan/30 hover:text-brand-text"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </SettingsRack>

          <SettingsRack id="danger" label="Danger zone" tone="danger">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
              <div>
                <p className="text-sm font-medium text-brand-text">
                  Delete account
                </p>
                <p className="mt-1.5 max-w-md text-xs leading-relaxed text-brand-subtle">
                  Removes your transcripts, scorecards, and practice progress.
                  Unused rounds are not refunded, and this cannot be undone.
                </p>
              </div>
              <div className="shrink-0">
                <DeleteAccountButton />
              </div>
            </div>
          </SettingsRack>
        </div>
      </div>
    </div>
  );
}
