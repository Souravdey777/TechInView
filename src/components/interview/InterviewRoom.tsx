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
import { useVoiceInterview } from "@/hooks/useVoiceInterview";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useInterviewStore } from "@/stores/interview-store";
import {
  type InterviewPhase,
  phaseFromElapsedFraction,
  clampPhaseToTimeFloor,
  parseInterviewPhase,
} from "@/lib/interview-phases";

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
  const voice = useVoiceInterview();
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
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
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

  // ── Derived voice state for UI ──────────────────────────────────────────────
  const voiceState: VoiceState = isAiThinking ? "thinking" : voice.voiceState as VoiceState;
  const [isMicEnabled, setIsMicEnabled] = useState(false);

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

  // ── Helper: get elapsed time string ─────────────────────────────────────────
  const getTimeStr = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  // Use a ref for activeProblem so sendToAI / startInterview always read the
  // latest value without needing to re-create the callbacks.
  const activeProblemRef = useRef(activeProblem);
  useEffect(() => { activeProblemRef.current = activeProblem; }, [activeProblem]);

  // Same for currentPhase and code — needed by sendToAI without dep churn
  const currentPhaseRef = useRef(currentPhase);
  useEffect(() => { currentPhaseRef.current = currentPhase; }, [currentPhase]);
  const codeRef = useRef(code);
  const setCodeInStore = useInterviewStore((s) => s.setCode);
  useEffect(() => {
    codeRef.current = code;
    // Debounce persisting code to sessionStorage (avoids write on every keystroke)
    const timer = setTimeout(() => {
      setCodeInStore(code);
      setCodeForLanguage(language, code);
    }, 500);
    return () => clearTimeout(timer);
  }, [code, language, setCodeInStore, setCodeForLanguage]);

  const applyPhaseAfterTurn = useCallback(
    (apiPhase: unknown) => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const pct = Math.min(1, Math.max(0, elapsed / maxDuration));
      const timePhase = phaseFromElapsedFraction(pct);
      const parsed = parseInterviewPhase(apiPhase);
      if (parsed) {
        const clamped = clampPhaseToTimeFloor(parsed, timePhase);
        setCurrentPhase(clamped);
        setRoomPhaseInStore(clamped);
      } else {
        setCurrentPhase((prev) => {
          const clamped = clampPhaseToTimeFloor(prev, timePhase);
          setRoomPhaseInStore(clamped);
          return clamped;
        });
      }
    },
    [maxDuration, setRoomPhaseInStore]
  );

  // ── Send message to AI and speak response ──────────────────────────────────
  const sendToAI = useCallback(async (userMessage: string) => {
    const elapsedMs = Date.now() - startTimeRef.current;
    const id = `msg-${++msgCounterRef.current}`;
    const userMsg: ChatMessage = { id, role: "candidate", content: userMessage, time: getTimeStr() };
    setChatMessages(prev => [...prev, userMsg]);
    conversationRef.current.push({ role: "candidate", content: userMessage, timestamp_ms: elapsedMs });
    addMessageToStore({ role: "candidate", content: userMessage, timestamp_ms: elapsedMs });

    setIsAiThinking(true);

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: conversationRef.current.slice(-10),
          problem: activeProblemRef.current,
          currentPhase: currentPhaseRef.current,
          currentCode: codeRef.current,
          elapsedSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
          maxDurationSeconds: maxDuration,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.message) {
        const aiText = data.data.message as string;
        const aiElapsedMs = Date.now() - startTimeRef.current;
        const aiId = `msg-${++msgCounterRef.current}`;
        const aiMsg: ChatMessage = { id: aiId, role: "interviewer", content: aiText, time: getTimeStr() };
        setChatMessages(prev => [...prev, aiMsg]);
        conversationRef.current.push({ role: "interviewer", content: aiText, timestamp_ms: aiElapsedMs });
        addMessageToStore({ role: "interviewer", content: aiText, timestamp_ms: aiElapsedMs });

        applyPhaseAfterTurn(data.data.phase);

        voice.speakText(aiText);
        setIsAiThinking(false);
      } else {
        setIsAiThinking(false);
      }
    } catch {
      setIsAiThinking(false);
    }
  }, [getTimeStr, voice, maxDuration, applyPhaseAfterTurn, addMessageToStore]);

  // ── Start interview (triggered by user click to enable audio) ───────────────
  const startInterview = useCallback(async () => {
    await voice.prepareAudioPlayback();

    setHasStarted(true);
    setIsTimerRunning(true);
    const now = Date.now();
    startTimeRef.current = now;
    setRoomStartedAtMs(now);
    setRoomPhaseInStore("INTRO");
    setIsAiThinking(true);
    msgCounterRef.current = 0;

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "The interview is starting. Please introduce yourself and the problem.",
          conversationHistory: [],
          problem: activeProblemRef.current,
          currentPhase: "INTRO",
          currentCode: "",
          elapsedSeconds: 0,
          maxDurationSeconds: maxDuration,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.message) {
        const aiText = data.data.message as string;
        const initId = `msg-${++msgCounterRef.current}`;
        setChatMessages([{ id: initId, role: "interviewer", content: aiText, time: "0:00" }]);
        conversationRef.current = [{ role: "interviewer", content: aiText, timestamp_ms: 0 }];
        addMessageToStore({ role: "interviewer", content: aiText, timestamp_ms: 0 });
        applyPhaseAfterTurn(data.data.phase);
        voice.speakText(aiText);
        setIsAiThinking(false);
      } else {
        setIsAiThinking(false);
      }
    } catch {
      setIsAiThinking(false);
    }
  }, [voice, maxDuration, applyPhaseAfterTurn, setRoomStartedAtMs, setRoomPhaseInStore, addMessageToStore]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleToggleMic = useCallback(() => {
    if (isMicEnabled) {
      // Manually stopping — grab transcript and send
      voice.stopListening();
      setIsMicEnabled(false);
      // Small delay to let final onresult fire before reading
      setTimeout(() => {
        const spokenText = voice.getTranscript().trim();
        if (spokenText) {
          sendToAI(spokenText);
          voice.setTranscript("");
        }
      }, 300);
    } else {
      // Stop Tia from speaking if he's talking
      voice.stopSpeaking();
      voice.setTranscript("");
      voice.startListening();
      setIsMicEnabled(true);
    }
  }, [isMicEnabled, voice, sendToAI]);

  // Auto-send when recognition stops (debounced silence in hook, or manual stop)
  const prevListeningRef = useRef(false);
  useEffect(() => {
    const wasListening = prevListeningRef.current;
    prevListeningRef.current = voice.isListening;

    // Transition from listening → not listening
    if (wasListening && !voice.isListening && isMicEnabled) {
      setIsMicEnabled(false);
      // Small delay to let final transcript settle
      setTimeout(() => {
        const spokenText = voice.getTranscript().trim();
        if (spokenText && !isAiThinking) {
          sendToAI(spokenText);
          voice.setTranscript("");
        }
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.isListening]);

  const handleSendText = useCallback((text: string) => {
    sendToAI(text);
  }, [sendToAI]);

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
  }, [language, code, interviewId, setTestResultsInStore]);

  // Use a ref so the timer effect always calls the latest version of
  // handleEndInterview without needing to restart the interval.
  const handleEndInterviewRef = useRef<() => Promise<void>>(async () => {});

  const handleEndInterview = useCallback(async () => {
    setIsScoring(true);

    voice.stopListening();
    voice.stopSpeaking();

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
  }, [interviewId, code, language, router, testResults, completeInterviewStore, voice]);

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
  }, [hasHydrated, interviewId, maxDuration]);

  // ── Resume interview (after reload) — no intro API call ────────────────────
  const resumeInterview = useCallback(async () => {
    await voice.prepareAudioPlayback();
    setHasStarted(true);
    setIsTimerRunning(true);
    setIsResuming(false);
  }, [voice]);

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
          <button onClick={isResuming ? resumeInterview : startInterview} className="flex items-center gap-2 rounded-xl bg-brand-cyan px-10 py-3.5 text-base font-semibold text-brand-deep transition-all hover:bg-brand-cyan/90 hover:scale-[1.03] active:scale-[0.98]" style={{ animation: "start-fade-up 0.8s ease-out 0.45s both, start-btn-glow 3s ease-in-out infinite" }}>
            {isResuming ? "Resume Interview" : "Start Interview"}
          </button>
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
                <TranscriptPanel messages={chatMessages} isThinking={isAiThinking} />
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
