"use client";

import { cn } from "@/lib/utils";
import type { VoiceState } from "./VoiceVisualizer";

type ClaudeOrbProps = {
  state: VoiceState;
  className?: string;
};

// Claude palette: terracotta / coral / clay on warm ivory, as RGB triplets.
const PALETTE: Record<VoiceState, { a: string; b: string; c: string; glow: number; speed: number }> = {
  idle:      { a: "217,119,87",  b: "193,95,60",   c: "240,238,230", glow: 0.25, speed: 1 },
  listening: { a: "232,146,124", b: "217,119,87",  c: "250,249,245", glow: 0.45, speed: 0.6 },
  thinking:  { a: "229,164,90",  b: "217,119,87",  c: "240,238,230", glow: 0.4,  speed: 0.8 },
  speaking:  { a: "217,119,87",  b: "232,146,124", c: "250,249,245", glow: 0.55, speed: 0.4 },
};

/**
 * Claude-style voice orb — warm terracotta sphere with slow swirling
 * gradients and a ✻ spark that spins while thinking. Drop-in for VoiceVisualizer.
 */
export function ClaudeOrb({ state, className }: ClaudeOrbProps) {
  const p = PALETTE[state];
  const s = (base: number) => `${base * p.speed}s`;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <style>{`
        @keyframes corb-spin { to { transform: rotate(360deg); } }
        @keyframes corb-spin-rev { to { transform: rotate(-360deg); } }
        @keyframes corb-breathe {
          0%, 100% { border-radius: 46% 54% 50% 50% / 50% 46% 54% 50%; transform: scale(0.96); }
          33%      { border-radius: 54% 46% 48% 52% / 52% 54% 46% 48%; transform: scale(1.04); }
          66%      { border-radius: 50% 50% 54% 46% / 46% 50% 50% 54%; transform: scale(0.99); }
        }
        @keyframes corb-glow {
          0%, 100% { opacity: 0.6; transform: scale(0.92); }
          50%      { opacity: 1;   transform: scale(1.12); }
        }
        @keyframes corb-ring {
          from { transform: scale(0.75); opacity: 0.5; }
          to   { transform: scale(2);    opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .corb-anim, .corb-anim * { animation: none !important; }
        }
      `}</style>

      <div className="corb-anim relative flex items-center justify-center">
        {/* Ambient glow */}
        <div
          className="absolute h-36 w-36 rounded-full blur-3xl transition-all duration-700"
          style={{
            background: `radial-gradient(circle, rgba(${p.a},${p.glow}) 0%, rgba(${p.b},${p.glow / 2}) 45%, transparent 70%)`,
            animation: `corb-glow ${s(4)} ease-in-out infinite`,
          }}
        />

        {/* Rings while listening / speaking */}
        {(state === "listening" || state === "speaking") &&
          [0, 0.9].map((delay) => (
            <div
              key={delay}
              className="absolute h-[76px] w-[76px] rounded-full"
              style={{
                border: `1.5px solid rgba(${p.a},0.35)`,
                animation: `corb-ring 2.6s ease-out ${delay}s infinite`,
              }}
            />
          ))}

        {/* Orb body */}
        <div
          className="relative z-10 h-[76px] w-[76px] overflow-hidden"
          style={{
            background: `radial-gradient(circle at 50% 55%, rgba(${p.a},0.9) 0%, rgba(${p.b},0.95) 60%, rgba(120,52,32,1) 100%)`,
            animation: `corb-breathe ${s(6)} ease-in-out infinite`,
            boxShadow: `inset 0 -8px 18px rgba(80,30,15,0.45), 0 0 24px rgba(${p.a},${p.glow})`,
          }}
        >
          <div
            className="absolute inset-[-25%]"
            style={{
              background: `conic-gradient(from 0deg, transparent, rgba(${p.c},0.35) 18%, transparent 36%, rgba(${p.a},0.6) 55%, transparent 75%, rgba(${p.c},0.25) 90%, transparent)`,
              filter: "blur(8px)",
              animation: `corb-spin ${s(10)} linear infinite`,
            }}
          />
          <div
            className="absolute inset-[-15%]"
            style={{
              background: `conic-gradient(from 140deg, transparent, rgba(${p.b},0.55) 25%, transparent 50%, rgba(${p.c},0.2) 75%, transparent)`,
              filter: "blur(6px)",
              animation: `corb-spin-rev ${s(14)} linear infinite`,
            }}
          />
          {/* Sheen */}
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 32% 26%, rgba(255,255,255,0.35) 0%, transparent 45%)" }}
          />
          {/* ✻ spark */}
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-2xl leading-none"
            style={{
              color: `rgba(${p.c},${state === "thinking" ? 0.95 : 0.55})`,
              animation: state === "thinking" ? "corb-spin 2.4s linear infinite" : undefined,
            }}
          >
            ✻
          </span>
        </div>
      </div>
    </div>
  );
}
