"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Code2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

import { VoicePanel } from "./VoicePanel";
import { CodeEditor } from "./CodeEditor";
import { ProblemPanel } from "./ProblemPanel";
import { TestRunner, type TestResult } from "./TestRunner";
import { Timer } from "./Timer";
import { InterviewControls } from "./InterviewControls";
import { VoiceVisualizer, type VoiceState } from "./VoiceVisualizer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useDeepgramVoiceAgent,
  type DeepgramVoiceAgentSettings,
  type AgentFunctionDef,
} from "@/hooks/useDeepgramVoiceAgent";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useInterviewStore } from "@/stores/interview-store";
import {
  type InterviewPhase,
  phaseFromElapsedFraction,
  clampPhaseToTimeFloor,
  parseInterviewPhase,
} from "@/lib/interview-phases";
import { buildVoiceSystemPrompt } from "@/lib/ai/interviewer-system-prompt";

// ─── Types ────────────────────────────────────────────────────────────────────

type SupportedLanguage = "python" | "javascript" | "java" | "cpp";

type ChatMessage = {
  id: string;
  role: "interviewer" | "candidate";
  content: string;
  time: string;
};

type ScoreDimensionRaw = { score: number; feedback: string };

type InterviewRoomProps = {
  interviewId: string;
};

const MAX_AGENT_CONTEXT_MESSAGES = 20;

// ─── Helper: extract typed score dimension safely ─────────────────────────────

function extractDimension(
  scores: Record<string, unknown>,
  key: string
): ScoreDimensionRaw {
  const raw = scores[key] as ScoreDimensionRaw | undefined;
  return { score: raw?.score ?? 0, feedback: raw?.feedback ?? "" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InterviewRoom({ interviewId }: InterviewRoomProps) {
  const router = useRouter();
  const hasHydrated = useHasHydrated();

  // ── Read setup config from Zustand store ───────────────────────────────────
  const storeConfig = useInterviewStore((s) => s.setupConfig);
  const storeProblem = useInterviewStore((s) => s.problem);
  const storeCode = useInterviewStore((s) => s.currentCode);
  const completeInterviewStore = useInterviewStore((s) => s.completeInterview);
  const addMessageToStore = useInterviewStore((s) => s.addMessage);
  const setRoomStartedAtMs = useInterviewStore((s) => s.setRoomStartedAtMs);
  const setRoomPhaseInStore = useInterviewStore((s) => s.setRoomPhase);
  const setRoomLanguageInStore = useInterviewStore((s) => s.setRoomLanguage);
  const setCodeForLanguage = useInterviewStore((s) => s.setCodeForLanguage);
  const setTestResultsInStore = useInterviewStore((s) => s.setTestResults);

  // Guard: wait for hydration before deciding to redirect
  useEffect(() => {
    if (hasHydrated && !storeProblem) {
      router.replace("/interview/setup");
    }
  }, [hasHydrated, storeProblem, router]);

  // Derive the active problem — always from store after the guard above
  const activeProblem = useMemo(() => storeProblem, [storeProblem]);

  const initialLanguage = (storeConfig?.language ?? "python") as SupportedLanguage;
  const maxDuration = storeConfig?.maxDurationSeconds ?? 45 * 60;

  // ── Conversation state ──────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isConnectingVoice, setIsConnectingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const conversationRef = useRef<{ role: string; content: string; timestamp_ms: number }[]>([]);
  const startTimeRef = useRef(Date.now());
  const msgCounterRef = useRef(0);
  const hasRestoredRef = useRef(false);

  // ── Interview state ──────────────────────────────────────────────────────────
  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>("INTRO");
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // ── Code state ───────────────────────────────────────────────────────────────
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [code, setCode] = useState(
    storeCode || activeProblem?.starter_code[initialLanguage] || ""
  );

  // ── Test state ───────────────────────────────────────────────────────────────
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // ── Scoring state ──────────────────────────────────────────────────────────
  const [isScoring, setIsScoring] = useState(false);

  // ── Mic mute state (mic streams continuously; this mutes/unmutes) ──────────
  const [isMicEnabled, setIsMicEnabled] = useState(true);

  // ── Resizable panel state ─────────────────────────────────────────────────
  const MIN_PANEL = 300;
  const MAX_PANEL = 700;
  const DEFAULT_PANEL = 400;
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_PANEL);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
  }, [panelWidth]);

  const handleTouchResizeStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    dragStartWidth.current = panelWidth;
  }, [panelWidth]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number) => {
      const delta = clientX - dragStartX.current;
      const newWidth = Math.min(MAX_PANEL, Math.max(MIN_PANEL, dragStartWidth.current + delta));
      setPanelWidth(newWidth);
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onEnd = () => setIsDragging(false);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onEnd);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  // Use a ref for activeProblem so callbacks always read the latest value.
  const activeProblemRef = useRef(activeProblem);
  useEffect(() => { activeProblemRef.current = activeProblem; }, [activeProblem]);

  const currentPhaseRef = useRef(currentPhase);
  useEffect(() => { currentPhaseRef.current = currentPhase; }, [currentPhase]);
  const codeRef = useRef(code);
  const languageRef = useRef(language);
  useEffect(() => { languageRef.current = language; }, [language]);
  const testResultsRef = useRef(testResults);
  useEffect(() => { testResultsRef.current = testResults; }, [testResults]);
  const setCodeInStore = useInterviewStore((s) => s.setCode);
  useEffect(() => {
    codeRef.current = code;
    const timer = setTimeout(() => {
      setCodeInStore(code);
      setCodeForLanguage(language, code);
    }, 500);
    return () => clearTimeout(timer);
  }, [code, language, setCodeInStore, setCodeForLanguage]);

  // ── Deepgram Voice Agent ──────────────────────────────────────────────────

  const agentFunctions = useMemo<AgentFunctionDef[]>(
    () => [
      {
        name: "get_current_code",
        description: "Retrieve the candidate's current code from the editor",
        parameters: { type: "object", properties: {}, required: [] },
      },
      {
        name: "run_tests",
        description: "Execute the candidate's code against test cases and return pass/fail results",
        parameters: { type: "object", properties: {}, required: [] },
      },
      {
        name: "get_interview_state",
        description: "Get current interview state including phase, time remaining, and test summary",
        parameters: { type: "object", properties: {}, required: [] },
      },
    ],
    [],
  );

  const agentContextMessages = useMemo(
    () =>
      chatMessages.slice(-MAX_AGENT_CONTEXT_MESSAGES).map((message) => ({
        role: message.role === "interviewer" ? ("assistant" as const) : ("user" as const),
        content: message.content,
      })),
    [chatMessages],
  );

  const hasCandidateCode = code.trim().length > 0;

  // Ref to break circular dependency: onConnected callback needs agent.injectUserMessage,
  // but agent is the return of the same hook. The ref is updated after hook returns.
  const agentInjectRef = useRef<(text: string) => void>(() => {});

  const agentSettings = useMemo<DeepgramVoiceAgentSettings>(
    () => ({
      systemPrompt: buildVoiceSystemPrompt(
        activeProblem,
        currentPhase,
        hasCandidateCode,
        Math.round(maxDuration / 60),
      ),
      functions: agentFunctions,
      contextMessages: agentContextMessages,
    }),
    [activeProblem, currentPhase, hasCandidateCode, maxDuration, agentFunctions, agentContextMessages],
  );

  const applyPhaseFromAgent = useCallback(
    (aiPhase: InterviewPhase) => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const pct = Math.min(1, Math.max(0, elapsed / maxDuration));
      const timePhase = phaseFromElapsedFraction(pct);
      const clamped = clampPhaseToTimeFloor(aiPhase, timePhase);
      setCurrentPhase(clamped);
      setRoomPhaseInStore(clamped);
    },
    [maxDuration, setRoomPhaseInStore],
  );

  const agent = useDeepgramVoiceAgent(agentSettings, {
    onTranscript: useCallback(
      (text: string, role: "user" | "agent") => {
        const elapsedMs = Date.now() - startTimeRef.current;
        const chatRole = role === "agent" ? "interviewer" : "candidate";
        const id = `msg-${++msgCounterRef.current}`;
        const elapsed = Math.floor(elapsedMs / 1000);
        const m = Math.floor(elapsed / 60);
        const s = elapsed % 60;
        const time = `${m}:${s.toString().padStart(2, "0")}`;

        const chatMsg: ChatMessage = { id, role: chatRole, content: text, time };
        setChatMessages((prev) => [...prev, chatMsg]);
        conversationRef.current.push({ role: chatRole, content: text, timestamp_ms: elapsedMs });
        addMessageToStore({ role: chatRole, content: text, timestamp_ms: elapsedMs });
      },
      [addMessageToStore],
    ),

    onFunctionCall: useCallback(
      async (name: string) => {
        switch (name) {
          case "get_current_code":
            return { language: languageRef.current, code: codeRef.current };

          case "run_tests": {
            const res = await fetch("/api/interview/run-code", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                language: languageRef.current,
                code: codeRef.current,
                interviewId,
                problemSlug: activeProblemRef.current?.slug,
              }),
            });
            const json = await res.json();
            if (!json.success) return { error: json.error || "Execution failed" };
            const results: TestResult[] = json.data?.test_results ?? [];
            setTestResults(results);
            setTestResultsInStore(
              results.map((r) => ({
                id: r.id, input: r.input, expected: r.expected,
                actual: r.actual ?? "", passed: r.passed, isHidden: r.isHidden,
              })),
            );
            const passed = results.filter((r) => r.passed).length;
            return {
              passed,
              total: results.length,
              summary: `${passed}/${results.length} tests passed`,
            };
          }

          case "get_interview_state": {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const remaining = Math.max(0, maxDuration - elapsed);
            const tr = testResultsRef.current;
            return {
              phase: currentPhaseRef.current,
              elapsedSeconds: elapsed,
              remainingSeconds: remaining,
              testsPassed: tr.filter((t) => t.passed).length,
              testsTotal: tr.length,
            };
          }

          default:
            return { error: `Unknown function: ${name}` };
        }
      },
      [interviewId, maxDuration, setTestResultsInStore],
    ),

    onPhaseChange: applyPhaseFromAgent,

    onError: useCallback((err: Error) => {
      console.error("[interview-room] Agent error:", err.message);
      setIsConnectingVoice(false);
      setVoiceError(err.message);
    }, []),

    onConnected: useCallback(() => {
      setIsConnectingVoice(false);
      setVoiceError(null);
      if (conversationRef.current.length === 0) {
        startTimeRef.current = Date.now();
        // Trigger the opening turn only for brand-new sessions. Resumes/reconnects
        // already carry transcript history via agent context.
        agentInjectRef.current(
          "The interview is starting. Please introduce yourself and the problem.",
        );
      }
    }, []),
  });

  // Keep the ref in sync with the latest injectUserMessage
  useEffect(() => {
    agentInjectRef.current = agent.injectUserMessage;
  }, [agent.injectUserMessage]);

  const voiceState: VoiceState = agent.voiceState;

  // ── Start interview (connect voice agent) ─────────────────────────────────
  const startInterview = useCallback(async () => {
    msgCounterRef.current = 0;
    setVoiceError(null);
    setIsConnectingVoice(true);

    try {
      await agent.connect();
      const now = startTimeRef.current;
      startTimeRef.current = now;
      setHasStarted(true);
      setIsTimerRunning(true);
      setRoomStartedAtMs(now);
      setRoomPhaseInStore("INTRO");
      // onConnected callback injects the greeting via agentInjectRef
    } catch (error) {
      setIsConnectingVoice(false);
      setIsTimerRunning(false);
      setHasStarted(false);
      setVoiceError(
        error instanceof Error ? error.message : "Unable to start the voice interview",
      );
    }
  }, [agent, setRoomStartedAtMs, setRoomPhaseInStore]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleToggleMic = useCallback(() => {
    if (isMicEnabled) {
      agent.mute();
      setIsMicEnabled(false);
    } else {
      agent.stopSpeaking();
      agent.unmute();
      setIsMicEnabled(true);
    }
  }, [isMicEnabled, agent]);

  const handleSendText = useCallback(
    (text: string) => {
      const elapsedMs = Date.now() - startTimeRef.current;
      const id = `msg-${++msgCounterRef.current}`;
      const elapsed = Math.floor(elapsedMs / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      const time = `${m}:${s.toString().padStart(2, "0")}`;
      setChatMessages((prev) => [...prev, { id, role: "candidate", content: text, time }]);
      conversationRef.current.push({ role: "candidate", content: text, timestamp_ms: elapsedMs });
      addMessageToStore({ role: "candidate", content: text, timestamp_ms: elapsedMs });
      agent.injectUserMessage(text);
    },
    [agent, addMessageToStore],
  );

  const handleLanguageChange = useCallback(
    (newLang: SupportedLanguage) => {
      // Save current language's code before switching
      setCodeForLanguage(language, code);

      setLanguage(newLang);
      setRoomLanguageInStore(newLang);

      // Load saved code for the new language, or fall back to starter stub
      const problem = activeProblemRef.current;
      const saved = useInterviewStore.getState().codePerLanguage[newLang];
      const newCode = saved ?? problem?.starter_code[newLang] ?? "";
      setCode(newCode);
    },
    [code, language, setRoomLanguageInStore, setCodeForLanguage]
  );

  const handleRunCode = useCallback(async () => {
    setIsRunningTests(true);
    setTestResults([]);

    try {
      const res = await fetch("/api/interview/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, interviewId, problemSlug: activeProblemRef.current?.slug }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Code execution failed");

      const results: TestResult[] = json.data?.test_results ?? [];

      if (results.length === 0 && json.data?.message) {
        results.push({
          id: "info",
          input: "",
          expected: "",
          actual: json.data.message,
          passed: false,
          isHidden: false,
        });
      }

      setTestResults(results);
      setTestResultsInStore(results.map((r) => ({
        id: r.id, input: r.input, expected: r.expected,
        actual: r.actual ?? "", passed: r.passed, isHidden: r.isHidden,
      })));

      // Inject test results into the agent for context
      if (agent.isConnected) {
        const passed = results.filter((r) => r.passed).length;
        agent.injectAgentMessage(
          `[System: Candidate ran their code. ${passed}/${results.length} tests passed. ` +
          `Language: ${language}. Code:\n${code}]`,
        );
      }
    } catch {
      const errorResults: TestResult[] = [
        {
          id: "error",
          input: "",
          expected: "",
          actual: "Execution error — check your code and try again.",
          passed: false,
          isHidden: false,
        },
      ];
      setTestResults(errorResults);
      setTestResultsInStore(errorResults.map((r) => ({
        id: r.id, input: r.input, expected: r.expected,
        actual: r.actual ?? "", passed: r.passed, isHidden: r.isHidden,
      })));
    } finally {
      setIsRunningTests(false);
    }
  }, [language, code, interviewId, setTestResultsInStore, agent]);

  // Use a ref so the timer effect always calls the latest version of
  // handleEndInterview without needing to restart the interval.
  const handleEndInterviewRef = useRef<() => Promise<void>>(async () => {});

  const handleEndInterview = useCallback(async () => {
    setIsScoring(true);

    agent.disconnect();

    const transcript = conversationRef.current.map((msg) => ({
      role: msg.role as "interviewer" | "candidate" | "system",
      content: msg.content,
      timestamp_ms: msg.timestamp_ms,
    }));

    const passed = testResults.filter((t) => t.passed).length;
    const total = testResults.length;
    const problem = activeProblemRef.current;

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
      const res = await fetch("/api/interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          finalCode: code,
          language,
          transcript,
          testsPassed: passed,
          testsTotal: total,
          problem: problem
            ? {
                title: problem.title,
                description: problem.description,
                difficulty: problem.difficulty,
                category: problem.category,
                optimal_complexity: problem.optimal_complexity ?? { time: "Unknown", space: "Unknown" },
              }
            : null,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.scoring) {
        scoringData = json.data.scoring as ScoringData;
      }
    } catch {
      // Scoring failed — navigate anyway; results page handles null scores
    }

    const rawScores = scoringData?.scores;
    const storeScores = rawScores
      ? {
          problem_solving: extractDimension(rawScores, "problem_solving"),
          code_quality: extractDimension(rawScores, "code_quality"),
          communication: extractDimension(rawScores, "communication"),
          technical_knowledge: extractDimension(rawScores, "technical_knowledge"),
          testing: extractDimension(rawScores, "testing"),
        }
      : null;

    completeInterviewStore({
      interviewId,
      finalCode: code,
      language,
      transcript,
      overallScore: scoringData?.overall_score ?? null,
      scores: storeScores,
      hireRecommendation: scoringData?.hire_recommendation ?? null,
      summary: scoringData?.summary ?? null,
      keyStrengths: scoringData?.key_strengths ?? null,
      areasToImprove: scoringData?.areas_to_improve ?? null,
      testsPassed: passed,
      testsTotal: total,
      problemTitle: problem?.title ?? "Unknown",
      problemDifficulty: problem?.difficulty ?? "medium",
      problemCategory: problem?.category ?? "arrays",
    });

    router.push(`/results/${interviewId}`);
  }, [interviewId, code, language, router, testResults, completeInterviewStore, agent]);

  // Keep the ref in sync with the latest callback
  useEffect(() => { handleEndInterviewRef.current = handleEndInterview; }, [handleEndInterview]);

  // ── Restore session from persisted store on hydration (reload resilience) ───
  useEffect(() => {
    if (!hasHydrated || hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const state = useInterviewStore.getState();
    const {
      roomStartedAtMs,
      interviewId: storeInterviewId,
      isInterviewActive,
      messages: storeMessages,
      roomPhase,
      roomLanguage,
      codePerLanguage: storedCodePerLang,
      testResults: storeTestResults,
      currentCode: storeCodeSnap,
    } = state;

    // Debug: remove after confirming reload works
    console.log("[reload-restore]", {
      hasHydrated,
      roomStartedAtMs,
      storeInterviewId,
      interviewId,
      isInterviewActive,
      messagesLen: storeMessages.length,
      roomPhase,
    });

    if (
      !roomStartedAtMs ||
      storeInterviewId !== interviewId ||
      !isInterviewActive ||
      storeMessages.length === 0
    ) {
      return;
    }

    // Calculate remaining time from wall-clock
    const elapsedMs = Date.now() - roomStartedAtMs;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    const remaining = Math.max(0, maxDuration - elapsedSec);

    // Restore conversationRef (needed by handleEndInterview for transcript)
    conversationRef.current = storeMessages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp_ms: m.timestamp_ms,
    }));

    if (remaining <= 0) {
      // Time expired while page was closed — auto-end via timer effect
      setHasStarted(true);
      setTimeLeft(0);
      setIsTimerRunning(true);
      startTimeRef.current = roomStartedAtMs;
      return;
    }

    // Restore chat messages for the transcript panel
    const restoredChat: ChatMessage[] = storeMessages
      .filter((m) => m.role !== "system")
      .map((m, i) => {
        const totalSec = Math.floor(m.timestamp_ms / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        return {
          id: `msg-${i + 1}`,
          role: m.role as "interviewer" | "candidate",
          content: m.content,
          time: `${min}:${sec.toString().padStart(2, "0")}`,
        };
      });
    setChatMessages(restoredChat);
    msgCounterRef.current = restoredChat.length;

    // Restore timing
    startTimeRef.current = roomStartedAtMs;
    setTimeLeft(remaining);

    // Restore phase
    const parsed = roomPhase ? parseInterviewPhase(roomPhase) : null;
    if (parsed) setCurrentPhase(parsed);

    // Restore test results
    if (storeTestResults.length > 0) setTestResults(storeTestResults);

    // Restore language selection
    const restoredLang = roomLanguage as SupportedLanguage | null;
    if (restoredLang) {
      setLanguage(restoredLang);
    }

    // Restore code state + ref — prefer per-language code for the active language
    const activeLang = restoredLang ?? initialLanguage;
    const restoredCode = storedCodePerLang[activeLang] ?? storeCodeSnap;
    if (restoredCode) {
      setCode(restoredCode);
      codeRef.current = restoredCode;
    }

    // Show resume overlay — user must click to unlock audio context (Safari)
    setIsResuming(true);
  }, [hasHydrated, initialLanguage, interviewId, maxDuration]);

  // ── Resume interview (after reload) — reconnect voice agent ─────────────────
  const resumeInterview = useCallback(async () => {
    setVoiceError(null);
    setIsConnectingVoice(true);

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
        error instanceof Error ? error.message : "Unable to reconnect to the voice agent",
      );
    }
  }, [agent]);

  // ── Timer countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted || !isTimerRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Call via ref so we always invoke the latest version of the handler
          // without needing to re-create this interval when deps change.
          void handleEndInterviewRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, isTimerRunning]);

  // ── Time floor: never show an earlier phase than elapsed time implies ─────────
  useEffect(() => {
    if (!hasStarted) return;
    const elapsed = maxDuration - timeLeft;
    const pct = elapsed / maxDuration;
    const timePhase = phaseFromElapsedFraction(pct);
    setCurrentPhase((prev) => clampPhaseToTimeFloor(prev, timePhase));
  }, [timeLeft, hasStarted, maxDuration]);

  // ── Periodic code snapshot injection (every 60s during coding phases) ──────
  useEffect(() => {
    if (!hasStarted || !agent.isConnected) return;
    const CODING_PHASES = new Set(["CODING", "TESTING", "COMPLEXITY_ANALYSIS"]);

    const interval = setInterval(() => {
      if (!CODING_PHASES.has(currentPhaseRef.current)) return;
      const currentCode = codeRef.current?.trim();
      if (!currentCode) return;
      agent.injectAgentMessage(
        `[System: Code snapshot — ${languageRef.current}]\n${currentCode}`,
      );
    }, 60_000);

    return () => clearInterval(interval);
  }, [hasStarted, agent]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  // Render nothing until hydration completes or while redirect is in flight
  if (!hasHydrated || !activeProblem) return null;

  // Scoring overlay — shown while AI evaluates the interview
  if (isScoring) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-brand-deep overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-brand-cyan/5 blur-[100px] animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-md text-center px-6">
          {/* Siri orb — thinking state for scoring */}
          <VoiceVisualizer state="thinking" className="h-36 w-36" />

          <div style={{ animation: "scoring-fade-in 0.6s ease-out 0.2s both" }}>
            <h1 className="text-2xl font-bold text-brand-text">Tia is reviewing your performance</h1>
            <p className="text-brand-muted text-sm mt-2 leading-relaxed">Evaluating problem solving, code quality, communication, technical knowledge, and testing.</p>
          </div>
          <div className="w-full space-y-2.5" style={{ animation: "scoring-fade-in 0.6s ease-out 0.5s both" }}>
            {["Problem Solving", "Code Quality", "Communication", "Technical Knowledge", "Testing"].map((dim, i) => (
              <div key={dim} className="flex items-center gap-3">
                <span className="text-[11px] text-brand-muted w-32 text-right shrink-0">{dim}</span>
                <div className="flex-1 h-1.5 rounded-full bg-brand-border overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-amber to-amber-400" style={{ animation: `scoring-progress ${6 + i * 1.5}s ease-out ${i * 0.4}s both` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-brand-muted/60" style={{ animation: "scoring-fade-in 0.6s ease-out 0.8s both" }}>This usually takes 5-10 seconds</p>
        </div>
      </div>
    );
  }

  // Start overlay — requires user click to unlock browser audio
  if (!hasStarted) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-brand-deep overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-cyan/4 blur-[120px]" />
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-md text-center px-6">
          {/* Siri orb — idle state for start screen */}
          <div style={{ animation: "start-fade-up 0.8s ease-out both" }}>
            <VoiceVisualizer state="idle" className="h-40 w-40" />
          </div>

          <div style={{ animation: "start-fade-up 0.8s ease-out 0.15s both" }}>
            <h1 className="text-3xl font-bold text-brand-text tracking-tight">
              {isResuming ? "Resume your interview" : "Ready to begin?"}
            </h1>
            <p className="text-brand-muted text-sm mt-3 leading-relaxed">
              {isResuming ? (
                <>Your session is still active. You have approximately{" "}
                <span className="text-brand-text font-medium">{Math.ceil(timeLeft / 60)} minute{Math.ceil(timeLeft / 60) !== 1 ? "s" : ""}</span> remaining.</>
              ) : (
                <>Tia, your AI interviewer, will introduce the problem and guide you through a{" "}
                <span className="text-brand-text font-medium">{Math.round(maxDuration / 60)}-minute</span> mock interview.</>
              )}
            </p>
          </div>
          {!isResuming && (
            <div className="flex items-center justify-center gap-6 text-[11px] text-brand-muted" style={{ animation: "start-fade-up 0.8s ease-out 0.3s both" }}>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-cyan/60" />Voice conversation</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-green/60" />Live coding</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-amber/60" />AI scoring</span>
            </div>
          )}
          <button
            onClick={isResuming ? resumeInterview : startInterview}
            disabled={isConnectingVoice}
            className={cn(
              "flex items-center gap-2 rounded-xl px-10 py-3.5 text-base font-semibold text-brand-deep transition-all",
              isConnectingVoice
                ? "cursor-wait bg-brand-cyan/70"
                : "bg-brand-cyan hover:bg-brand-cyan/90 hover:scale-[1.03] active:scale-[0.98]",
            )}
            style={{ animation: "start-fade-up 0.8s ease-out 0.45s both, start-btn-glow 3s ease-in-out infinite" }}
          >
            {isConnectingVoice
              ? "Connecting..."
              : isResuming
                ? "Resume Interview"
                : "Start Interview"}
          </button>
          {voiceError && (
            <p
              className="max-w-sm text-center text-xs leading-relaxed text-brand-rose"
              style={{ animation: "start-fade-up 0.8s ease-out 0.52s both" }}
            >
              {voiceError}
            </p>
          )}
          <p className="text-xs text-brand-muted/60" style={{ animation: "start-fade-up 0.8s ease-out 0.6s both" }}>
            {isResuming
              ? "Click resume to continue where you left off"
              : "Make sure your speakers are on \u00b7 You can also type responses"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-brand-deep overflow-hidden">
      {/* ── Top bar ── */}
      <header
        className={cn(
          "flex h-14 shrink-0 items-center justify-between border-b border-brand-border bg-brand-card px-4"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-brand-cyan" />
          <span className="text-sm font-semibold tracking-tight text-brand-text">
            TechInView
          </span>
        </div>

        {/* Timer */}
        <Timer timeLeft={timeLeft} isRunning={isTimerRunning} />

        {/* Right controls placeholder (run + end live in bottom bar) */}
        <div className="w-28 text-right">
          <span className="text-xs text-brand-muted">
            Session{" "}
            <span className="font-mono text-brand-text">
              #{interviewId.slice(-6).toUpperCase()}
            </span>
          </span>
        </div>
      </header>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel (resizable) ── */}
        <aside
          className="flex shrink-0 flex-col border-r border-brand-border bg-brand-surface overflow-hidden"
          style={{ width: `${panelWidth}px` }}
        >
          {/* Voice panel always visible at top */}
          <div className="shrink-0 border-b border-brand-border">
            <VoicePanel
              voiceState={voiceState}
              currentPhase={currentPhase}
              isMicEnabled={isMicEnabled}
              errorMessage={voiceError}
              onToggleMic={handleToggleMic}
              onSendText={handleSendText}
            />
          </div>

          {/* Problem / Transcript tabs */}
          <div className="flex flex-1 flex-col overflow-hidden px-4 pt-3">
            <Tabs defaultValue="problem" className="flex flex-1 flex-col overflow-hidden">
              <TabsList className="w-full">
                <TabsTrigger value="problem" className="flex-1 text-xs">
                  Problem
                </TabsTrigger>
                <TabsTrigger value="transcript" className="flex-1 text-xs">
                  Transcript
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="problem"
                className="flex-1 overflow-hidden mt-0"
              >
                <ProblemPanel problem={{ ...activeProblem, difficulty: activeProblem.difficulty as "easy" | "medium" | "hard" }} />
              </TabsContent>

              <TabsContent
                value="transcript"
                className="flex-1 overflow-y-auto mt-2"
              >
                <TranscriptPanel messages={chatMessages} isThinking={voiceState === "thinking"} />
              </TabsContent>
            </Tabs>
          </div>
        </aside>

        {/* ── Resize handle ── */}
        <div
          className={cn(
            "flex w-2 shrink-0 cursor-col-resize items-center justify-center border-r border-brand-border bg-brand-surface transition-colors hover:bg-brand-cyan/10 group",
            isDragging && "bg-brand-cyan/10"
          )}
          onMouseDown={handleResizeStart}
          onTouchStart={handleTouchResizeStart}
        >
          <GripVertical className={cn(
            "h-5 w-5 text-brand-border transition-colors group-hover:text-brand-cyan/60",
            isDragging && "text-brand-cyan/60"
          )} />
        </div>

        {/* ── Right panel ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Code editor — fills available space above test runner */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              language={language}
              value={code}
              onChange={setCode}
              onRunCode={handleRunCode}
              onLanguageChange={handleLanguageChange}
            />
          </div>

          {/* Test runner — fixed height */}
          <div className="h-48 shrink-0 overflow-hidden">
            <TestRunner
              testResults={testResults}
              isRunning={isRunningTests}
            />
          </div>
        </main>
      </div>

      {/* ── Bottom bar ── */}
      <InterviewControls
        phase={currentPhase}
        language={language}
        onRunCode={handleRunCode}
        onEndInterview={handleEndInterview}
        isRunning={isRunningTests}
      />
    </div>
  );
}

// ─── Transcript panel ─────────────────────────────────────────────────────────

function TranscriptPanel({ messages, isThinking }: { messages: ChatMessage[]; isThinking: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  if (messages.length === 0 && !isThinking) {
    return (
      <p className="text-center text-[10px] text-brand-muted pt-8">
        Tia will start the conversation shortly...
      </p>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex gap-2",
            msg.role === "candidate" ? "flex-row-reverse" : "flex-row"
          )}
        >
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
              msg.role === "interviewer"
                ? "bg-brand-cyan/20 text-brand-cyan"
                : "bg-brand-green/20 text-brand-green"
            )}
          >
            {msg.role === "interviewer" ? "A" : "Y"}
          </div>
          <div
            className={cn(
              "max-w-[80%] rounded-xl px-3 py-2",
              msg.role === "interviewer"
                ? "rounded-tl-none bg-brand-card border border-brand-border"
                : "rounded-tr-none bg-brand-cyan/10 border border-brand-cyan/20"
            )}
          >
            <p className="text-xs leading-relaxed text-brand-text">
              {msg.content}
            </p>
            <span className="mt-1 block text-[10px] text-brand-muted">
              {msg.time}
            </span>
          </div>
        </div>
      ))}
      {isThinking && (
        <div className="flex gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold bg-brand-cyan/20 text-brand-cyan">
            A
          </div>
          <div className="rounded-xl rounded-tl-none bg-brand-card border border-brand-border px-3 py-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-brand-amber rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-brand-amber rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-brand-amber rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
