"use client";

import { cn } from "@/lib/utils";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

type VoiceVisualizerProps = {
  state: VoiceState;
  className?: string;
};

/**
 * Siri / Gemini-style animated orb visualizer.
 * Layered glows, morphing blobs, and expanding rings per state.
 */
export function VoiceVisualizer({ state, className }: VoiceVisualizerProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <style>{`
        /* ─── Idle: slow breathing ─── */
        @keyframes orb-idle {
          0%, 100% { transform: scale(0.92); border-radius: 44% 56% 52% 48% / 48% 44% 56% 52%; }
          50% { transform: scale(1.04); border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; }
        }
        @keyframes orb-idle-glow {
          0%, 100% { opacity: 0.25; transform: scale(0.9); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        @keyframes orb-idle-inner {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50% { opacity: 0.55; transform: scale(1.1); }
        }

        /* ─── Listening: energized, organic morphing ─── */
        @keyframes orb-listen {
          0%   { transform: scale(1.0)  rotate(0deg);   border-radius: 40% 60% 55% 45% / 45% 40% 60% 55%; }
          15%  { transform: scale(1.12) rotate(45deg);   border-radius: 55% 45% 40% 60% / 60% 55% 45% 40%; }
          30%  { transform: scale(0.95) rotate(100deg);  border-radius: 45% 55% 60% 40% / 40% 60% 55% 45%; }
          45%  { transform: scale(1.1)  rotate(160deg);  border-radius: 60% 40% 45% 55% / 55% 45% 40% 60%; }
          60%  { transform: scale(0.93) rotate(210deg);  border-radius: 42% 58% 52% 48% / 52% 42% 58% 48%; }
          75%  { transform: scale(1.08) rotate(280deg);  border-radius: 58% 42% 48% 52% / 48% 58% 42% 52%; }
          100% { transform: scale(1.0)  rotate(360deg);  border-radius: 40% 60% 55% 45% / 45% 40% 60% 55%; }
        }
        @keyframes orb-listen-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          30% { opacity: 0.7; transform: scale(1.25); }
          60% { opacity: 0.4; transform: scale(1.1); }
        }
        @keyframes orb-listen-inner {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          40% { opacity: 0.8; transform: scale(1.15); }
          70% { opacity: 0.5; transform: scale(0.95); }
        }

        /* ─── Thinking: pulsing anticipation with shimmer ─── */
        @keyframes orb-think {
          0%, 100% { transform: scale(0.93); border-radius: 46% 54% 50% 50% / 50% 46% 54% 50%; }
          25% { transform: scale(1.02); border-radius: 50% 50% 46% 54% / 54% 50% 50% 46%; }
          50% { transform: scale(0.96); border-radius: 54% 46% 50% 50% / 50% 54% 46% 50%; }
          75% { transform: scale(1.04); border-radius: 50% 50% 54% 46% / 46% 50% 50% 54%; }
        }
        @keyframes orb-think-glow {
          0%, 100% { opacity: 0.2; transform: scale(0.95); }
          50% { opacity: 0.55; transform: scale(1.2); }
        }
        @keyframes orb-think-inner {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes orb-think-shimmer {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* ─── Speaking: lively, expressive morphing ─── */
        @keyframes orb-speak {
          0%   { transform: scale(0.9)  rotate(0deg);   border-radius: 36% 64% 56% 44% / 44% 36% 64% 56%; }
          12%  { transform: scale(1.14) rotate(50deg);   border-radius: 56% 44% 36% 64% / 64% 56% 44% 36%; }
          25%  { transform: scale(0.88) rotate(100deg);  border-radius: 44% 56% 64% 36% / 36% 64% 56% 44%; }
          37%  { transform: scale(1.12) rotate(155deg);  border-radius: 64% 36% 44% 56% / 56% 44% 36% 64%; }
          50%  { transform: scale(0.92) rotate(200deg);  border-radius: 38% 62% 54% 46% / 46% 38% 62% 54%; }
          62%  { transform: scale(1.1)  rotate(250deg);  border-radius: 54% 46% 38% 62% / 62% 54% 46% 38%; }
          75%  { transform: scale(0.9)  rotate(300deg);  border-radius: 62% 38% 46% 54% / 54% 46% 38% 62%; }
          87%  { transform: scale(1.08) rotate(340deg);  border-radius: 46% 54% 62% 38% / 38% 62% 54% 46%; }
          100% { transform: scale(0.9)  rotate(360deg);  border-radius: 36% 64% 56% 44% / 44% 36% 64% 56%; }
        }
        @keyframes orb-speak-glow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          25% { opacity: 0.75; transform: scale(1.3); }
          50% { opacity: 0.4; transform: scale(1.05); }
          75% { opacity: 0.7; transform: scale(1.25); }
        }
        @keyframes orb-speak-inner {
          0%, 100% { opacity: 0.5; transform: scale(0.85); }
          30% { opacity: 0.9; transform: scale(1.15); }
          60% { opacity: 0.5; transform: scale(0.9); }
          80% { opacity: 0.85; transform: scale(1.1); }
        }

        /* ─── Shared: expanding rings ─── */
        @keyframes orb-ring-expand {
          0% { transform: scale(0.6); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* ── Layer 1: Outer ambient glow ── */}
      <div
        className={cn(
          "absolute rounded-full blur-2xl transition-all duration-700",
          state === "idle" && "w-32 h-32 bg-brand-cyan/20",
          state === "listening" && "w-36 h-36 bg-brand-cyan/30",
          state === "thinking" && "w-32 h-32 bg-brand-amber/25",
          state === "speaking" && "w-40 h-40 bg-brand-green/30",
        )}
        style={{
          animation: state === "idle"
            ? "orb-idle-glow 4s ease-in-out infinite"
            : state === "listening"
            ? "orb-listen-glow 2.5s ease-in-out infinite"
            : state === "thinking"
            ? "orb-think-glow 2s ease-in-out infinite"
            : "orb-speak-glow 1.8s ease-in-out infinite",
        }}
      />

      {/* ── Layer 2: Second glow layer (depth) — active states only ── */}
      {state !== "idle" && (
        <div
          className={cn(
            "absolute rounded-full blur-3xl transition-all duration-700",
            state === "listening" && "w-28 h-28 bg-cyan-400/15",
            state === "thinking" && "w-24 h-24 bg-amber-400/12",
            state === "speaking" && "w-32 h-32 bg-emerald-400/15",
          )}
          style={{
            animation: state === "listening"
              ? "orb-listen-glow 2.5s ease-in-out 0.8s infinite"
              : state === "thinking"
              ? "orb-think-glow 2s ease-in-out 0.6s infinite"
              : "orb-speak-glow 1.8s ease-in-out 0.5s infinite",
          }}
        />
      )}

      {/* ── Layer 3: Expanding rings ── */}
      {(state === "listening" || state === "speaking") && (
        <>
          <div
            className={cn(
              "absolute w-20 h-20 rounded-full border-2",
              state === "listening" ? "border-brand-cyan/50" : "border-brand-green/50"
            )}
            style={{ animation: "orb-ring-expand 2.2s ease-out infinite" }}
          />
          <div
            className={cn(
              "absolute w-20 h-20 rounded-full border",
              state === "listening" ? "border-brand-cyan/35" : "border-brand-green/35"
            )}
            style={{ animation: "orb-ring-expand 2.2s ease-out 0.7s infinite" }}
          />
          <div
            className={cn(
              "absolute w-20 h-20 rounded-full border",
              state === "listening" ? "border-brand-cyan/20" : "border-brand-green/20"
            )}
            style={{ animation: "orb-ring-expand 2.2s ease-out 1.4s infinite" }}
          />
        </>
      )}

      {/* Thinking: rotating shimmer ring */}
      {state === "thinking" && (
        <div
          className="absolute w-24 h-24 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.3) 25%, transparent 50%, rgba(251,191,36,0.2) 75%, transparent 100%)",
            animation: "orb-think-shimmer 3s linear infinite",
          }}
        />
      )}

      {/* ── Layer 4: Main orb — morphing blob ── */}
      <div
        className={cn(
          "relative z-10 w-20 h-20 transition-all duration-500",
          state === "idle" && "bg-gradient-to-br from-brand-cyan/40 via-brand-cyan/20 to-brand-cyan/10",
          state === "listening" && "bg-gradient-to-br from-brand-cyan/70 via-cyan-400/40 to-brand-cyan/15",
          state === "thinking" && "bg-gradient-to-br from-brand-amber/60 via-amber-400/30 to-brand-amber/15",
          state === "speaking" && "bg-gradient-to-br from-brand-green/70 via-emerald-400/40 to-brand-green/15",
        )}
        style={{
          borderRadius: "42% 58% 52% 48% / 48% 42% 58% 52%",
          animation: state === "idle"
            ? "orb-idle 5s ease-in-out infinite"
            : state === "listening"
            ? "orb-listen 4s ease-in-out infinite"
            : state === "thinking"
            ? "orb-think 2.5s ease-in-out infinite"
            : "orb-speak 2.8s ease-in-out infinite",
        }}
      >
        {/* Inner bright core */}
        <div
          className={cn(
            "absolute inset-3 rounded-full blur-sm transition-colors duration-500",
            state === "idle" && "bg-brand-cyan/30",
            state === "listening" && "bg-brand-cyan/50",
            state === "thinking" && "bg-brand-amber/40",
            state === "speaking" && "bg-brand-green/50",
          )}
          style={{
            animation: state === "idle"
              ? "orb-idle-inner 5s ease-in-out infinite"
              : state === "listening"
              ? "orb-listen-inner 2.5s ease-in-out infinite"
              : state === "thinking"
              ? "orb-think-inner 2s ease-in-out infinite"
              : "orb-speak-inner 1.8s ease-in-out infinite",
          }}
        />
      </div>

    </div>
  );
}

/**
 * Compact mic visualizer — Siri-style glowing ring around mic button.
 */
export function MicVisualizer({ isActive, className }: { isActive: boolean; className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <style>{`
        @keyframes mic-glow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes mic-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      {isActive && (
        <>
          {/* Soft glow behind */}
          <div
            className="absolute w-[130%] h-[130%] rounded-full bg-brand-cyan/15 blur-md"
            style={{ animation: "mic-glow 1.5s ease-in-out infinite" }}
          />
          {/* Expanding rings */}
          <div
            className="absolute w-full h-full rounded-full border-2 border-brand-cyan/50"
            style={{ animation: "mic-ring 1.8s ease-out infinite" }}
          />
          <div
            className="absolute w-full h-full rounded-full border border-brand-cyan/35"
            style={{ animation: "mic-ring 1.8s ease-out 0.5s infinite" }}
          />
          <div
            className="absolute w-full h-full rounded-full border border-brand-cyan/20"
            style={{ animation: "mic-ring 1.8s ease-out 1s infinite" }}
          />
        </>
      )}
    </div>
  );
}
