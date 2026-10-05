"use client";

import { CheckCircle2, Play, Save, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportedLanguage } from "@/lib/constants";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep";

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
 * phase transport and the end-round action; practice has neither.
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
    <div className="relative flex h-12 items-center justify-between border-t border-white/[0.08] bg-brand-deep px-4">
      {/* Left: autosave + test progress */}
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-brand-subtle">
        <span className="inline-flex items-center gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {saveLabel}
        </span>
        {testsTotal !== null && (
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
            <span className="tabular-nums text-brand-text">
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
        <span className="rounded-full border border-white/[0.1] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-muted">
          {LANGUAGE_LABELS[language]}
        </span>
      </div>

      {/* Right: run action + shortcut hint */}
      <div className="flex items-center gap-2">
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.1em] text-brand-subtle sm:block">
          {getRunShortcutHint()} to run
        </span>

        <button
          onClick={onRunCode}
          disabled={isRunning}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
            FOCUS_RING,
            isRunning
              ? "cursor-not-allowed border-white/[0.08] text-brand-subtle"
              : "border-white/[0.18] text-brand-text hover:border-brand-cyan hover:text-brand-cyan"
          )}
        >
          <Play className="h-3.5 w-3.5" />
          Run
        </button>
      </div>
    </div>
  );
}
