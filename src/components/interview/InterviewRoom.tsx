"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { VoicePanel } from "./VoicePanel";
import { CodeEditor } from "./CodeEditor";
import { ProblemPanel } from "./ProblemPanel";
import { TestRunner, type TestResult } from "./TestRunner";
import { Timer } from "./Timer";
import { InterviewControls } from "./InterviewControls";
import type { VoiceState } from "./VoiceVisualizer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useVoiceInterview } from "@/hooks/useVoiceInterview";

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

const MOCK_PROBLEM = {
  title: "Two Sum",
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
  hints: [
    "A brute force O(n²) solution works, but can you do better?",
    "Think about what complement you need for each number. How could you store what you have seen so far?",
    "A hash map lets you look up complements in O(1) time.",
  ],
};

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

// ─── Component ────────────────────────────────────────────────────────────────

export function InterviewRoom({ interviewId }: InterviewRoomProps) {
  const router = useRouter();
  const voice = useVoiceInterview();

  // ── Conversation state ──────────────────────────────────────────────────────
  type ChatMessage = { role: "interviewer" | "candidate"; content: string; time: string };
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const conversationRef = useRef<{ role: string; content: string }[]>([]);
  const startTimeRef = useRef(Date.now());

  // ── Interview state ──────────────────────────────────────────────────────────
  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>("INTRO");
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [isTimerRunning] = useState(true);

  // ── Code state ───────────────────────────────────────────────────────────────
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [code, setCode] = useState(STARTER_CODE.python);

  // ── Test state ───────────────────────────────────────────────────────────────
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // ── Derived voice state for UI ──────────────────────────────────────────────
  const voiceState: VoiceState = isAiThinking ? "thinking" : voice.voiceState as VoiceState;
  const [isMicEnabled, setIsMicEnabled] = useState(false);

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
          problem: MOCK_PROBLEM,
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
  }, [currentPhase, code, getTimeStr, voice]);

  // ── Start interview (triggered by user click to enable audio) ───────────────
  const startInterview = useCallback(async () => {
    // Unlock browser audio by speaking an empty utterance on user gesture
    if (typeof window !== "undefined") {
      const unlock = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(unlock);
    }

    setHasStarted(true);
    startTimeRef.current = Date.now();
    setIsAiThinking(true);

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "The interview is starting. Please introduce yourself and the problem.",
          conversationHistory: [],
          problem: MOCK_PROBLEM,
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
      if (code === STARTER_CODE[language]) {
        setCode(STARTER_CODE[newLang]);
      }
    },
    [code, language]
  );

  const handleRunCode = useCallback(async () => {
    setIsRunningTests(true);
    setTestResults([]);

    try {
      const res = await fetch("/api/interview/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, interviewId }),
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
  }, [language, code, interviewId]);

  const handleEndInterview = useCallback(async () => {
    try {
      await fetch("/api/interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, finalCode: code }),
      });
    } catch {
      // Navigate regardless — results page will handle missing data
    }
    router.push(`/results/${interviewId}`);
  }, [interviewId, code, router]);

  void setCurrentPhase;
  void setTimeLeft;

  // ─── Render ──────────────────────────────────────────────────────────────────

  // Start overlay — requires user click to unlock browser audio
  if (!hasStarted) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-brand-deep">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-cyan bg-brand-card">
            <span className="text-3xl font-bold text-brand-cyan">A</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-text">Ready to begin?</h1>
          <p className="text-brand-muted text-sm">
            Alex, your AI interviewer, will introduce the problem and guide you through a 45-minute mock interview. Make sure your speakers are on.
          </p>
          <button
            onClick={startInterview}
            className="flex items-center gap-2 rounded-xl bg-brand-cyan px-8 py-3 text-base font-semibold text-brand-deep transition-all hover:bg-brand-cyan/90 hover:scale-105"
          >
            Start Interview
          </button>
          <p className="text-xs text-brand-muted">
            You can use the mic or type your responses
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
        {/* ── Left panel ── */}
        <aside className="flex w-[360px] shrink-0 flex-col border-r border-brand-border bg-brand-surface overflow-hidden">
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
                <ProblemPanel problem={MOCK_PROBLEM} />
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
