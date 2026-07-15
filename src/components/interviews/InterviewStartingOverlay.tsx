"use client";

import { Loader2, Mic, Radio, Volume2 } from "lucide-react";

type InterviewStartingOverlayProps = {
  visible: boolean;
  interviewerName: string;
  isResuming?: boolean;
};

const READINESS_STEPS = [
  { label: "Preparing microphone", icon: Mic },
  { label: "Connecting live voice", icon: Radio },
  { label: "Buffering clear audio", icon: Volume2 },
] as const;

export function InterviewStartingOverlay({
  visible,
  interviewerName,
  isResuming = false,
}: InterviewStartingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-deep/95 px-6 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label={isResuming ? "Reconnecting interview audio" : "Preparing interview audio"}
    >
      <div className="w-full max-w-md rounded-3xl border border-brand-cyan/20 bg-brand-card p-8 text-center shadow-[0_0_80px_rgba(34,211,238,0.12)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>

        <h2 className="mt-6 text-xl font-semibold text-brand-text">
          {isResuming ? `Reconnecting to ${interviewerName}` : `Getting ${interviewerName} ready`}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-muted">
          Please wait a moment. The interview will begin automatically when the audio connection is ready.
        </p>

        <div className="mt-6 grid gap-2 text-left">
          {READINESS_STEPS.map(({ label, icon: Icon }, index) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-muted"
            >
              <Icon className="h-4 w-4 shrink-0 text-brand-cyan" />
              <span>{label}</span>
              <span
                className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-brand-cyan"
                style={{ animationDelay: `${index * 180}ms` }}
              />
            </div>
          ))}
        </div>

        <p className="mt-5 text-xs text-brand-muted/70">This usually takes a few seconds.</p>
      </div>
    </div>
  );
}
