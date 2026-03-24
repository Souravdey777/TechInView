import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { InterviewPhase } from "@/lib/constants";

// ─── Lightweight types for the store (no heavy imports from @/types) ─────────

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

type StoreProblem = {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starter_code: Record<string, string>;
  hints: string[];
  optimal_complexity?: { time: string; space: string };
  solution_approach?: string;
  follow_up_questions?: string[];
};

type StoreMessage = {
  role: "interviewer" | "candidate" | "system";
  content: string;
  timestamp_ms: number;
};

type StoreTestResult = {
  id: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  isHidden: boolean;
};

type ScoreDimension = {
  score: number;
  feedback: string;
};

type StoreScores = {
  problem_solving: ScoreDimension;
  code_quality: ScoreDimension;
  communication: ScoreDimension;
  technical_knowledge: ScoreDimension;
  testing: ScoreDimension;
};

// ─── Setup config (from the setup page) ──────────────────────────────────────

type SetupConfig = {
  difficulty: string;
  category: string | null;
  language: string;
  maxDurationSeconds: number;
};

// ─── Interview result (populated when interview ends) ────────────────────────

type InterviewResult = {
  interviewId: string;
  finalCode: string;
  language: string;
  transcript: StoreMessage[];
  overallScore: number | null;
  scores: StoreScores | null;
  hireRecommendation: string | null;
  summary: string | null;
  keyStrengths: string[] | null;
  areasToImprove: string[] | null;
  testsPassed: number;
  testsTotal: number;
  problemTitle: string;
  problemDifficulty: string;
  problemCategory: string;
};

// ─── Store ───────────────────────────────────────────────────────────────────

type InterviewStore = {
  // Setup config
  setupConfig: SetupConfig | null;
  interviewId: string | null;

  // Active interview state
  problem: StoreProblem | null;
  messages: StoreMessage[];
  currentPhase: InterviewPhase;
  currentCode: string;
  testResults: StoreTestResult[];
  voiceState: VoiceState;
  isInterviewActive: boolean;
  textInputMode: boolean;
  startedAt: string | null;

  // Results (populated after interview ends)
  interviewResult: InterviewResult | null;

  // Actions — setup
  initFromSetup: (config: {
    interviewId: string;
    problem: StoreProblem;
    language: string;
    maxDurationSeconds: number;
    difficulty: string;
    category: string | null;
    startedAt: string;
  }) => void;

  // Actions — interview
  setProblem: (problem: StoreProblem) => void;
  setCode: (code: string) => void;
  addMessage: (message: StoreMessage) => void;
  setPhase: (phase: InterviewPhase) => void;
  setVoiceState: (state: VoiceState) => void;
  setTestResults: (results: StoreTestResult[]) => void;
  toggleTextInput: () => void;

  // Actions — end interview & store results
  completeInterview: (result: InterviewResult) => void;

  // Actions — reset
  reset: () => void;
};

const INITIAL_STATE = {
  setupConfig: null,
  interviewId: null,
  problem: null,
  messages: [],
  currentPhase: "intro" as InterviewPhase,
  currentCode: "",
  testResults: [],
  voiceState: "idle" as VoiceState,
  isInterviewActive: false,
  textInputMode: false,
  startedAt: null,
  interviewResult: null,
};

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      // ── Setup ──────────────────────────────────────────────────────────────
      initFromSetup: (config) =>
        set({
          interviewId: config.interviewId,
          problem: config.problem,
          currentCode: config.problem.starter_code[config.language] ?? "",
          setupConfig: {
            difficulty: config.difficulty,
            category: config.category,
            language: config.language,
            maxDurationSeconds: config.maxDurationSeconds,
          },
          isInterviewActive: true,
          startedAt: config.startedAt,
          currentPhase: "intro",
          messages: [],
          testResults: [],
          interviewResult: null,
        }),

      // ── Interview ──────────────────────────────────────────────────────────
      setProblem: (problem) => set({ problem }),

      setCode: (code) => set({ currentCode: code }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      setPhase: (phase) => set({ currentPhase: phase }),

      setVoiceState: (voiceState) => set({ voiceState }),

      setTestResults: (testResults) => set({ testResults }),

      toggleTextInput: () =>
        set((state) => ({ textInputMode: !state.textInputMode })),

      // ── Complete ───────────────────────────────────────────────────────────
      completeInterview: (result) =>
        set({
          isInterviewActive: false,
          currentPhase: "completed",
          interviewResult: result,
        }),

      // ── Reset ──────────────────────────────────────────────────────────────
      reset: () => set(INITIAL_STATE),
    }),
    {
      name: "techinview-interview",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      // Only persist fields needed across navigation, not transient UI state
      partialize: (state) => ({
        setupConfig: state.setupConfig,
        interviewId: state.interviewId,
        problem: state.problem,
        currentCode: state.currentCode,
        startedAt: state.startedAt,
        isInterviewActive: state.isInterviewActive,
        messages: state.messages,
        interviewResult: state.interviewResult,
      }),
    }
  )
);
