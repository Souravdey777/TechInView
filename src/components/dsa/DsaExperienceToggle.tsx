"use client";

import { Brain, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CELL, GRID } from "@/components/marketing/ds";
import {
  SETUP_CELL_FOCUS,
  SETUP_CELL_SELECTED,
} from "@/components/interviews/setup/SetupRack";
import type { DsaExperience } from "@/lib/dsa";

type DsaExperienceToggleProps = {
  value: DsaExperience;
  onChange: (value: DsaExperience) => void;
  practiceLabel?: string;
  practiceDescription?: string;
  aiLabel?: string;
  aiDescription?: string;
};

const OPTIONS = {
  practice: {
    icon: Code2,
  },
  ai_interview: {
    icon: Brain,
  },
} as const;

export function DsaExperienceToggle({
  value,
  onChange,
  practiceLabel = "Practice Mode",
  practiceDescription = "Solve DSA problems like a normal coding platform.",
  aiLabel = "AI Interview Mode",
  aiDescription = "Turn the same problem into a voice-based mock interview.",
}: DsaExperienceToggleProps) {
  return (
    <div className={cn(GRID, "grid-cols-1 md:grid-cols-2")}>
      {(
        [
          {
            id: "practice" as const,
            label: practiceLabel,
            description: practiceDescription,
          },
          {
            id: "ai_interview" as const,
            label: aiLabel,
            description: aiDescription,
          },
        ] satisfies {
          id: DsaExperience;
          label: string;
          description: string;
        }[]
      ).map((option) => {
        const Icon = OPTIONS[option.id].icon;
        const isActive = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              CELL,
              "p-5 text-left transition-colors duration-150",
              isActive ? SETUP_CELL_SELECTED : "hover:bg-white/[0.03]",
              SETUP_CELL_FOCUS
            )}
          >
            <div className="flex items-start gap-3">
              <Icon
                className={cn(
                  "mt-1 h-4 w-4 shrink-0",
                  isActive ? "text-brand-cyan" : "text-brand-subtle"
                )}
              />
              <div>
                <p
                  className={cn(
                    "text-xl font-medium tracking-[-0.02em]",
                    isActive ? "text-brand-text" : "text-brand-muted"
                  )}
                >
                  {option.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
