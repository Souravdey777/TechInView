"use client";

import type { VoiceLatencyStats } from "@/hooks/useDeepgramVoiceAgent";

/**
 * Dev-only voice latency overlay. Renders rolling V2V (voice-to-voice) p50/p90
 * plus Deepgram's own per-turn total. Mounted when NODE_ENV !== production or
 * the URL carries `?latency=1` (so it can be read against a real deploy too).
 */

function fmt(v: number | null): string {
  return v == null ? "—" : `${v}ms`;
}

function band(v: number | null): string {
  if (v == null) return "text-brand-muted";
  if (v < 800) return "text-brand-green";
  if (v < 1200) return "text-brand-amber";
  return "text-brand-rose";
}

export function VoiceLatencyHud({ stats }: { stats: VoiceLatencyStats }) {
  const last = stats.samples[stats.samples.length - 1];

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-50 w-52 rounded-lg border border-brand-border bg-brand-card/95 p-3 font-mono text-[11px] text-brand-text shadow-lg backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between tracking-wider text-brand-muted">
        <span>VOICE LATENCY</span>
        <span>n={stats.count}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-brand-muted">V2V last</span>
        <span className={band(stats.lastV2vMs)}>{fmt(stats.lastV2vMs)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-brand-muted">V2V p50</span>
        <span className={band(stats.p50V2vMs)}>{fmt(stats.p50V2vMs)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-brand-muted">V2V p90</span>
        <span className={band(stats.p90V2vMs)}>{fmt(stats.p90V2vMs)}</span>
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-brand-border pt-1 text-brand-muted">
        <span>think→audio</span>
        <span>{fmt(last?.thinkToAudioMs ?? null)}</span>
      </div>
      <div className="flex items-center justify-between text-brand-muted">
        <span>dg total</span>
        <span>{fmt(last?.dgTotalMs ?? null)}</span>
      </div>

      <div className="mt-1 text-[9px] leading-tight text-brand-subtle">
        end-of-speech → agent audio. +~150ms jitter to audible.
      </div>
    </div>
  );
}
