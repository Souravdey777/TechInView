"use client";

import { Check, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewSetupSection } from "@/components/interviews/InterviewSetupLayout";
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
 * this so a competency means the same thing in either round.
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
          className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {INTERVIEW_VALUE_FRAMEWORKS.map((option) => {
            const selected = option.id === frameworkId;

            return (
              <Button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onFrameworkChange(option.id)}
                variant="outline"
                className={cn(
                  "h-auto w-full flex-col items-start whitespace-normal rounded-2xl px-4 py-4 text-left",
                  selected
                    ? "border-brand-cyan bg-brand-cyan/10 text-brand-text hover:bg-brand-cyan/10"
                    : "border-brand-border bg-brand-card text-brand-muted hover:border-brand-cyan/30 hover:text-brand-text"
                )}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-brand-muted">
                  {option.shortLabel}
                </p>
                <p className="mt-3 text-xs leading-relaxed">{option.description}</p>
              </Button>
            );
          })}
        </div>
        <p className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4 text-xs leading-relaxed text-brand-muted">
          <span className="font-semibold text-brand-text">How this round runs: </span>
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
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          {framework.competencies.map((competency) => {
            const selected = competencyIds.includes(competency.id);
            const disabled = !selected && atLimit;

            return (
              <Button
                key={competency.id}
                type="button"
                role="checkbox"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => onCompetencyToggle(competency.id)}
                variant="outline"
                className={cn(
                  "h-auto w-full items-start justify-between gap-3 whitespace-normal rounded-2xl px-4 py-4 text-left",
                  selected
                    ? "border-brand-cyan bg-brand-cyan/10 text-brand-text hover:bg-brand-cyan/10"
                    : "border-brand-border bg-brand-card text-brand-muted hover:border-brand-cyan/30 hover:text-brand-text",
                  disabled && "cursor-not-allowed opacity-40"
                )}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{competency.label}</span>
                  <span className="mt-2 block text-xs leading-relaxed">
                    {competency.description}
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-brand-cyan bg-brand-cyan text-brand-deep"
                      : "border-brand-border bg-brand-surface"
                  )}
                >
                  {selected ? <Check className="h-3 w-3" /> : null}
                </span>
              </Button>
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
