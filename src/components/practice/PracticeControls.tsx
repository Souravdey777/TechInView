"use client";

import { CheckCircle2, Play, Save, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportedLanguage } from "@/lib/constants";

type PracticeControlsProps = {
  language: SupportedLanguage;
  saveLabel: string;
  testsPassed: number | null;
  testsTotal: number | null;
  isSolved: boolean;
  isRunning: boolean;
  onRunCode: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  python: "Python",
  javascript: "JavaScript",
  java: "Java",
  cpp: "C++",
};

// ─── OS detection for keyboard shortcut hint ─────────────────────────────────

function getRunShortcutHint(): string {
  if (typeof navigator === "undefined") return "Ctrl+↵";
  return navigator.platform.startsWith("Mac") ? "⌘↵" : "Ctrl+↵";
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Practice room bottom bar. Mirrors the interview room's control bar, minus the
 * phase transport and the end-round action — practice has neither.
 */
export function PracticeControls({
  language,
  saveLabel,
  testsPassed,
  testsTotal,
  isSolved,
  isRunning,
  onRunCode,
}: PracticeControlsProps) {
  return (
    <div className="flex h-12 items-center justify-between border-t border-brand-border bg-brand-card px-4">
      {/* Left: autosave + test progress */}
      <div className="flex items-center gap-3 text-xs text-brand-muted">
        <span className="inline-flex items-center gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {saveLabel}
        </span>
        {testsTotal !== null && (
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
            <span className="font-medium text-brand-text">
              {testsPassed}/{testsTotal}
            </span>{" "}
            tests
          </span>
        )}
        {isSolved && (
          <span className="inline-flex items-center gap-1.5 text-brand-green">
            <Sparkles className="h-3.5 w-3.5" />
            Solved
          </span>
        )}
      </div>

      {/* Center: language badge */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <span className="rounded-md border border-brand-border bg-brand-surface px-2.5 py-1 font-mono text-xs font-medium text-brand-muted">
          {LANGUAGE_LABELS[language]}
        </span>
      </div>

      {/* Right: run action + shortcut hint */}
      <div className="flex items-center gap-2">
        <span className="hidden text-[10px] text-brand-muted sm:block">
          {getRunShortcutHint()} to run
        </span>

        <button
          onClick={onRunCode}
          disabled={isRunning}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
            isRunning
              ? "cursor-not-allowed border-brand-border text-brand-muted"
              : "border-brand-green/30 bg-brand-green/10 text-brand-green hover:bg-brand-green/20 hover:border-brand-green/50"
          )}
        >
          <Play className="h-3.5 w-3.5" />
          Run
        </button>
      </div>
    </div>
  );
}
