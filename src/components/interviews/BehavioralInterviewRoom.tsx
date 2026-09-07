"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewStartingOverlay } from "@/components/interviews/InterviewStartingOverlay";
import { Timer } from "@/components/interview/Timer";
import { DiscussionWorkspace } from "@/components/interview/DiscussionWorkspace";
import { RoundBriefPanel } from "@/components/interview/RoundBriefPanel";
import { TranscriptChat, type TranscriptMessage } from "@/components/interview/TranscriptChat";
import { VoicePanel } from "@/components/interview/VoicePanel";
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
import { getInterviewerPersona } from "@/lib/interviewer-personas";
import { getPhaseLabelForRound } from "@/lib/loops/round-config";
import { BEHAVIORAL_DURATION_MINUTES } from "@/lib/behavioral";
import type { CompetencyReport } from "@/types";

type BehavioralInterviewRoomProps = {
  interviewId: string;
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

const MAX_DURATION_SECONDS = BEHAVIORAL_DURATION_MINUTES * 60;
const MAX_AGENT_CONTEXT_MESSAGES = 20;
const OPENING_TURN_DELAY_MS = 2000;
const INTRO_KICKOFF =
  "Start the behavioural round now. Greet the candidate briefly, say in one sentence that this round is about specific past experience rather than coding, then ask exactly one short calibration question about their current scope and the work they own. Stop and wait for their answer. Keep this voice-first and never ask them to code.";

function formatTimeLabel(timestampMs: number) {
  const totalSeconds = Math.floor(timestampMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function toUiMessages(messages: TranscriptEntry[]): TranscriptMessage[] {
  return messages
    .filter((message) => message.role !== "system")
    .map((message, index) => ({
      id: `behavioral-msg-${index + 1}`,
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

export function BehavioralInterviewRoom({ interviewId }: BehavioralInterviewRoomProps) {
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

  const [chatMessages, setChatMessages] = useState<TranscriptMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>("INTRO");
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [hasStarted, setHasStarted] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isConnectingVoice, setIsConnectingVoice] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
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
  const notesRef = useRef(notes);
  const shouldSendOpeningTurnRef = useRef(false);

  useEffect(() => {
    currentPhaseRef.current = currentPhase;
  }, [currentPhase]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!round || storeConfig?.roundType !== "behavioral") {
      router.replace("/interviews/behavioral/setup");
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
      state.setupConfig?.roundType === "behavioral";

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
      {
        name: "get_workspace_notes",
        description:
          "Retrieve the candidate's structured STAR notes from the round workspace before assuming what they have already written down.",
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
        roundType: "behavioral",
        problem: null,
        roundContext: round,
        currentPhase,
        hasCandidateCode: false,
        hasWorkspaceNotes: true,
        totalMinutes: Math.round(maxDuration / 60),
        interviewerPersonaId: interviewer.id,
      }),
      thinkModel: getLiveInterviewModel(storeConfig?.isFreeInterview ?? false),
      voiceModel: interviewer.voiceModel,
      functions: agentFunctions,
      contextMessages: agentContextMessages,
      inputDeviceId: selectedDeviceId,
    }),
    [
      agentContextMessages,
      agentFunctions,
      currentPhase,
      interviewer,
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
            id: `behavioral-msg-${++msgCounterRef.current}`,
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
          case "get_workspace_notes":
            return { roundType: "behavioral", notes: notesRef.current };
          default:
            return { error: `Unknown function: ${name}` };
        }
      },
      [maxDuration]
    ),
    onPhaseChange: applyPhaseFromAgent,
    onError: useCallback((error: Error) => {
      console.error("[behavioral-room] Agent error:", error.message);
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

  const handleChangeNote = useCallback((sectionId: string, value: string) => {
    setNotes((current) => ({ ...current, [sectionId]: value }));
  }, []);

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
          id: `behavioral-msg-${++msgCounterRef.current}`,
          role,
          content: message,
          time: formatTimeLabel(elapsedMs),
        },
      ]);
      addMessageToStore(transcriptMessage);
    },
    [addMessageToStore]
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
      interviewerPersona: interviewer.id,
      roundType: "behavioral",
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
      competency_report?: CompetencyReport | null;
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
          roundType: "behavioral",
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
      roundType: "behavioral",
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
      competencyReport: scoringData?.competency_report ?? null,
      testsPassed: 0,
      testsTotal: 0,
      problemTitle: round.title,
      problemDifficulty: "medium",
      problemCategory: "behavioral",
      company: storeConfig?.company ?? null,
      roleTitle: storeConfig?.roleTitle ?? null,
      loopName: storeConfig?.loopName ?? null,
      loopSummary: storeConfig?.loopSummary ?? null,
      roundContext: round,
    });

    router.push(`/interviews/behavioral/results/${interviewId}`);
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

  if (!hasHydrated || !round || storeConfig?.roundType !== "behavioral") {
    return null;
  }

  if (isScoring) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-deep px-6 text-center text-brand-text">
        <div className="max-w-md space-y-5">
          <VoiceVisualizer state="thinking" className="mx-auto h-28 w-28" />
          <div>
            <h1 className="text-2xl font-semibold">Scoring your behavioral round</h1>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              We&apos;re reviewing each story for the evidence a real interviewer grades:
              your own contribution, the hard part, the result, and your reflection.
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
        <InterviewStartingOverlay
          visible={isConnectingVoice}
          interviewerName={interviewer.name}
          isResuming={isResuming}
        />
        <div className="w-full max-w-3xl rounded-3xl border border-brand-border bg-brand-card p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
            Behavioral
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
                {BEHAVIORAL_DURATION_MINUTES} minutes
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
                "Resume Behavioral Round"
              ) : (
                "Start Behavioral Round"
              )}
            </Button>
            <Button asChild variant="secondary">
              <Link href="/interviews/behavioral/setup">Back to setup</Link>
            </Button>
          </div>

          {voiceError ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-sm text-brand-rose">{voiceError}</p>
              <Button variant="secondary" onClick={() => void continueInTextMode()}>
                Continue with text
              </Button>
            </div>
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

  return (
    <div className="flex h-screen flex-col bg-brand-deep text-brand-text">
      <header className="border-b border-brand-border bg-brand-card px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-brand-muted transition-colors hover:text-brand-text"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div className="hidden h-5 w-px bg-brand-border sm:block" />
            <div>
              <p className="text-sm font-semibold tracking-tight">Behavioral</p>
              <p className="text-xs text-brand-muted">
                Session #{interviewId.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>

          <Timer timeLeft={timeLeft} isRunning={isTimerRunning} />

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted md:inline-flex">
              {getPhaseLabelForRound("behavioral", currentPhase)}
            </span>
            <Button variant="destructive" size="sm" onClick={() => void handleEndInterview()}>
              End Interview
            </Button>
          </div>
        </div>
      </header>

      {/* Brief | STAR notes workspace | voice + transcript, mirroring the
          non-coding layout the shared interview room uses. */}
      <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[17rem_minmax(0,1fr)_20rem] xl:grid-cols-[19rem_minmax(0,1fr)_22rem]">
        <aside className="min-h-0 overflow-hidden rounded-3xl border border-brand-border bg-brand-card">
          <RoundBriefPanel
            round={round}
            company={storeConfig?.company ?? null}
            roleTitle={storeConfig?.roleTitle ?? null}
            loopName={storeConfig?.loopName ?? null}
          />
        </aside>

        <section className="min-h-0 overflow-hidden rounded-3xl border border-brand-border bg-brand-card">
          <DiscussionWorkspace
            round={round}
            company={storeConfig?.company}
            roleTitle={storeConfig?.roleTitle}
            notes={notes}
            onChangeNote={handleChangeNote}
          />
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-brand-border bg-brand-card">
          <div className="shrink-0">
            <VoicePanel
              voiceState={voiceState}
              currentPhase={currentPhase}
              roundType="behavioral"
              interviewerName={interviewer.name}
              isMicEnabled={isMicEnabled}
              isVoiceConnected={isAgentConnected}
              isReconnecting={isConnectingVoice}
              errorMessage={voiceError}
              microphoneDevices={microphoneDevices}
              selectedDeviceId={selectedDeviceId}
              deviceWarning={deviceWarning}
              showTextFallback={false}
              onToggleMic={handleToggleMic}
              onDeviceChange={setSelectedDeviceId}
              onReconnect={resumeInterview}
              onSendText={handleSendText}
            />
          </div>

          <TranscriptChat
            messages={chatMessages}
            interviewerName={interviewer.name}
            isThinking={voiceState === "thinking"}
            isSendingText={isSendingText}
            textError={textError}
            onSendText={handleSendText}
          />
        </aside>
      </div>
    </div>
  );
}
