"use client";

import { Brain, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SETUP_FOCUS_RING } from "@/components/interviews/dsa-setup/SetupRack";
import type { DsaExperience } from "@/lib/dsa";

export type ModeChipTone = "green" | "cyan" | "amber" | "rose";

const CHIP_TONES: Record<ModeChipTone, string> = {
  green: "border-brand-green/30 text-brand-green",
  cyan: "border-brand-cyan/30 text-brand-cyan",
  amber: "border-brand-amber/30 text-brand-amber",
  rose: "border-brand-rose/30 text-brand-rose",
};

type DsaModePickerProps = {
  value: DsaExperience;
  onChange: (value: DsaExperience) => void;
  practiceStatus: string;
  practiceStatusTone: ModeChipTone;
  practiceDetail: string;
  aiStatus: string;
  aiStatusTone: ModeChipTone;
  aiDetail: string;
};

/** Two-cell mode picker: free practice vs. the scored AI interview round. */
export function DsaModePicker({
  value,
  onChange,
  practiceStatus,
  practiceStatusTone,
  practiceDetail,
  aiStatus,
  aiStatusTone,
  aiDetail,
}: DsaModePickerProps) {
  const cells = [
    {
      id: "practice" as const,
      icon: Code2,
      label: "Practice Mode",
      status: practiceStatus,
      statusTone: practiceStatusTone,
      detail: practiceDetail,
    },
    {
      id: "ai_interview" as const,
      icon: Brain,
      label: "AI Interview Mode",
      status: aiStatus,
      statusTone: aiStatusTone,
      detail: aiDetail,
    },
  ] satisfies {
    id: DsaExperience;
    icon: typeof Code2;
    label: string;
    status: string;
    statusTone: ModeChipTone;
    detail: string;
  }[];

  return (
    <div
      role="radiogroup"
      aria-label="DSA mode"
      className="grid gap-3 sm:grid-cols-2"
    >
      {cells.map((cell) => {
        const Icon = cell.icon;
        const isActive = value === cell.id;

        return (
          <button
            key={cell.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(cell.id)}
            className={cn(
              "flex min-h-[44px] flex-col rounded-xl border px-4 py-4 text-left transition-all duration-150",
              isActive
                ? "border-brand-cyan bg-brand-cyan/5 ring-1 ring-brand-cyan/30"
                : "border-brand-border bg-brand-surface hover:border-brand-subtle",
              SETUP_FOCUS_RING
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-brand-cyan" : "text-brand-muted"
                  )}
                />
                <p
                  className={cn(
                    "font-heading text-base font-semibold",
                    isActive ? "text-brand-text" : "text-brand-muted"
                  )}
                >
                  {cell.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em]",
                    CHIP_TONES[cell.statusTone]
                  )}
                >
                  {cell.status}
                </span>
                {isActive ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-cyan ring-2 ring-brand-cyan/30" />
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                      Selected
                    </span>
                  </span>
                ) : null}
              </div>
            </div>
            <p
              className={cn(
                "mt-3 text-xs leading-relaxed",
                isActive ? "text-brand-text" : "text-brand-muted"
              )}
            >
              {cell.detail}
            </p>
          </button>
        );
      })}
    </div>
  );
}
