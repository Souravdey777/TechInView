"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { normalizeSttTranscript } from "@/lib/voice/normalize-stt-transcript";
import { splitTextForTts } from "@/lib/voice/split-for-tts";

// Web Speech API types (STT — browser SpeechRecognition until Deepgram Nova-2)
type SpeechRecognitionType = {
  new (): SpeechRecognitionInstance;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: {
    resultIndex: number;
    results: {
      length: number;
      [index: number]: { isFinal: boolean; [index: number]: { transcript: string } };
    };
  }) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  /** Non-standard; supported in Chromium for long-form dictation. */
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

/** Pause longer than this after the last word before we stop recognition and auto-send (continuous mode). */
const SILENCE_END_MS = 2400;

function getAudioContextCtor(): (typeof AudioContext) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

export function useVoiceInterview() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef("");
  /** Final segments accumulated across `onresult` events (continuous recognition). */
  const finalsRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const setTranscriptSynced = useCallback((value: string) => {
    transcriptRef.current = value;
    if (value === "") finalsRef.current = "";
    setTranscript(value);
  }, []);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  /** When Web Audio decode fails, we fall back to this element (must pause on stop). */
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const playAbortRef = useRef<AbortController | null>(null);

  const getOrCreateAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (audioContextRef.current) return audioContextRef.current;
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    audioContextRef.current = new Ctor();
    return audioContextRef.current;
  }, []);

  /**
   * Call from a user gesture (e.g. "Start interview") so playback works on Safari/iOS.
   */
  const prepareAudioPlayback = useCallback(async () => {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
  }, [getOrCreateAudioContext]);

  const stopSpeaking = useCallback(() => {
    playAbortRef.current?.abort();
    playAbortRef.current = null;
    try {
      sourceRef.current?.stop();
    } catch {
      /* already stopped */
    }
    sourceRef.current = null;
    try {
      fallbackAudioRef.current?.pause();
    } catch {
      /* ignore */
    }
    fallbackAudioRef.current = null;
    setIsSpeaking(false);
    setVoiceState("idle");
  }, []);

  // Continuous mode + debounced silence: `continuous=false` stops after tiny pauses and feels like the mic "drops" mid-sentence.
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    clearSilenceTimer();

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    const win = window as unknown as Record<string, unknown>;
    const SpeechRecognitionCtor =
      (win.SpeechRecognition || win.webkitSpeechRecognition) as SpeechRecognitionType | undefined;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    try {
      recognition.maxAlternatives = 1;
    } catch {
      /* optional */
      console.warn("SpeechRecognition.maxAlternatives not supported");
    }

    transcriptRef.current = "";
    finalsRef.current = "";

    const scheduleSilenceEnd = () => {
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        silenceTimerRef.current = null;
        const rec = recognitionRef.current;
        if (rec) {
          try {
            rec.stop();
          } catch {
            /* ignore */
          }
        }
      }, SILENCE_END_MS);
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const piece = normalizeSttTranscript(result[0].transcript);
        if (result.isFinal) {
          finalsRef.current += piece;
        } else {
          interim += piece;
        }
      }

      const combined = (finalsRef.current + interim).trim();
      if (combined) {
        transcriptRef.current = combined;
        setTranscript(combined);
        scheduleSilenceEnd();
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceState("listening");
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
      setVoiceState("idle");
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      clearSilenceTimer();
      setIsListening(false);
      setVoiceState("idle");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [clearSilenceTimer]);

  // Stop listening manually
  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setIsListening(false);
    setVoiceState("idle");
  }, [clearSilenceTimer]);

  // Get the current transcript (use ref for synchronous access)
  const getTranscript = useCallback(() => {
    return transcriptRef.current;
  }, []);

  // Text-to-speech via Deepgram Aura 2: sentence chunks + prefetch next chunk while playing (lower latency).
  const speakText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (typeof window === "undefined" || !trimmed) return;

      stopSpeaking();

      // Mark as busy so the caller can clear isAiThinking without
      // the orb flickering to "idle".  The actual "speaking" state
      // is deferred until the first audio chunk starts playing.
      setIsSpeaking(true);
      setVoiceState("thinking");

      const ctx = getOrCreateAudioContext();
      if (!ctx) {
        console.warn("Web Audio API not available for TTS.");
        setIsSpeaking(false);
        setVoiceState("idle");
        return;
      }

      await prepareAudioPlayback();

      const chunks = splitTextForTts(trimmed);
      if (chunks.length === 0) {
        setIsSpeaking(false);
        setVoiceState("idle");
        return;
      }

      const ac = new AbortController();
      playAbortRef.current = ac;

      type ChunkPayload = { data: ArrayBuffer; mimeType: string };

      const fetchChunk = async (index: number): Promise<ChunkPayload> => {
        const res = await fetch("/api/voice/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunks[index] }),
          signal: ac.signal,
          ...(index === 0 ? ({ priority: "high" } as RequestInit) : {}),
        });
        if (!res.ok) {
          let detail = "";
          try {
            const j = (await res.json()) as { error?: string };
            detail = j.error ?? "";
          } catch {
            /* ignore */
          }
          throw new Error(detail || `TTS HTTP ${res.status}`);
        }
        const mimeType = res.headers.get("content-type") ?? "audio/mpeg";
        const data = await res.arrayBuffer();
        return { data, mimeType };
      };

      /** Keep two chunks in flight so chunk 1 is often ready before chunk 0 finishes playing. */
      const inFlight = new Map<number, Promise<ChunkPayload>>();
      const ensureFetched = (idx: number) => {
        if (idx < 0 || idx >= chunks.length) return;
        if (!inFlight.has(idx)) {
          inFlight.set(idx, fetchChunk(idx));
        }
      };

      let firstChunkStarted = false;
      const markSpeaking = () => {
        if (!firstChunkStarted) {
          firstChunkStarted = true;
          setVoiceState("speaking");
        }
      };

      const playBlobWithHtmlAudio = (data: ArrayBuffer, mimeType: string): Promise<void> =>
        new Promise((resolve) => {
          if (ac.signal.aborted) {
            resolve();
            return;
          }
          const blob = new Blob([data], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const audio = new Audio();
          fallbackAudioRef.current = audio;

          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            ac.signal.removeEventListener("abort", onAbort);
            URL.revokeObjectURL(url);
            if (fallbackAudioRef.current === audio) fallbackAudioRef.current = null;
            resolve();
          };

          function onAbort() {
            audio.pause();
            finish();
          }

          ac.signal.addEventListener("abort", onAbort);
          audio.onplay = () => markSpeaking();
          audio.onended = () => {
            finish();
          };
          audio.onerror = () => {
            console.warn("HTMLAudioElement playback error for TTS chunk");
            finish();
          };

          audio.src = url;
          void audio.play().catch((err) => {
            console.warn("TTS audio.play() failed:", err);
            finish();
          });
        });

      const playBuffer = (audioBuffer: AudioBuffer): Promise<void> =>
        new Promise((resolve) => {
          if (ac.signal.aborted) {
            resolve();
            return;
          }

          const src = ctx.createBufferSource();
          src.buffer = audioBuffer;
          src.connect(ctx.destination);

          let settled = false;
          function finish() {
            if (settled) return;
            settled = true;
            ac.signal.removeEventListener("abort", onAbort);
            resolve();
          }
          function onAbort() {
            try {
              src.stop();
            } catch {
              /* ignore */
            }
            finish();
          }

          ac.signal.addEventListener("abort", onAbort);
          src.onended = () => {
            sourceRef.current = null;
            finish();
          };
          sourceRef.current = src;
          src.start(0);
          markSpeaking();
        });

      try {
        ensureFetched(0);
        ensureFetched(1);

        for (let i = 0; i < chunks.length; i++) {
          ensureFetched(i);
          const { data: buf, mimeType } = await inFlight.get(i)!;
          inFlight.delete(i);

          ensureFetched(i + 2);

          if (ac.signal.aborted) return;

          try {
            const audioBuffer = await ctx.decodeAudioData(buf.slice(0));
            if (ac.signal.aborted) return;
            await playBuffer(audioBuffer);
          } catch (decodeErr) {
            if (!mimeType.includes("mpeg") && !mimeType.includes("mp3")) {
              console.warn("decodeAudioData failed, using <audio> fallback:", decodeErr);
            }
            if (ac.signal.aborted) return;
            await playBlobWithHtmlAudio(buf, mimeType);
          }

          if (ac.signal.aborted) return;
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (e instanceof Error && e.name === "AbortError") return;
        console.warn("Aura TTS playback failed:", e);
      } finally {
        if (!ac.signal.aborted) {
          setIsSpeaking(false);
          setVoiceState("idle");
          sourceRef.current = null;
        }
      }
    },
    [stopSpeaking, getOrCreateAudioContext, prepareAudioPlayback]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
      playAbortRef.current?.abort();
      try {
        sourceRef.current?.stop();
      } catch {
        /* ignore */
      }
      try {
        fallbackAudioRef.current?.pause();
      } catch {
        /* ignore */
      }
      audioContextRef.current?.close().catch(() => {});
    };
  }, []);

  return {
    voiceState,
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    prepareAudioPlayback,
    setTranscript: setTranscriptSynced,
    getTranscript,
  };
}
