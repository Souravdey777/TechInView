"use client";

import { ROUND_TYPE_LABELS } from "@/lib/loops/round-config";
import type { RoundContextSnapshot } from "@/lib/loops/types";
import { CHIP, LABEL } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

type RoundBriefPanelProps = {
  round: RoundContextSnapshot;
  company?: string | null;
  roleTitle?: string | null;
  loopName?: string | null;
};

// Static tags, so drop the chip's hover colour.
const TAG = cn(CHIP, "hover:text-brand-muted");

/**
 * Left pane of the discussion rooms: round metadata, then hairline-divided
 * sections (brief, focus areas, value lens, question patterns) with mono labels.
 */
export function RoundBriefPanel({
  round,
  company,
  roleTitle,
  loopName,
}: RoundBriefPanelProps) {
  // Behaviour-led rounds carry a value lens; coding and technical Q&A do not.
  const values = round.valuesContext ?? null;

  return (
    <div className="h-full divide-y divide-white/[0.08] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-brand-border">
      <div className="space-y-3 px-5 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={LABEL}>{ROUND_TYPE_LABELS[round.roundType]}</span>
          {company && <span className={cn(TAG, "capitalize")}>{company}</span>}
        </div>
        <h2 className="text-xl font-medium leading-snug tracking-[-0.02em] text-brand-text">{round.title}</h2>
        {loopName && (
          <p className="font-mono text-[11px] tracking-[0.04em] text-brand-subtle">
            {loopName}
            {roleTitle ? ` · ${roleTitle}` : ""}
          </p>
        )}
      </div>

      <section className="px-5 py-5">
        <div className={LABEL}>Round brief</div>
        <p className="mt-3 text-sm leading-relaxed text-brand-text">{round.summary}</p>
        <p className="mt-3 text-xs leading-relaxed text-brand-muted">{round.rationale}</p>
      </section>

      <section className="space-y-3 px-5 py-5">
        <div className={LABEL}>Focus areas</div>
        <div className="flex flex-wrap gap-2">
          {round.focusAreas.map((focus) => (
            <span key={`${round.id}-${focus}`} className={TAG}>
              {focus}
            </span>
          ))}
        </div>
      </section>

      {values && values.competencies.length > 0 ? (
        <section className="px-5 py-5">
          <div className={LABEL}>Graded against</div>
          <p className="mt-3 text-[15px] text-brand-text">{values.frameworkLabel}</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">
            {values.frameworkOrigin}
          </p>
          <ul className="mt-4 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {values.competencies.map((competency) => (
              <li key={`${round.id}-${competency.id}`} className="py-3">
                <span className="block text-sm font-medium text-brand-text">{competency.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-brand-muted">
                  {competency.description}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="px-5 py-5">
        <div className={LABEL}>Historical question patterns</div>
        {round.historicalQuestions.length > 0 ? (
          <ul className="mt-3 divide-y divide-white/[0.08]">
            {round.historicalQuestions.map((question) => (
              <li key={question.id} className="py-3 first:pt-0">
                <p className="text-sm leading-relaxed text-brand-text">{question.prompt}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {question.topics.map((topic) => (
                    <span key={`${question.id}-${topic}`} className={TAG}>
                      {topic}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-brand-muted">
            This round is driven directly by your selected setup rather than a historical-question corpus.
          </p>
        )}
      </section>
    </div>
  );
}
