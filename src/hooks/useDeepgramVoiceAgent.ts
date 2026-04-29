"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DeepgramClient, type ThinkSettingsV1 } from "@deepgram/sdk";
import type {
  AgentV1Settings,
  AgentV1FunctionCallRequest,
  AgentV1SendFunctionCallResponse,
} from "@deepgram/sdk/agent";
import type { VoiceState } from "@/components/interview/VoiceVisualizer";
import type { InterviewPhase } from "@/lib/interview-phases";
import { parseInterviewPhase, PHASE_ORDER } from "@/lib/interview-phases";

// ─── Public types ─────────────────────────────────────────────────────────────

export type AgentFunctionHandler = (
  name: string,
  args: Record<string, unknown>,
) => Promise<unknown>;

export type DeepgramVoiceAgentSettings = {
  systemPrompt: string;
  voiceModel?: string;
  greeting?: string;
  functions?: AgentFunctionDef[];
  contextMessages?: { role: "user" | "assistant"; content: string }[];
};

export type AgentFunctionDef = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type DeepgramVoiceAgentCallbacks = {
  onTranscript: (text: string, role: "user" | "agent", isFinal: boolean) => void;
  onFunctionCall: AgentFunctionHandler;
  onError: (error: Error) => void;
  onPhaseChange?: (phase: InterviewPhase) => void;
  onConnected?: () => void;
};

type InjectUserMessageOptions = {
  suppressTranscript?: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const DEFAULT_VOICE_MODEL = "aura-2-asteria-en";
const KEEPALIVE_INTERVAL_MS = 8000;
const MIC_RESUME_AFTER_AGENT_MS = 700;
const MIC_PERMISSION_TIMEOUT_MS = 15000;
const VOICE_TOKEN_TIMEOUT_MS = 15000;

type AgentConnection = Awaited<ReturnType<DeepgramClient["agent"]["v1"]["connect"]>>;

function buildThinkSettings(settings: DeepgramVoiceAgentSettings): ThinkSettingsV1 {
  const functions: ThinkSettingsV1.Functions = [
    {
      name: "set_interview_phase",
      description:
        "Update the interview phase displayed in the UI. Call when the conversation transitions to a new phase.",
      parameters: {
        type: "object",
        properties: {
          phase: {
            type: "string",
            enum: [...PHASE_ORDER],
            description: "The interview phase to transition to",
          },
        },
        required: ["phase"],
      },
    },
    ...(settings.functions ?? []).map((fn) => ({
      name: fn.name,
      description: fn.description,
      parameters: fn.parameters,
    })),
  ];

  return {
    provider: { type: "anthropic", model: "claude-sonnet-4-20250514" },
    prompt: settings.systemPrompt,
    functions,
  };
}

function buildThinkSignature(settings: DeepgramVoiceAgentSettings): string {
  return JSON.stringify({
    prompt: settings.systemPrompt,
    functions: settings.functions ?? [],
  });
}

function buildAgentSettings(settings: DeepgramVoiceAgentSettings): AgentV1Settings {
  const voiceModel = settings.voiceModel || DEFAULT_VOICE_MODEL;

  const base: AgentV1Settings = {
    type: "Settings",
    audio: {
      input: { encoding: "linear16", sample_rate: INPUT_SAMPLE_RATE },
      output: { encoding: "linear16", sample_rate: OUTPUT_SAMPLE_RATE, container: "none" },
    },
    agent: {
      listen: {
        provider: { version: "v2", type: "deepgram", model: "flux-general-en" },
      },
      think: buildThinkSettings(settings),
      speak: {
        provider: { type: "deepgram", model: voiceModel },
      },
    },
  };

  if (settings.greeting) {
    base.agent = { ...base.agent, greeting: settings.greeting };
  }

  if (settings.contextMessages && settings.contextMessages.length > 0) {
    base.agent = {
      ...base.agent,
      context: {
        messages: settings.contextMessages.map((m) => ({
          type: "History" as const,
          role: m.role,
          content: m.content,
        })),
      },
    };
  }

  return base;
}

function normalizeVoiceAgentError(error: unknown): Error {
  const domError = error instanceof DOMException ? error : null;
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Voice agent error";

  if (
    domError?.name === "NotAllowedError" ||
    domError?.name === "SecurityError" ||
    /permission denied/i.test(message)
  ) {
    return new Error("Microphone access is blocked. Allow mic access in your browser and try again.");
  }

  if (domError?.name === "NotFoundError") {
    return new Error("No microphone was found. Connect a mic and try again.");
  }

  if (domError?.name === "NotReadableError") {
    return new Error("Your microphone is busy in another app. Close the other app and try again.");
  }

  return error instanceof Error ? error : new Error(message);
}

function timeoutError(message: string) {
  return new DOMException(message, "TimeoutError");
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDeepgramVoiceAgent(
  settings: DeepgramVoiceAgentSettings,
  callbacks: DeepgramVoiceAgentCallbacks,
) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const connectionRef = useRef<AgentConnection | null>(null);

  /** Single context for mic + TTS so the browser can correlate playback with capture (AEC). */
  const audioCtxRef = useRef<AudioContext | null>(null);
  /** Tracks which context has the PCM worklet module loaded (module is per-context). */
  const pcmWorkletContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsAppliedResolverRef = useRef<(() => void) | null>(null);
  const settingsAppliedRejectorRef = useRef<((error: Error) => void) | null>(null);
  const welcomeResolverRef = useRef<(() => void) | null>(null);
  const welcomeRejectorRef = useRef<((error: Error) => void) | null>(null);
  const isClosingRef = useRef(false);
  const lastThinkSignatureRef = useRef<string | null>(null);
  const suppressedUserMessagesRef = useRef<string[]>([]);

  /** Schedule TTS chunks on a single timeline so there are no gaps between WebSocket frames. */
  const nextPlaybackTimeRef = useRef(0);
  const scheduledPlaybackSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const playbackAbortRef = useRef<AbortController | null>(null);
  const isAgentAudioActiveRef = useRef(false);
  const resumeMicAfterAgentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMutedRef = useRef(false);

  const getOrCreateAudioContext = useCallback((): AudioContext => {
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      return audioCtxRef.current;
    }
    // Let the browser pick the device rate (typically 48 kHz). TTS buffers still use OUTPUT_SAMPLE_RATE.
    const ctx = new AudioContext({ latencyHint: "interactive" });
    audioCtxRef.current = ctx;
    pcmWorkletContextRef.current = null;
    return ctx;
  }, []);

  const ensurePcmWorkletLoaded = useCallback(async (ctx: AudioContext) => {
    if (pcmWorkletContextRef.current === ctx) return;
    await ctx.audioWorklet.addModule("/worklets/pcm-capture-worklet.js");
    pcmWorkletContextRef.current = ctx;
  }, []);

  const pcmToFloat32 = useCallback((buffer: ArrayBuffer): Float32Array => {
    const int16 = new Int16Array(buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    return float32;
  }, []);

  const scheduleTtsChunk = useCallback(
    (samples: Float32Array) => {
      if (playbackAbortRef.current?.signal.aborted) return;
      if (samples.length === 0) return;

      const ctx = getOrCreateAudioContext();
      void ctx.resume();

      const audioBuffer = ctx.createBuffer(1, samples.length, OUTPUT_SAMPLE_RATE);
      audioBuffer.getChannelData(0).set(samples);

      const src = ctx.createBufferSource();
      src.buffer = audioBuffer;
      src.connect(ctx.destination);

      const now = ctx.currentTime;
      let startAt = nextPlaybackTimeRef.current;
      if (startAt < now) startAt = now;

      const onAbort = () => {
        try {
          src.stop();
        } catch {
          /* already stopped */
        }
        try {
          src.disconnect();
        } catch {
          /* noop */
        }
        scheduledPlaybackSourcesRef.current = scheduledPlaybackSourcesRef.current.filter((s) => s !== src);
      };
      playbackAbortRef.current?.signal.addEventListener("abort", onAbort, { once: true });

      scheduledPlaybackSourcesRef.current.push(src);
      src.onended = () => {
        scheduledPlaybackSourcesRef.current = scheduledPlaybackSourcesRef.current.filter((s) => s !== src);
      };

      src.start(startAt);
      nextPlaybackTimeRef.current = startAt + audioBuffer.duration;
    },
    [getOrCreateAudioContext],
  );

  const stopSpeaking = useCallback(() => {
    if (resumeMicAfterAgentTimerRef.current) {
      clearTimeout(resumeMicAfterAgentTimerRef.current);
      resumeMicAfterAgentTimerRef.current = null;
    }
    isAgentAudioActiveRef.current = false;
    playbackAbortRef.current?.abort();
    playbackAbortRef.current = new AbortController();
    for (const src of scheduledPlaybackSourcesRef.current) {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
      try {
        src.disconnect();
      } catch {
        /* noop */
      }
    }
    scheduledPlaybackSourcesRef.current = [];
    nextPlaybackTimeRef.current = 0;
    setVoiceState((prev) => (prev === "speaking" ? "idle" : prev));
  }, []);

  const blockMicDuringAgentAudio = useCallback(() => {
    if (resumeMicAfterAgentTimerRef.current) {
      clearTimeout(resumeMicAfterAgentTimerRef.current);
      resumeMicAfterAgentTimerRef.current = null;
    }
    isAgentAudioActiveRef.current = true;
  }, []);

  const resumeMicAfterAgentAudio = useCallback(() => {
    if (resumeMicAfterAgentTimerRef.current) {
      clearTimeout(resumeMicAfterAgentTimerRef.current);
    }

    const ctx = audioCtxRef.current;
    const queuedPlaybackMs =
      ctx && ctx.state !== "closed"
        ? Math.max(0, (nextPlaybackTimeRef.current - ctx.currentTime) * 1000)
        : 0;

    resumeMicAfterAgentTimerRef.current = setTimeout(() => {
      isAgentAudioActiveRef.current = false;
      resumeMicAfterAgentTimerRef.current = null;
      if (scheduledPlaybackSourcesRef.current.length === 0) {
        setVoiceState("idle");
      }
    }, queuedPlaybackMs + MIC_RESUME_AFTER_AGENT_MS);
  }, []);

  const clearKeepalive = useCallback(() => {
    if (keepaliveRef.current) {
      clearInterval(keepaliveRef.current);
      keepaliveRef.current = null;
    }
  }, []);

  const clearWelcomeWaiter = useCallback(() => {
    welcomeResolverRef.current = null;
    welcomeRejectorRef.current = null;
  }, []);

  const clearSettingsAppliedWaiter = useCallback(() => {
    settingsAppliedResolverRef.current = null;
    settingsAppliedRejectorRef.current = null;
  }, []);

  const resolveWelcome = useCallback(() => {
    const resolve = welcomeResolverRef.current;
    clearWelcomeWaiter();
    resolve?.();
  }, [clearWelcomeWaiter]);

  const rejectWelcome = useCallback(
    (error: Error) => {
      const reject = welcomeRejectorRef.current;
      clearWelcomeWaiter();
      reject?.(error);
    },
    [clearWelcomeWaiter],
  );

  const resolveSettingsApplied = useCallback(() => {
    const resolve = settingsAppliedResolverRef.current;
    clearSettingsAppliedWaiter();
    resolve?.();
  }, [clearSettingsAppliedWaiter]);

  const rejectSettingsApplied = useCallback(
    (error: Error) => {
      const reject = settingsAppliedRejectorRef.current;
      clearSettingsAppliedWaiter();
      reject?.(error);
    },
    [clearSettingsAppliedWaiter],
  );

  const waitForSettingsApplied = useCallback(() => {
    clearSettingsAppliedWaiter();
    return new Promise<void>((resolve, reject) => {
      settingsAppliedResolverRef.current = resolve;
      settingsAppliedRejectorRef.current = reject;
    });
  }, [clearSettingsAppliedWaiter]);

  const waitForWelcome = useCallback(() => {
    clearWelcomeWaiter();
    return new Promise<void>((resolve, reject) => {
      welcomeResolverRef.current = resolve;
      welcomeRejectorRef.current = reject;
    });
  }, [clearWelcomeWaiter]);

  const shouldSuppressUserTranscript = useCallback((text: string) => {
    const index = suppressedUserMessagesRef.current.findIndex((message) => message === text);
    if (index === -1) return false;

    suppressedUserMessagesRef.current.splice(index, 1);
    return true;
  }, []);

  const sendFunctionCallResponse = useCallback((payload: AgentV1SendFunctionCallResponse) => {
    const conn = connectionRef.current;
    if (conn && conn.readyState === WebSocket.OPEN) {
      conn.sendFunctionCallResponse(payload);
    }
  }, []);

  const sendKeepAlive = useCallback(() => {
    const conn = connectionRef.current;
    if (conn && conn.readyState === WebSocket.OPEN) {
      conn.sendKeepAlive({ type: "KeepAlive" });
    }
  }, []);

  const startKeepalive = useCallback(() => {
    clearKeepalive();
    keepaliveRef.current = setInterval(() => {
      sendKeepAlive();
    }, KEEPALIVE_INTERVAL_MS);
  }, [clearKeepalive, sendKeepAlive]);

  const updateThink = useCallback(() => {
    const conn = connectionRef.current;
    if (!conn || conn.readyState !== WebSocket.OPEN) return;

    const nextSignature = buildThinkSignature(settingsRef.current);
    if (nextSignature === lastThinkSignatureRef.current) return;

    conn.sendUpdateThink({
      type: "UpdateThink",
      think: buildThinkSettings(settingsRef.current),
    });
    lastThinkSignatureRef.current = nextSignature;
  }, []);

  const requestMicStream = useCallback(async () => {
    if (micStreamRef.current) {
      return micStreamRef.current;
    }

    const baseAudio: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };
    const withVoiceIsolation: MediaTrackConstraints & { voiceIsolation?: boolean } = {
      ...baseAudio,
      voiceIsolation: true,
    };
    let stream: MediaStream;
    try {
      stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ audio: withVoiceIsolation }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(timeoutError("Microphone permission timed out. Allow mic access and try again.")),
            MIC_PERMISSION_TIMEOUT_MS,
          ),
        ),
      ]);
    } catch (error) {
      const domError = error instanceof DOMException ? error : null;
      if (
        domError?.name === "NotAllowedError" ||
        domError?.name === "SecurityError" ||
        domError?.name === "NotFoundError" ||
        domError?.name === "NotReadableError" ||
        domError?.name === "TimeoutError"
      ) {
        throw normalizeVoiceAgentError(error);
      }

      try {
        stream = await Promise.race([
          navigator.mediaDevices.getUserMedia({ audio: baseAudio }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(timeoutError("Microphone permission timed out. Allow mic access and try again.")),
              MIC_PERMISSION_TIMEOUT_MS,
            ),
          ),
        ]);
      } catch (fallbackError) {
        throw normalizeVoiceAgentError(fallbackError);
      }
    }
    micStreamRef.current = stream;
    return stream;
  }, []);

  const startMicCapture = useCallback(async () => {
    const stream = await requestMicStream();
    const ctx = getOrCreateAudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    await ensurePcmWorkletLoaded(ctx);

    const source = ctx.createMediaStreamSource(stream);
    // No speaker output from the capture chain — avoids echo and keeps AEC reference sane.
    const workletNode = new AudioWorkletNode(ctx, "pcm-capture", { numberOfOutputs: 0 });

    workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      if (isMutedRef.current) return;
      if (isAgentAudioActiveRef.current) return;
      const conn = connectionRef.current;
      if (conn && conn.readyState === WebSocket.OPEN) {
        conn.sendMedia(e.data);
      }
    };

    source.connect(workletNode);
    workletNodeRef.current = workletNode;
    setIsListening(true);
  }, [ensurePcmWorkletLoaded, getOrCreateAudioContext, requestMicStream]);

  const stopMicCapture = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    setIsListening(false);
  }, []);

  const handleFunctionCall = useCallback(
    async (fn: AgentV1FunctionCallRequest.Functions.Item) => {
      const args: Record<string, unknown> = (() => {
        try {
          return JSON.parse(fn.arguments) as Record<string, unknown>;
        } catch {
          return {};
        }
      })();

      if (fn.name === "set_interview_phase") {
        const phase = parseInterviewPhase(args.phase);
        if (phase) callbacksRef.current.onPhaseChange?.(phase);
        sendFunctionCallResponse({
          type: "FunctionCallResponse",
          id: fn.id,
          name: fn.name,
          content: JSON.stringify({ success: true, phase: args.phase }),
        });
        return;
      }

      try {
        const result = await callbacksRef.current.onFunctionCall(fn.name, args);
        sendFunctionCallResponse({
          type: "FunctionCallResponse",
          id: fn.id,
          name: fn.name,
          content: typeof result === "string" ? result : JSON.stringify(result),
        });
      } catch (e) {
        sendFunctionCallResponse({
          type: "FunctionCallResponse",
          id: fn.id,
          name: fn.name,
          content: JSON.stringify({
            error: e instanceof Error ? e.message : "Function call failed",
          }),
        });
      }
    },
    [sendFunctionCallResponse],
  );

  const handleAgentMessage = useCallback(
    (msg: unknown) => {
      if (msg instanceof ArrayBuffer) {
        scheduleTtsChunk(pcmToFloat32(msg));
        return;
      }

      if (typeof msg !== "object" || msg === null || !("type" in msg)) return;

      const event = msg as { type: string; [key: string]: unknown };

      switch (event.type) {
        case "Welcome":
          resolveWelcome();
          break;

        case "SettingsApplied":
          setVoiceState("idle");
          resolveSettingsApplied();
          break;

        case "ConversationText": {
          const ct = event as unknown as { role: string; content: string };
          if (ct.role !== "assistant" && shouldSuppressUserTranscript(ct.content)) {
            break;
          }
          callbacksRef.current.onTranscript(
            ct.content,
            ct.role === "assistant" ? "agent" : "user",
            true,
          );
          break;
        }

        case "UserStartedSpeaking":
          stopSpeaking();
          setVoiceState("listening");
          break;

        case "AgentThinking":
          setVoiceState("thinking");
          break;

        case "AgentStartedSpeaking":
          blockMicDuringAgentAudio();
          setVoiceState("speaking");
          if (!playbackAbortRef.current || playbackAbortRef.current.signal.aborted) {
            playbackAbortRef.current = new AbortController();
          }
          break;

        case "AgentAudioDone":
          resumeMicAfterAgentAudio();
          break;

        case "FunctionCallRequest": {
          const fcr = event as unknown as AgentV1FunctionCallRequest;
          for (const fn of fcr.functions) {
            if (fn.client_side) {
              void handleFunctionCall(fn);
            }
          }
          break;
        }

        case "ThinkUpdated":
          lastThinkSignatureRef.current = buildThinkSignature(settingsRef.current);
          break;

        case "InjectionRefused":
          console.warn("[deepgram-agent] Injection refused — agent is busy.");
          break;

        case "Error": {
          const err = event as { description?: string; message?: string };
          const text = err.description ?? (typeof err.message === "string" ? err.message : undefined);
          console.error("[deepgram-agent] Server error:", err);
          const error = new Error(text ?? "Agent error");
          rejectWelcome(error);
          rejectSettingsApplied(error);
          callbacksRef.current.onError(error);
          break;
        }

        case "Warning":
          console.warn("[deepgram-agent] Warning:", event);
          break;

        default:
          break;
      }
    },
    [
      pcmToFloat32,
      scheduleTtsChunk,
      stopSpeaking,
      blockMicDuringAgentAudio,
      handleFunctionCall,
      rejectWelcome,
      rejectSettingsApplied,
      resolveSettingsApplied,
      resolveWelcome,
      resumeMicAfterAgentAudio,
      shouldSuppressUserTranscript,
    ],
  );

  const connect = useCallback(async () => {
    let connection: AgentConnection | null = null;
    try {
      const audioCtx = getOrCreateAudioContext();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      await ensurePcmWorkletLoaded(audioCtx);
      await requestMicStream();

      const tokenController = new AbortController();
      const tokenTimeout = setTimeout(() => tokenController.abort(), VOICE_TOKEN_TIMEOUT_MS);
      let tokenRes: Response;
      try {
        tokenRes = await fetch("/api/voice/deepgram-token", {
          method: "POST",
          signal: tokenController.signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error("Voice token request timed out. Check the Deepgram/Supabase connection and try again.");
        }
        throw error;
      } finally {
        clearTimeout(tokenTimeout);
      }
      const tokenJson = (await tokenRes.json()) as {
        success: boolean;
        data?: { token: string };
        error?: string;
      };
      if (!tokenJson.success || !tokenJson.data?.token) {
        throw new Error(tokenJson.error || "Failed to get voice token");
      }
      const token = tokenJson.data.token;

      playbackAbortRef.current = new AbortController();
      isClosingRef.current = false;

      const dg = new DeepgramClient({ accessToken: token });
      connection = await dg.agent.v1.connect({
        Authorization: `Bearer ${token}`,
        reconnectAttempts: 0,
        connectionTimeoutInSeconds: 10,
      });
      const welcomePromise = waitForWelcome();
      const settingsAppliedPromise = waitForSettingsApplied();

      connection.socket.binaryType = "arraybuffer";

      connection.on("message", handleAgentMessage);
      connection.on("close", () => {
        console.warn("[deepgram-agent] connection closed");
        const error = new Error("Voice agent connection closed");
        rejectWelcome(error);
        rejectSettingsApplied(error);
        setIsConnected(false);
        stopMicCapture();
        stopSpeaking();
        clearKeepalive();
        lastThinkSignatureRef.current = null;
        connectionRef.current = null;
        if (!isClosingRef.current) {
          callbacksRef.current.onError(error);
        }
      });
      connection.on("error", (err: Error) => {
        console.error("[deepgram-agent] connection error:", err);
        const error = err instanceof Error ? err : new Error("Voice agent connection error");
        rejectWelcome(error);
        rejectSettingsApplied(error);
        callbacksRef.current.onError(error);
      });

      connectionRef.current = connection;
      connection.connect();

      await Promise.race([
        connection.waitForOpen(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Voice agent connection timeout")), 10000),
        ),
      ]);

      await Promise.race([
        welcomePromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Voice agent welcome timeout")), 10000),
        ),
      ]);

      startKeepalive();
      connection.sendSettings(buildAgentSettings(settingsRef.current));
      lastThinkSignatureRef.current = buildThinkSignature(settingsRef.current);

      await Promise.race([
        settingsAppliedPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Voice agent settings timeout")), 10000),
        ),
      ]);

      await startMicCapture();
      setIsConnected(true);
      callbacksRef.current.onConnected?.();
    } catch (error) {
      isClosingRef.current = true;
      clearKeepalive();
      stopMicCapture();
      stopSpeaking();
      clearWelcomeWaiter();
      clearSettingsAppliedWaiter();
      lastThinkSignatureRef.current = null;
      suppressedUserMessagesRef.current = [];
      if (connectionRef.current === connection) {
        connectionRef.current = null;
      }
      connection?.close();
      setIsConnected(false);
      setIsListening(false);
      setVoiceState("idle");
      throw normalizeVoiceAgentError(error);
    }
  }, [
    clearSettingsAppliedWaiter,
    clearWelcomeWaiter,
    handleAgentMessage,
    rejectWelcome,
    rejectSettingsApplied,
    startMicCapture,
    startKeepalive,
    clearKeepalive,
    stopMicCapture,
    stopSpeaking,
    getOrCreateAudioContext,
    ensurePcmWorkletLoaded,
    requestMicStream,
    waitForWelcome,
    waitForSettingsApplied,
  ]);

  const disconnect = useCallback(() => {
    isClosingRef.current = true;
    rejectWelcome(new Error("Voice agent disconnected"));
    rejectSettingsApplied(new Error("Voice agent disconnected"));
    stopMicCapture();
    stopSpeaking();
    clearKeepalive();
    const conn = connectionRef.current;
    if (conn) {
      conn.close();
      connectionRef.current = null;
    }
    lastThinkSignatureRef.current = null;
    suppressedUserMessagesRef.current = [];
    setIsConnected(false);
    setIsListening(false);
    setVoiceState("idle");
  }, [stopMicCapture, stopSpeaking, clearKeepalive, rejectWelcome, rejectSettingsApplied]);

  const injectUserMessage = useCallback((text: string, options?: InjectUserMessageOptions) => {
    if (options?.suppressTranscript) {
      suppressedUserMessagesRef.current.push(text);
    }
    connectionRef.current?.sendInjectUserMessage({ type: "InjectUserMessage", content: text });
  }, []);

  const injectAgentMessage = useCallback((text: string) => {
    connectionRef.current?.sendInjectAgentMessage({ type: "InjectAgentMessage", message: text });
  }, []);

  const updatePrompt = useCallback((promptDelta: string) => {
    connectionRef.current?.sendUpdatePrompt({ type: "UpdatePrompt", prompt: promptDelta });
  }, []);

  const mute = useCallback(() => {
    isMutedRef.current = true;
    setIsListening(false);
  }, []);

  const unmute = useCallback(() => {
    isMutedRef.current = false;
    setIsListening(true);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const syncTimer = window.setTimeout(() => {
      updateThink();
    }, 250);

    return () => window.clearTimeout(syncTimer);
  }, [isConnected, settings.systemPrompt, settings.functions, updateThink]);

  useEffect(() => {
    return () => {
      isClosingRef.current = true;
      stopMicCapture();
      stopSpeaking();
      clearKeepalive();
      rejectWelcome(new Error("Voice agent cleaned up"));
      rejectSettingsApplied(new Error("Voice agent cleaned up"));
      connectionRef.current?.close();
      connectionRef.current = null;
      lastThinkSignatureRef.current = null;
      suppressedUserMessagesRef.current = [];
      if (resumeMicAfterAgentTimerRef.current) {
        clearTimeout(resumeMicAfterAgentTimerRef.current);
        resumeMicAfterAgentTimerRef.current = null;
      }
      isAgentAudioActiveRef.current = false;
      pcmWorkletContextRef.current = null;
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    voiceState,
    isConnected,
    isListening,
    connect,
    disconnect,
    stopSpeaking,
    mute,
    unmute,
    injectUserMessage,
    injectAgentMessage,
    updatePrompt,
    updateThink,
  };
}
