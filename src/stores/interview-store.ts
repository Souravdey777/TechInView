import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { InterviewMode, RoundType } from "@/lib/constants";
import type { InterviewerPersonaId } from "@/lib/interviewer-personas";
import type { LoopSummarySnapshot, RoundContextSnapshot } from "@/lib/loops/types";

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

type StoreScores = Record<string, ScoreDimension>;

// ─── Setup config (from the setup page) ──────────────────────────────────────

type SetupConfig = {
  mode: InterviewMode;
  roundType: RoundType;
  difficulty: string;
  category: string | null;
  language: string;
  maxDurationSeconds: number;
  interviewerPersona: InterviewerPersonaId;
  generatedLoopId: string | null;
  generatedLoopRoundId: string | null;
  company: string | null;
  roleTitle: string | null;
  experienceLevel: string | null;
  loopName: string | null;
  loopSummary: LoopSummarySnapshot | null;
};

// ─── Interview result (populated when interview ends) ────────────────────────

type InterviewResult = {
  mode: InterviewMode;
  roundType: RoundType;
  roundTitle: string;
  interviewId: string;
  interviewerPersona: InterviewerPersonaId;
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
  company: string | null;
  roleTitle: string | null;
  loopName: string | null;
  loopSummary: LoopSummarySnapshot | null;
  roundContext: RoundContextSnapshot | null;
};

// ─── Store ───────────────────────────────────────────────────────────────────

type InterviewStore = {
  // Setup config
  setupConfig: SetupConfig | null;
  interviewId: string | null;

  // Active interview state
  problem: StoreProblem | null;
  roundContext: RoundContextSnapshot | null;
  messages: StoreMessage[];
  currentPhase: string;
  currentCode: string;
  testResults: StoreTestResult[];
  voiceState: VoiceState;
  isInterviewActive: boolean;
  textInputMode: boolean;
  startedAt: string | null;

  // Room snapshot (persisted for reload resilience)
  roomStartedAtMs: number | null;
  roomPhase: string | null;
  roomLanguage: string | null;
  codePerLanguage: Record<string, string>;

  // Results (populated after interview ends)
  interviewResult: InterviewResult | null;

  // Actions — setup
  initFromSetup: (config: {
    interviewId: string;
    mode: InterviewMode;
    roundType: RoundType;
    problem: StoreProblem | null;
    roundContext: RoundContextSnapshot | null;
    language: string;
    maxDurationSeconds: number;
    difficulty: string;
    category: string | null;
    interviewerPersona: InterviewerPersonaId;
    generatedLoopId?: string | null;
    generatedLoopRoundId?: string | null;
    company?: string | null;
    roleTitle?: string | null;
    experienceLevel?: string | null;
    loopName?: string | null;
    loopSummary?: LoopSummarySnapshot | null;
    startedAt: string;
  }) => void;

  // Actions — interview
  setProblem: (problem: StoreProblem) => void;
  setRoundContext: (roundContext: RoundContextSnapshot | null) => void;
  setCode: (code: string) => void;
  addMessage: (message: StoreMessage) => void;
  setPhase: (phase: string) => void;
  setVoiceState: (state: VoiceState) => void;
  setTestResults: (results: StoreTestResult[]) => void;
  toggleTextInput: () => void;

  // Actions — room snapshot (reload resilience)
  setRoomStartedAtMs: (ms: number) => void;
  setRoomPhase: (phase: string) => void;
  setRoomLanguage: (lang: string) => void;
  setCodeForLanguage: (lang: string, code: string) => void;

  // Actions — end interview & store results
  completeInterview: (result: InterviewResult) => void;

  // Actions — reset
  reset: () => void;
};

const INITIAL_STATE = {
  setupConfig: null,
  interviewId: null,
  problem: null,
  roundContext: null,
  messages: [],
  currentPhase: "intro",
  currentCode: "",
  testResults: [],
  voiceState: "idle" as VoiceState,
  isInterviewActive: false,
  textInputMode: false,
  startedAt: null,
  roomStartedAtMs: null,
  roomPhase: null,
  roomLanguage: null,
  codePerLanguage: {},
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
          roundContext: config.roundContext,
          currentCode: config.problem?.starter_code?.[config.language] ?? "",
          setupConfig: {
            mode: config.mode,
            roundType: config.roundType,
            difficulty: config.difficulty,
            category: config.category,
            language: config.language,
            maxDurationSeconds: config.maxDurationSeconds,
            interviewerPersona: config.interviewerPersona,
            generatedLoopId: config.generatedLoopId ?? null,
            generatedLoopRoundId: config.generatedLoopRoundId ?? null,
            company: config.company ?? null,
            roleTitle: config.roleTitle ?? null,
            experienceLevel: config.experienceLevel ?? null,
            loopName: config.loopName ?? null,
            loopSummary: config.loopSummary ?? null,
          },
          isInterviewActive: true,
          startedAt: config.startedAt,
          currentPhase: "intro",
          messages: [],
          testResults: [],
          interviewResult: null,
          roomStartedAtMs: null,
          roomPhase: null,
          roomLanguage: null,
          codePerLanguage: {},
        }),

      // ── Interview ──────────────────────────────────────────────────────────
      setProblem: (problem) => set({ problem }),

      setRoundContext: (roundContext) => set({ roundContext }),

      setCode: (code) => set({ currentCode: code }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      setPhase: (phase) => set({ currentPhase: phase }),

      setVoiceState: (voiceState) => set({ voiceState }),

      setTestResults: (testResults) => set({ testResults }),

      toggleTextInput: () =>
        set((state) => ({ textInputMode: !state.textInputMode })),

      // ── Room snapshot (reload resilience) ──────────────────────────────────
      setRoomStartedAtMs: (ms) => set({ roomStartedAtMs: ms }),
      setRoomPhase: (phase) => set({ roomPhase: phase }),
      setRoomLanguage: (lang) => set({ roomLanguage: lang }),
      setCodeForLanguage: (lang, code) =>
        set((state) => ({
          codePerLanguage: { ...state.codePerLanguage, [lang]: code },
        })),

      // ── Complete ───────────────────────────────────────────────────────────
      completeInterview: (result) =>
        set({
          isInterviewActive: false,
          currentPhase: "completed",
          interviewResult: result,
          roomStartedAtMs: null,
          roomPhase: null,
          roomLanguage: null,
          codePerLanguage: {},
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
        roundContext: state.roundContext,
        currentCode: state.currentCode,
        startedAt: state.startedAt,
        isInterviewActive: state.isInterviewActive,
        messages: state.messages,
        interviewResult: state.interviewResult,
        roomStartedAtMs: state.roomStartedAtMs,
        roomPhase: state.roomPhase,
        roomLanguage: state.roomLanguage,
        codePerLanguage: state.codePerLanguage,
        testResults: state.testResults,
      }),
    }
  )
);
