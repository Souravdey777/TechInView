"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp, Mic, MicOff, RefreshCw, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { type InterviewPhase, PHASE_LABELS } from "@/lib/interview-phases";
import type { RoundType } from "@/lib/constants";
import { getPhaseLabelForRound } from "@/lib/loops/round-config";
import { MicVisualizer, VoiceVisualizer, type VoiceState } from "./VoiceVisualizer";
import type { MicrophoneDevice } from "@/hooks/useMicrophoneDevices";

type VoicePanelProps = {
  voiceState: VoiceState;
  currentPhase: InterviewPhase;
  roundType: RoundType;
  interviewerName: string;
  layout?: "default" | "center-stage";
  isMicEnabled: boolean;
  isVoiceConnected?: boolean;
  isReconnecting?: boolean;
  errorMessage?: string | null;
  microphoneDevices?: MicrophoneDevice[];
  selectedDeviceId?: string;
  deviceWarning?: string | null;
  isSendingText?: boolean;
  textError?: string | null;
  onToggleMic: () => void;
  onDeviceChange?: (deviceId: string) => void;
  onReconnect?: () => void;
  onSendText: (text: string) => boolean | Promise<boolean>;
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

function getStateLabel(voiceState: VoiceState, interviewerName: string): string {
  const labels: Record<VoiceState, string> = {
    idle: "Ready",
    listening: "Listening...",
    thinking: "Thinking...",
    speaking: `${interviewerName} is speaking`,
  };

  return labels[voiceState];
}

const STATE_COLORS: Record<VoiceState, string> = {
  idle: "text-brand-muted",
  listening: "text-brand-cyan",
  thinking: "text-brand-amber",
  speaking: "text-brand-green",
};

export function VoicePanel({
  voiceState,
  currentPhase,
  roundType,
  interviewerName,
  layout = "default",
  isMicEnabled,
  isVoiceConnected = true,
  isReconnecting = false,
  errorMessage,
  microphoneDevices = [],
  selectedDeviceId = "",
  deviceWarning,
  isSendingText = false,
  textError,
  onToggleMic,
  onDeviceChange,
  onReconnect,
  onSendText,
}: VoicePanelProps) {
  const [textOpen, setTextOpen] = useState(true);
  const [micSupported, setMicSupported] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCenterStage = layout === "center-stage";

  useEffect(() => {
    const hasGetUserMedia =
      typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    setMicSupported(hasGetUserMedia);
  }, []);

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || isSendingText) return;

    const sent = await onSendText(trimmed);
    if (sent) setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        isCenterStage ? "h-full justify-between gap-4 p-5" : "gap-2 p-4"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "rounded-full border px-3 py-0.5 text-xs font-medium",
            PHASE_COLORS[currentPhase]
          )}
        >
          {roundType === "coding"
            ? PHASE_LABELS[currentPhase]
            : getPhaseLabelForRound(roundType, currentPhase)}
        </span>
        <span className={cn("text-xs font-medium", isVoiceConnected ? STATE_COLORS[voiceState] : "text-brand-amber")}>
          {isReconnecting
            ? "Connecting"
            : !isVoiceConnected
              ? "Text mode"
              : getStateLabel(voiceState, interviewerName)}
        </span>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-brand-rose/30 bg-brand-rose/10 px-3 py-2 text-[11px] leading-relaxed text-brand-rose">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{errorMessage}</span>
            {onReconnect ? (
              <button
                type="button"
                onClick={onReconnect}
                disabled={isVoiceConnected || isReconnecting}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  isVoiceConnected || isReconnecting
                    ? "cursor-not-allowed border-brand-border bg-brand-surface text-brand-muted"
                    : "border-brand-rose/35 bg-brand-deep text-brand-rose hover:border-brand-rose/60 hover:text-brand-text",
                )}
              >
                <RefreshCw className={cn("h-3 w-3", isReconnecting && "animate-spin")} />
                {isReconnecting ? "Reconnecting" : "Reconnect voice"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-col items-center",
          isCenterStage ? "flex-1 justify-center gap-6 py-8" : "gap-1 py-3"
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <VoiceVisualizer
            state={voiceState}
            className={isCenterStage ? "h-40 w-40" : "h-32 w-32"}
          />
          <div className="mt-1 text-center">
            <p
              className={cn(
                "font-semibold text-brand-text",
                isCenterStage ? "text-base" : "text-sm"
              )}
            >
              {interviewerName}
            </p>
            <p className="text-[11px] text-brand-muted">AI Interviewer</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <MicVisualizer isActive={isMicEnabled} className="absolute inset-0" />
            <button
              onClick={onToggleMic}
              disabled={!micSupported || !isVoiceConnected}
              className={cn(
                "relative z-10 flex items-center justify-center rounded-full transition-all duration-300",
                isCenterStage ? "h-14 w-14" : "h-12 w-12",
                !micSupported || !isVoiceConnected
                  ? "cursor-not-allowed border border-brand-border bg-brand-card text-brand-muted opacity-50"
                  : isMicEnabled
                    ? "border-2 border-brand-cyan bg-brand-cyan/20 text-brand-cyan shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                    : "border border-brand-border bg-brand-card text-brand-muted hover:border-brand-subtle hover:text-brand-text"
              )}
              aria-label={!isVoiceConnected ? "Voice disconnected" : isMicEnabled ? "Mute microphone" : "Enable microphone"}
            >
              {isMicEnabled ? (
                <Mic className={cn(isCenterStage ? "h-6 w-6" : "h-5 w-5")} />
              ) : (
                <MicOff className={cn(isCenterStage ? "h-6 w-6" : "h-5 w-5")} />
              )}
            </button>
          </div>
          {!micSupported ? (
            <span className="text-[10px] text-brand-muted">
              Mic not supported — use text input below
            </span>
          ) : (
            <span className="mt-0.5 text-[10px] text-brand-muted">
              {!isVoiceConnected
                ? "Voice disconnected"
                : isMicEnabled
                  ? voiceState === "listening"
                    ? "Listening · tap to mute"
                    : "Mic active · tap to mute"
                  : "Muted · tap to unmute"}
            </span>
          )}
          {onDeviceChange && microphoneDevices.length > 0 ? (
            <label className="mt-2 flex flex-col gap-1 text-[10px] text-brand-muted">
              <span>Microphone</span>
              <select
                value={selectedDeviceId}
                onChange={(event) => onDeviceChange(event.target.value)}
                className="max-w-52 rounded-md border border-brand-border bg-brand-surface px-2 py-1.5 text-xs text-brand-text focus:border-brand-cyan/60 focus:outline-none"
                aria-label="Select microphone"
              >
                <option value="">System default</option>
                {microphoneDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {deviceWarning ? (
            <span className="mt-1 max-w-56 text-center text-[10px] text-brand-amber">
              {deviceWarning}
            </span>
          ) : null}
        </div>
      </div>

      <div className={cn("border-t border-brand-border", isCenterStage ? "pt-4" : "mt-1 pt-2")}>
        <button
          onClick={() => {
            setTextOpen((current) => !current);
            if (!textOpen) {
              setTimeout(() => textareaRef.current?.focus(), 50);
            }
          }}
          className="flex w-full items-center justify-between px-1 text-xs text-brand-muted transition-colors hover:text-brand-text"
        >
          <span>Type instead of speaking</span>
          {textOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {textOpen ? (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response... (Enter to send)"
              rows={isCenterStage ? 4 : 3}
              className="w-full resize-none rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/60 focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!draft.trim() || isSendingText}
              className={cn(
                "flex items-center justify-center gap-2 self-end rounded-lg px-4 py-2 text-xs font-medium transition-colors",
                draft.trim() && !isSendingText
                  ? "bg-brand-cyan text-brand-deep hover:bg-brand-cyan/90"
                  : "cursor-not-allowed bg-brand-border/30 text-brand-muted"
              )}
            >
              <Send className="h-3.5 w-3.5" />
              {isSendingText ? "Sending..." : "Send"}
            </button>
            {textError ? (
              <p className="text-[11px] leading-relaxed text-brand-rose">{textError}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
