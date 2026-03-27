import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { cn } from "@/lib/utils";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { RazorpayCheckout } from "@/components/shared/RazorpayCheckout";
import { CREDIT_PACKS, PACK_IDS, getRegionForCountry } from "@/lib/constants";
import {
  User,
  CreditCard,
  AlertTriangle,
  Ticket,
} from "lucide-react";

const PACK_COLORS: Record<string, string> = {
  single: "brand-cyan",
  "3pack": "brand-green",
  "5pack": "brand-amber",
};

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
    .select("display_name, target_company, experience_level, preferred_language, interview_credits, has_used_free_trial, interviews_completed")
    .eq("id", user.id)
    .single();

  const credits = profile?.interview_credits ?? 1;
  const hasUsedTrial = profile?.has_used_free_trial ?? false;
  const interviewsCompleted = profile?.interviews_completed ?? 0;

  const headersList = headers();
  const country = (headersList.get("x-vercel-ip-country") ?? "US").toUpperCase();
  const { region, symbol } = getRegionForCountry(country);

  const displayKey = region === "INR" ? "inr" : region === "PPP" ? "ppp" : "usd";

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
            email: user.email ?? "",
            target_company: profile?.target_company ?? null,
            experience_level: profile?.experience_level ?? null,
            preferred_language: profile?.preferred_language ?? null,
          }}
        />
      </section>

      {/* Interview Credits Section */}
      <section className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-border">
          <Ticket className="w-4 h-4 text-brand-cyan" />
          <h2 className="text-sm font-semibold text-brand-text">
            Interview Credits
          </h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Credits balance */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-muted text-sm">Available credits</p>
              <p className="text-xs text-brand-muted mt-0.5">
                {interviewsCompleted} interview{interviewsCompleted !== 1 ? "s" : ""} completed
                {!hasUsedTrial && credits > 0 && " · Free trial available"}
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
                    Buy Credits
                  </RazorpayCheckout>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-brand-muted" />
            <p className="text-brand-muted text-xs">
              Credits never expire. Secure payments via Razorpay.
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
          <button
            type="button"
            disabled
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-brand-rose border border-brand-rose/30 bg-brand-rose/5 hover:bg-brand-rose/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}
