"use client";

import { ROUND_TYPE_DESCRIPTIONS, ROUND_TYPE_LABELS } from "@/lib/loops/round-config";
import type { RoundContextSnapshot } from "@/lib/loops/types";
import { CHIP, LABEL } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

// Edge-to-edge hairline cells: the pane edges already draw the outer borders,
// so cells only draw their bottom rule (plus a column rule on wide screens).
const CELL = "border-b border-white/[0.08] p-5";

type DiscussionWorkspaceProps = {
  round: RoundContextSnapshot;
  company?: string | null;
  roleTitle?: string | null;
  notes: Record<string, string>;
  onChangeNote: (sectionId: string, value: string) => void;
};

/**
 * Workspace for discussion rounds: a header with round metadata, then a
 * hairline grid holding the live prompt, the notes intro and one note cell
 * per workspace section.
 */
export function DiscussionWorkspace({
  round,
  company,
  roleTitle,
  notes,
  onChangeNote,
}: DiscussionWorkspaceProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-brand-deep">
      <div className="border-b border-white/[0.08] px-5 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={LABEL}>{ROUND_TYPE_LABELS[round.roundType]}</span>
          {company && <span className={cn(CHIP, "capitalize hover:text-brand-muted")}>{company}</span>}
          {roleTitle && <span className={cn(CHIP, "hover:text-brand-muted")}>{roleTitle}</span>}
        </div>
        <h2 className="mt-3 text-2xl font-normal tracking-[-0.03em] text-brand-text">{round.title}</h2>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-brand-muted">
          {ROUND_TYPE_DESCRIPTIONS[round.roundType]}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
          <div className={cn(CELL, "xl:border-r")}>
            <div className={LABEL}>Live interview prompt</div>
            <p className="mt-4 text-[15px] leading-relaxed text-brand-text">{round.prompt}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {round.focusAreas.map((focus) => (
                <span key={`${round.id}-focus-${focus}`} className={cn(CHIP, "hover:text-brand-muted")}>
                  {focus}
                </span>
              ))}
            </div>
          </div>

          <div className={CELL}>
            <div className={LABEL}>Notes board</div>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              Capture the structure you want to hold onto while the interviewer probes.
            </p>
          </div>
        </div>

        <div className="grid xl:grid-cols-2">
          {round.workspaceSections.map((section) => (
            <div key={section.id} className={cn(CELL, "xl:odd:border-r")}>
              <label className={LABEL}>{section.label}</label>
              <textarea
                value={notes[section.id] ?? ""}
                onChange={(event) => onChangeNote(section.id, event.target.value)}
                rows={8}
                placeholder={section.placeholder}
                className="mt-3 w-full resize-none rounded-[16px] border border-white/[0.12] bg-transparent px-4 py-3 text-sm leading-relaxed text-brand-text placeholder:text-brand-subtle focus:border-brand-cyan focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
