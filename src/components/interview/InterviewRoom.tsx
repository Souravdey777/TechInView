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
import { useInterviewStore } from "@/stores/interview-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type SupportedLanguage = "python" | "javascript" | "java" | "cpp";

type InterviewPhase =
  | "INTRO"
  | "PROBLEM_PRESENTED"
  | "CLARIFICATION"
  | "APPROACH_DISCUSSION"
  | "CODING"
  | "TESTING"
  | "COMPLEXITY_ANALYSIS"
  | "FOLLOW_UP"
  | "WRAP_UP";

type InterviewRoomProps = {
  interviewId: string;
};

// ─── Mock data (replaced by real API data in production) ──────────────────────

const STARTER_CODE: Record<SupportedLanguage, string> = {
  python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Your solution here
    pass
`,
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Your solution here
}
`,
  java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your solution here
        return new int[]{};
    }
}
`,
  cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your solution here
        return {};
    }
};
`,
};

const MOCK_PROBLEM = {
  title: "Two Sum",
  slug: "two-sum",
  difficulty: "easy" as const,
  category: "arrays",
  description:
    "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation:
        "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]",
    },
    {
      input: "nums = [3,3], target = 6",
      output: "[0,1]",
    },
  ],
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists.",
  ],
  starter_code: STARTER_CODE as Record<string, string>,
  optimal_complexity: { time: "O(n)", space: "O(n)" },
  hints: [
    "A brute force O(n²) solution works, but can you do better?",
    "Think about what complement you need for each number. How could you store what you have seen so far?",
    "A hash map lets you look up complements in O(1) time.",
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function InterviewRoom({ interviewId }: InterviewRoomProps) {
  const router = useRouter();
  const voice = useVoiceInterview();

  // ── Read setup config from Zustand store ───────────────────────────────────
  const storeConfig = useInterviewStore((s) => s.setupConfig);
  const storeProblem = useInterviewStore((s) => s.problem);
  const storeCode = useInterviewStore((s) => s.currentCode);
  const completeInterviewStore = useInterviewStore((s) => s.completeInterview);

  // Derive the active problem — store data or fallback to mock
  const activeProblem = useMemo(
    () => storeProblem ?? MOCK_PROBLEM,
    [storeProblem]
  );
  const initialLanguage = (storeConfig?.language ?? "python") as SupportedLanguage;
  const maxDuration = storeConfig?.maxDurationSeconds ?? 45 * 60;

  // ── Conversation state ──────────────────────────────────────────────────────
  type ChatMessage = { role: "interviewer" | "candidate"; content: string; time: string };
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const conversationRef = useRef<{ role: string; content: string }[]>([]);
  const startTimeRef = useRef(Date.now());

  // ── Interview state ──────────────────────────────────────────────────────────
  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>("INTRO");
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // ── Code state ───────────────────────────────────────────────────────────────
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [code, setCode] = useState(
    storeCode || activeProblem.starter_code[initialLanguage] || STARTER_CODE[initialLanguage]
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

  // ── Send message to AI and speak response ──────────────────────────────────
  const sendToAI = useCallback(async (userMessage: string) => {
    // Add user message to chat
    const userMsg: ChatMessage = { role: "candidate", content: userMessage, time: getTimeStr() };
    setChatMessages(prev => [...prev, userMsg]);
    conversationRef.current.push({ role: "candidate", content: userMessage });

    setIsAiThinking(true);

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: conversationRef.current.slice(-10),
          problem: activeProblem,
          currentPhase,
          currentCode: code,
          elapsedSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.message) {
        const aiText = data.data.message;
        const aiMsg: ChatMessage = { role: "interviewer", content: aiText, time: getTimeStr() };
        setChatMessages(prev => [...prev, aiMsg]);
        conversationRef.current.push({ role: "interviewer", content: aiText });

        setIsAiThinking(false);
        // Speak the response using browser TTS
        voice.speakText(aiText);
      } else {
        setIsAiThinking(false);
      }
    } catch {
      setIsAiThinking(false);
    }
  }, [currentPhase, code, getTimeStr, voice, activeProblem]);

  // ── Start interview (triggered by user click to enable audio) ───────────────
  const startInterview = useCallback(async () => {
    // Unlock browser audio by speaking an empty utterance on user gesture
    if (typeof window !== "undefined") {
      const unlock = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(unlock);
    }

    setHasStarted(true);
    setIsTimerRunning(true);
    startTimeRef.current = Date.now();
    setIsAiThinking(true);

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "The interview is starting. Please introduce yourself and the problem.",
          conversationHistory: [],
          problem: activeProblem,
          currentPhase: "INTRO",
          currentCode: "",
          elapsedSeconds: 0,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.message) {
        const aiText = data.data.message;
        setChatMessages([{ role: "interviewer", content: aiText, time: "0:00" }]);
        conversationRef.current.push({ role: "interviewer", content: aiText });
        setIsAiThinking(false);
        voice.speakText(aiText);
      } else {
        setIsAiThinking(false);
      }
    } catch {
      setIsAiThinking(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Stop Alex from speaking if he's talking
      voice.stopSpeaking();
      voice.setTranscript("");
      voice.startListening();
      setIsMicEnabled(true);
    }
  }, [isMicEnabled, voice, sendToAI]);

  // Auto-send when speech recognition ends naturally (user stops talking)
  // This fires when continuous=false recognition auto-stops after silence
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
      setLanguage(newLang);
      // Preserve code if user has edited beyond the starter; otherwise swap template
      const currentStarter = activeProblem.starter_code[language] ?? STARTER_CODE[language];
      if (code === currentStarter) {
        setCode(activeProblem.starter_code[newLang] ?? STARTER_CODE[newLang]);
      }
    },
    [code, language, activeProblem]
  );

  const handleRunCode = useCallback(async () => {
    setIsRunningTests(true);
    setTestResults([]);

    try {
      const res = await fetch("/api/interview/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, interviewId, problemSlug: activeProblem.slug }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Code execution failed");
      setTestResults(json.data?.test_results ?? []);
    } catch {
      setTestResults([
        {
          id: "error",
          input: "",
          expected: "",
          actual: "Execution error — check your code and try again.",
          passed: false,
          isHidden: false,
        },
      ]);
    } finally {
      setIsRunningTests(false);
    }
  }, [language, code, interviewId, activeProblem.slug]);

  const handleEndInterview = useCallback(async () => {
    setIsScoring(true);

    // Stop voice
    voice.stopListening();
    voice.stopSpeaking();

    const transcript = conversationRef.current.map((msg, i) => ({
      role: msg.role as "interviewer" | "candidate" | "system",
      content: msg.content,
      timestamp_ms: i * 30000, // approximate
    }));

    const passed = testResults.filter((t) => t.passed).length;
    const total = testResults.length;

    // Call the complete API with full data for AI scoring
    let scoringData: {
      overall_score?: number;
      scores?: Record<string, { score: number; feedback: string }>;
      hire_recommendation?: string;
      summary?: string;
      key_strengths?: string[];
      areas_to_improve?: string[];
    } | null = null;

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
          problem: {
            title: activeProblem.title,
            description: activeProblem.description,
            difficulty: activeProblem.difficulty,
            category: activeProblem.category,
            optimal_complexity: activeProblem.optimal_complexity ?? { time: "Unknown", space: "Unknown" },
          },
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.scoring) {
        scoringData = json.data.scoring;
      }
    } catch {
      // Scoring failed — will navigate with null scores, results page uses mock fallback
    }

    // Map scoring data into the store shape
    const storeScores = scoringData?.scores
      ? {
          problem_solving: {
            score: (scoringData.scores.problem_solving as { score: number; feedback: string }).score,
            feedback: (scoringData.scores.problem_solving as { score: number; feedback: string }).feedback,
          },
          code_quality: {
            score: (scoringData.scores.code_quality as { score: number; feedback: string }).score,
            feedback: (scoringData.scores.code_quality as { score: number; feedback: string }).feedback,
          },
          communication: {
            score: (scoringData.scores.communication as { score: number; feedback: string }).score,
            feedback: (scoringData.scores.communication as { score: number; feedback: string }).feedback,
          },
          technical_knowledge: {
            score: (scoringData.scores.technical_knowledge as { score: number; feedback: string }).score,
            feedback: (scoringData.scores.technical_knowledge as { score: number; feedback: string }).feedback,
          },
          testing: {
            score: (scoringData.scores.testing as { score: number; feedback: string }).score,
            feedback: (scoringData.scores.testing as { score: number; feedback: string }).feedback,
          },
        }
      : null;

    completeInterviewStore({
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
      problemTitle: activeProblem.title,
      problemDifficulty: activeProblem.difficulty,
      problemCategory: activeProblem.category,
    });

    router.push(`/results/${interviewId}`);
  }, [interviewId, code, language, router, testResults, activeProblem, completeInterviewStore, voice]);

  // ── Timer countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted || !isTimerRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  // handleEndInterview is stable (useCallback with fixed deps); intentionally
  // omitted to avoid restarting the interval when other state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, isTimerRunning]);

  // ── Phase transitions based on elapsed time ──────────────────────────────────
  useEffect(() => {
    if (!hasStarted) return;

    const elapsed = maxDuration - timeLeft;
    const pct = elapsed / maxDuration;

    // Phase boundaries as fractions of total duration (calibrated for 45 min)
    // INTRO:               0%  – 2.2%   (0–60s of 2700)
    // PROBLEM_PRESENTED:   2.2% – 4.4%  (60–120s)
    // CLARIFICATION:       4.4% – 11.1% (120–300s)
    // APPROACH_DISCUSSION: 11.1% – 26.7%(300–720s)
    // CODING:              26.7% – 71.1%(720–1920s)
    // TESTING:             71.1% – 82.2%(1920–2220s)
    // COMPLEXITY_ANALYSIS: 82.2% – 88.9%(2220–2400s)
    // FOLLOW_UP:           88.9% – 95.6%(2400–2580s)
    // WRAP_UP:             95.6% – 100% (2580–2700s)

    let nextPhase: InterviewPhase;
    if (pct < 2.2 / 100) {
      nextPhase = "INTRO";
    } else if (pct < 4.4 / 100) {
      nextPhase = "PROBLEM_PRESENTED";
    } else if (pct < 11.1 / 100) {
      nextPhase = "CLARIFICATION";
    } else if (pct < 26.7 / 100) {
      nextPhase = "APPROACH_DISCUSSION";
    } else if (pct < 71.1 / 100) {
      nextPhase = "CODING";
    } else if (pct < 82.2 / 100) {
      nextPhase = "TESTING";
    } else if (pct < 88.9 / 100) {
      nextPhase = "COMPLEXITY_ANALYSIS";
    } else if (pct < 95.6 / 100) {
      nextPhase = "FOLLOW_UP";
    } else {
      nextPhase = "WRAP_UP";
    }

    setCurrentPhase((prev) => (prev !== nextPhase ? nextPhase : prev));
  }, [timeLeft, hasStarted, maxDuration]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  // Scoring overlay — shown while AI evaluates the interview
  if (isScoring) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-brand-deep overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-brand-cyan/5 blur-[100px] animate-pulse" />
        <style>{`
          @keyframes scoring-progress {
            0% { width: 0%; }
            20% { width: 30%; }
            50% { width: 55%; }
            80% { width: 80%; }
            95% { width: 92%; }
            100% { width: 95%; }
          }
          @keyframes scoring-fade-in {
            0% { opacity: 0; transform: translateY(12px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-md text-center px-6">
          {/* Siri orb — thinking state for scoring */}
          <VoiceVisualizer state="thinking" className="h-36 w-36" />

          <div style={{ animation: "scoring-fade-in 0.6s ease-out 0.2s both" }}>
            <h1 className="text-2xl font-bold text-brand-text">Alex is reviewing your performance</h1>
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
        <style>{`
          @keyframes start-fade-up {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes start-btn-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(34,211,238,0.15), 0 0 60px rgba(34,211,238,0.05); }
            50% { box-shadow: 0 0 30px rgba(34,211,238,0.3), 0 0 80px rgba(34,211,238,0.1); }
          }
        `}</style>
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-md text-center px-6">
          {/* Siri orb — idle state for start screen */}
          <div style={{ animation: "start-fade-up 0.8s ease-out both" }}>
            <VoiceVisualizer state="idle" className="h-40 w-40" />
          </div>

          <div style={{ animation: "start-fade-up 0.8s ease-out 0.15s both" }}>
            <h1 className="text-3xl font-bold text-brand-text tracking-tight">Ready to begin?</h1>
            <p className="text-brand-muted text-sm mt-3 leading-relaxed">
              Alex, your AI interviewer, will introduce the problem and guide you through a{" "}
              <span className="text-brand-text font-medium">{Math.round(maxDuration / 60)}-minute</span> mock interview.
            </p>
          </div>
          <div className="flex items-center justify-center gap-6 text-[11px] text-brand-muted" style={{ animation: "start-fade-up 0.8s ease-out 0.3s both" }}>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-cyan/60" />Voice conversation</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-green/60" />Live coding</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-amber/60" />AI scoring</span>
          </div>
          <button onClick={startInterview} className="flex items-center gap-2 rounded-xl bg-brand-cyan px-10 py-3.5 text-base font-semibold text-brand-deep transition-all hover:bg-brand-cyan/90 hover:scale-[1.03] active:scale-[0.98]" style={{ animation: "start-fade-up 0.8s ease-out 0.45s both, start-btn-glow 3s ease-in-out infinite" }}>
            Start Interview
          </button>
          <p className="text-xs text-brand-muted/60" style={{ animation: "start-fade-up 0.8s ease-out 0.6s both" }}>
            Make sure your speakers are on &middot; You can also type responses
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

function TranscriptPanel({ messages, isThinking }: { messages: { role: "interviewer" | "candidate"; content: string; time: string }[]; isThinking: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  if (messages.length === 0 && !isThinking) {
    return (
      <p className="text-center text-[10px] text-brand-muted pt-8">
        Alex will start the conversation shortly...
      </p>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {messages.map((msg, i) => (
        <div
          key={i}
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
