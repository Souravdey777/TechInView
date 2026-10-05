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

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep";

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
      <div className="relative flex h-12 items-center justify-between border-t border-white/[0.08] bg-brand-deep px-4">
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
                      ? "w-1.5 bg-white/[0.4]"
                      : "w-1.5 bg-white/[0.1]"
                )}
                title={PHASE_LABELS[p]}
              />
            ))}
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-subtle">
            <span className="text-brand-text">
              {phaseLabel}
            </span>{" "}
            &middot; Step {step}/{total}
          </span>
        </div>

        {/* Center: language badge */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="rounded-full border border-white/[0.1] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-muted">
            {isCodingRound ? LANGUAGE_LABELS[language] : ROUND_TYPE_LABELS[roundType]}
          </span>
        </div>

        {/* Right: action buttons + shortcut hint */}
        <div className="flex items-center gap-2">
          {isCodingRound && (
            <>
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
            </>
          )}

          {/* End Interview */}
          <button
            onClick={() => setConfirmOpen(true)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border border-brand-rose/30 bg-brand-rose/[0.08] px-3.5 py-1.5 text-xs font-medium text-brand-rose transition-colors hover:border-brand-rose/50 hover:bg-brand-rose/[0.14]",
              FOCUS_RING
            )}
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
            <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-brand-rose" />
            <DialogTitle className="text-center text-xl font-normal tracking-[-0.02em]">End Interview?</DialogTitle>
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
