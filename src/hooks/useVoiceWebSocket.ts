"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

type ProblemContext = {
  title: string;
  description: string;
  solution_approach?: string;
  constraints?: string[];
};

type VoiceWSCallbacks = {
  onTranscriptInterim?: (text: string) => void;
  onTranscriptFinal?: (text: string) => void;
  onAiTextPartial?: (text: string) => void;
  onAiTextComplete?: (text: string) => void;
  onError?: (source: string, message: string) => void;
};

const VOICE_WS_URL = process.env.NEXT_PUBLIC_VOICE_WS_URL ?? "ws://localhost:8080/voice";
const TTS_SAMPLE_RATE = 24000;

export function useVoiceWebSocket(callbacks?: VoiceWSCallbacks) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const serverDoneSendingRef = useRef(false);
  const callbacksRef = useRef(callbacks);
  const transcriptRef = useRef("");
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Keep refs in sync with state
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  // ── Audio playback via Web Audio API (gapless scheduling) ────────────────

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContext({ sampleRate: TTS_SAMPLE_RATE });
    }
    return audioContextRef.current;
  }, []);

  const flushAudioQueue = useCallback(() => {
    for (const source of scheduledSourcesRef.current) {
      try { source.stop(); } catch { /* already stopped */ }
    }
    scheduledSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
    serverDoneSendingRef.current = false;
  }, []);

  const enqueueAudio = useCallback((pcmData: ArrayBuffer) => {
    if (pcmData.byteLength < 4) return;

    const ctx = getAudioContext();
    const int16 = new Int16Array(pcmData);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, TTS_SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(nextPlayTimeRef.current, now);
    source.start(startAt);
    nextPlayTimeRef.current = startAt + audioBuffer.duration;

    scheduledSourcesRef.current.push(source);
    source.onended = () => {
      scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
      if (serverDoneSendingRef.current && scheduledSourcesRef.current.length === 0) {
        serverDoneSendingRef.current = false;
        setIsSpeaking(false);
        if (!isListeningRef.current) {
          setVoiceState("idle");
        }
      }
    };
  }, [getAudioContext]);

  const enqueueAudioRef = useRef(enqueueAudio);
  enqueueAudioRef.current = enqueueAudio;

  // ── Mic capture ─────────────────────────────────────────────────────────

  const stopMic = useCallback(() => {
    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stop(); } catch { /* */ }
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const startMic = useCallback(async () => {
    if (mediaRecorderRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          event.data.arrayBuffer().then((buf) => {
            wsRef.current?.send(buf);
          });
        }
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error("[voice-ws] Failed to start mic:", err);
    }
  }, []);

  // ── Server message handler ──────────────────────────────────────────────

  const handleServerMessageRef = useRef((msg: Record<string, unknown>) => {
    const type = msg.type as string;

    switch (type) {
      case "transcript_interim":
        transcriptRef.current = msg.text as string;
        setTranscript(msg.text as string);
        callbacksRef.current?.onTranscriptInterim?.(msg.text as string);
        break;

      case "transcript_final":
        transcriptRef.current = msg.text as string;
        setTranscript(msg.text as string);
        callbacksRef.current?.onTranscriptFinal?.(msg.text as string);
        break;

      case "utterance_end":
        if (isListeningRef.current) {
          // Stop mic — inline to avoid stale closure
          if (mediaRecorderRef.current) {
            try { mediaRecorderRef.current.stop(); } catch { /* */ }
            mediaRecorderRef.current = null;
          }
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }
          isListeningRef.current = false;
          setIsListening(false);
        }
        break;

      case "thinking_started":
        setVoiceState("thinking");
        break;

      case "speaking_started":
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        setVoiceState("speaking");
        serverDoneSendingRef.current = false;
        break;

      case "speaking_ended":
        serverDoneSendingRef.current = true;
        if (scheduledSourcesRef.current.length === 0) {
          serverDoneSendingRef.current = false;
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          if (!isListeningRef.current) {
            setVoiceState("idle");
          }
        }
        break;

      case "ai_text_partial":
        callbacksRef.current?.onAiTextPartial?.(msg.text as string);
        break;

      case "ai_text_complete":
        callbacksRef.current?.onAiTextComplete?.(msg.text as string);
        break;

      case "error":
        console.error(`[voice-ws] Server error (${msg.source}): ${msg.message}`);
        callbacksRef.current?.onError?.(msg.source as string, msg.message as string);
        break;
    }
  });

  // ── WebSocket lifecycle managed by a single effect ──────────────────────

  useEffect(() => {
    mountedRef.current = true;

    console.log("[voice-ws] Connecting...");
    const ws = new WebSocket(VOICE_WS_URL);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      console.log("[voice-ws] Connected to voice server.");
      setIsConnected(true);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        enqueueAudioRef.current(event.data);
        return;
      }
      try {
        const msg = JSON.parse(event.data as string);
        handleServerMessageRef.current(msg);
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      console.log("[voice-ws] Disconnected.");
      if (wsRef.current === ws) {
        wsRef.current = null;
        setIsConnected(false);
      }
    };

    ws.onerror = (err) => {
      console.error("[voice-ws] WebSocket error:", err);
    };

    return () => {
      mountedRef.current = false;
      ws.close();
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cleanup on full unmount ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stop(); } catch { /* */ }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  // ── Public API ──────────────────────────────────────────────────────────

  const sendControl = useCallback((msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isSpeakingRef.current) {
      sendControl({ type: "interrupt" });
      flushAudioQueue();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }

    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    setTranscript("");
    transcriptRef.current = "";
    await startMic();
    isListeningRef.current = true;
    setIsListening(true);
    setVoiceState("listening");
  }, [sendControl, flushAudioQueue, getAudioContext, startMic]);

  const stopListening = useCallback(() => {
    stopMic();
    isListeningRef.current = false;
    setIsListening(false);
    if (!isSpeakingRef.current) {
      setVoiceState("idle");
    }
  }, [stopMic]);

  const stopSpeaking = useCallback(() => {
    sendControl({ type: "interrupt" });
    flushAudioQueue();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setVoiceState("idle");
  }, [sendControl, flushAudioQueue]);

  const startInterview = useCallback(async (problem: ProblemContext) => {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    sendControl({ type: "start", problem, phase: "INTRO" });
  }, [getAudioContext, sendControl]);

  const sendTextInput = useCallback((text: string) => {
    sendControl({ type: "text_input", text });
  }, [sendControl]);

  const sendStateUpdate = useCallback((state: string) => {
    sendControl({ type: "state_update", state });
  }, [sendControl]);

  const sendCodeUpdate = useCallback((code: string, language: string) => {
    sendControl({ type: "code_update", code, language });
  }, [sendControl]);

  const getTranscript = useCallback(() => {
    return transcriptRef.current;
  }, []);

  const disconnect = useCallback(() => {
    stopMic();
    flushAudioQueue();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setVoiceState("idle");
    isListeningRef.current = false;
    setIsListening(false);
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, [stopMic, flushAudioQueue]);

  return {
    voiceState,
    isListening,
    isSpeaking,
    isConnected,
    transcript,
    setTranscript,
    getTranscript,

    disconnect,
    startListening,
    stopListening,
    stopSpeaking,
    startInterview,
    sendTextInput,
    sendStateUpdate,
    sendCodeUpdate,
  };
}
