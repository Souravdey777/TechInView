"use client";

import { Brain, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRID, CELL } from "@/components/marketing/ds";
import {
  SETUP_CELL_FOCUS,
  SETUP_CELL_SELECTED,
} from "@/components/interviews/setup/SetupRack";
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

/** Two-cell hairline grid: free practice vs. the scored AI interview round. */
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
      className={cn(GRID, "grid-cols-1 sm:grid-cols-2")}
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
              CELL,
              "flex min-h-[44px] flex-col p-5 text-left transition-colors duration-150",
              isActive ? SETUP_CELL_SELECTED : "hover:bg-white/[0.03]",
              SETUP_CELL_FOCUS
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-brand-cyan" : "text-brand-subtle"
                  )}
                />
                <p
                  className={cn(
                    "text-xl font-medium tracking-[-0.02em]",
                    isActive ? "text-brand-text" : "text-brand-muted"
                  )}
                >
                  {cell.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                    CHIP_TONES[cell.statusTone]
                  )}
                >
                  {cell.status}
                </span>
                {isActive ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-cyan">
                      Selected
                    </span>
                  </span>
                ) : null}
              </div>
            </div>
            <p
              className={cn(
                "mt-3 text-sm leading-relaxed",
                isActive ? "text-brand-text/85" : "text-brand-muted"
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
