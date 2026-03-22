import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { InterviewHistory } from "@/components/dashboard/InterviewHistory";
import { ArrowRight, Mic, Zap } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile for display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, interviews_completed")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "there";

  // For V1, use zero-state placeholder data
  const stats = {
    totalInterviews: 0,
    avgScore: 0,
    problemsSolved: 0,
    streak: 0,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-brand-text mb-1">
          Welcome back,{" "}
          <span className="text-brand-cyan">{displayName}</span>
        </h1>
        <p className="text-brand-muted text-sm">
          Ready to sharpen your interview skills today?
        </p>
      </div>

      {/* Stats Grid */}
      <StatsOverview {...stats} />

      {/* Quick Start CTA */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-cyan/10 via-brand-card to-brand-card rounded-xl border border-brand-cyan/25 p-6">
        {/* Background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-brand-cyan" />
              <span className="text-brand-cyan text-xs font-semibold uppercase tracking-widest">
                Quick Start
              </span>
            </div>
            <h2 className="text-xl font-bold font-heading text-brand-text mb-2">
              Start a New Mock Interview
            </h2>
            <p className="text-brand-muted text-sm mb-5 max-w-md">
              Practice with an AI interviewer named Alex. Solve DSA problems
              with voice interaction, live code execution, and FAANG-calibrated
              scoring.
            </p>
            <Link
              href="/interview/setup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-cyan text-brand-deep font-semibold text-sm rounded-lg hover:bg-brand-cyan/90 transition-all duration-150 shadow-lg shadow-brand-cyan/20"
            >
              <Mic className="w-4 h-4" />
              Start Interview
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Visual decoration */}
          <div className="hidden sm:flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 shrink-0">
            <Mic className="w-9 h-9 text-brand-cyan opacity-60" />
          </div>
        </div>
      </div>

      {/* Recent Interviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-brand-text">
            Recent Interviews
          </h2>
          <Link
            href="/problems"
            className="text-brand-cyan text-sm hover:text-brand-cyan/80 transition-colors flex items-center gap-1"
          >
            Browse problems
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <InterviewHistory interviews={[]} />
      </div>
    </div>
  );
}
