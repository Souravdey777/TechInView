import type { InterviewPhase } from "@/lib/interview-phases";
import type { RoundType } from "@/lib/constants";
import type { RoundContextSnapshot } from "@/lib/loops/types";
import type { ProblemPayload } from "@/lib/ai/interviewer-system-prompt";

export type InterviewChatTurnInput = {
  message: string;
  conversationHistory: { role: string; content: string }[];
  problem: ProblemPayload;
  currentPhase: InterviewPhase;
  currentCode: string;
  elapsedSeconds: number;
  maxDurationSeconds: number;
  interviewerPersona: string;
  roundType: RoundType;
  roundContext: RoundContextSnapshot | null;
};

export type InterviewChatTurnResult = {
  message: string;
  phase?: InterviewPhase;
};

export async function sendInterviewChatTurn(
  input: InterviewChatTurnInput,
): Promise<InterviewChatTurnResult> {
  const response = await fetch("/api/interview/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await response.json()) as {
    success?: boolean;
    data?: InterviewChatTurnResult;
    error?: string;
  };

  if (!response.ok || !body.success || !body.data?.message) {
    throw new Error(body.error ?? "Tia could not respond. Please try again.");
  }

  return body.data;
}
