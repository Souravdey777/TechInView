import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { cn } from "@/lib/utils";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { SettingsRack } from "@/components/dashboard/settings/SettingsRack";
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
import {
  BTN_GHOST,
  BTN_PRIMARY,
  BTN_SM,
  BODY,
  CELL,
  CHIP,
  Eyebrow,
  GRID,
  LABEL,
} from "@/components/marketing/ds";
import { DeleteAccountButton } from "@/components/dashboard/DeleteAccountButton";
import { LEGAL_LINKS, SUPPORT_EMAIL, createSupportMailto } from "@/lib/legal";

/** The pack that gets the primary pill, matching the landing pricing section. */
const FEATURED_PACK = "3pack";

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
        <Eyebrow className="mb-4">Settings</Eyebrow>
        <h1 className="text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
          Account.
        </h1>
      </header>

      <div className="mt-8 grid items-start gap-6 sm:mt-12 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
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
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span
                      className={cn(
                        "text-[clamp(40px,5vw,56px)] font-normal tabular-nums leading-none tracking-[-0.045em]",
                        credits > 0 ? "text-brand-text" : "text-brand-subtle"
                      )}
                    >
                      {credits}
                    </span>
                    <span className={LABEL}>
                      round{credits === 1 ? "" : "s"} remaining
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                    {interviewsCompleted} round
                    {interviewsCompleted === 1 ? "" : "s"} completed. Rounds never
                    expire.
                    {!hasUsedTrial && " A 5-minute audio preview is still available."}
                  </p>
                </div>
              </div>

              <div className={cn(GRID, "sm:grid-cols-3")}>
                {PACK_IDS.map((packId) => {
                  const pack = CREDIT_PACKS[packId];
                  const featured = packId === FEATURED_PACK;
                  const price = pack.displayPrices[displayKey];

                  return (
                    <div
                      key={packId}
                      className={cn(
                        CELL,
                        "flex flex-col gap-5 p-5",
                        featured && "bg-brand-cyan/[0.03]"
                      )}
                    >
                      <div
                        className={cn(
                          LABEL,
                          "flex items-center justify-between gap-2",
                          featured && "text-brand-cyan"
                        )}
                      >
                        <span>{pack.label}</span>
                        {pack.badge && <span>{pack.badge}</span>}
                      </div>

                      <span className="text-[40px] font-light tabular-nums leading-none tracking-[-0.05em] text-brand-text">
                        {symbol}
                        {price.toLocaleString(region === "INR" ? "en-IN" : "en-US")}
                      </span>

                      <p className="text-sm leading-relaxed text-brand-muted">
                        {pack.credits} x {FULL_INTERVIEW_DURATION_MINUTES}-minute
                        full round{pack.credits > 1 ? "s" : ""}
                      </p>

                      <RazorpayCheckout
                        packId={packId}
                        countryCode={country}
                        userName={profile?.display_name ?? undefined}
                        userEmail={user.email ?? undefined}
                        className={cn(
                          featured ? BTN_PRIMARY : BTN_GHOST,
                          BTN_SM,
                          "mt-auto w-full"
                        )}
                      >
                        Buy pack
                      </RazorpayCheckout>
                    </div>
                  );
                })}
              </div>

              <p className="text-sm leading-relaxed text-brand-subtle">
                Practice Mode stays free. Rounds are only spent in AI Interview
                Mode. One-time packs, no subscription, secure payments via
                Razorpay.
                {region === "INR" && (
                  <span className="ml-1 text-brand-text">India pricing applied.</span>
                )}
                {region === "PPP" && (
                  <span className="ml-1 text-brand-text">Regional pricing applied.</span>
                )}
              </p>
            </div>
          </SettingsRack>

          <SettingsRack id="support" label="Support" note="Replies from a human">
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xl font-medium tracking-[-0.02em] text-brand-text">
                  Need help with billing, rounds, account access, or privacy?
                </p>
                <p className={cn(BODY, "mt-2 max-w-xl")}>
                  Email the TechInView team directly. Include your account email
                  and any order ID, payment ID, or page URL that helps us verify
                  the request quickly.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={supportHref}
                  className={cn(BTN_PRIMARY, BTN_SM, "gap-2")}
                >
                  <Mail className="h-4 w-4" />
                  Email support
                </a>
                <Link
                  href="/contact"
                  className={cn(BTN_GHOST, BTN_SM)}
                >
                  Support page
                </Link>
                <span className="font-mono text-xs text-brand-subtle">
                  {SUPPORT_EMAIL}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-5">
                {LEGAL_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={CHIP}
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
                <p className="text-xl font-medium tracking-[-0.02em] text-brand-text">
                  Delete account
                </p>
                <p className={cn(BODY, "mt-2 max-w-md")}>
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
