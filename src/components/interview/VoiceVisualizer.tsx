"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

type VoiceVisualizerProps = {
  state: VoiceState;
  className?: string;
  /** Eyes track the pointer on top of the state pose (landing page). */
  followCursor?: boolean;
};

const FADE_MS = 700;

/**
 * Siri-style fluid orb — smooth iridescent sphere with swirling
 * color gradients that blend and morph organically.
 *
 * Gradients can't be CSS-transitioned and swapping keyframes restarts them,
 * so each state renders as its own layer and state changes crossfade: the
 * outgoing layer keeps animating while it fades out.
 */
export function VoiceVisualizer({ state, className, followCursor = false }: VoiceVisualizerProps) {
  const [layers, setLayers] = useState<VoiceState[]>([state]);

  useEffect(() => {
    setLayers((prev) => (prev.includes(state) ? prev : [...prev, state]));
    const id = window.setTimeout(() => setLayers([state]), FADE_MS);
    return () => window.clearTimeout(id);
  }, [state]);

  return (
    <div
      className={cn("relative min-h-[76px] min-w-[76px] transition-transform ease-in-out motion-reduce:transition-none", className)}
      style={{ transform: `scale(${state === "idle" ? 0.75 : 1})`, transitionDuration: `${FADE_MS}ms` }}
    >
      {layers.map((s) => (
        <OrbLayer key={s} state={s} visible={s === state} />
      ))}
      {/* One pair above the layers, so a state change moves the eyes instead of crossfading two pairs. */}
      <OrbEyes state={state} followCursor={followCursor} />
    </div>
  );
}

function OrbLayer({ state, visible }: { state: VoiceState; visible: boolean }) {
  const isActive = state !== "idle";

  return (
    <div
      data-state={state}
      className="absolute inset-0 flex items-center justify-center transition-opacity motion-reduce:transition-none"
      style={{
        // Incoming eases out fast, outgoing eases in late, so the sum never dips.
        opacity: visible ? 1 : 0,
        transitionDuration: `${FADE_MS}ms`,
        transitionTimingFunction: "cubic-bezier(0.7, 0, 1, 1)",
        animation: `siri-layer-in ${FADE_MS}ms cubic-bezier(0, 0, 0.3, 1)`,
      }}
    >
      <style>{`
        @keyframes siri-layer-in { from { opacity: 0; } }
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

      {/* ── The orb — layered rotating gradients inside a morphing container ── */}
      <div
        className="relative z-10 w-[76px] h-[76px] overflow-hidden"
        style={{
          animation: isActive
            ? `siri-morph-active ${state === "speaking" ? "3s" : state === "thinking" ? "4s" : "3.5s"} ease-in-out infinite`
            : "siri-morph 6s ease-in-out infinite",
          borderRadius: "42% 58% 50% 50% / 50% 42% 58% 50%",
          boxShadow: "0 12px 28px -10px rgba(0,0,0,0.7)",
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

        {/* Sphere shading — light from top-left: shadowed far side, rim, specular */}
        <div
          className="absolute inset-0 rounded-[inherit]"
          style={{
            background: "radial-gradient(circle at 36% 30%, transparent 35%, rgba(0,0,0,0.25) 65%, rgba(0,0,0,0.6) 100%)",
            boxShadow: "inset -4px -6px 12px rgba(0,0,0,0.45), inset 2px 3px 6px rgba(255,255,255,0.12)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: "20%",
            top: "14%",
            width: "34%",
            height: "24%",
            background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 50%, transparent 75%)",
            filter: "blur(3px)",
            transform: "rotate(-25deg)",
          }}
        />
      </div>
    </div>
  );
}

// One eye's shape: size in px, corner radius, tilt, and vertical nudge.
type EyeShape = { w: number; h: number; r: string; rot: number; dy: number };

const PILL = "50%";
// Rounded top, flat bottom: cheeks pushing up into a smile.
const HAPPY = "50% 50% 30% 30% / 80% 80% 20% 20%";

// Per-state pose. x/y shift both eyes; look/bob are 0..1 amplitudes for the idle glance and speaking bob.
const EYE_POSE: Record<VoiceState, { x: number; y: number; look: number; bob: number; eyes: [EyeShape, EyeShape] }> = {
  // Calm, glancing around.
  idle: {
    x: 0, y: 0, look: 1, bob: 0,
    eyes: [{ w: 8, h: 13, r: PILL, rot: 0, dy: 0 }, { w: 8, h: 13, r: PILL, rot: 0, dy: 0 }],
  },
  // Wide open, leaning in.
  listening: {
    x: 0, y: -2, look: 0, bob: 0,
    eyes: [{ w: 9, h: 16, r: PILL, rot: 0, dy: 0 }, { w: 9, h: 16, r: PILL, rot: 0, dy: 0 }],
  },
  // Looking up and away, one eye squinted: pondering.
  thinking: {
    x: 5, y: -6, look: 0, bob: 0,
    eyes: [{ w: 9, h: 6, r: PILL, rot: -12, dy: 2 }, { w: 8, h: 14, r: PILL, rot: 0, dy: -1 }],
  },
  // Smiling eyes, tilted outward, bobbing with the voice.
  speaking: {
    x: 0, y: 0, look: 0, bob: 1,
    eyes: [{ w: 10, h: 7, r: HAPPY, rot: -10, dy: 0 }, { w: 10, h: 7, r: HAPPY, rot: 10, dy: 0 }],
  },
};

const EYE_EASE = `${FADE_MS}ms cubic-bezier(0.45, 0, 0.25, 1)`;
// How far (orb px) the eyes can travel toward the cursor, and the distance at which they hit it.
const FOLLOW_MAX = { x: 7, y: 5 };
const FOLLOW_REACH = 320;

const EYE_CSS = `
        @property --eye-look { syntax: "<number>"; inherits: false; initial-value: 0; }
        @property --eye-bob { syntax: "<number>"; inherits: false; initial-value: 0; }
        @keyframes siri-eyes-look {
          0%, 100% { transform: translateX(0); }
          30% { transform: translateX(calc(var(--eye-look) * -3px)); }
          65% { transform: translateX(calc(var(--eye-look) * 3px)); }
        }
        @keyframes siri-eyes-bob {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 calc(var(--eye-bob) * -1.5px); }
        }
        @keyframes siri-blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
`;

function OrbEyes({ state, followCursor }: { state: VoiceState; followCursor: boolean }) {
  const pose = EYE_POSE[state];
  const followRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = followRef.current;
    if (!followCursor || !el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Rect is post-transform, so this works however the orb is scaled or moved.
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const pull = Math.min(1, dist / FOLLOW_REACH);
        el.style.translate = `${(dx / dist) * pull * FOLLOW_MAX.x}px ${(dy / dist) * pull * FOLLOW_MAX.y}px`;
      });
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      el.style.translate = "0px 0px";
    };
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", reset);
    };
  }, [followCursor]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center motion-reduce:![animation:none]"
      style={{
        // Glance and bob always run; their amplitudes transition, so motion fades in and out instead of snapping.
        ["--eye-look" as string]: followCursor ? 0 : pose.look,
        ["--eye-bob" as string]: pose.bob,
        transition: `--eye-look ${EYE_EASE}, --eye-bob ${EYE_EASE}`,
        animation: "siri-eyes-look 9s ease-in-out infinite, siri-eyes-bob 0.6s ease-in-out infinite",
      }}
    >
      {/* Raw HTML: React escapes the quotes/brackets in @property text on the server, breaking hydration. */}
      <style dangerouslySetInnerHTML={{ __html: EYE_CSS }} />
      <div ref={followRef} className="flex items-center gap-[13px]" style={{ transition: "translate 180ms ease-out" }}>
        {pose.eyes.map((eye, i) => (
          <span
            key={i}
            className="block bg-white/90 motion-reduce:![animation:none]"
            style={{
              width: eye.w,
              height: eye.h,
              borderRadius: eye.r,
              rotate: `${eye.rot}deg`,
              translate: `${pose.x}px ${pose.y + eye.dy - 3}px`,
              transition: ["width", "height", "border-radius", "rotate", "translate"].map((p) => `${p} ${EYE_EASE}`).join(", "),
              boxShadow: "0 0 8px rgba(255,255,255,0.45)",
              animation: "siri-blink 4.5s ease-in-out infinite",
            }}
          />
        ))}
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
