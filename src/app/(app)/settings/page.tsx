import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { cn } from "@/lib/utils";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { RazorpayCheckout } from "@/components/shared/RazorpayCheckout";
import {
  CREDIT_PACKS,
  FULL_INTERVIEW_DURATION_MINUTES,
  PACK_IDS,
  getDisplayPricingKey,
  getRegionForCountry,
} from "@/lib/constants";
import {
  User,
  CreditCard,
  AlertTriangle,
  Ticket,
  LifeBuoy,
  Mail,
} from "lucide-react";
import { DeleteAccountButton } from "@/components/dashboard/DeleteAccountButton";
import { LEGAL_LINKS, SUPPORT_EMAIL, createSupportMailto } from "@/lib/legal";

const PACK_COLORS: Record<string, string> = {
  single: "brand-cyan",
  "3pack": "brand-green",
  "6pack": "brand-amber",
};

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

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-brand-text mb-1">
          Settings
        </h1>
        <p className="text-brand-muted text-sm">
          Manage your profile, preferences, and billing.
        </p>
      </div>

      {/* Profile Section */}
      <section className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-border">
          <User className="w-4 h-4 text-brand-cyan" />
          <h2 className="text-sm font-semibold text-brand-text">Profile</h2>
        </div>
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
      </section>

      {/* Interview Packs Section */}
      <section className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-border">
          <Ticket className="w-4 h-4 text-brand-cyan" />
          <h2 className="text-sm font-semibold text-brand-text">
            Interview Packs
          </h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Credits balance */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-muted text-sm">Available AI interview credits</p>
              <p className="text-xs text-brand-muted mt-0.5">
                {interviewsCompleted} interview{interviewsCompleted !== 1 ? "s" : ""} completed
                {!hasUsedTrial && " · 5-minute audio preview available"}
              </p>
            </div>
            <span className={cn(
              "text-3xl font-bold font-heading",
              credits > 0 ? "text-brand-cyan" : "text-brand-muted"
            )}>
              {credits}
            </span>
          </div>

          {/* Credit packs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PACK_IDS.map((packId) => {
              const pack = CREDIT_PACKS[packId];
              const color = PACK_COLORS[packId] ?? "brand-cyan";
              const price = pack.displayPrices[displayKey];

              return (
                <div
                  key={packId}
                  className="rounded-xl border border-brand-border bg-brand-surface p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-brand-text">{pack.label}</span>
                    {pack.badge && (
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        color === "brand-green" ? "bg-brand-green/15 text-brand-green" : "bg-brand-amber/15 text-brand-amber"
                      )}>
                        {pack.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-muted">
                    {pack.credits} x {FULL_INTERVIEW_DURATION_MINUTES}-minute full interview{pack.credits > 1 ? "s" : ""}
                  </p>
                  <span className="text-xl font-bold text-brand-text">
                    {symbol}{price.toLocaleString(region === "INR" ? "en-IN" : "en-US")}
                  </span>
                  <RazorpayCheckout
                    packId={packId}
                    countryCode={country}
                    userName={profile?.display_name ?? undefined}
                    userEmail={user.email ?? undefined}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-semibold border transition-colors",
                      color === "brand-cyan" && "bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/20",
                      color === "brand-green" && "bg-brand-green/10 border-brand-green/30 text-brand-green hover:bg-brand-green/20",
                      color === "brand-amber" && "bg-brand-amber/10 border-brand-amber/30 text-brand-amber hover:bg-brand-amber/20",
                    )}
                  >
                    Buy Pack
                  </RazorpayCheckout>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-brand-muted" />
            <p className="text-brand-muted text-xs">
              Practice Mode stays free. Credits are only used for AI Interview Mode. One-time packs. No subscription. Secure payments via Razorpay.
              {region === "INR" && (
                <span className="text-brand-cyan ml-1">India pricing applied.</span>
              )}
              {region === "PPP" && (
                <span className="text-brand-cyan ml-1">Regional pricing applied.</span>
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-border">
          <LifeBuoy className="w-4 h-4 text-brand-cyan" />
          <h2 className="text-sm font-semibold text-brand-text">Support</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-brand-text">
              Need help with billing, credits, account access, or privacy?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-brand-muted">
              Reach the TechInView team directly by email. Include your account
              email and any order ID, payment ID, or page URL that helps us
              verify the request quickly.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={createSupportMailto({ subject: "TechInView support request" })}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-cyan/90"
            >
              <Mail className="w-4 h-4" />
              Email support
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-text transition-colors hover:bg-brand-surface"
            >
              Support page
            </Link>
          </div>

          <p className="text-xs text-brand-muted">
            Canonical support email:{" "}
            <a
              href={createSupportMailto({ subject: "TechInView support request" })}
              className="text-brand-cyan transition-colors hover:text-cyan-300"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>

          <div className="flex flex-wrap gap-2 text-xs">
            {LEGAL_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-brand-muted transition-colors hover:border-brand-cyan/30 hover:text-brand-text"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-brand-card rounded-xl border border-brand-rose/20 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-rose/20">
          <AlertTriangle className="w-4 h-4 text-brand-rose" />
          <h2 className="text-sm font-semibold text-brand-rose">
            Danger Zone
          </h2>
        </div>
        <div className="p-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-brand-text text-sm font-medium mb-1">
              Delete Account
            </p>
            <p className="text-brand-muted text-xs max-w-sm">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
          </div>
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  );
}
