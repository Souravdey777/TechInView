"use client";

import { useRef, useState } from "react";
import { VoiceVisualizer, type VoiceState } from "@/components/interview/VoiceVisualizer";
import { cn } from "@/lib/utils";

const STATES: VoiceState[] = ["idle", "listening", "thinking", "speaking"];

// A realistic turn, including the brief "thinking" flicker Deepgram emits.
const TURN: [VoiceState, number][] = [
  ["listening", 2500],
  ["thinking", 80],
  ["listening", 1200],
  ["thinking", 1500],
  ["speaking", 3000],
  ["idle", 0],
];

export function OrbLab() {
  const [state, setState] = useState<VoiceState>("idle");
  const timers = useRef<number[]>([]);

  const play = () => {
    timers.current.forEach(clearTimeout);
    let at = 0;
    timers.current = TURN.map(([s, ms]) => {
      const id = window.setTimeout(() => setState(s), at);
      at += ms;
      return id;
    });
  };

  const pick = (s: VoiceState) => {
    timers.current.forEach(clearTimeout);
    setState(s);
  };

  return (
    <main className="min-h-screen bg-brand-deep px-4 py-12 text-brand-text">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold">Orb lab</h1>
        <p className="mt-1 text-sm text-brand-muted">Voice orb states and transitions. Dev only.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => pick(s)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm capitalize transition-colors",
                state === s ? "border-brand-cyan bg-brand-cyan/15 text-brand-cyan" : "border-white/10 hover:border-white/30"
              )}
            >
              {s}
            </button>
          ))}
          <button onClick={play} className="rounded-full border border-white/10 px-4 py-1.5 text-sm hover:border-white/30">
            ▶ Simulate a turn
          </button>
        </div>

        <div className="mt-8 grid gap-6">
          {[
            { label: "Default", orb: <VoiceVisualizer state={state} className="h-48 w-48" /> },
            { label: "Follow cursor (landing)", orb: <VoiceVisualizer state={state} followCursor className="h-48 w-48" /> },
          ].map(({ label, orb }) => (
            <section key={label} className="flex flex-col items-center gap-4 rounded-2xl border border-brand-border bg-brand-card p-8">
              <div className="flex h-56 items-center justify-center">{orb}</div>
              <p className="text-sm text-brand-muted">{label}</p>
            </section>
          ))}
        </div>

        <p className="mt-4 text-center font-mono text-xs text-brand-muted">state: {state}</p>
      </div>
    </main>
  );
}
