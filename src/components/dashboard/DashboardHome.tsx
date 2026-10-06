"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonoLabel, Rack } from "@/components/shared/Rack";
import {
  BODY,
  ButtonLink,
  FOCUS,
  Kicker,
  LEAD,
  LINK_ARROW,
} from "@/components/marketing/ds";
import { cn } from "@/lib/utils";
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
    <div className="stagger-in space-y-6">
      {/* ─── Hero ─── */}
      <header className="flex flex-col gap-8 pb-4 pt-2 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="min-w-0">
          <Kicker>Studio</Kicker>
          <h1 className="text-balance text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
            {summary.greeting}
          </h1>
          <p className="mt-4 text-xl font-normal tracking-[-0.02em] text-brand-text/90">
            {summary.headline}
          </p>
          <p className={cn(LEAD, "mt-3 max-w-[620px]")}>{summary.insight}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href={primaryAction.href}>
            {primaryAction.label}
            <ChevronRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/interview/setup?dsaExperience=practice" variant="ghost">
            Practice free
          </ButtonLink>
        </div>
      </header>

      {/* ─── Meters ─── */}
      <MeterStrip meters={summary.meters} />

      {/* ─── Trend and dimensions ─── */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
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
        label={<MonoLabel>Prep Guru</MonoLabel>}
        accessory={
          <Link href="/prep-guru" className={LINK_ARROW}>
            {plans.length > 0 ? "View all plans" : "Open Prep Guru"}
            <span aria-hidden>→</span>
          </Link>
        }
      >
        {!isLoaded ? (
          <p className={BODY}>Loading saved prep plans…</p>
        ) : plans.length === 0 ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className={cn(BODY, "max-w-xl")}>
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

      <p className="border-t border-white/[0.08] pb-6 pt-6 text-center text-sm text-brand-subtle">
        {hasCredits
          ? `${credits} round${credits === 1 ? "" : "s"} left on your account.`
          : isFreeTrialUser
            ? "Your audio preview is still unused. Practice Mode stays free either way."
            : "Practice Mode stays free."}{" "}
        <Link
          href="/settings#rounds"
          className={cn("text-brand-cyan hover:text-brand-text", FOCUS)}
        >
          Manage rounds
          <ArrowRight className="ml-1 inline h-3 w-3" />
        </Link>
      </p>
    </div>
  );
}
