import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { InterviewHistory } from "@/components/dashboard/InterviewHistory";
import { ArrowRight, Mic, Zap, Braces, Network, MonitorSmartphone, Lock, CreditCard, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile and interviews in parallel
  const [{ data: profile }, { data: interviews }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, interviews_completed, interview_credits, has_used_free_trial")
      .eq("id", user.id)
      .single(),
    supabase
      .from("interviews")
      .select("id, status, language, overall_score, duration_seconds, started_at, completed_at, problem_id, hire_recommendation, problems(title, difficulty, category)")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(20),
  ]);

  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "there";
  const credits = profile?.interview_credits ?? 0;
  const hasCredits = credits > 0;
  const isFreeTrialUser = hasCredits && !(profile?.has_used_free_trial ?? false);

  const completedInterviews = (interviews || []).filter(
    (i) => i.status === "completed"
  );

  // Calculate stats
  const totalInterviews = completedInterviews.length;
  const avgScore =
    totalInterviews > 0
      ? Math.round(
          completedInterviews.reduce(
            (sum, i) => sum + (i.overall_score || 0),
            0
          ) / totalInterviews
        )
      : 0;

  // Count unique problems solved (score >= 55 = at least "lean hire")
  const problemsSolved = new Set(
    completedInterviews
      .filter((i) => (i.overall_score || 0) >= 55)
      .map((i) => i.problem_id)
  ).size;

  // Streak: consecutive days with at least one interview
  let streak = 0;
  if (completedInterviews.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = completedInterviews
      .map((i) => {
        const d = new Date(i.completed_at || i.started_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
      .filter((v, i, a) => a.indexOf(v) === i) // unique dates
      .sort((a, b) => b - a); // newest first

    const oneDay = 86400000;
    // Check if most recent is today or yesterday
    if (dates[0] >= today.getTime() - oneDay) {
      streak = 1;
      for (let i = 1; i < dates.length; i++) {
        if (dates[i - 1] - dates[i] <= oneDay) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  // Map interviews for the history component
  const historyItems = (interviews || []).map((i) => {
    const prob = i.problems as unknown as { title: string; difficulty: string } | null;
    return {
      id: i.id,
      problemTitle: prob?.title ?? "Unknown Problem",
      difficulty: (prob?.difficulty ?? "medium") as "easy" | "medium" | "hard",
      score: i.overall_score as number | null,
      date: new Date(i.started_at).toLocaleDateString(),
      duration: i.duration_seconds as number | null,
      status: i.status as "completed" | "abandoned" | "in_progress",
    };
  });

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

      {/* Interview Types */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* DSA — active / disabled when no credits */}
        {hasCredits ? (
          <Link
            href="/interview/setup"
            className="flex items-center gap-3 rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 px-4 py-3.5 transition-all hover:border-brand-cyan/50 hover:bg-brand-cyan/8 group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-cyan/10 border border-brand-cyan/25">
              <Braces className="w-4 h-4 text-brand-cyan" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-text">DSA / Coding</p>
              <p className="text-[11px] text-brand-muted truncate">Algorithms &amp; data structures</p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-brand-border px-4 py-3.5 opacity-60 cursor-not-allowed">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface border border-brand-border">
              <Braces className="w-4 h-4 text-brand-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-muted">DSA / Coding</p>
              <p className="text-[11px] text-brand-muted/60 truncate">No credits remaining</p>
            </div>
          </div>
        )}

        {/* System Design — coming soon */}
        <div className="flex items-center gap-3 rounded-xl border border-brand-border px-4 py-3.5 opacity-50 cursor-not-allowed">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface border border-brand-border">
            <Network className="w-4 h-4 text-brand-muted" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-brand-muted">System Design</p>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-amber/10 text-brand-amber border border-brand-amber/25">
                <Lock className="w-2.5 h-2.5" />
                Soon
              </span>
            </div>
            <p className="text-[11px] text-brand-muted/60 truncate">Scalable architecture</p>
          </div>
        </div>

        {/* Machine Coding — coming soon */}
        <div className="flex items-center gap-3 rounded-xl border border-brand-border px-4 py-3.5 opacity-50 cursor-not-allowed">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface border border-brand-border">
            <MonitorSmartphone className="w-4 h-4 text-brand-muted" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-brand-muted">Machine Coding</p>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-amber/10 text-brand-amber border border-brand-amber/25">
                <Lock className="w-2.5 h-2.5" />
                Soon
              </span>
            </div>
            <p className="text-[11px] text-brand-muted/60 truncate">Multi-file IDE projects</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsOverview
        totalInterviews={totalInterviews}
        avgScore={avgScore}
        problemsSolved={problemsSolved}
        streak={streak}
      />

      {/* Quick Start CTA */}
      {isFreeTrialUser ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-green/10 via-brand-card to-brand-card rounded-xl border border-brand-green/25 p-6">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-green/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-brand-green" />
                <span className="text-brand-green text-xs font-semibold uppercase tracking-widest">
                  Free Trial
                </span>
              </div>
              <h2 className="text-xl font-bold font-heading text-brand-text mb-2">
                Try Your First Interview Free
              </h2>
              <p className="text-brand-muted text-sm mb-4 max-w-md">
                You have 1 free voice trial with Tia. It&apos;s a 5-minute
                easy-level session with a basic score summary.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/interview/setup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green text-brand-deep font-semibold text-sm rounded-lg hover:bg-brand-green/90 transition-all duration-150 shadow-lg shadow-brand-green/20"
                >
                  <Mic className="w-4 h-4" />
                  Start Free Interview
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-brand-cyan/30 text-brand-cyan text-sm font-medium rounded-lg hover:bg-brand-cyan/5 transition-colors"
                >
                  Upgrade for full access
                </Link>
              </div>
              <p className="text-brand-muted text-xs mt-3">
                Upgrade to unlock full 45-minute interviews, all difficulties, and detailed AI feedback.
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-green/10 border border-brand-green/20 shrink-0">
              <Sparkles className="w-9 h-9 text-brand-green opacity-60" />
            </div>
          </div>
        </div>
      ) : hasCredits ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-cyan/10 via-brand-card to-brand-card rounded-xl border border-brand-cyan/25 p-6">
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
                Practice with an AI interviewer named Tia. Solve DSA problems
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
            <div className="hidden sm:flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 shrink-0">
              <Mic className="w-9 h-9 text-brand-cyan opacity-60" />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-amber/5 via-brand-card to-brand-card rounded-xl border border-brand-amber/25 p-6">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-amber/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-brand-amber" />
                <span className="text-brand-amber text-xs font-semibold uppercase tracking-widest">
                  No Credits
                </span>
              </div>
              <h2 className="text-xl font-bold font-heading text-brand-text mb-2">
                You&apos;re out of interview credits
              </h2>
              <p className="text-brand-muted text-sm mb-5 max-w-md">
                Choose an interview pack to continue practicing with Tia. Keep
                sharpening your skills and land your dream offer.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-amber text-brand-deep font-semibold text-sm rounded-lg hover:bg-brand-amber/90 transition-all duration-150 shadow-lg shadow-brand-amber/20"
              >
                <CreditCard className="w-4 h-4" />
                View Packs
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="hidden sm:flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-amber/10 border border-brand-amber/20 shrink-0">
              <CreditCard className="w-9 h-9 text-brand-amber opacity-60" />
            </div>
          </div>
        </div>
      )}

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
        <InterviewHistory interviews={historyItems} />
      </div>

    </div>
  );
}
