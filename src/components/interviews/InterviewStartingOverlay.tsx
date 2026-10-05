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
      <div className="w-full max-w-md rounded-[20px] border border-white/[0.08] bg-brand-deep p-8">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] text-brand-subtle">
          <Loader2 className="h-4 w-4 animate-spin text-brand-cyan" />
          {isResuming ? "Reconnecting" : "Connecting"}
        </div>

        <h2 className="mt-5 text-2xl font-normal tracking-[-0.03em] text-brand-text">
          {isResuming ? `Reconnecting to ${interviewerName}` : `Getting ${interviewerName} ready`}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">
          Please wait a moment. The interview will begin automatically when the audio connection is ready.
        </p>

        <ul className="mt-6 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {READINESS_STEPS.map(({ label, icon: Icon }, index) => (
            <li
              key={label}
              className="flex items-center gap-3 py-3 text-sm text-brand-muted"
            >
              <Icon className="h-4 w-4 shrink-0 text-brand-subtle" />
              <span>{label}</span>
              <span
                className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-brand-cyan"
                style={{ animationDelay: `${index * 180}ms` }}
              />
            </li>
          ))}
        </ul>

        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">
          This usually takes a few seconds.
        </p>
      </div>
    </div>
  );
}
