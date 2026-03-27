import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { cn } from "@/lib/utils";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import {
  User,
  CreditCard,
  AlertTriangle,
  Ticket,
} from "lucide-react";

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
  const country = headersList.get("x-vercel-ip-country") ?? "US";
  const isIndia = country === "IN";

  const packs = isIndia
    ? [
        { name: "1 Interview", price: "₹349", credits: 1, color: "brand-cyan" },
        { name: "3-Pack", price: "₹799", credits: 3, badge: "Save 25%", color: "brand-green" },
        { name: "5-Pack", price: "₹1099", credits: 5, badge: "Save 40%", color: "brand-amber" },
      ]
    : [
        { name: "1 Interview", price: "$8", credits: 1, color: "brand-cyan" },
        { name: "3-Pack", price: "$18", credits: 3, badge: "Save 25%", color: "brand-green" },
        { name: "5-Pack", price: "$24", credits: 5, badge: "Save 40%", color: "brand-amber" },
      ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-brand-text mb-1">
          Settings
        </h1>
        <p className="text-brand-muted text-sm">
          Manage your profile, preferences, and subscription.
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
            {packs.map((pack) => (
              <div
                key={pack.name}
                className="rounded-xl border border-brand-border bg-brand-surface p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand-text">{pack.name}</span>
                  {pack.badge && (
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      pack.color === "brand-green" ? "bg-brand-green/15 text-brand-green" : "bg-brand-amber/15 text-brand-amber"
                    )}>
                      {pack.badge}
                    </span>
                  )}
                </div>
                <span className="text-xl font-bold text-brand-text">{pack.price}</span>
                <button
                  type="button"
                  disabled
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                    `bg-${pack.color}/10 border-${pack.color}/30 text-${pack.color}`
                  )}
                >
                  Buy Credits
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-brand-muted" />
            <p className="text-brand-muted text-xs">
              Payments coming soon. Credits never expire.
              {isIndia && (
                <span className="text-brand-cyan ml-1">India pricing applied.</span>
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
