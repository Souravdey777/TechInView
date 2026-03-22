"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

declare global {
  interface Window {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  }
}
import { Mic, MicOff, Send, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceVisualizer, type VoiceState } from "./VoiceVisualizer";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type VoicePanelProps = {
  voiceState: VoiceState;
  currentPhase: InterviewPhase;
  isMicEnabled: boolean;
  onToggleMic: () => void;
  onSendText: (text: string) => void;
};

// ─── Phase label map ──────────────────────────────────────────────────────────

const PHASE_LABELS: Record<InterviewPhase, string> = {
  INTRO: "Introduction",
  PROBLEM_PRESENTED: "Problem",
  CLARIFICATION: "Clarification",
  APPROACH_DISCUSSION: "Approach",
  CODING: "Coding",
  TESTING: "Testing",
  COMPLEXITY_ANALYSIS: "Complexity",
  FOLLOW_UP: "Follow-up",
  WRAP_UP: "Wrap-up",
};

const PHASE_COLORS: Record<InterviewPhase, string> = {
  INTRO: "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30",
  PROBLEM_PRESENTED: "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30",
  CLARIFICATION: "bg-brand-amber/10 text-brand-amber border-brand-amber/30",
  APPROACH_DISCUSSION:
    "bg-brand-amber/10 text-brand-amber border-brand-amber/30",
  CODING: "bg-brand-green/10 text-brand-green border-brand-green/30",
  TESTING: "bg-brand-green/10 text-brand-green border-brand-green/30",
  COMPLEXITY_ANALYSIS:
    "bg-brand-rose/10 text-brand-rose border-brand-rose/30",
  FOLLOW_UP: "bg-brand-rose/10 text-brand-rose border-brand-rose/30",
  WRAP_UP: "bg-brand-muted/10 text-brand-muted border-brand-border",
};

// ─── Voice state label ────────────────────────────────────────────────────────

const STATE_LABELS: Record<VoiceState, string> = {
  idle: "Ready",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Alex is speaking",
};

const STATE_COLORS: Record<VoiceState, string> = {
  idle: "text-brand-muted",
  listening: "text-brand-cyan",
  thinking: "text-brand-amber",
  speaking: "text-brand-green",
};

// ─── Avatar ring colors ───────────────────────────────────────────────────────

const RING_COLORS: Record<VoiceState, string> = {
  idle: "border-brand-border",
  listening: "border-brand-cyan shadow-[0_0_24px_rgba(34,211,238,0.25)]",
  thinking: "border-brand-amber shadow-[0_0_24px_rgba(251,191,36,0.2)]",
  speaking: "border-brand-green shadow-[0_0_24px_rgba(52,211,153,0.25)]",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function VoicePanel({
  voiceState,
  currentPhase,
  isMicEnabled,
  onToggleMic,
  onSendText,
}: VoicePanelProps) {
  const [textOpen, setTextOpen] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    setSpeechSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Phase badge */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "rounded-full border px-3 py-0.5 text-xs font-medium",
            PHASE_COLORS[currentPhase]
          )}
        >
          {PHASE_LABELS[currentPhase]}
        </span>
        <span className={cn("text-xs font-medium", STATE_COLORS[voiceState])}>
          {STATE_LABELS[voiceState]}
        </span>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-4 py-4">
        {/* Animated rings behind avatar */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulse ring — only visible when active */}
          {(voiceState === "listening" || voiceState === "speaking") && (
            <>
              <div
                className={cn(
                  "absolute h-28 w-28 rounded-full border-2 opacity-0",
                  voiceState === "listening"
                    ? "border-brand-cyan animate-[pulse-ring_1.6s_ease-out_infinite]"
                    : "border-brand-green animate-[pulse-ring_1.2s_ease-out_infinite]"
                )}
              />
              <div
                className={cn(
                  "absolute h-24 w-24 rounded-full border opacity-0",
                  voiceState === "listening"
                    ? "border-brand-cyan/60 animate-[pulse-ring_1.6s_ease-out_0.4s_infinite]"
                    : "border-brand-green/60 animate-[pulse-ring_1.2s_ease-out_0.3s_infinite]"
                )}
              />
            </>
          )}

          {/* Avatar circle */}
          <div
            className={cn(
              "relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 bg-brand-card transition-all duration-300",
              RING_COLORS[voiceState]
            )}
          >
            <span className="text-3xl font-bold text-brand-cyan">A</span>
          </div>
        </div>

        {/* Name + title */}
        <div className="text-center">
          <p className="text-sm font-semibold text-brand-text">Alex</p>
          <p className="text-xs text-brand-muted">AI Interviewer</p>
        </div>

        {/* Visualizer */}
        <VoiceVisualizer state={voiceState} className="h-10 w-48" />
      </div>

      {/* Mic toggle */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onToggleMic}
          disabled={!speechSupported}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-200",
            !speechSupported
              ? "border-brand-border bg-brand-card text-brand-muted cursor-not-allowed opacity-50"
              : isMicEnabled
              ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20"
              : "border-brand-border bg-brand-card text-brand-muted hover:border-brand-subtle hover:text-brand-text"
          )}
          aria-label={isMicEnabled ? "Mute microphone" : "Enable microphone"}
        >
          {isMicEnabled ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </button>
        {!speechSupported && (
          <span className="text-[10px] text-brand-muted">Mic not supported — use text input below</span>
        )}
      </div>

      {/* Text fallback toggle */}
      <div className="border-t border-brand-border pt-3">
        <button
          onClick={() => {
            setTextOpen((v) => !v);
            if (!textOpen) {
              setTimeout(() => textareaRef.current?.focus(), 50);
            }
          }}
          className="flex w-full items-center justify-between px-1 text-xs text-brand-muted hover:text-brand-text transition-colors"
        >
          <span>Type instead of speaking</span>
          {textOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {textOpen && (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response… (Enter to send)"
              rows={3}
              className="w-full resize-none rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/60 focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className={cn(
                "flex items-center justify-center gap-2 self-end rounded-lg px-4 py-2 text-xs font-medium transition-colors",
                draft.trim()
                  ? "bg-brand-cyan text-brand-deep hover:bg-brand-cyan/90"
                  : "cursor-not-allowed bg-brand-border/30 text-brand-muted"
              )}
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
