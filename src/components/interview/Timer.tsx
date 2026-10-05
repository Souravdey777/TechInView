"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimerProps = {
  timeLeft: number; // seconds
  isRunning: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Timer({ timeLeft, isRunning }: TimerProps) {
  const isCritical = timeLeft < 5 * 60;
  const isWarning = !isCritical && timeLeft < 10 * 60;

  const colorClass = isCritical
    ? "text-brand-rose"
    : isWarning
      ? "text-brand-amber"
      : "text-brand-text";

  const pulseClass = isCritical
    ? "animate-[pulse_0.8s_ease-in-out_infinite]"
    : isWarning
      ? "animate-[pulse_1.5s_ease-in-out_infinite]"
      : "";

  const iconClass = isCritical
    ? "text-brand-rose"
    : isWarning
      ? "text-brand-amber"
      : "text-brand-muted";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1 transition-colors duration-300",
        isCritical
          ? "border-brand-rose/30 bg-brand-rose/[0.06]"
          : isWarning
            ? "border-brand-amber/30 bg-brand-amber/[0.06]"
            : "border-white/[0.12]"
      )}
      aria-label={`Time remaining: ${formatDuration(timeLeft)}`}
    >
      <Clock
        className={cn("h-3.5 w-3.5 transition-colors duration-300", iconClass)}
      />
      <span
        className={cn(
          "font-mono text-sm tabular-nums tracking-[0.02em] transition-colors duration-300",
          colorClass,
          pulseClass
        )}
      >
        {formatDuration(timeLeft)}
      </span>
      {!isRunning && (
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle">
          Paused
        </span>
      )}
    </div>
  );
}
