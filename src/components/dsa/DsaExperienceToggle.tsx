"use client";

import { Brain, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div className="grid gap-3 md:grid-cols-2">
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
              "rounded-xl border px-4 py-4 text-left transition-all duration-150",
              isActive
                ? "border-brand-cyan bg-brand-cyan/5 ring-1 ring-brand-cyan/30"
                : "border-brand-border hover:border-brand-subtle hover:bg-brand-surface"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                  isActive
                    ? "border-brand-cyan/30 bg-brand-cyan/10"
                    : "border-brand-border bg-brand-surface"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-brand-cyan" : "text-brand-muted")} />
              </div>
              <div>
                <p className={cn("text-sm font-semibold", isActive ? "text-brand-cyan" : "text-brand-text")}>
                  {option.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-brand-muted">
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
