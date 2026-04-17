"use client";

import { useState, type ElementType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  BriefcaseBusiness,
  Braces,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Flame,
  FolderKanban,
  Layers3,
  Lock,
  MonitorSmartphone,
  Network,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrepPlanCard } from "@/components/prep-plans/PrepPlanCard";
import { usePrepPlans } from "@/hooks/usePrepPlans";
import {
  DASHBOARD_FILTER_LABELS,
  PRACTICE_CARD_CONFIGS,
  getPracticeResultsHref,
  type DashboardActivityItem,
  type DashboardFilter,
  type DashboardPracticeItem,
  type PracticeAvailability,
  type PracticeCardConfig,
  type PracticeInterviewKind,
} from "@/lib/dashboard/models";
import { cn, formatDuration, getScoreColor } from "@/lib/utils";

type DashboardHomeProps = {
  displayName: string;
  credits: number;
  hasCredits: boolean;
  isFreeTrialUser: boolean;
  defaultInterviewerName: string;
  initialInterviews: DashboardPracticeItem[];
  practiceAttempts: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    category: string;
    language: string;
    isSolved: boolean;
    testsPassed: number | null;
    testsTotal: number | null;
    updatedAt: string;
  }[];
};

const PRACTICE_ICON_MAP: Record<PracticeInterviewKind, ElementType> = {
  dsa: Braces,
  machine_coding: MonitorSmartphone,
  system_design: Network,
  technical_qa: BrainCircuit,
  engineering_manager: BriefcaseBusiness,
  behavioral: ClipboardList,
};

const STATUS_STYLES: Record<
  PracticeAvailability,
  { tone: string; label: string; buttonVariant: "default" | "secondary" | "outline" }
> = {
  live: {
    tone: "border-brand-green/25 bg-brand-green/10 text-brand-green",
    label: "Live",
    buttonVariant: "default",
  },
  beta: {
    tone: "border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan",
    label: "Beta",
    buttonVariant: "secondary",
  },
  planned: {
    tone: "border-brand-amber/25 bg-brand-amber/10 text-brand-amber",
    label: "Planned",
    buttonVariant: "outline",
  },
  coming_soon: {
    tone: "border-brand-amber/25 bg-brand-amber/10 text-brand-amber",
    label: "Coming Soon",
    buttonVariant: "outline",
  },
};

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function calculateStreak(interviews: DashboardPracticeItem[]) {
  const completed = interviews.filter((item) => item.status === "completed");
  if (completed.length === 0) return 0;

  const days = completed
    .map((item) => {
      const date = new Date(item.startedAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneDay = 24 * 60 * 60 * 1000;

  if (days[0] < today.getTime() - oneDay) return 0;

  let streak = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (days[index - 1] - days[index] <= oneDay) {
      streak += 1;
      continue;
    }
    break;
  }

  return streak;
}

function buildActivityItems(
  interviews: DashboardPracticeItem[],
  plans: ReturnType<typeof usePrepPlans>["plans"],
  filter: DashboardFilter
): DashboardActivityItem[] {
  const practiceItems: DashboardActivityItem[] = interviews
    .filter((item) => filter === "all" || filter === item.kind)
    .map((item) => ({
      id: item.id,
      type: "practice" as const,
      filter: item.kind,
      title: item.title,
      subtitle: item.subtitle,
      timestamp: item.startedAt,
      href: getPracticeResultsHref(item.kind, item.id),
      statusLabel: item.status.replace(/_/g, " "),
      score: item.score,
    }));

  const prepItems: DashboardActivityItem[] = plans
    .filter((plan) => {
      if (filter === "all" || filter === "prep_plans") return true;
      const track = plan.tracks.find((item) => item.kind === filter);
      return Boolean(track && (track.status !== "not_started" || track.priority === "core"));
    })
    .map((plan) => {
      const relatedTrack =
        filter !== "all" && filter !== "prep_plans"
          ? plan.tracks.find((item) => item.kind === filter) ?? plan.tracks[0]
          : plan.tracks.find((item) => item.kind === plan.nextRecommendedKind) ?? plan.tracks[0];

      return {
        id: plan.id,
        type: "prep_plan" as const,
        filter: "prep_plans" as const,
        relatedKind: relatedTrack.kind,
        title: plan.label,
        subtitle: `${relatedTrack.title ?? DASHBOARD_FILTER_LABELS[relatedTrack.kind]} · ${relatedTrack.nextActionLabel}`,
        timestamp: plan.updatedAt,
        href: `/prep-plans/${plan.id}`,
        statusLabel: plan.status,
      };
    });

  return [...practiceItems, ...prepItems].sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
  );
}

function PracticeCard({
  config,
  filter,
  hasCredits,
}: {
  config: PracticeCardConfig;
  filter: DashboardFilter;
  hasCredits: boolean;
}) {
  const Icon = PRACTICE_ICON_MAP[config.kind];
  const style = STATUS_STYLES[config.status];
  const isDimmed =
    filter !== "all" && filter !== "prep_plans" && filter !== config.kind;
  const isLocked = config.status === "coming_soon";
  const ctaHref =
    config.status === "live" && !hasCredits ? "/settings" : config.href;
  const ctaLabel =
    config.status === "live" && !hasCredits ? "Buy Credits" : config.ctaLabel;
  const isDsaCard = config.kind === "dsa";

  return (
    <div
      className={cn(
        "rounded-2xl border border-brand-border bg-brand-card p-5 transition-all",
        isDimmed && "opacity-55"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-brand-surface">
          <Icon className="h-5 w-5 text-brand-cyan" />
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
            style.tone
          )}
        >
          {style.label}
        </span>
      </div>

      <h3 className="mt-5 text-lg font-semibold text-brand-text">{config.label}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-muted">
        {config.shortDescription}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {config.setupHighlights.map((item) => (
          <span
            key={`${config.kind}-${item}`}
            className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mt-5">
        {isLocked ? (
          <Button size="sm" variant="outline" disabled>
            {ctaLabel}
            <Lock className="h-3.5 w-3.5" />
          </Button>
        ) : isDsaCard ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/interview/setup?dsaExperience=practice">
                Practice
                <span className="rounded-full border border-brand-green/25 bg-brand-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-green">
                  Free
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={hasCredits ? "/interview/setup?dsaExperience=ai_interview" : "/settings"}>
                {hasCredits ? "AI Interview" : "Buy Credits"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        ) : (
          <Button asChild size="sm" variant={style.buttonVariant}>
            <Link href={ctaHref}>
              {ctaLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: DashboardActivityItem }) {
  return (
    <Link
      href={item.href}
      className="flex flex-col gap-3 rounded-xl border border-brand-border bg-brand-card px-4 py-4 transition-colors hover:border-brand-cyan/25 hover:bg-brand-card/90 sm:flex-row sm:items-center"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-surface">
        {item.type === "practice" ? (
          <Layers3 className="h-4 w-4 text-brand-cyan" />
        ) : (
          <FolderKanban className="h-4 w-4 text-brand-green" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-brand-text">{item.title}</p>
          <span className="rounded-full border border-brand-border bg-brand-surface px-2 py-0.5 text-[11px] text-brand-muted">
            {item.type === "practice"
              ? DASHBOARD_FILTER_LABELS[item.filter]
              : DASHBOARD_FILTER_LABELS[item.relatedKind]}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-brand-muted">{item.subtitle}</p>
      </div>

      <div className="w-full border-t border-brand-border/70 pt-3 text-left sm:w-auto sm:border-t-0 sm:pt-0 sm:text-right">
        <p className="text-xs font-medium capitalize text-brand-text">
          {item.statusLabel}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-brand-muted sm:justify-end">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatShortDate(item.timestamp)}
          </span>
          {item.type === "practice" && item.score !== null ? (
            <span className={cn("font-semibold", getScoreColor(item.score))}>
              {item.score}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function DashboardHome({
  displayName,
  credits,
  hasCredits,
  isFreeTrialUser,
  defaultInterviewerName,
  initialInterviews,
  practiceAttempts,
}: DashboardHomeProps) {
  const prepPlansComingSoon = true;
  const { plans, isLoaded, deletePlan } = usePrepPlans();
  const [filter, setFilter] = useState<DashboardFilter>("all");

  const filteredInterviews =
    filter === "all" || filter === "prep_plans"
      ? initialInterviews
      : initialInterviews.filter((item) => item.kind === filter);

  const activityItems = buildActivityItems(initialInterviews, plans, filter).slice(0, 8);

  const totalTracks = plans.flatMap((plan) => plan.tracks);
  const inProgressTracks = totalTracks.filter((track) => track.status === "in_progress").length;
  const completedTracks = totalTracks.filter((track) => track.status === "completed").length;
  const recentlyUpdatedPlans = plans.filter((plan) => {
    const age = Date.now() - new Date(plan.updatedAt).getTime();
    return age <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const completedPractice = filteredInterviews.filter((item) => item.status === "completed");
  const averageScore = completedPractice.length
    ? Math.round(
        completedPractice.reduce((sum, item) => sum + (item.score ?? 0), 0) /
          completedPractice.length
      )
    : 0;
  const sessionsThisWeek = filteredInterviews.filter((item) => {
    const age = Date.now() - new Date(item.startedAt).getTime();
    return age <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const streak = calculateStreak(filteredInterviews);

  const statCards =
    filter === "prep_plans"
      ? [
          {
            label: "Active Plans",
            value: plans.length,
            icon: FolderKanban,
            accent: "text-brand-cyan",
            surface: "bg-brand-cyan/10",
          },
          {
            label: "Tracks In Progress",
            value: inProgressTracks,
            icon: Sparkles,
            accent: "text-brand-green",
            surface: "bg-brand-green/10",
          },
          {
            label: "Completed Tracks",
            value: completedTracks,
            icon: CheckCircle2,
            accent: "text-brand-amber",
            surface: "bg-brand-amber/10",
          },
          {
            label: "Updated This Week",
            value: recentlyUpdatedPlans,
            icon: CalendarClock,
            accent: "text-brand-rose",
            surface: "bg-brand-rose/10",
          },
        ]
      : [
          {
            label: "Practice Sessions",
            value: filteredInterviews.length,
            icon: Layers3,
            accent: "text-brand-cyan",
            surface: "bg-brand-cyan/10",
          },
          {
            label: "Average Score",
            value: averageScore === 0 ? "—" : `${averageScore}/100`,
            icon: Target,
            accent: "text-brand-green",
            surface: "bg-brand-green/10",
          },
          {
            label: filter === "all" ? "Active Prep Plans" : "Completed Rounds",
            value: filter === "all" ? plans.length : completedPractice.length,
            icon: filter === "all" ? FolderKanban : CheckCircle2,
            accent: "text-brand-amber",
            surface: "bg-brand-amber/10",
          },
          {
            label: filter === "all" ? "Current Streak" : "Sessions This Week",
            value: filter === "all" ? `${streak} day${streak === 1 ? "" : "s"}` : sessionsThisWeek,
            icon: filter === "all" ? Flame : CalendarClock,
            accent: "text-brand-rose",
            surface: "bg-brand-rose/10",
          },
        ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rounded-3xl border border-brand-border bg-brand-card p-6 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-brand-cyan">Dashboard</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-text">
              Welcome back, <span className="text-brand-cyan">{displayName}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted">
              Choose between free Practice Mode and AI Interview Mode. Solo DSA work stays lightweight,
              while voice-based rounds start with {defaultInterviewerName} when you want pressure and feedback.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
                Credits: <span className="font-semibold text-brand-text">{credits}</span>
              </span>
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  isFreeTrialUser
                    ? "border-brand-green/25 bg-brand-green/10 text-brand-green"
                    : hasCredits
                      ? "border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan"
                      : "border-brand-amber/25 bg-brand-amber/10 text-brand-amber"
                )}
              >
                {isFreeTrialUser
                  ? "Audio preview available"
                  : hasCredits
                    ? "AI interview ready"
                    : "Practice free"}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {prepPlansComingSoon ? (
                <Button variant="outline" disabled>
                  Prep Plans coming soon
                  <Sparkles className="h-4 w-4" />
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/prep-plans/new">
                    Create Prep Plan
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="secondary">
                <Link href="/interview/setup?dsaExperience=ai_interview">
                  <Sparkles className="h-4 w-4" />
                  Start AI interview
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(Object.keys(DASHBOARD_FILTER_LABELS) as DashboardFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                filter === item
                  ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan"
                  : "border-brand-border bg-brand-surface text-brand-muted hover:text-brand-text"
              )}
            >
              {DASHBOARD_FILTER_LABELS[item]}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-brand-text">Free Solver Activity</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Jump back into your saved Practice Mode problems or turn them into an AI interview.
            </p>
          </div>
          <Link
            href="/interview/setup?dsaExperience=practice"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-cyan"
          >
            Practice free
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {practiceAttempts.length === 0 ? (
          <div className="rounded-2xl border border-brand-border bg-brand-card p-8 text-center">
            <BookOpenText className="mx-auto h-10 w-10 text-brand-cyan" />
            <h3 className="mt-4 text-lg font-semibold text-brand-text">No saved practice yet</h3>
            <p className="mt-2 text-sm text-brand-muted">
              Start in Practice Mode and your latest DSA attempts will show up here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {practiceAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="rounded-2xl border border-brand-border bg-brand-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-text">{attempt.title}</p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {attempt.category} · {attempt.language}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      attempt.isSolved
                        ? "border-brand-green/25 bg-brand-green/10 text-brand-green"
                        : "border-brand-amber/25 bg-brand-amber/10 text-brand-amber"
                    )}
                  >
                    {attempt.isSolved ? "Solved" : "In progress"}
                  </span>
                </div>

                <p className="mt-3 text-xs text-brand-muted">
                  {attempt.testsTotal
                    ? `${attempt.testsPassed}/${attempt.testsTotal} tests passed`
                    : "Code saved, no recent test run"}
                </p>
                <p className="mt-1 text-xs text-brand-muted">
                  Updated {formatShortDate(attempt.updatedAt)}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={`/practice/solve/${attempt.slug}`}>
                      Resume Practice
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/interview/setup?problem=${attempt.slug}&dsaExperience=ai_interview`}>
                      AI Interview
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-brand-text">Practice Now</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Start with free DSA practice or jump straight into AI Interview Mode.
            </p>
          </div>
          <Link
            href="/interviews/dsa/setup"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-cyan"
          >
            Open DSA setup
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PRACTICE_CARD_CONFIGS.map((config) => (
            <PracticeCard
              key={config.kind}
              config={config}
              filter={filter}
              hasCredits={hasCredits}
            />
          ))}
        </div>
      </section>

      <section
        className={cn(
          "space-y-4 rounded-3xl border p-5 sm:p-6",
          filter === "prep_plans"
            ? "border-brand-cyan/25 bg-brand-cyan/[0.04]"
            : "border-brand-border bg-transparent"
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-brand-text">Prep Plans</h2>
              {prepPlansComingSoon ? (
                <span className="rounded-full border border-brand-amber/25 bg-brand-amber/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber">
                  Coming Soon
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-brand-muted">
              Plan creation is temporarily paused while we refine the company-matched prep
              experience and bring the full workspace back in a cleaner shape.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3 lg:flex-nowrap lg:justify-end">
            <Button variant="secondary" disabled={prepPlansComingSoon}>
              View all plans
            </Button>
            <Button variant="outline" disabled>
              Create Prep Plan
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isLoaded ? (
          <div className="rounded-2xl border border-brand-border bg-brand-card p-6 text-sm text-brand-muted">
            Loading saved prep plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-border bg-brand-card p-8 text-center">
            <BookOpenText className="mx-auto h-10 w-10 text-brand-cyan" />
            <h3 className="mt-4 text-lg font-semibold text-brand-text">
              Prep Plans are coming soon
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              We&apos;re tightening the planning experience so company, role, and JD context turn
              into higher-signal prep loops before the feature goes live again.
            </p>
            <div className="mt-5">
              <Button variant="outline" disabled>
                Prep Plans coming soon
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {plans.slice(0, 2).map((plan) => (
              <PrepPlanCard
                key={plan.id}
                plan={plan}
                compact
                onDelete={deletePlan}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-text">Unified Stats</h2>
          <p className="mt-1 text-sm text-brand-muted">
            {filter === "prep_plans"
              ? "Filter switched to Prep Plans, so these metrics focus on plan progress."
              : `Filtered to ${DASHBOARD_FILTER_LABELS[filter]}. Practice metrics stay visible without hiding the broader product shape.`}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-brand-border bg-brand-card p-5">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", card.surface)}>
                <card.icon className={cn("h-5 w-5", card.accent)} />
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-brand-muted">
                {card.label}
              </p>
              <p className={cn("mt-2 text-2xl font-semibold", card.accent)}>{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-brand-text">Recent Activity</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Practice sessions and prep-plan progress show up in one activity feed, clearly labeled by type.
            </p>
          </div>
          <Link href="/prep-plans" className="inline-flex items-center gap-1 text-sm font-medium text-brand-cyan">
            Open prep plans
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activityItems.length === 0 ? (
          <div className="rounded-2xl border border-brand-border bg-brand-card p-8 text-center">
            <Layers3 className="mx-auto h-10 w-10 text-brand-cyan" />
            <h3 className="mt-4 text-lg font-semibold text-brand-text">No activity yet</h3>
            <p className="mt-2 text-sm text-brand-muted">
              Start a DSA round or create a prep plan and your recent activity will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activityItems.map((item) => (
              <ActivityRow key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}

        {filter !== "prep_plans" && initialInterviews.length > 0 ? (
          <p className="text-xs text-brand-muted">
            Session durations include coding-runtime data when available. Example: the latest round took{" "}
            <span className="text-brand-text">
              {formatDuration(initialInterviews[0].durationSeconds ?? 0)}
            </span>
            .
          </p>
        ) : null}
      </section>
    </div>
  );
}
