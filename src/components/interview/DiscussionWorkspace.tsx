"use client";

import { FileText, ListChecks } from "lucide-react";
import { ROUND_TYPE_DESCRIPTIONS, ROUND_TYPE_LABELS } from "@/lib/loops/round-config";
import type { RoundContextSnapshot } from "@/lib/loops/types";

type DiscussionWorkspaceProps = {
  round: RoundContextSnapshot;
  company?: string | null;
  roleTitle?: string | null;
  notes: Record<string, string>;
  onChangeNote: (sectionId: string, value: string) => void;
};

export function DiscussionWorkspace({
  round,
  company,
  roleTitle,
  notes,
  onChangeNote,
}: DiscussionWorkspaceProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-brand-deep">
      <div className="border-b border-brand-border bg-brand-card px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-cyan">
            {ROUND_TYPE_LABELS[round.roundType]}
          </span>
          {company && (
            <span className="rounded-full border border-brand-border px-3 py-1 text-[11px] text-brand-muted capitalize">
              {company}
            </span>
          )}
          {roleTitle && (
            <span className="rounded-full border border-brand-border px-3 py-1 text-[11px] text-brand-muted">
              {roleTitle}
            </span>
          )}
        </div>
        <h2 className="mt-3 text-lg font-semibold text-brand-text">{round.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-muted">
          {ROUND_TYPE_DESCRIPTIONS[round.roundType]}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
          <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
              <FileText className="h-3.5 w-3.5" />
              Live Interview Prompt
            </div>
            <p className="mt-4 text-sm leading-relaxed text-brand-text">{round.prompt}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {round.focusAreas.map((focus) => (
                <span
                  key={`${round.id}-focus-${focus}`}
                  className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted"
                >
                  {focus}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
              <ListChecks className="h-3.5 w-3.5" />
              Notes Board
            </div>
            <p className="mt-3 text-xs leading-relaxed text-brand-muted">
              Capture the structure you want to hold onto while the interviewer probes.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {round.workspaceSections.map((section) => (
            <div
              key={section.id}
              className="rounded-2xl border border-brand-border bg-brand-card p-5"
            >
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                {section.label}
              </label>
              <textarea
                value={notes[section.id] ?? ""}
                onChange={(event) => onChangeNote(section.id, event.target.value)}
                rows={8}
                placeholder={section.placeholder}
                className="mt-3 w-full resize-none rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-sm leading-relaxed text-brand-text placeholder:text-brand-muted focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
