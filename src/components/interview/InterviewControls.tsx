"use client";

import { useState } from "react";
import { Play, StopCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  type InterviewPhase,
  PHASE_ORDER,
  PHASE_STEP,
  PHASE_LABELS,
} from "@/lib/interview-phases";
import type { RoundType } from "@/lib/constants";
import { getPhaseLabelForRound, ROUND_TYPE_LABELS } from "@/lib/loops/round-config";

type SupportedLanguage = "python" | "javascript" | "java" | "cpp";

type InterviewControlsProps = {
  phase: InterviewPhase;
  roundType: RoundType;
  language: SupportedLanguage;
  onRunCode: () => void;
  onEndInterview: () => void;
  isRunning: boolean;
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

export function InterviewControls({
  phase,
  roundType,
  language,
  onRunCode,
  onEndInterview,
  isRunning,
}: InterviewControlsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const step = PHASE_STEP[phase];
  const total = PHASE_ORDER.length;
  const isCodingRound = roundType === "coding";
  const phaseLabel = isCodingRound ? PHASE_LABELS[phase] : getPhaseLabelForRound(roundType, phase);

  function handleConfirmEnd() {
    setConfirmOpen(false);
    onEndInterview();
  }

  return (
    <>
      <div className="flex h-12 items-center justify-between border-t border-brand-border bg-brand-card px-4">
        {/* Left: phase progress */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {PHASE_ORDER.map((p) => (
              <div
                key={p}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  p === phase
                    ? "w-4 bg-brand-cyan"
                    : PHASE_STEP[p] < step
                      ? "w-1.5 bg-brand-green/60"
                      : "w-1.5 bg-brand-border"
                )}
                title={PHASE_LABELS[p]}
              />
            ))}
          </div>
          <span className="text-xs text-brand-muted">
            <span className="font-medium text-brand-text">
              {phaseLabel}
            </span>{" "}
            &mdash; Step {step}/{total}
          </span>
        </div>

        {/* Center: language badge */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="rounded-md border border-brand-border bg-brand-surface px-2.5 py-1 font-mono text-xs font-medium text-brand-muted">
            {isCodingRound ? LANGUAGE_LABELS[language] : ROUND_TYPE_LABELS[roundType]}
          </span>
        </div>

        {/* Right: action buttons + shortcut hint */}
        <div className="flex items-center gap-2">
          {isCodingRound && (
            <>
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
            </>
          )}

          {/* End Interview */}
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-brand-rose/30 bg-brand-rose/10 px-3 py-1.5 text-xs font-semibold text-brand-rose transition-all hover:bg-brand-rose/20 hover:border-brand-rose/50"
          >
            <StopCircle className="h-3.5 w-3.5" />
            End
          </button>
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-rose/10 border border-brand-rose/30">
              <AlertTriangle className="h-6 w-6 text-brand-rose" />
            </div>
            <DialogTitle className="text-center">End Interview?</DialogTitle>
            <DialogDescription className="text-center">
              Your session will be submitted for scoring. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              className="flex-1"
            >
              Keep Going
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmEnd}
              className="flex-1"
            >
              End Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
