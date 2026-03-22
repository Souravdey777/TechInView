"use client";
import { useInterviewStore } from "@/stores/interview-store";
import { INTERVIEW_PHASES, PHASE_LABELS } from "@/lib/constants";
import type { InterviewPhase } from "@/lib/constants";

const PHASE_DESCRIPTIONS: Record<InterviewPhase, string> = {
  intro: "AI introduces itself and asks about your experience.",
  problem_presented: "AI presents the problem and reads it aloud.",
  clarification: "Ask clarifying questions about the problem.",
  approach: "Discuss your approach before coding.",
  coding: "Implement your solution.",
  testing: "Trace through examples and test edge cases.",
  complexity: "Analyze the time and space complexity of your solution.",
  wrapup: "AI summarizes the interview and wraps up.",
  completed: "Interview complete.",
};

export function useInterviewState() {
  const store = useInterviewStore();

  const advancePhase = () => {
    const currentIndex = INTERVIEW_PHASES.indexOf(store.currentPhase);
    const nextIndex = currentIndex + 1;
    if (nextIndex < INTERVIEW_PHASES.length) {
      store.setPhase(INTERVIEW_PHASES[nextIndex]);
    }
  };

  const getPhaseInfo = (): { label: string; description: string } => {
    return {
      label: PHASE_LABELS[store.currentPhase],
      description: PHASE_DESCRIPTIONS[store.currentPhase],
    };
  };

  return {
    // Store state
    interview: store.interview,
    problem: store.problem,
    messages: store.messages,
    currentPhase: store.currentPhase,
    currentCode: store.currentCode,
    testResults: store.testResults,
    voiceState: store.voiceState,
    isInterviewActive: store.isInterviewActive,
    textInputMode: store.textInputMode,

    // Store actions
    setInterview: store.setInterview,
    setProblem: store.setProblem,
    setCode: store.setCode,
    addMessage: store.addMessage,
    setPhase: store.setPhase,
    setVoiceState: store.setVoiceState,
    setTestResults: store.setTestResults,
    endInterview: store.endInterview,
    toggleTextInput: store.toggleTextInput,

    // Extended actions
    advancePhase,
    getPhaseInfo,
  };
}
