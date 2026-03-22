import { create } from "zustand";
import type { Interview, Problem, Message, TestResult } from "@/types";
import type { InterviewPhase } from "@/lib/constants";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

type InterviewStore = {
  // State
  interview: Interview | null;
  problem: Problem | null;
  messages: Message[];
  currentPhase: InterviewPhase;
  currentCode: string;
  testResults: TestResult[];
  voiceState: VoiceState;
  isInterviewActive: boolean;
  textInputMode: boolean;

  // Actions
  setInterview: (interview: Interview) => void;
  setProblem: (problem: Problem) => void;
  setCode: (code: string) => void;
  addMessage: (message: Message) => void;
  setPhase: (phase: InterviewPhase) => void;
  setVoiceState: (state: VoiceState) => void;
  setTestResults: (results: TestResult[]) => void;
  endInterview: () => void;
  toggleTextInput: () => void;
};

export const useInterviewStore = create<InterviewStore>((set) => ({
  // Initial state
  interview: null,
  problem: null,
  messages: [],
  currentPhase: "intro",
  currentCode: "",
  testResults: [],
  voiceState: "idle",
  isInterviewActive: false,
  textInputMode: false,

  // Actions
  setInterview: (interview) =>
    set({ interview, isInterviewActive: interview.status === "in_progress" }),

  setProblem: (problem) => set({ problem }),

  setCode: (code) => set({ currentCode: code }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setPhase: (phase) => set({ currentPhase: phase }),

  setVoiceState: (voiceState) => set({ voiceState }),

  setTestResults: (testResults) => set({ testResults }),

  endInterview: () =>
    set((state) => ({
      isInterviewActive: false,
      currentPhase: "completed",
      interview: state.interview
        ? { ...state.interview, status: "completed" }
        : null,
    })),

  toggleTextInput: () =>
    set((state) => ({ textInputMode: !state.textInputMode })),
}));
