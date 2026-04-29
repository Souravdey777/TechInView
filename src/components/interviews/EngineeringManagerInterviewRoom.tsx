"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageSquareMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Timer } from "@/components/interview/Timer";
import { VoicePanel } from "@/components/interview/VoicePanel";
import { VoiceVisualizer, type VoiceState } from "@/components/interview/VoiceVisualizer";
import { RoundBriefPanel } from "@/components/interview/RoundBriefPanel";
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
import { ENGINEERING_MANAGER_DURATION_MINUTES } from "@/lib/engineering-manager";

type EngineeringManagerInterviewRoomProps = {
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

const MAX_DURATION_SECONDS = ENGINEERING_MANAGER_DURATION_MINUTES * 60;
const MAX_AGENT_CONTEXT_MESSAGES = 20;
const OPENING_TURN_DELAY_MS = 2000;
const INTRO_KICKOFF =
  "Start the engineering-manager round now. Greet the candidate briefly, confirm the role context you want to evaluate in one short sentence, ask exactly one strong engineering-manager question, then stop and wait for their answer. Keep this voice-first and do not ask them to code.";

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
      id: `engineering-manager-msg-${index + 1}`,
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

export function EngineeringManagerInterviewRoom({
  interviewId,
}: EngineeringManagerInterviewRoomProps) {
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
    if (!round || storeConfig?.roundType !== "hiring_manager") {
      router.replace("/interviews/engineering-manager/setup");
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
      state.setupConfig?.roundType === "hiring_manager";

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
        roundType: "hiring_manager",
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
            id: `engineering-manager-msg-${++msgCounterRef.current}`,
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
      console.error("[engineering-manager-room] Agent error:", error.message);
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
          id: `engineering-manager-msg-${++msgCounterRef.current}`,
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
          roundType: "hiring_manager",
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
      roundType: "hiring_manager",
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
      problemCategory: "engineering-manager",
      company: storeConfig?.company ?? null,
      roleTitle: storeConfig?.roleTitle ?? null,
      loopName: storeConfig?.loopName ?? null,
      loopSummary: storeConfig?.loopSummary ?? null,
      roundContext: round,
    });

    router.push(`/interviews/engineering-manager/results/${interviewId}`);
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

  if (!hasHydrated || !round || storeConfig?.roundType !== "hiring_manager") {
    return null;
  }

  if (isScoring) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-deep px-6 text-center text-brand-text">
        <div className="max-w-md space-y-5">
          <VoiceVisualizer state="thinking" className="mx-auto h-28 w-28" />
          <div>
            <h1 className="text-2xl font-semibold">Scoring your Engineering Manager round</h1>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              We&apos;re reviewing the transcript for leadership signal, communication clarity,
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
            Engineering Manager
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
                {ENGINEERING_MANAGER_DURATION_MINUTES} minutes
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
                "Resume Engineering Manager Round"
              ) : (
                "Start Engineering Manager Round"
              )}
            </Button>
            <Button asChild variant="secondary">
              <Link href="/interviews/engineering-manager/setup">Back to setup</Link>
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
              <p className="text-sm font-semibold tracking-tight">Engineering Manager</p>
              <p className="text-xs text-brand-muted">
                Session #{interviewId.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>

          <Timer timeLeft={timeLeft} isRunning={isTimerRunning} />

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted md:inline-flex">
              {getPhaseLabelForRound("hiring_manager", currentPhase)}
            </span>
            <Button variant="destructive" size="sm" onClick={() => void handleEndInterview()}>
              End Interview
            </Button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[18rem_22rem_minmax(0,1fr)] xl:grid-cols-[20rem_24rem_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-hidden rounded-3xl border border-brand-border bg-brand-card">
          <RoundBriefPanel
            round={round}
            company={storeConfig?.company ?? null}
            roleTitle={storeConfig?.roleTitle ?? null}
            loopName={storeConfig?.loopName ?? null}
          />
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-brand-border bg-brand-card">
          <div className="border-b border-brand-border px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
              Voice Room
            </p>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              Stay in the conversation. This round is built for clear, concrete leadership
              answers, not note-taking or coding.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="h-full min-h-[36rem]">
              <VoicePanel
                voiceState={voiceState}
                currentPhase={currentPhase}
                roundType="hiring_manager"
                interviewerName={interviewer.name}
                layout="center-stage"
                isMicEnabled={isMicEnabled}
                isVoiceConnected={isAgentConnected}
                isReconnecting={isConnectingVoice}
                errorMessage={voiceError}
                onToggleMic={handleToggleMic}
                onReconnect={resumeInterview}
                onSendText={handleSendText}
              />
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-brand-border bg-brand-card">
          <div className="border-b border-brand-border px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                  Live Transcript
                </p>
                <p className="mt-1 text-sm text-brand-muted">
                  Every spoken turn lands here so you can track the flow of the round in real
                  time.
                </p>
              </div>
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
                {voiceState === "thinking"
                  ? "Thinking"
                  : voiceState === "speaking"
                    ? `${interviewer.name} speaking`
                    : "Listening live"}
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <EngineeringManagerTranscript
              messages={chatMessages}
              interviewerName={interviewer.name}
              isAgentBusy={voiceState === "thinking"}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function EngineeringManagerTranscript({
  messages,
  interviewerName,
  isAgentBusy,
}: {
  messages: ChatMessage[];
  interviewerName: string;
  isAgentBusy: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isAgentBusy, messages]);

  if (messages.length === 0 && !isAgentBusy) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-brand-border bg-brand-surface">
        <div className="max-w-sm px-6 text-center">
          <MessageSquareMore className="mx-auto h-10 w-10 text-brand-cyan" />
          <p className="mt-4 text-sm font-semibold text-brand-text">
            {interviewerName} will open the round here
          </p>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted">
            This is a live voice interview with no coding. The transcript will build here as the
            interviewer probes role fit, leadership, and decision-making.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === "candidate" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              message.role === "candidate"
                ? "rounded-tr-sm border border-brand-cyan/25 bg-brand-cyan/10"
                : "rounded-tl-sm border border-brand-border bg-brand-surface"
            }`}
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
          <div className="rounded-2xl rounded-tl-sm border border-brand-border bg-brand-surface px-4 py-3">
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
  );
}
