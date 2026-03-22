"use client";

import { cn } from "@/lib/utils";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

type VoiceVisualizerProps = {
  state: VoiceState;
  className?: string;
};

// Bar heights for the speaking state (static values; animation adds movement)
const SPEAKING_BAR_HEIGHTS = [10, 20, 28, 18, 26, 14, 22];
const SPEAKING_DELAYS = [
  "0ms",
  "100ms",
  "200ms",
  "50ms",
  "150ms",
  "250ms",
  "75ms",
];

// Bar heights for listening / idle
const LISTEN_HEIGHTS = [8, 16, 24, 16, 8];
const LISTEN_DELAYS = ["0ms", "120ms", "240ms", "360ms", "480ms"];

export function VoiceVisualizer({ state, className }: VoiceVisualizerProps) {
  // ── Idle ──────────────────────────────────────────────────────────────────
  if (state === "idle") {
    return (
      <div className={cn("flex items-end justify-center gap-1", className)}>
        {LISTEN_HEIGHTS.map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}px` }}
            className="w-1 rounded-full bg-brand-border"
          />
        ))}
      </div>
    );
  }

  // ── Listening ─────────────────────────────────────────────────────────────
  if (state === "listening") {
    return (
      <div className={cn("flex items-end justify-center gap-1", className)}>
        <style>{`
          @keyframes listen-bar {
            0%, 100% { height: 8px; }
            50% { height: 28px; }
          }
        `}</style>
        {LISTEN_HEIGHTS.map((_, i) => (
          <div
            key={i}
            style={{
              animationDelay: LISTEN_DELAYS[i],
              animation: "listen-bar 0.8s ease-in-out infinite",
            }}
            className="w-1.5 rounded-full bg-brand-cyan"
          />
        ))}
      </div>
    );
  }

  // ── Thinking ──────────────────────────────────────────────────────────────
  if (state === "thinking") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <style>{`
          @keyframes think-dot {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
            40% { transform: scale(1.2); opacity: 1; }
          }
        `}</style>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              animationDelay: `${i * 160}ms`,
              animation: "think-dot 1.2s ease-in-out infinite",
            }}
            className="h-2.5 w-2.5 rounded-full bg-brand-amber"
          />
        ))}
      </div>
    );
  }

  // ── Speaking ─────────────────────────────────────────────────────────────
  return (
    <div className={cn("flex items-end justify-center gap-1", className)}>
      <style>{`
        @keyframes speak-bar {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
      {SPEAKING_BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          style={{
            height: `${h}px`,
            transformOrigin: "bottom",
            animationDelay: SPEAKING_DELAYS[i],
            animation: "speak-bar 0.6s ease-in-out infinite",
          }}
          className="w-1.5 rounded-full bg-brand-green"
        />
      ))}
    </div>
  );
}
