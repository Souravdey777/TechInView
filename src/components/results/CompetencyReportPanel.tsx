"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  MinusCircle,
  Quote,
  Scale,
} from "lucide-react";
import type {
  CompetencyRating,
  CompetencyReport,
  CompetencySignal,
  StarCoverage,
} from "@/types";

const RATING_TONES: Record<
  CompetencyRating,
  { label: string; text: string; bg: string; border: string; bar: string; blurb: string }
> = {
  strong: {
    label: "Strong",
    text: "text-brand-green",
    bg: "bg-brand-green/10",
    border: "border-brand-green/25",
    bar: "bg-brand-green",
    blurb: "Specific example, your own action, concrete outcome.",
  },
  solid: {
    label: "Solid",
    text: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
    border: "border-brand-cyan/25",
    bar: "bg-brand-cyan",
    blurb: "Real example, but one dimension was missing.",
  },
  mixed: {
    label: "Mixed",
    text: "text-brand-amber",
    bg: "bg-brand-amber/10",
    border: "border-brand-amber/25",
    bar: "bg-brand-amber",
    blurb: "Part evidence, part assertion, or needed heavy prompting.",
  },
  insufficient: {
    label: "Not Evidenced",
    text: "text-brand-rose",
    bg: "bg-brand-rose/10",
    border: "border-brand-rose/25",
    bar: "bg-brand-rose",
    blurb: "No specific example surfaced in this round.",
  },
};

const RATING_ICONS: Record<CompetencyRating, typeof CheckCircle2> = {
  strong: CheckCircle2,
  solid: CheckCircle2,
  mixed: AlertTriangle,
  insufficient: MinusCircle,
};

const STAR_PARTS: { key: keyof StarCoverage; label: string; hint: string }[] = [
  { key: "situation", label: "Situation", hint: "Context, scope, and why it mattered." },
  { key: "task", label: "Task", hint: "What you were specifically responsible for." },
  { key: "action", label: "Action", hint: "What you personally did, not the team." },
  { key: "result", label: "Result", hint: "The measurable outcome you can name." },
  { key: "reflection", label: "Reflection", hint: "What you would do differently." },
];

function starTone(value: number) {
  if (value >= 80) return { text: "text-brand-green", bar: "bg-brand-green" };
  if (value >= 60) return { text: "text-brand-cyan", bar: "bg-brand-cyan" };
  if (value >= 40) return { text: "text-brand-amber", bar: "bg-brand-amber" };
  return { text: "text-brand-rose", bar: "bg-brand-rose" };
}

function CompetencyCard({ signal }: { signal: CompetencySignal }) {
  const tone = RATING_TONES[signal.rating] ?? RATING_TONES.mixed;
  const Icon = RATING_ICONS[signal.rating] ?? AlertTriangle;
  const score = Math.min(100, Math.max(0, signal.score));

  return (
    <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone.border} ${tone.bg}`}
          >
            <Icon className={`h-5 w-5 ${tone.text}`} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-brand-text">
              {signal.label}
            </h3>
            <p
              className={`mt-1 text-xs font-semibold uppercase tracking-[0.14em] ${tone.text}`}
            >
              {tone.label}
            </p>
          </div>
        </div>
        <span className={`shrink-0 text-2xl font-bold tabular-nums ${tone.text}`}>
          {score}
          <span className="text-xs font-normal text-brand-muted">/100</span>
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-brand-surface">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${score}%` }} />
      </div>

      <div className="mt-5 space-y-4 text-sm leading-relaxed">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          <Quote className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted" />
          <p className="text-brand-muted">
            <span className="font-semibold text-brand-text">What the interviewer heard: </span>
            {signal.evidence}
          </p>
        </div>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
          <p className="text-brand-muted">
            <span className="font-semibold text-brand-text">Still missing: </span>
            {signal.gap}
          </p>
        </div>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
          <p className="text-brand-muted">
            <span className="font-semibold text-brand-text">Do this next time: </span>
            {signal.upgrade}
          </p>
        </div>
      </div>
    </div>
  );
}

function StarCoveragePanel({ coverage }: { coverage: StarCoverage }) {
  return (
    <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-brand-text">
        <ClipboardList className="h-4 w-4 text-brand-cyan" />
        Story Structure Coverage
      </div>
      <p className="mt-2 text-sm leading-relaxed text-brand-muted">
        How completely your answers supplied each part of the structure interviewers grade.
        A low bar means that part was thin or absent, not that the story was bad.
      </p>
      <div className="mt-5 space-y-4">
        {STAR_PARTS.map((part) => {
          const value = Math.min(100, Math.max(0, coverage[part.key]));
          const tone = starTone(value);

          return (
            <div key={part.key}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-brand-text">{part.label}</p>
                <span className={`text-sm font-bold tabular-nums ${tone.text}`}>{value}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-surface">
                <div
                  className={`h-full rounded-full ${tone.bar}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-brand-muted">{part.hint}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type CompetencyReportPanelProps = {
  report: CompetencyReport;
  /** Section heading, e.g. "Leadership Signals" or "Competency Signals". */
  title?: string;
  description?: string;
};

/**
 * Shared report section for behaviour-led rounds. Renders the per-competency
 * evidence cards, the interviewer's debrief note, story-structure coverage, and
 * the rehearsal drills produced by the scorer.
 */
export function CompetencyReportPanel({
  report,
  title = "Competency Signals",
  description,
}: CompetencyReportPanelProps) {
  if (!report || report.competencies.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
            <Scale className="h-3 w-3" />
            {report.framework_label}
          </span>
        </div>
        <p className="mt-1 text-sm text-brand-muted">
          {description ??
            `Each competency you selected, graded on the evidence you actually gave. Ratings are based on specific examples, not delivery.`}
        </p>
      </div>

      {report.debrief_note ? (
        <div className="rounded-3xl border border-brand-cyan/25 bg-brand-cyan/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-cyan">
            <ClipboardList className="h-4 w-4" />
            Interviewer debrief note
          </div>
          <p className="mt-3 text-sm leading-relaxed text-brand-text">
            {report.debrief_note}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {report.competencies.map((signal) => (
          <CompetencyCard key={signal.competency_id} signal={signal} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {report.star_coverage ? (
          <StarCoveragePanel coverage={report.star_coverage} />
        ) : null}

        {report.follow_up_drills && report.follow_up_drills.length > 0 ? (
          <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-text">
              <Dumbbell className="h-4 w-4 text-brand-amber" />
              Rehearse before your next attempt
            </div>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              Specific fixes for the gaps above, in priority order.
            </p>
            <ol className="mt-4 space-y-3">
              {report.follow_up_drills.map((drill, index) => (
                <li
                  key={drill}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm leading-relaxed text-brand-muted"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-surface text-xs font-semibold text-brand-text">
                    {index + 1}
                  </span>
                  <span>{drill}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
