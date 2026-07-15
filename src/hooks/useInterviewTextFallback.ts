"use client";

import { useCallback, useRef, useState } from "react";
import {
  sendInterviewChatTurn,
  type InterviewChatTurnInput,
} from "@/lib/interview-chat-client";
import type { InterviewPhase } from "@/lib/interview-phases";

type TextFallbackContext = Omit<InterviewChatTurnInput, "message" | "conversationHistory"> & {
  conversationHistory: { role: string; content: string }[];
};

type UseInterviewTextFallbackOptions = {
  getContext: () => TextFallbackContext;
  appendTurn: (role: "candidate" | "interviewer", content: string) => void;
  applyPhase: (phase: InterviewPhase) => void;
  isVoiceConnected: () => boolean;
  injectVoiceMessage: (message: string) => void;
};

export function useInterviewTextFallback(options: UseInterviewTextFallbackOptions) {
  const [isSendingText, setIsSendingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const isSendingRef = useRef(false);
  const pendingRef = useRef<{
    text: string;
    conversationHistory: { role: string; content: string }[];
  } | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const sendText = useCallback(
    async (text: string, sendOptions?: { suppressCandidateTranscript?: boolean }) => {
      const message = text.trim();
      if (!message || isSendingRef.current) return false;

      isSendingRef.current = true;
      setIsSendingText(true);
      setTextError(null);
      const current = optionsRef.current;
      const pending = pendingRef.current?.text === message ? pendingRef.current : null;
      const currentContext = current.getContext();
      const context = pending
        ? { ...currentContext, conversationHistory: pending.conversationHistory }
        : currentContext;

      if (!sendOptions?.suppressCandidateTranscript && !pending) {
        current.appendTurn("candidate", message);
      }

      if (current.isVoiceConnected() && !sendOptions?.suppressCandidateTranscript) {
        current.injectVoiceMessage(message);
        pendingRef.current = null;
        isSendingRef.current = false;
        setIsSendingText(false);
        return true;
      }

      try {
        const result = await sendInterviewChatTurn({ ...context, message });
        current.appendTurn("interviewer", result.message);
        if (result.phase) current.applyPhase(result.phase);
        pendingRef.current = null;
        return true;
      } catch (error) {
        if (!sendOptions?.suppressCandidateTranscript) {
          pendingRef.current = { text: message, conversationHistory: context.conversationHistory };
        }
        setTextError(
          error instanceof Error ? error.message : "The interviewer could not respond. Please try again.",
        );
        return false;
      } finally {
        isSendingRef.current = false;
        setIsSendingText(false);
      }
    },
    [],
  );

  return { sendText, isSendingText, textError };
}
