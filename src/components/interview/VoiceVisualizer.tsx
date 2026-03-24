"use client";

import { cn } from "@/lib/utils";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

type VoiceVisualizerProps = {
  state: VoiceState;
  className?: string;
};

/**
 * Siri-style fluid orb — smooth iridescent sphere with swirling
 * color gradients that blend and morph organically.
 */
export function VoiceVisualizer({ state, className }: VoiceVisualizerProps) {
  const isActive = state !== "idle";

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <style>{`
        /* ─── Siri orb keyframes ─── */
        @keyframes siri-rotate-1 {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes siri-rotate-2 {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes siri-morph {
          0%, 100% { border-radius: 42% 58% 50% 50% / 50% 42% 58% 50%; transform: scale(0.95); }
          25%  { border-radius: 50% 50% 42% 58% / 58% 50% 50% 42%; transform: scale(1.02); }
          50%  { border-radius: 58% 42% 50% 50% / 50% 58% 42% 50%; transform: scale(0.98); }
          75%  { border-radius: 50% 50% 58% 42% / 42% 50% 50% 58%; transform: scale(1.03); }
        }
        @keyframes siri-morph-active {
          0%, 100% { border-radius: 38% 62% 48% 52% / 52% 38% 62% 48%; transform: scale(0.92); }
          14%  { border-radius: 52% 48% 38% 62% / 62% 52% 48% 38%; transform: scale(1.08); }
          28%  { border-radius: 62% 38% 52% 48% / 48% 62% 38% 52%; transform: scale(0.95); }
          42%  { border-radius: 48% 52% 62% 38% / 38% 48% 52% 62%; transform: scale(1.06); }
          57%  { border-radius: 38% 62% 48% 52% / 52% 38% 62% 48%; transform: scale(0.93); }
          71%  { border-radius: 58% 42% 38% 62% / 62% 58% 42% 38%; transform: scale(1.05); }
          85%  { border-radius: 42% 58% 62% 38% / 38% 42% 58% 62%; transform: scale(0.97); }
        }
        @keyframes siri-glow-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 0.65; transform: scale(1.15); }
        }
        @keyframes siri-glow-active {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          30% { opacity: 0.8; transform: scale(1.2); }
          60% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes siri-ring-expand {
          0% { transform: scale(0.7); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      {/* ── Ambient glow ── */}
      <div
        className={cn(
          "absolute rounded-full transition-all duration-700",
          state === "idle" && "w-28 h-28 blur-2xl",
          state === "listening" && "w-36 h-36 blur-3xl",
          state === "thinking" && "w-32 h-32 blur-2xl",
          state === "speaking" && "w-40 h-40 blur-3xl",
        )}
        style={{
          background: state === "idle"
            ? "radial-gradient(circle, rgba(34,211,238,0.2) 0%, rgba(139,92,246,0.1) 50%, transparent 70%)"
            : state === "listening"
            ? "radial-gradient(circle, rgba(34,211,238,0.35) 0%, rgba(139,92,246,0.2) 50%, transparent 70%)"
            : state === "thinking"
            ? "radial-gradient(circle, rgba(251,191,36,0.3) 0%, rgba(251,146,60,0.15) 50%, transparent 70%)"
            : "radial-gradient(circle, rgba(52,211,153,0.35) 0%, rgba(34,211,238,0.2) 50%, transparent 70%)",
          animation: isActive
            ? `siri-glow-active ${state === "speaking" ? "1.5s" : "2.5s"} ease-in-out infinite`
            : "siri-glow-pulse 5s ease-in-out infinite",
        }}
      />

      {/* ── Expanding rings (listening/speaking) ── */}
      {(state === "listening" || state === "speaking") && (
        <>
          <div
            className="absolute w-[72px] h-[72px] rounded-full"
            style={{
              border: state === "listening" ? "1.5px solid rgba(34,211,238,0.3)" : "1.5px solid rgba(52,211,153,0.3)",
              animation: "siri-ring-expand 2.5s ease-out infinite",
            }}
          />
          <div
            className="absolute w-[72px] h-[72px] rounded-full"
            style={{
              border: state === "listening" ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(34,211,238,0.25)",
              animation: "siri-ring-expand 2.5s ease-out 0.8s infinite",
            }}
          />
        </>
      )}

      {/* ── The orb — layered rotating gradients inside a morphing container ── */}
      <div
        className="relative z-10 w-[76px] h-[76px] overflow-hidden"
        style={{
          animation: isActive
            ? `siri-morph-active ${state === "speaking" ? "3s" : state === "thinking" ? "4s" : "3.5s"} ease-in-out infinite`
            : "siri-morph 6s ease-in-out infinite",
          borderRadius: "42% 58% 50% 50% / 50% 42% 58% 50%",
        }}
      >
        {/* Base fill — dark with tint */}
        <div
          className="absolute inset-0"
          style={{
            background: state === "idle"
              ? "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.08) 0%, rgba(7,8,10,0.9) 70%)"
              : state === "listening"
              ? "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.15) 0%, rgba(7,8,10,0.8) 70%)"
              : state === "thinking"
              ? "radial-gradient(circle at 50% 50%, rgba(251,191,36,0.12) 0%, rgba(7,8,10,0.85) 70%)"
              : "radial-gradient(circle at 50% 50%, rgba(52,211,153,0.15) 0%, rgba(7,8,10,0.8) 70%)",
          }}
        />

        {/* Gradient layer 1 — slow clockwise */}
        <div
          className="absolute inset-[-20%] rounded-full"
          style={{
            background: state === "idle"
              ? "conic-gradient(from 0deg, transparent 0%, rgba(34,211,238,0.2) 15%, transparent 30%, rgba(139,92,246,0.15) 50%, transparent 65%, rgba(34,211,238,0.18) 80%, transparent 100%)"
              : state === "listening"
              ? "conic-gradient(from 0deg, transparent 0%, rgba(34,211,238,0.45) 15%, transparent 30%, rgba(139,92,246,0.35) 50%, transparent 65%, rgba(96,165,250,0.4) 80%, transparent 100%)"
              : state === "thinking"
              ? "conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.4) 15%, transparent 30%, rgba(251,146,60,0.3) 50%, transparent 65%, rgba(251,191,36,0.35) 80%, transparent 100%)"
              : "conic-gradient(from 0deg, transparent 0%, rgba(52,211,153,0.45) 15%, transparent 30%, rgba(34,211,238,0.35) 50%, transparent 65%, rgba(110,231,183,0.4) 80%, transparent 100%)",
            filter: "blur(8px)",
            animation: `siri-rotate-1 ${isActive ? (state === "speaking" ? "3s" : "5s") : "10s"} linear infinite`,
          }}
        />

        {/* Gradient layer 2 — counter-clockwise */}
        <div
          className="absolute inset-[-15%] rounded-full"
          style={{
            background: state === "idle"
              ? "conic-gradient(from 120deg, transparent 0%, rgba(139,92,246,0.15) 20%, transparent 40%, rgba(34,211,238,0.12) 60%, transparent 80%, rgba(168,85,247,0.1) 95%, transparent 100%)"
              : state === "listening"
              ? "conic-gradient(from 120deg, transparent 0%, rgba(139,92,246,0.35) 20%, transparent 40%, rgba(34,211,238,0.3) 60%, transparent 80%, rgba(168,85,247,0.3) 95%, transparent 100%)"
              : state === "thinking"
              ? "conic-gradient(from 120deg, transparent 0%, rgba(251,146,60,0.3) 20%, transparent 40%, rgba(251,191,36,0.25) 60%, transparent 80%, rgba(245,158,11,0.25) 95%, transparent 100%)"
              : "conic-gradient(from 120deg, transparent 0%, rgba(34,211,238,0.35) 20%, transparent 40%, rgba(52,211,153,0.3) 60%, transparent 80%, rgba(20,184,166,0.3) 95%, transparent 100%)",
            filter: "blur(6px)",
            animation: `siri-rotate-2 ${isActive ? (state === "speaking" ? "4s" : "7s") : "14s"} linear infinite`,
          }}
        />

        {/* Gradient layer 3 — faster, tighter swirl */}
        <div
          className="absolute inset-[-10%] rounded-full"
          style={{
            background: state === "idle"
              ? "conic-gradient(from 240deg, transparent 0%, rgba(34,211,238,0.1) 25%, transparent 50%, rgba(139,92,246,0.08) 75%, transparent 100%)"
              : state === "listening"
              ? "conic-gradient(from 240deg, transparent 0%, rgba(96,165,250,0.3) 25%, transparent 50%, rgba(34,211,238,0.25) 75%, transparent 100%)"
              : state === "thinking"
              ? "conic-gradient(from 240deg, transparent 0%, rgba(251,191,36,0.25) 25%, transparent 50%, rgba(251,146,60,0.2) 75%, transparent 100%)"
              : "conic-gradient(from 240deg, transparent 0%, rgba(110,231,183,0.3) 25%, transparent 50%, rgba(52,211,153,0.25) 75%, transparent 100%)",
            filter: "blur(5px)",
            animation: `siri-rotate-1 ${isActive ? (state === "speaking" ? "2s" : "4s") : "8s"} linear infinite`,
          }}
        />

        {/* Bright center core */}
        <div
          className="absolute inset-[25%] rounded-full"
          style={{
            background: state === "idle"
              ? "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)"
              : state === "listening"
              ? "radial-gradient(circle, rgba(34,211,238,0.3) 0%, rgba(139,92,246,0.1) 50%, transparent 70%)"
              : state === "thinking"
              ? "radial-gradient(circle, rgba(251,191,36,0.25) 0%, rgba(251,146,60,0.08) 50%, transparent 70%)"
              : "radial-gradient(circle, rgba(52,211,153,0.3) 0%, rgba(34,211,238,0.1) 50%, transparent 70%)",
            filter: "blur(3px)",
            animation: `siri-glow-pulse ${isActive ? "2s" : "5s"} ease-in-out infinite`,
          }}
        />

        {/* Surface sheen — subtle highlight for 3D effect */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.08) 0%, transparent 50%)",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Compact mic visualizer — glowing ring around mic button.
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
          <div
            className="absolute w-[130%] h-[130%] rounded-full bg-brand-cyan/15 blur-md"
            style={{ animation: "mic-glow 1.5s ease-in-out infinite" }}
          />
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
