"use client";

import { useCallback, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { VoiceVisualizer } from "@/components/interview/VoiceVisualizer";
import { cn } from "@/lib/utils";
import { getInterviewerPersona } from "@/lib/interviewer-personas";

const TIA_SAMPLE_AUDIO_PATH = "/sounds/tia-aura-asteria-sample.wav";
const DEFAULT_PERSONA = getInterviewerPersona("tia");

export function LandingTiaPreview() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      void el.play().catch(() => setPlaying(false));
    }
  }, [playing]);

  return (
    <div className="flex w-full flex-col items-center gap-3 py-1">
      <audio
        ref={audioRef}
        src={TIA_SAMPLE_AUDIO_PATH}
        preload="metadata"
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setLoadError(true)}
      />

      <VoiceVisualizer
        state="speaking"
        className="h-24 w-24 sm:h-28 sm:w-28"
      />

      <div className="w-full text-center">
        <p className="text-sm font-semibold text-brand-text">
          {DEFAULT_PERSONA.name}{" "}
          <span className="text-[10px] font-normal text-brand-muted">
            ({DEFAULT_PERSONA.companyLabel})
          </span>
        </p>
        <p className="text-[11px] text-brand-muted">AI Interviewer</p>
        <div className="mt-1 flex min-h-5 items-center justify-center" aria-live="polite">
          <p
            className={cn(
              "flex items-center justify-center gap-1 text-[10px] text-brand-green transition-opacity duration-150",
              playing ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={!playing}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green",
                playing && "animate-pulse"
              )}
            />
            Speaking...
          </p>
        </div>
      </div>

      {loadError ? (
        <p className="max-w-[220px] text-center text-[11px] leading-snug text-brand-muted">
          We couldn&apos;t load the voice preview. Refresh the page or try again in a moment.
        </p>
      ) : null}

      <button
        type="button"
        onClick={toggle}
        disabled={loadError}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors",
          loadError && "cursor-not-allowed opacity-40",
          !loadError &&
            (playing
              ? "border-brand-green/40 bg-brand-green/10 text-brand-green hover:bg-brand-green/15"
              : "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/15")
        )}
        aria-label={
          playing
            ? `Pause ${DEFAULT_PERSONA.name} voice sample`
            : `Play ${DEFAULT_PERSONA.name} voice sample`
        }
      >
        {playing ? (
          <Pause className="h-3.5 w-3.5 shrink-0" aria-hidden />
        ) : (
          <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden />
        )}
        <Volume2 className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        {playing ? "Pause" : `Hear ${DEFAULT_PERSONA.name}`}
      </button>
    </div>
  );
}
