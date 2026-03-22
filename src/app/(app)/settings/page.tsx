import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  User,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Shield,
} from "lucide-react";

const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior (0–2 years)" },
  { value: "mid", label: "Mid-level (3–5 years)" },
  { value: "senior", label: "Senior (5–8 years)" },
  { value: "staff", label: "Staff / Principal (8+ years)" },
];

const TARGET_COMPANIES = [
  "Google", "Meta", "Amazon", "Apple", "Microsoft",
  "Netflix", "Uber", "Airbnb", "Stripe", "OpenAI", "Other",
];

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python 3",
  javascript: "JavaScript (Node)",
  java: "Java",
  cpp: "C++",
};

const PLAN_CONFIG = {
  starter: {
    name: "Starter",
    price: "$19/mo",
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
    border: "border-brand-cyan/25",
    features: ["5 interviews/week", "All DSA problems", "Score history"],
  },
  pro: {
    name: "Pro",
    price: "$29/mo",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
    border: "border-brand-green/25",
    features: [
      "Unlimited interviews",
      "All DSA problems",
      "Company personas",
      "Priority support",
    ],
  },
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
    .select("*")
    .eq("id", user.id)
    .single();

  const currentPlan: "free" | "starter" | "pro" = profile?.plan ?? "free";

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
        <div className="p-6 space-y-5">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
              Display Name
            </label>
            <input
              type="text"
              defaultValue={profile?.display_name ?? ""}
              placeholder="Your name"
              disabled
              className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-lg text-brand-text text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-cyan/50 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={user.email ?? ""}
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
              defaultValue={profile?.target_company ?? ""}
              disabled
              className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-lg text-brand-muted text-sm appearance-none focus:outline-none focus:border-brand-cyan/50 disabled:opacity-60 disabled:cursor-not-allowed"
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
              {EXPERIENCE_LEVELS.map((level) => (
                <label
                  key={level.value}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm cursor-not-allowed opacity-60",
                    profile?.experience_level === level.value
                      ? "border-brand-cyan/40 bg-brand-cyan/5 text-brand-cyan"
                      : "border-brand-border bg-brand-surface text-brand-muted"
                  )}
                >
                  <input
                    type="radio"
                    name="experience"
                    value={level.value}
                    defaultChecked={
                      profile?.experience_level === level.value
                    }
                    disabled
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-3.5 h-3.5 rounded-full border-2 shrink-0",
                      profile?.experience_level === level.value
                        ? "border-brand-cyan bg-brand-cyan"
                        : "border-brand-border"
                    )}
                  />
                  <span>{level.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Language */}
          <div className="space-y-1.5">
            <label className="block text-brand-muted text-xs font-medium uppercase tracking-wide">
              Preferred Language
            </label>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  disabled
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                    profile?.preferred_language === lang
                      ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan"
                      : "border-brand-border bg-brand-surface text-brand-muted"
                  )}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button (disabled, for now) */}
          <div className="pt-2">
            <button
              type="button"
              disabled
              className="px-5 py-2.5 bg-brand-cyan text-brand-deep font-semibold text-sm rounded-lg opacity-50 cursor-not-allowed"
            >
              Save Changes
            </button>
            <p className="text-brand-muted text-xs mt-2">
              Profile editing coming soon.
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-border">
          <CreditCard className="w-4 h-4 text-brand-cyan" />
          <h2 className="text-sm font-semibold text-brand-text">
            Subscription
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Current Plan Badge */}
          <div className="flex items-center gap-3">
            <span className="text-brand-muted text-sm">Current plan:</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border",
                currentPlan === "free"
                  ? "bg-brand-surface border-brand-border text-brand-muted"
                  : currentPlan === "starter"
                    ? "bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan"
                    : "bg-brand-green/10 border-brand-green/30 text-brand-green"
              )}
            >
              {currentPlan === "pro" && (
                <Zap className="w-3 h-3" />
              )}
              {currentPlan === "starter" && (
                <CheckCircle2 className="w-3 h-3" />
              )}
              {currentPlan === "free"
                ? "Free Plan"
                : currentPlan === "starter"
                  ? "Starter"
                  : "Pro"}
            </span>
          </div>

          {currentPlan === "free" && (
            <p className="text-brand-muted text-sm">
              You are on the free plan. Upgrade to unlock more interviews and
              features.
            </p>
          )}

          {/* Plan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {(["starter", "pro"] as const).map((plan) => {
              const cfg = PLAN_CONFIG[plan];
              const isCurrentPlan = currentPlan === plan;
              return (
                <div
                  key={plan}
                  className={cn(
                    "rounded-xl border p-5 flex flex-col gap-4",
                    isCurrentPlan
                      ? cn(cfg.bg, cfg.border)
                      : "bg-brand-surface border-brand-border"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-base font-bold font-heading",
                          isCurrentPlan ? cfg.color : "text-brand-text"
                        )}
                      >
                        {cfg.name}
                      </span>
                      <span
                        className={cn(
                          "text-lg font-bold font-heading",
                          isCurrentPlan ? cfg.color : "text-brand-text"
                        )}
                      >
                        {cfg.price}
                      </span>
                    </div>
                    <ul className="space-y-1 mt-3">
                      {cfg.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-xs text-brand-muted"
                        >
                          <Shield className="w-3 h-3 text-brand-green shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isCurrentPlan ? (
                    <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-brand-surface/50 text-brand-muted border border-current/10">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Current Plan
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                        plan === "pro"
                          ? "bg-brand-green/10 border-brand-green/30 text-brand-green"
                          : "bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan"
                      )}
                    >
                      Upgrade to {cfg.name}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-brand-muted text-xs">
            Stripe billing coming soon. Plans will be available at launch.
          </p>
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
