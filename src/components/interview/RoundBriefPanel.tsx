"use client";

import { FileText, MessageSquare, Target } from "lucide-react";
import { ROUND_TYPE_LABELS } from "@/lib/loops/round-config";
import type { RoundContextSnapshot } from "@/lib/loops/types";

type RoundBriefPanelProps = {
  round: RoundContextSnapshot;
  company?: string | null;
  roleTitle?: string | null;
  loopName?: string | null;
};

export function RoundBriefPanel({
  round,
  company,
  roleTitle,
  loopName,
}: RoundBriefPanelProps) {
  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-brand-border">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-2.5 py-0.5 text-xs font-semibold text-brand-cyan">
            {ROUND_TYPE_LABELS[round.roundType]}
          </span>
          {company && (
            <span className="rounded-full border border-brand-border bg-brand-card px-2.5 py-0.5 text-xs text-brand-muted capitalize">
              {company}
            </span>
          )}
        </div>
        <h2 className="text-base font-bold leading-snug text-brand-text">{round.title}</h2>
        {loopName && (
          <p className="text-xs text-brand-muted">
            {loopName}
            {roleTitle ? ` · ${roleTitle}` : ""}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface px-4 py-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
          <FileText className="h-3.5 w-3.5" />
          Round Brief
        </div>
        <p className="mt-3 text-sm leading-relaxed text-brand-text">{round.summary}</p>
        <p className="mt-3 text-xs leading-relaxed text-brand-muted">{round.rationale}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
          <Target className="h-3.5 w-3.5 text-brand-cyan" />
          Focus Areas
        </div>
        <div className="flex flex-wrap gap-2">
          {round.focusAreas.map((focus) => (
            <span
              key={`${round.id}-${focus}`}
              className="rounded-full border border-brand-border bg-brand-card px-3 py-1 text-xs text-brand-muted"
            >
              {focus}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
          <MessageSquare className="h-3.5 w-3.5 text-brand-cyan" />
          Historical Question Patterns
        </div>
        {round.historicalQuestions.length > 0 ? (
          round.historicalQuestions.map((question) => (
            <div
              key={question.id}
              className="rounded-lg border border-brand-border bg-brand-surface px-4 py-3"
            >
              <p className="text-sm leading-relaxed text-brand-text">{question.prompt}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {question.topics.map((topic) => (
                  <span
                    key={`${question.id}-${topic}`}
                    className="rounded-full border border-brand-border px-2 py-0.5 text-[11px] text-brand-muted"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-brand-border bg-brand-surface px-4 py-4">
            <p className="text-sm leading-relaxed text-brand-muted">
              This round is driven directly by your selected setup rather than a historical-question corpus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
