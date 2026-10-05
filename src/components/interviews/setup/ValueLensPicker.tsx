"use client";

import { Check, Scale } from "lucide-react";
import { InterviewSetupSection } from "@/components/interviews/InterviewSetupLayout";
import { CELL, GRID } from "@/components/marketing/ds";
import {
  SETUP_CELL_FOCUS,
  SETUP_CELL_SELECTED,
} from "@/components/interviews/setup/SetupRack";
import {
  INTERVIEW_VALUE_FRAMEWORKS,
  MAX_VALUE_COMPETENCIES,
  getValueFramework,
  type ValueFrameworkId,
} from "@/lib/interview-values";
import { cn } from "@/lib/utils";

type ValueLensPickerProps = {
  frameworkId: ValueFrameworkId;
  competencyIds: string[];
  onFrameworkChange: (frameworkId: ValueFrameworkId) => void;
  onCompetencyToggle: (competencyId: string) => void;
  /** Overrides the default section copy for round-specific framing. */
  description?: string;
};

/**
 * Shared value-lens selector for behaviour-led rounds. The candidate picks the
 * value system the round is run and graded against, then the specific
 * competencies to probe. Both the Behavioral and Engineering Manager setups use
 * this so a competency means the same thing in either round. Options render as
 * hairline grid cells with a cyan inset hairline on the selected one.
 */
export function ValueLensPicker({
  frameworkId,
  competencyIds,
  onFrameworkChange,
  onCompetencyToggle,
  description,
}: ValueLensPickerProps) {
  const framework = getValueFramework(frameworkId);
  const atLimit = competencyIds.length >= MAX_VALUE_COMPETENCIES;

  return (
    <>
      <InterviewSetupSection
        title="Value lens"
        icon={<Scale className="h-3.5 w-3.5" />}
        description={
          description ??
          "Choose the value system the interviewer should grade you against. This drives the questions asked live and the competency report afterwards."
        }
      >
        <div
          role="radiogroup"
          aria-label="Value framework"
          className={cn(GRID, "mt-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3")}
        >
          {INTERVIEW_VALUE_FRAMEWORKS.map((option) => {
            const selected = option.id === frameworkId;

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onFrameworkChange(option.id)}
                className={cn(
                  CELL,
                  "flex w-full flex-col items-start p-5 text-left transition-colors duration-150",
                  selected ? SETUP_CELL_SELECTED : "hover:bg-white/[0.03]",
                  SETUP_CELL_FOCUS
                )}
              >
                <p
                  className={cn(
                    "text-[15px] font-medium tracking-[-0.01em]",
                    selected ? "text-brand-text" : "text-brand-muted"
                  )}
                >
                  {option.label}
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-[11px] uppercase tracking-[0.12em]",
                    selected ? "text-brand-cyan" : "text-brand-subtle"
                  )}
                >
                  {option.shortLabel}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-brand-muted">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
        <p className="mt-5 border-l border-white/[0.18] pl-4 text-sm leading-relaxed text-brand-muted">
          <span className="text-brand-text">How this round runs: </span>
          {framework.interviewStyle}
        </p>
      </InterviewSetupSection>

      <InterviewSetupSection
        title="Competencies to probe"
        icon={<Check className="h-3.5 w-3.5" />}
        description={`Pick up to ${MAX_VALUE_COMPETENCIES} competencies from ${framework.label}. The interviewer covers them in order and the report grades each one separately.`}
      >
        <div
          role="group"
          aria-label="Competencies"
          className={cn(GRID, "mt-5 grid-cols-1 sm:grid-cols-2")}
        >
          {framework.competencies.map((competency) => {
            const selected = competencyIds.includes(competency.id);
            const disabled = !selected && atLimit;

            return (
              <button
                key={competency.id}
                type="button"
                role="checkbox"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => onCompetencyToggle(competency.id)}
                className={cn(
                  CELL,
                  "flex w-full items-start justify-between gap-3 p-5 text-left transition-colors duration-150",
                  selected ? SETUP_CELL_SELECTED : !disabled && "hover:bg-white/[0.03]",
                  disabled && "cursor-not-allowed opacity-40",
                  SETUP_CELL_FOCUS
                )}
              >
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[15px] font-medium tracking-[-0.01em]",
                      selected ? "text-brand-text" : "text-brand-muted"
                    )}
                  >
                    {competency.label}
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-brand-muted">
                    {competency.description}
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-brand-cyan bg-brand-cyan text-brand-deep"
                      : "border-white/[0.18]"
                  )}
                >
                  {selected ? <Check className="h-3 w-3" /> : null}
                </span>
              </button>
            );
          })}
        </div>
        {atLimit ? (
          <p className="mt-3 text-xs text-brand-muted">
{MAX_VALUE_COMPETENCIES} competencies is the most a 45-minute round can cover
            properly. Deselect one to swap.
          </p>
        ) : null}
      </InterviewSetupSection>
    </>
  );
}
