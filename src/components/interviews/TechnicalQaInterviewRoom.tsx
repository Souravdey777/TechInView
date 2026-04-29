"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageSquareMore, Mic, MicOff, PhoneOff, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Timer } from "@/components/interview/Timer";
import { VoiceVisualizer, type VoiceState } from "@/components/interview/VoiceVisualizer";
import {
  useDeepgramVoiceAgent,
  type AgentFunctionDef,
  type DeepgramVoiceAgentSettings,
} from "@/hooks/useDeepgramVoiceAgent";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useInterviewStore } from "@/stores/interview-store";
import {
  type InterviewPhase,
  clampPhaseToTimeFloor,
  parseInterviewPhase,
  phaseFromElapsedFraction,
} from "@/lib/interview-phases";
import { buildVoiceSystemPrompt } from "@/lib/ai/interviewer-system-prompt";
import { getInterviewerPersona } from "@/lib/interviewer-personas";
import { getPhaseLabelForRound } from "@/lib/loops/round-config";
import { TECHNICAL_QA_DURATION_MINUTES } from "@/lib/technical-qa";
import { cn } from "@/lib/utils";

type TechnicalQaInterviewRoomProps = {
  interviewId: string;
};

type ChatMessage = {
  id: string;
  role: "interviewer" | "candidate";
  content: string;
  time: string;
};

type TranscriptEntry = {
  role: "interviewer" | "candidate" | "system";
  content: string;
  timestamp_ms: number;
};

type ScoreDimensionRaw = {
  score: number;
  feedback: string;
};

const MAX_DURATION_SECONDS = TECHNICAL_QA_DURATION_MINUTES * 60;
const MAX_AGENT_CONTEXT_MESSAGES = 20;
const OPENING_TURN_DELAY_MS = 2000;
const INTRO_KICKOFF =
  "Start the Technical Q&A now. Greet the candidate briefly, ask exactly one short calibration question about their selected language/framework experience, then stop and wait for their answer. Do not ask the first deep technical question until after the candidate responds.";

function formatTimeLabel(timestampMs: number) {
  const totalSeconds = Math.floor(timestampMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function toUiMessages(messages: TranscriptEntry[]): ChatMessage[] {
  return messages
    .filter((message) => message.role !== "system")
    .map((message, index) => ({
      id: `technical-qa-msg-${index + 1}`,
      role: message.role as "interviewer" | "candidate",
      content: message.content,
      time: formatTimeLabel(message.timestamp_ms),
    }));
}

function extractDimension(
  scores: Record<string, unknown>,
  key: string
): ScoreDimensionRaw {
  const raw = scores[key] as ScoreDimensionRaw | undefined;
  return { score: raw?.score ?? 0, feedback: raw?.feedback ?? "" };
}

function getVoiceStateLabel(voiceState: VoiceState, interviewerName: string) {
  if (voiceState === "thinking") return "Thinking";
  if (voiceState === "speaking") return `${interviewerName} speaking`;
  if (voiceState === "listening") return "Listening";
  return "Ready";
}

function getVoiceStateDotClass(voiceState: VoiceState) {
  if (voiceState === "speaking") return "bg-brand-green";
  if (voiceState === "thinking") return "bg-brand-amber";
  if (voiceState === "listening") return "bg-brand-cyan";
  return "bg-brand-muted";
}

export function TechnicalQaInterviewRoom({
  interviewId,
}: TechnicalQaInterviewRoomProps) {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const storeConfig = useInterviewStore((state) => state.setupConfig);
  const roundContext = useInterviewStore((state) => state.roundContext);
  const completeInterviewStore = useInterviewStore((state) => state.completeInterview);
  const addMessageToStore = useInterviewStore((state) => state.addMessage);
  const setRoomStartedAtMs = useInterviewStore((state) => state.setRoomStartedAtMs);
  const setRoomPhase = useInterviewStore((state) => state.setRoomPhase);

  const interviewer = useMemo(
    () => getInterviewerPersona(storeConfig?.interviewerPersona),
    [storeConfig?.interviewerPersona]
  );
  const maxDuration = storeConfig?.maxDurationSeconds ?? MAX_DURATION_SECONDS;
  const round = roundContext;

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>("INTRO");
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [hasStarted, setHasStarted] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isConnectingVoice, setIsConnectingVoice] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);

  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const startTimeRef = useRef(Date.now());
  const msgCounterRef = useRef(0);
  const hasRestoredRef = useRef(false);
  const endInterviewRef = useRef<() => Promise<void>>(async () => {});
  const currentPhaseRef = useRef(currentPhase);
  const shouldSendOpeningTurnRef = useRef(false);

  useEffect(() => {
    currentPhaseRef.current = currentPhase;
  }, [currentPhase]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!round || storeConfig?.roundType !== "technical_qa") {
      router.replace("/interviews/technical-qa/setup");
    }
  }, [hasHydrated, round, router, storeConfig?.roundType]);

  useEffect(() => {
    if (!hasHydrated || hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const state = useInterviewStore.getState();
    const startedAtMs = state.roomStartedAtMs;
    const matchesSession =
      state.interviewId === interviewId &&
      state.isInterviewActive &&
      state.setupConfig?.roundType === "technical_qa";

    if (!matchesSession || !startedAtMs || state.messages.length === 0) {
      return;
    }

    const elapsedSeconds = Math.floor((Date.now() - startedAtMs) / 1000);
    const remainingSeconds = Math.max(0, maxDuration - elapsedSeconds);
    const restoredPhase = parseInterviewPhase(state.roomPhase) ?? "INTRO";

    transcriptRef.current = state.messages.map((message) => ({
      role: message.role,
      content: message.content,
      timestamp_ms: message.timestamp_ms,
    }));
    setChatMessages(toUiMessages(transcriptRef.current));
    msgCounterRef.current = state.messages.filter(
      (message) => message.role !== "system"
    ).length;
    setCurrentPhase(restoredPhase);
    setTimeLeft(remainingSeconds);
    startTimeRef.current = startedAtMs;

    if (remainingSeconds <= 0) {
      setHasStarted(true);
      setIsTimerRunning(true);
      return;
    }

    setIsResuming(true);
  }, [hasHydrated, interviewId, maxDuration]);

  const agentFunctions = useMemo<AgentFunctionDef[]>(
    () => [
      {
        name: "get_interview_state",
        description:
          "Get current interview state including the active phase, elapsed time, and remaining time.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    ],
    []
  );

  const agentContextMessages = useMemo(
    () =>
      chatMessages.slice(-MAX_AGENT_CONTEXT_MESSAGES).map((message) => ({
        role: message.role === "interviewer" ? ("assistant" as const) : ("user" as const),
        content: message.content,
      })),
    [chatMessages]
  );

  const agentSettings = useMemo<DeepgramVoiceAgentSettings>(
    () => ({
      systemPrompt: buildVoiceSystemPrompt({
        roundType: "technical_qa",
        problem: null,
        roundContext: round,
        currentPhase,
        hasCandidateCode: false,
        hasWorkspaceNotes: false,
        totalMinutes: Math.round(maxDuration / 60),
        interviewerPersonaId: interviewer.id,
      }),
      voiceModel: interviewer.voiceModel,
      functions: agentFunctions,
      contextMessages: agentContextMessages,
    }),
    [agentContextMessages, agentFunctions, currentPhase, interviewer, maxDuration, round]
  );

  const applyPhaseFromAgent = useCallback(
    (phase: InterviewPhase) => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const pct = Math.min(1, Math.max(0, elapsed / maxDuration));
      const clamped = clampPhaseToTimeFloor(phase, phaseFromElapsedFraction(pct));
      setCurrentPhase(clamped);
      setRoomPhase(clamped);
    },
    [maxDuration, setRoomPhase]
  );

  const agent = useDeepgramVoiceAgent(agentSettings, {
    onTranscript: useCallback(
      (text: string, role: "user" | "agent") => {
        const elapsedMs = Date.now() - startTimeRef.current;
        const chatRole = role === "agent" ? "interviewer" : "candidate";
        const transcriptMessage: TranscriptEntry = {
          role: chatRole,
          content: text,
          timestamp_ms: elapsedMs,
        };

        transcriptRef.current.push(transcriptMessage);
        setChatMessages((current) => [
          ...current,
          {
            id: `technical-qa-msg-${++msgCounterRef.current}`,
            role: chatRole,
            content: text,
            time: formatTimeLabel(elapsedMs),
          },
        ]);
        addMessageToStore(transcriptMessage);
      },
      [addMessageToStore]
    ),
    onFunctionCall: useCallback(
      async (name: string) => {
        switch (name) {
          case "get_interview_state": {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            return {
              phase: currentPhaseRef.current,
              elapsedSeconds: elapsed,
              remainingSeconds: Math.max(0, maxDuration - elapsed),
            };
          }
          default:
            return { error: `Unknown function: ${name}` };
        }
      },
      [maxDuration]
    ),
    onPhaseChange: applyPhaseFromAgent,
    onError: useCallback((error: Error) => {
      console.error("[technical-qa-room] Agent error:", error.message);
      setIsConnectingVoice(false);
      setIsMicEnabled(false);
      setVoiceError(error.message);
    }, []),
    onConnected: useCallback(() => {
      setIsConnectingVoice(false);
      setVoiceError(null);

      if (transcriptRef.current.length === 0) {
        shouldSendOpeningTurnRef.current = true;
      }
    }, []),
  });

  const voiceState: VoiceState = agent.voiceState;
  const isAgentConnected = agent.isConnected;
  const injectAgentUserMessage = agent.injectUserMessage;

  useEffect(() => {
    if (!hasStarted || !isAgentConnected || !shouldSendOpeningTurnRef.current) return;

    const timer = window.setTimeout(() => {
      if (!shouldSendOpeningTurnRef.current) return;

      shouldSendOpeningTurnRef.current = false;

      if (!isAgentConnected || transcriptRef.current.length > 0) {
        return;
      }

      injectAgentUserMessage(INTRO_KICKOFF, { suppressTranscript: true });
    }, OPENING_TURN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [hasStarted, injectAgentUserMessage, isAgentConnected]);

  const startInterview = useCallback(async () => {
    msgCounterRef.current = 0;
    setVoiceError(null);
    setIsConnectingVoice(true);
    setIsMicEnabled(true);

    try {
      await agent.connect();
      const now = Date.now();
      startTimeRef.current = now;
      setHasStarted(true);
      setIsTimerRunning(true);
      setRoomStartedAtMs(now);
      setRoomPhase("INTRO");
    } catch (error) {
      shouldSendOpeningTurnRef.current = false;
      setIsConnectingVoice(false);
      setIsTimerRunning(false);
      setHasStarted(false);
      setVoiceError(
        error instanceof Error ? error.message : "Unable to start the voice interview"
      );
    }
  }, [agent, setRoomPhase, setRoomStartedAtMs]);

  const resumeInterview = useCallback(async () => {
    setVoiceError(null);
    setIsConnectingVoice(true);
    setIsMicEnabled(true);

    try {
      await agent.connect();
      setHasStarted(true);
      setIsTimerRunning(true);
      setIsResuming(false);
    } catch (error) {
      setIsConnectingVoice(false);
      setIsTimerRunning(false);
      setHasStarted(false);
      setVoiceError(
        error instanceof Error ? error.message : "Unable to reconnect to the voice interview"
      );
    }
  }, [agent]);

  const handleToggleMic = useCallback(() => {
    if (isMicEnabled) {
      agent.mute();
      setIsMicEnabled(false);
      return;
    }

    agent.stopSpeaking();
    agent.unmute();
    setIsMicEnabled(true);
  }, [agent, isMicEnabled]);

  const handleSendText = useCallback(
    (text: string) => {
      const message = text.trim();
      if (!message) return;

      const elapsedMs = Date.now() - startTimeRef.current;
      const transcriptMessage: TranscriptEntry = {
        role: "candidate",
        content: message,
        timestamp_ms: elapsedMs,
      };

      transcriptRef.current.push(transcriptMessage);
      setChatMessages((current) => [
        ...current,
        {
          id: `technical-qa-msg-${++msgCounterRef.current}`,
          role: "candidate",
          content: message,
          time: formatTimeLabel(elapsedMs),
        },
      ]);
      addMessageToStore(transcriptMessage);
      agent.injectUserMessage(message, { suppressTranscript: true });
    },
      [addMessageToStore, agent]
    );

  const handleEndInterview = useCallback(async () => {
    if (!round || isScoring) return;

    setIsScoring(true);
    setIsTimerRunning(false);
    agent.disconnect();

    type ScoringData = {
      overall_score?: number;
      scores?: Record<string, unknown>;
      hire_recommendation?: string;
      summary?: string;
      key_strengths?: string[];
      areas_to_improve?: string[];
    };

    let scoringData: ScoringData | null = null;

    try {
      const response = await fetch("/api/interview/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewId,
          interviewerPersona: interviewer.id,
          mode: "targeted_loop",
          roundType: "technical_qa",
          roundTitle: round.title,
          finalCode: "",
          language: storeConfig?.language ?? "javascript",
          transcript: transcriptRef.current,
          testsPassed: 0,
          testsTotal: 0,
          problem: null,
          roundContext: round,
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        data?: {
          scoring?: ScoringData;
        };
      };

      if (payload.success && payload.data?.scoring) {
        scoringData = payload.data.scoring;
      }
    } catch {
      // Results page can still render from local state when API completion fails.
    }

    const rawScores = scoringData?.scores;
    const storeScores = rawScores
      ? Object.keys(rawScores).reduce<Record<string, ScoreDimensionRaw>>((acc, key) => {
          acc[key] = extractDimension(rawScores, key);
          return acc;
        }, {})
      : null;

    completeInterviewStore({
      mode: "targeted_loop",
      roundType: "technical_qa",
      roundTitle: round.title,
      interviewId,
      interviewerPersona: interviewer.id,
      finalCode: "",
      language: storeConfig?.language ?? "javascript",
      transcript: transcriptRef.current,
      overallScore: scoringData?.overall_score ?? null,
      scores: storeScores,
      hireRecommendation: scoringData?.hire_recommendation ?? null,
      summary: scoringData?.summary ?? null,
      keyStrengths: scoringData?.key_strengths ?? null,
      areasToImprove: scoringData?.areas_to_improve ?? null,
      testsPassed: 0,
      testsTotal: 0,
      problemTitle: round.title,
      problemDifficulty: "medium",
      problemCategory: "technical-qa",
      company: storeConfig?.company ?? null,
      roleTitle: storeConfig?.roleTitle ?? null,
      loopName: storeConfig?.loopName ?? null,
      loopSummary: storeConfig?.loopSummary ?? null,
      roundContext: round,
    });

    router.push(`/interviews/technical-qa/results/${interviewId}`);
  }, [
    agent,
    completeInterviewStore,
    interviewId,
    interviewer.id,
    isScoring,
    round,
    router,
    storeConfig?.company,
    storeConfig?.language,
    storeConfig?.loopName,
    storeConfig?.loopSummary,
    storeConfig?.roleTitle,
  ]);

  useEffect(() => {
    endInterviewRef.current = handleEndInterview;
  }, [handleEndInterview]);

  useEffect(() => {
    if (!hasStarted || !isTimerRunning) return;

    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          void endInterviewRef.current();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [hasStarted, isTimerRunning]);

  useEffect(() => {
    if (!hasStarted) return;

    const elapsed = maxDuration - timeLeft;
    const pct = elapsed / maxDuration;
    const floorPhase = phaseFromElapsedFraction(pct);

    setCurrentPhase((current) => {
      const nextPhase = clampPhaseToTimeFloor(current, floorPhase);
      if (nextPhase !== current) {
        setRoomPhase(nextPhase);
      }
      return nextPhase;
    });
  }, [hasStarted, maxDuration, setRoomPhase, timeLeft]);

  if (!hasHydrated || !round || storeConfig?.roundType !== "technical_qa") {
    return null;
  }

  if (isScoring) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-deep px-6 text-center text-brand-text">
        <div className="max-w-md space-y-5">
          <VoiceVisualizer state="thinking" className="mx-auto h-28 w-28" />
          <div>
            <h1 className="text-2xl font-semibold">Scoring your Technical Q&A round</h1>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              We&apos;re reviewing the voice transcript for technical depth, communication,
              execution, and judgment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    const minutesRemaining = Math.ceil(timeLeft / 60);

    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-deep px-6 text-brand-text">
        <div className="w-full max-w-3xl rounded-3xl border border-brand-border bg-brand-card p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
            Technical Q&A
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            {isResuming ? "Resume your voice interview" : round.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted">
            {isResuming
              ? `Your session is still active. You have about ${minutesRemaining} minute${
                  minutesRemaining === 1 ? "" : "s"
                } remaining.`
              : round.summary}
          </p>

          {!isResuming ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {round.focusAreas.map((focus) => (
                <span
                  key={focus}
                  className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted"
                >
                  {focus}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Format</p>
              <p className="mt-2 text-sm font-semibold text-brand-text">
                Voice conversation, no coding
              </p>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Duration</p>
              <p className="mt-2 text-sm font-semibold text-brand-text">
                {TECHNICAL_QA_DURATION_MINUTES} minutes
              </p>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Interviewer</p>
              <p className="mt-2 text-sm font-semibold text-brand-text">{interviewer.name}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => void (isResuming ? resumeInterview() : startInterview())}
              disabled={isConnectingVoice}
            >
              {isConnectingVoice ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : isResuming ? (
                "Resume Technical Q&A"
              ) : (
                "Start Technical Q&A"
              )}
            </Button>
            <Button asChild variant="secondary">
              <Link href="/interviews/technical-qa/setup">Back to setup</Link>
            </Button>
          </div>

          {voiceError ? (
            <p className="mt-4 text-sm text-brand-rose">{voiceError}</p>
          ) : (
            <p className="mt-4 text-sm text-brand-muted">
              Make sure your mic and speakers are on. Typed fallback stays available inside the
              room if you need it.
            </p>
          )}
        </div>
      </div>
    );
  }

  const phaseLabel = getPhaseLabelForRound("technical_qa", currentPhase);
  const voiceStateLabel = getVoiceStateLabel(voiceState, interviewer.name);

  return (
    <div className="flex h-screen flex-col bg-brand-deep text-brand-text">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-brand-border bg-brand-deep px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-muted transition-colors hover:bg-brand-surface hover:text-brand-text"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">Technical Q&amp;A</p>
            <p className="truncate text-xs text-brand-muted">
              {round.title} · #{interviewId.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        <Timer timeLeft={timeLeft} isRunning={isTimerRunning} />

        <div className="hidden items-center gap-2 md:flex">
          <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
            {phaseLabel}
          </span>
          <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
            {storeConfig?.language ?? "Voice"}
          </span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_22rem] lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-1 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <section className="flex min-h-0 flex-col bg-brand-deep">
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-5 sm:px-6 lg:px-8">
            <div className="relative flex aspect-video w-full max-w-5xl items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-brand-border bg-brand-deep/80 px-3 py-1 text-xs text-brand-muted">
                <span className={cn("h-2 w-2 rounded-full", getVoiceStateDotClass(voiceState))} />
                {voiceStateLabel}
              </div>

              {voiceError ? (
                <div className="absolute right-4 top-4 max-w-xs rounded-lg border border-brand-rose/30 bg-brand-rose/10 px-3 py-2 text-xs leading-relaxed text-brand-rose">
                  {voiceError}
                </div>
              ) : null}

              <div className="flex flex-col items-center text-center">
                <VoiceVisualizer state={voiceState} className="h-40 w-40 sm:h-48 sm:w-48" />
                <p className="mt-5 text-lg font-semibold text-brand-text">{interviewer.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-brand-muted">
                  AI Interviewer
                </p>
              </div>

              <div className="absolute bottom-4 left-4 max-w-[70%] rounded-lg border border-brand-border bg-brand-deep/80 px-3 py-2">
                <p className="truncate text-sm font-medium text-brand-text">{round.title}</p>
                <p className="mt-1 truncate text-xs text-brand-muted">{phaseLabel}</p>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-brand-border bg-brand-deep px-4 py-3">
            <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleToggleMic}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
                  isMicEnabled
                    ? "border-brand-cyan/40 bg-brand-cyan/15 text-brand-cyan hover:bg-brand-cyan/25"
                    : "border-brand-border bg-brand-surface text-brand-muted hover:text-brand-text"
                )}
                aria-label={isMicEnabled ? "Mute microphone" : "Enable microphone"}
              >
                {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              <button
                type="button"
                onClick={() => void resumeInterview()}
                disabled={isAgentConnected || isConnectingVoice}
                className={cn(
                  "flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                  isAgentConnected || isConnectingVoice
                    ? "cursor-not-allowed border-brand-border bg-brand-surface text-brand-muted"
                    : "border-brand-cyan/40 bg-brand-cyan/15 text-brand-cyan hover:bg-brand-cyan/25"
                )}
              >
                <RefreshCw className={cn("h-4 w-4", isConnectingVoice && "animate-spin")} />
                <span className="hidden sm:inline">
                  {isConnectingVoice ? "Reconnecting" : "Reconnect"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleEndInterview()}
                className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-brand-rose px-4 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-rose/90"
              >
                <PhoneOff className="h-4 w-4" />
                <span className="hidden sm:inline">End</span>
              </button>
            </div>
          </div>
        </section>

        <TechnicalQaConversationPanel
          messages={chatMessages}
          interviewerName={interviewer.name}
          isAgentBusy={voiceState === "thinking"}
          onSendText={handleSendText}
        />
      </div>
    </div>
  );
}

function TechnicalQaConversationPanel({
  messages,
  interviewerName,
  isAgentBusy,
  onSendText,
}: {
  messages: ChatMessage[];
  interviewerName: string;
  isAgentBusy: boolean;
  onSendText: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isAgentBusy, messages]);

  function sendDraft() {
    const message = draft.trim();
    if (!message) return;

    onSendText(message);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendDraft();
    }
  }

  return (
    <aside className="flex min-h-0 flex-col border-t border-brand-border bg-brand-card lg:border-l lg:border-t-0">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-brand-border px-4">
        <div>
          <p className="text-sm font-semibold text-brand-text">Conversation</p>
          <p className="text-xs text-brand-muted">Chat + transcript</p>
        </div>
        <span className="rounded-full border border-brand-border bg-brand-surface px-2.5 py-1 text-xs text-brand-muted">
          {messages.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !isAgentBusy ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-brand-border bg-brand-surface">
            <div className="max-w-xs px-6 text-center">
              <MessageSquareMore className="mx-auto h-9 w-9 text-brand-cyan" />
              <p className="mt-4 text-sm font-semibold text-brand-text">
                {interviewerName} will open the round here
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex", message.role === "candidate" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[88%] rounded-lg border px-3 py-2.5",
                  message.role === "candidate"
                    ? "border-brand-cyan/25 bg-brand-cyan/10"
                    : "border-brand-border bg-brand-surface"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-brand-text">
                    {message.role === "candidate" ? "You" : interviewerName}
                  </span>
                  <span className="text-[11px] text-brand-muted">{message.time}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-brand-text">{message.content}</p>
              </div>
            </div>
          ))}

          {isAgentBusy ? (
            <div className="flex justify-start">
              <div className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-cyan [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-cyan [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-cyan" />
                </div>
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-brand-border p-3">
        <div className="flex items-end gap-2 rounded-lg border border-brand-border bg-brand-surface p-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Type your answer..."
            className="min-h-10 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={sendDraft}
            disabled={!draft.trim()}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors",
              draft.trim()
                ? "bg-brand-cyan text-brand-deep hover:bg-brand-cyan/90"
                : "cursor-not-allowed bg-brand-border/40 text-brand-muted"
            )}
            aria-label="Send typed answer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
