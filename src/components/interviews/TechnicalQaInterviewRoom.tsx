"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mic, MicOff, PhoneOff, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewStartingOverlay } from "@/components/interviews/InterviewStartingOverlay";
import { Timer } from "@/components/interview/Timer";
import { VoiceVisualizer, type VoiceState } from "@/components/interview/VoiceVisualizer";
import {
  useDeepgramVoiceAgent,
  type AgentFunctionDef,
  type DeepgramVoiceAgentSettings,
} from "@/hooks/useDeepgramVoiceAgent";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useMicrophoneDevices } from "@/hooks/useMicrophoneDevices";
import { useInterviewTextFallback } from "@/hooks/useInterviewTextFallback";
import { useInterviewStore } from "@/stores/interview-store";
import {
  type InterviewPhase,
  clampPhaseToTimeFloor,
  parseInterviewPhase,
  phaseFromElapsedFraction,
} from "@/lib/interview-phases";
import { buildVoiceSystemPrompt } from "@/lib/ai/interviewer-system-prompt";
import { getLiveInterviewModel } from "@/lib/ai/models";
import { INTERVIEWER as interviewer, getInterviewerVoice } from "@/lib/interviewer";
import { getPhaseLabelForRound } from "@/lib/loops/round-config";
import { TECHNICAL_QA_DURATION_MINUTES } from "@/lib/technical-qa";
import { cn } from "@/lib/utils";
import { BODY, CELL, CHIP, FOCUS, GRID, LABEL, LEAD, PANEL } from "@/components/marketing/ds";

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
  const {
    devices: microphoneDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    deviceWarning,
  } = useMicrophoneDevices();

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
      }),
      thinkModel: getLiveInterviewModel(storeConfig?.isFreeInterview ?? false),
      voiceModel: getInterviewerVoice(),
      functions: agentFunctions,
      contextMessages: agentContextMessages,
      inputDeviceId: selectedDeviceId,
    }),
    [
      agentContextMessages,
      agentFunctions,
      currentPhase,
      maxDuration,
      round,
      selectedDeviceId,
      storeConfig?.isFreeInterview,
    ]
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
    const wasActive = hasStarted;
    setVoiceError(null);
    setIsConnectingVoice(true);

    try {
      await agent.connect();
      setHasStarted(true);
      setIsTimerRunning(true);
      setIsResuming(false);
    } catch (error) {
      setIsConnectingVoice(false);
      if (!wasActive) {
        setIsTimerRunning(false);
        setHasStarted(false);
      }
      setVoiceError(
        error instanceof Error ? error.message : "Unable to reconnect to the voice interview"
      );
    }
  }, [agent, hasStarted]);

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

  const appendTextTurn = useCallback(
    (role: "candidate" | "interviewer", message: string) => {
      const elapsedMs = Date.now() - startTimeRef.current;
      const transcriptMessage: TranscriptEntry = {
        role,
        content: message,
        timestamp_ms: elapsedMs,
      };

      transcriptRef.current.push(transcriptMessage);
      setChatMessages((current) => [
        ...current,
        {
          id: `technical-qa-msg-${++msgCounterRef.current}`,
          role,
          content: message,
          time: formatTimeLabel(elapsedMs),
        },
      ]);
      addMessageToStore(transcriptMessage);
    },
    [addMessageToStore],
  );

  const {
    sendText: sendTextTurn,
    isSendingText,
    textError,
  } = useInterviewTextFallback({
    getContext: () => ({
      conversationHistory: transcriptRef.current.map(({ role, content }) => ({ role, content })),
      problem: null,
      currentPhase: currentPhaseRef.current,
      currentCode: "",
      elapsedSeconds: Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)),
      maxDurationSeconds: maxDuration,
      roundType: "technical_qa",
      roundContext: round,
    }),
    appendTurn: appendTextTurn,
    applyPhase: applyPhaseFromAgent,
    isVoiceConnected: () => agent.isConnected,
    injectVoiceMessage: (message) => agent.injectUserMessage(message, { suppressTranscript: true }),
  });

  const handleSendText = useCallback((text: string) => sendTextTurn(text), [sendTextTurn]);

  const continueInTextMode = useCallback(async () => {
    setVoiceError(null);
    setIsConnectingVoice(false);

    if (isResuming) {
      setHasStarted(true);
      setIsTimerRunning(true);
      setIsResuming(false);
      return;
    }

    const now = Date.now();
    startTimeRef.current = now;
    setHasStarted(true);
    setIsTimerRunning(true);
    setRoomStartedAtMs(now);
    setRoomPhase("INTRO");
    await sendTextTurn(INTRO_KICKOFF, { suppressCandidateTranscript: true });
  }, [isResuming, sendTextTurn, setRoomPhase, setRoomStartedAtMs]);

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
        <div className="max-w-md space-y-6">
          <VoiceVisualizer state="thinking" className="mx-auto h-28 w-28" />
          <div>
            <p className={LABEL}>Scoring</p>
            <h1 className="mt-3 text-balance text-[clamp(28px,3.4vw,40px)] font-normal leading-[1.05] tracking-[-0.03em]">Scoring your Technical Q&A round</h1>
            <p className={cn(BODY, "mt-3")}>
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
      <div className="flex min-h-screen items-center justify-center bg-brand-deep px-5 py-12 text-brand-text">
        <InterviewStartingOverlay
          visible={isConnectingVoice}
          interviewerName={interviewer.name}
          isResuming={isResuming}
        />
        <div className="w-full max-w-3xl">
          <p className={LABEL}>
            Technical Q&A
          </p>
          <h1 className="mt-4 text-balance text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em]">
            {isResuming ? "Resume your voice interview" : round.title}
          </h1>
          <p className={cn(LEAD, "mt-5 max-w-2xl")}>
            {isResuming
              ? `Your session is still active. You have about ${minutesRemaining} minute${
                  minutesRemaining === 1 ? "" : "s"
                } remaining.`
              : round.summary}
          </p>

          {!isResuming ? (
            <div className="mt-7 flex flex-wrap gap-2">
              {round.focusAreas.map((focus) => (
                <span key={focus} className={CHIP}>
                  {focus}
                </span>
              ))}
            </div>
          ) : null}

          <div className={cn(GRID, "mt-10 sm:grid-cols-3")}>
            <div className={cn(CELL, "p-5")}>
              <p className={LABEL}>Format</p>
              <p className="mt-2 text-[15px] text-brand-text">
                Voice conversation, no coding
              </p>
            </div>
            <div className={cn(CELL, "p-5")}>
              <p className={LABEL}>Duration</p>
              <p className="mt-2 text-[15px] text-brand-text">
                {TECHNICAL_QA_DURATION_MINUTES} minutes
              </p>
            </div>
            <div className={cn(CELL, "p-5")}>
              <p className={LABEL}>Interviewer</p>
              <p className="mt-2 text-[15px] text-brand-text">{interviewer.name}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button
              size="lg"
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
            <Button asChild variant="secondary" size="lg">
              <Link href="/interviews/technical-qa/setup">Back to setup</Link>
            </Button>
          </div>

          {voiceError ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-sm text-brand-rose">{voiceError}</p>
              <Button variant="secondary" onClick={() => void continueInTextMode()}>
                Continue with text
              </Button>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-brand-muted">
              Make sure your mic and speakers are on. Typed fallback stays available inside the
              room if you need it.
            </p>
          )}
        </div>
      </div>
    );
  }

  const phaseLabel = getPhaseLabelForRound("technical_qa", currentPhase);
  const voiceStateLabel = isConnectingVoice
    ? "Connecting"
    : isAgentConnected
      ? getVoiceStateLabel(voiceState, interviewer.name)
      : "Text mode";

  return (
    <div className="flex h-screen flex-col bg-brand-deep text-brand-text">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] bg-brand-deep px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-muted transition-colors hover:bg-white/[0.04] hover:text-brand-text",
              FOCUS,
              "rounded-full"
            )}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium tracking-[-0.01em]">Technical Q&amp;A</p>
            <p className={cn(LABEL, "truncate text-[10px]")}>
              {round.title} · #{interviewId.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        <Timer timeLeft={timeLeft} isRunning={isTimerRunning} />

        <div className="hidden items-center gap-4 md:flex">
          <span className={LABEL}>
            {phaseLabel}
          </span>
          <span className={LABEL}>
            {storeConfig?.language ?? "Voice"}
          </span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_22rem] lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-1 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <section className="flex min-h-0 flex-col bg-brand-deep">
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-5 sm:px-6 lg:px-8">
            <div className={cn(PANEL, "relative flex aspect-video w-full max-w-5xl items-center justify-center overflow-hidden")}>
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/[0.08] bg-brand-deep/80 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-brand-muted">
                <span className={cn("h-1.5 w-1.5 rounded-full", getVoiceStateDotClass(voiceState))} />
                {voiceStateLabel}
              </div>

              {voiceError ? (
                <div className="absolute right-4 top-4 max-w-xs rounded-[14px] border border-brand-rose/30 bg-brand-rose/10 px-3 py-2 text-xs leading-relaxed text-brand-rose">
                  {voiceError}
                </div>
              ) : null}

              <div className="flex flex-col items-center text-center">
                <VoiceVisualizer state={voiceState} className="h-40 w-40 sm:h-48 sm:w-48" />
                <p className="mt-5 text-xl font-medium tracking-[-0.02em] text-brand-text">{interviewer.name}</p>
                <p className={cn(LABEL, "mt-1.5")}>
                  AI Interviewer
                </p>
              </div>

              <div className="absolute bottom-4 left-4 max-w-[70%] rounded-[14px] border border-white/[0.08] bg-brand-deep/80 px-3 py-2">
                <p className="truncate text-sm text-brand-text">{round.title}</p>
                <p className={cn(LABEL, "mt-1 truncate text-[10px]")}>{phaseLabel}</p>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-white/[0.08] bg-brand-deep px-4 py-3">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleToggleMic}
                disabled={!isAgentConnected}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
                  !isAgentConnected
                    ? "cursor-not-allowed border-white/[0.08] text-brand-subtle opacity-50"
                    : isMicEnabled
                    ? "border-brand-cyan/40 bg-brand-cyan/[0.08] text-brand-cyan hover:bg-brand-cyan/[0.14]"
                    : "border-white/[0.12] text-brand-muted hover:border-white/[0.18] hover:text-brand-text"
                )}
                aria-label={!isAgentConnected ? "Voice disconnected" : isMicEnabled ? "Mute microphone" : "Enable microphone"}
              >
                {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              {microphoneDevices.length > 0 ? (
                <select
                  value={selectedDeviceId}
                  onChange={(event) => setSelectedDeviceId(event.target.value)}
                  className="h-11 max-w-56 rounded-full border border-white/[0.12] bg-brand-deep px-4 text-sm text-brand-text focus:border-brand-cyan focus:outline-none"
                  aria-label="Select microphone"
                >
                  <option value="">System default</option>
                  {microphoneDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                  ))}
                </select>
              ) : null}

              <button
                type="button"
                onClick={() => void resumeInterview()}
                disabled={isAgentConnected || isConnectingVoice}
                className={cn(
                  "flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
                  isAgentConnected || isConnectingVoice
                    ? "cursor-not-allowed border-white/[0.08] text-brand-subtle"
                    : "border-white/[0.18] text-brand-text hover:border-brand-cyan hover:text-brand-cyan"
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
                className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-brand-rose/30 bg-brand-rose/10 px-4 text-sm font-medium text-brand-rose transition-colors hover:border-brand-rose/60 hover:bg-brand-rose/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
              >
                <PhoneOff className="h-4 w-4" />
                <span className="hidden sm:inline">End</span>
              </button>
            </div>
            {deviceWarning ? <p className="mt-2 text-center text-xs text-brand-amber">{deviceWarning}</p> : null}
          </div>
        </section>

        <TechnicalQaConversationPanel
          messages={chatMessages}
          interviewerName={interviewer.name}
          isAgentBusy={voiceState === "thinking"}
          isSendingText={isSendingText}
          textError={textError}
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
  isSendingText,
  textError,
  onSendText,
}: {
  messages: ChatMessage[];
  interviewerName: string;
  isAgentBusy: boolean;
  isSendingText: boolean;
  textError: string | null;
  onSendText: (text: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isAgentBusy, messages]);

  async function sendDraft() {
    const message = draft.trim();
    if (!message || isSendingText) return;

    const sent = await onSendText(message);
    if (sent) setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendDraft();
    }
  }

  return (
    <aside className="flex min-h-0 flex-col border-t border-white/[0.08] bg-brand-deep lg:border-l lg:border-t-0">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] px-4">
        <div>
          <p className={cn(LABEL, "text-brand-text")}>Conversation</p>
          <p className="mt-0.5 text-xs text-brand-muted">Chat + transcript</p>
        </div>
        <span className="font-mono text-xs tabular-nums text-brand-subtle">
          {messages.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !isAgentBusy ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-xs px-6 text-center">
              <p className="text-[15px] text-brand-muted">
                {interviewerName} will open the round here
              </p>
            </div>
          </div>
        ) : null}

        {/* Transcript idiom: hairline-divided turns with a mono speaker label,
            the candidate's words set off by a quiet left rule. */}
        <div className="divide-y divide-white/[0.08]">
          {messages.map((message) => (
            <div key={message.id} className="py-4 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <span className={cn(LABEL, message.role === "interviewer" && "text-brand-text")}>
                  {message.role === "candidate" ? "You" : interviewerName}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-brand-subtle">{message.time}</span>
              </div>
              <p
                className={cn(
                  "mt-2 text-sm leading-relaxed text-brand-text",
                  message.role === "candidate" && "border-l border-white/[0.18] pl-3"
                )}
              >
                {message.content}
              </p>
            </div>
          ))}

          {isAgentBusy ? (
            <div className="py-4 first:pt-0">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted" />
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-white/[0.08] p-3">
        <div className="flex items-end gap-2 rounded-[20px] border border-white/[0.12] p-2 transition-colors focus-within:border-brand-cyan">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Type your answer..."
            className="min-h-10 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-brand-text placeholder:text-brand-subtle focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void sendDraft()}
            disabled={!draft.trim() || isSendingText}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
              draft.trim() && !isSendingText
                ? "bg-brand-cyan text-brand-deep hover:bg-brand-text"
                : "cursor-not-allowed bg-white/[0.06] text-brand-subtle"
            )}
            aria-label="Send typed answer"
          >
            {isSendingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        {textError ? <p className="mt-2 text-xs text-brand-rose">{textError}</p> : null}
      </div>
    </aside>
  );
}
