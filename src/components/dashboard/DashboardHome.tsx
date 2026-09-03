"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonoLabel, Rack } from "@/components/shared/Rack";
import { PrepPlanCard } from "@/components/prep-plans/PrepPlanCard";
import { usePrepPlans } from "@/hooks/usePrepPlans";
import { MeterStrip } from "@/components/dashboard/home/MeterStrip";
import { ScoreTrendPanel } from "@/components/dashboard/home/ScoreTrendPanel";
import { DimensionAverages } from "@/components/dashboard/home/DimensionAverages";
import { RoundLaunchers } from "@/components/dashboard/home/RoundLaunchers";
import {
  ContinueRack,
  type ContinueAttempt,
} from "@/components/dashboard/home/ContinueRack";
import { SessionLog } from "@/components/dashboard/home/SessionLog";
import type { DashboardSummary } from "@/lib/dashboard/home-metrics";
import type { SessionLogRow } from "@/lib/dashboard/session-log";

type DashboardHomeProps = {
  credits: number;
  hasCredits: boolean;
  isFreeTrialUser: boolean;
  summary: DashboardSummary;
  sessionRows: SessionLogRow[];
  practiceAttempts: ContinueAttempt[];
};

export function DashboardHome({
  credits,
  hasCredits,
  isFreeTrialUser,
  summary,
  sessionRows,
  practiceAttempts,
}: DashboardHomeProps) {
  const { plans, isLoaded, deletePlan } = usePrepPlans();

  const canStartRound = hasCredits || isFreeTrialUser;
  const primaryAction = canStartRound
    ? {
        href: "/interview/setup?dsaExperience=ai_interview",
        label: isFreeTrialUser && !hasCredits ? "Start audio preview" : "Start round",
      }
    : { href: "/settings#rounds", label: "Buy rounds" };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* ─── Hero ─── */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <MonoLabel>Studio</MonoLabel>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            {summary.headline}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-muted">
            {summary.insight}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="gap-2 text-base font-semibold">
            <Link href={primaryAction.href}>
              {primaryAction.label}
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link href="/interview/setup?dsaExperience=practice">
              Practice free
            </Link>
          </Button>
        </div>
      </header>

      {/* ─── Meters ─── */}
      <MeterStrip meters={summary.meters} />

      {/* ─── Trend and dimensions ─── */}
      <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          <ScoreTrendPanel trend={summary.trend} />
        </div>
        <div className="lg:col-span-5">
          <DimensionAverages
            dimensions={summary.dimensions}
            note={summary.dimensionsNote}
            footnote={summary.dimensionsFootnote}
          />
        </div>
      </div>

      {/* ─── Resume saved practice ─── */}
      {practiceAttempts.length > 0 ? (
        <ContinueRack attempts={practiceAttempts} />
      ) : null}

      {/* ─── Launchers ─── */}
      <RoundLaunchers hasCredits={hasCredits} canPreview={isFreeTrialUser} />

      {/* ─── Prep Guru ─── */}
      <Rack
        label={<MonoLabel className="tracking-[0.18em]">Prep Guru</MonoLabel>}
        accessory={
          <Link
            href="/prep-guru"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-cyan hover:underline"
          >
            {plans.length > 0 ? "View all plans" : "Open Prep Guru"}
          </Link>
        }
      >
        {!isLoaded ? (
          <p className="text-xs text-brand-muted">Loading saved prep plans…</p>
        ) : plans.length === 0 ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-xs leading-relaxed text-brand-muted">
              Paste a job description, or name the company and role. Prep Guru
              maps the rounds you are likely to face and the questions that have
              actually been reported for them.
            </p>
            <Button asChild size="sm" className="shrink-0">
              <Link href="/prep-guru">
                Ask Prep Guru
                <Sparkles className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {plans.slice(0, 2).map((plan) => (
              <PrepPlanCard key={plan.id} plan={plan} compact onDelete={deletePlan} />
            ))}
          </div>
        )}
      </Rack>

      {/* ─── Session log ─── */}
      <SessionLog rows={sessionRows} />

      <p className="pb-6 text-center text-xs text-brand-subtle">
        {hasCredits
          ? `${credits} round${credits === 1 ? "" : "s"} left on your account.`
          : isFreeTrialUser
            ? "Your audio preview is still unused. Practice Mode stays free either way."
            : "Practice Mode stays free."}{" "}
        <Link href="/settings#rounds" className="text-brand-cyan hover:underline">
          Manage rounds
        </Link>
        <ArrowRight className="ml-1 inline h-3 w-3 text-brand-cyan" />
      </p>
    </div>
  );
}
