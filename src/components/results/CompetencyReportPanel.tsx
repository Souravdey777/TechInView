"use client";

import { BODY, CELL, CHIP, GRID, LABEL } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";
import type {
  CompetencyRating,
  CompetencyReport,
  CompetencySignal,
  StarCoverage,
} from "@/types";

const RATING_TONES: Record<
  CompetencyRating,
  { label: string; text: string; bar: string; blurb: string }
> = {
  strong: {
    label: "Strong",
    text: "text-brand-green",
    bar: "bg-brand-green",
    blurb: "Specific example, your own action, concrete outcome.",
  },
  solid: {
    label: "Solid",
    text: "text-brand-cyan",
    bar: "bg-brand-cyan",
    blurb: "Real example, but one dimension was missing.",
  },
  mixed: {
    label: "Mixed",
    text: "text-brand-amber",
    bar: "bg-brand-amber",
    blurb: "Part evidence, part assertion, or needed heavy prompting.",
  },
  insufficient: {
    label: "Not Evidenced",
    text: "text-brand-rose",
    bar: "bg-brand-rose",
    blurb: "No specific example surfaced in this round.",
  },
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
  const score = Math.min(100, Math.max(0, signal.score));

  return (
    <li className={cn(CELL, "flex flex-col p-6")}>
      <div className={cn(LABEL, "flex justify-between gap-4")}>
        <span className={tone.text}>{tone.label}</span>
        <span className="tabular-nums">
          <span className={tone.text}>{score}</span>/100
        </span>
      </div>
      <h3 className="mt-5 text-[17px] tracking-[-0.01em] text-brand-text">{signal.label}</h3>
      <div className="mt-3 h-0.5 bg-white/[0.08]">
        <div className={cn("h-full", tone.bar)} style={{ width: `${Math.max(2, score)}%` }} />
      </div>

      <dl className="mt-5 divide-y divide-white/[0.08] border-t border-white/[0.08]">
        <div className="py-4">
          <dt className={LABEL}>What the interviewer heard</dt>
          <dd className={cn(BODY, "mt-2")}>{signal.evidence}</dd>
        </div>
        <div className="py-4">
          <dt className={LABEL}>Still missing</dt>
          <dd className={cn(BODY, "mt-2")}>{signal.gap}</dd>
        </div>
        <div className="pt-4">
          <dt className={LABEL}>Do this next time</dt>
          <dd className="mt-2 text-[15px] leading-relaxed text-brand-text">{signal.upgrade}</dd>
        </div>
      </dl>
    </li>
  );
}

function StarCoveragePanel({ coverage }: { coverage: StarCoverage }) {
  return (
    <div className={cn(CELL, "p-6")}>
      <h3 className="text-xl font-medium tracking-[-0.02em] text-brand-text">Story structure coverage</h3>
      <p className={cn(BODY, "mt-2")}>
        How completely your answers supplied each part of the structure interviewers grade.
        A low bar means that part was thin or absent, not that the story was bad.
      </p>
      <div className="mt-5 divide-y divide-white/[0.08] border-t border-white/[0.08]">
        {STAR_PARTS.map((part) => {
          const value = Math.min(100, Math.max(0, coverage[part.key]));
          const tone = starTone(value);

          return (
            <div key={part.key} className="py-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[15px] text-brand-text">{part.label}</p>
                <span className={cn("font-mono text-xs tabular-nums", tone.text)}>{value}</span>
              </div>
              <div className="mt-2 h-0.5 bg-white/[0.08]">
                <div className={cn("h-full", tone.bar)} style={{ width: `${Math.max(2, value)}%` }} />
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-brand-muted">{part.hint}</p>
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

  const hasStar = Boolean(report.star_coverage);
  const hasDrills = Boolean(report.follow_up_drills && report.follow_up_drills.length > 0);

  return (
    <section className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-normal tracking-[-0.03em] text-brand-text">{title}</h2>
          <span className={CHIP}>{report.framework_label}</span>
        </div>
        <p className={cn(BODY, "mt-2 max-w-prose")}>
          {description ??
            `Each competency you selected, graded on the evidence you actually gave. Ratings are based on specific examples, not delivery.`}
        </p>
      </div>

      {report.debrief_note ? (
        <figure className="border-l border-white/[0.18] pl-5">
          <figcaption className={LABEL}>Interviewer debrief note</figcaption>
          <blockquote className="mt-3 text-[17px] leading-relaxed text-brand-text">
            {report.debrief_note}
          </blockquote>
        </figure>
      ) : null}

      <ul className={cn(GRID, "md:grid-cols-2")}>
        {report.competencies.map((signal) => (
          <CompetencyCard key={signal.competency_id} signal={signal} />
        ))}
      </ul>

      {hasStar || hasDrills ? (
        <div className={cn(GRID, hasStar && hasDrills && "md:grid-cols-2")}>
          {report.star_coverage ? (
            <StarCoveragePanel coverage={report.star_coverage} />
          ) : null}

          {report.follow_up_drills && report.follow_up_drills.length > 0 ? (
            <div className={cn(CELL, "p-6")}>
              <h3 className="text-xl font-medium tracking-[-0.02em] text-brand-text">
                Rehearse before your next attempt
              </h3>
              <p className={cn(BODY, "mt-2")}>
                Specific fixes for the gaps above, in priority order.
              </p>
              <ol className="mt-5 divide-y divide-white/[0.08] border-t border-white/[0.08]">
                {report.follow_up_drills.map((drill, index) => (
                  <li
                    key={drill}
                    className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 py-4 text-[15px] leading-relaxed text-brand-muted"
                  >
                    <span className="pt-0.5 font-mono text-xs tabular-nums text-brand-subtle">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{drill}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
