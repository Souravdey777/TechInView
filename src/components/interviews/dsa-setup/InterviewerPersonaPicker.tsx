"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SETUP_FOCUS_RING,
  SetupMonoLabel,
} from "@/components/interviews/dsa-setup/SetupRack";
import type {
  InterviewerPersona,
  InterviewerPersonaId,
} from "@/lib/interviewer-personas";

type InterviewerPersonaPickerProps = {
  personas: readonly InterviewerPersona[];
  value: InterviewerPersonaId;
  onSelect: (personaId: InterviewerPersonaId) => void;
  isPersonaLocked: (personaId: InterviewerPersonaId) => boolean;
};

/** Grid of interviewer persona cells — company micro-label above the name. */
export function InterviewerPersonaPicker({
  personas,
  value,
  onSelect,
  isPersonaLocked,
}: InterviewerPersonaPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Interviewer"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {personas.map((persona) => {
        const isLocked = isPersonaLocked(persona.id);
        const isSelected = value === persona.id;

        return (
          <button
            key={persona.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isLocked}
            onClick={() => onSelect(persona.id)}
            className={cn(
              "flex min-h-[44px] flex-col gap-2 rounded-xl border px-4 py-3 text-left transition-all duration-150",
              isLocked && "cursor-not-allowed opacity-50",
              isSelected
                ? "border-brand-cyan bg-brand-cyan/5 ring-1 ring-brand-cyan/30"
                : "border-brand-border bg-brand-surface hover:border-brand-subtle",
              SETUP_FOCUS_RING
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <SetupMonoLabel className={isSelected ? "text-brand-cyan" : undefined}>
                {persona.companyLabel}
              </SetupMonoLabel>
              {isSelected ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-brand-cyan" />
              ) : isLocked ? (
                <Lock className="h-3 w-3 shrink-0 text-brand-muted" />
              ) : null}
            </div>
            <p
              className={cn(
                "font-heading text-base font-semibold tracking-tight",
                isSelected ? "text-brand-text" : "text-brand-muted"
              )}
            >
              {persona.name}
            </p>
          </button>
        );
      })}
    </div>
  );
}
