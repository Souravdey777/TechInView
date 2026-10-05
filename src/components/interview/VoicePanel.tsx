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
  /** Off when the transcript panel owns the composer (see TranscriptChat). */
  showTextFallback?: boolean;
  onToggleMic: () => void;
  onDeviceChange?: (deviceId: string) => void;
  onReconnect?: () => void;
  onSendText: (text: string) => boolean | Promise<boolean>;
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

// Matches the orb's colour per state, so the label and the orb agree.
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
  showTextFallback = true,
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
        <span className="rounded-full border border-white/[0.1] px-3 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-brand-text">
          {roundType === "coding"
            ? PHASE_LABELS[currentPhase]
            : getPhaseLabelForRound(roundType, currentPhase)}
        </span>
        <span className={cn("font-mono text-[10px] uppercase tracking-[0.1em]", isVoiceConnected ? STATE_COLORS[voiceState] : "text-brand-amber")}>
          {isReconnecting
            ? "Connecting"
            : !isVoiceConnected
              ? "Text mode"
              : getStateLabel(voiceState, interviewerName)}
        </span>
      </div>

      {errorMessage ? (
        <div className="rounded-[12px] border border-brand-rose/30 bg-brand-rose/[0.06] px-3 py-2 text-[11px] leading-relaxed text-brand-rose">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{errorMessage}</span>
            {onReconnect ? (
              <button
                type="button"
                onClick={onReconnect}
                disabled={isVoiceConnected || isReconnecting}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan",
                  isVoiceConnected || isReconnecting
                    ? "cursor-not-allowed border-white/[0.08] text-brand-subtle"
                    : "border-brand-rose/35 text-brand-rose hover:border-brand-rose/60 hover:text-brand-text",
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
                "tracking-[-0.01em] text-brand-text",
                isCenterStage ? "text-lg" : "text-base"
              )}
            >
              {interviewerName}
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle">AI Interviewer</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <MicVisualizer isActive={isMicEnabled} className="absolute inset-0" />
            <button
              onClick={onToggleMic}
              disabled={!micSupported || !isVoiceConnected}
              className={cn(
                "relative z-10 flex items-center justify-center rounded-full transition-colors duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
                isCenterStage ? "h-14 w-14" : "h-12 w-12",
                !micSupported || !isVoiceConnected
                  ? "cursor-not-allowed border border-white/[0.08] bg-brand-deep text-brand-subtle opacity-50"
                  : isMicEnabled
                    ? "border border-brand-cyan bg-brand-cyan/[0.12] text-brand-cyan"
                    : "border border-white/[0.18] bg-brand-deep text-brand-muted hover:border-white/[0.3] hover:text-brand-text"
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
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-subtle">
              Mic not supported. Use text input below.
            </span>
          ) : (
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-subtle">
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
            <label className="mt-2 flex flex-col gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-brand-subtle">
              <span>Microphone</span>
              <select
                value={selectedDeviceId}
                onChange={(event) => onDeviceChange(event.target.value)}
                className="max-w-52 rounded-full border border-white/[0.12] bg-brand-deep px-3 py-1.5 font-sans text-xs normal-case tracking-normal text-brand-text focus:border-brand-cyan focus:outline-none"
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

      {showTextFallback ? (
        <div className={cn("border-t border-white/[0.08]", isCenterStage ? "pt-4" : "mt-1 pt-2")}>
          <button
            onClick={() => {
              setTextOpen((current) => !current);
              if (!textOpen) {
                setTimeout(() => textareaRef.current?.focus(), 50);
              }
            }}
            className="flex w-full items-center justify-between rounded-sm px-1 font-mono text-[11px] uppercase tracking-[0.1em] text-brand-subtle transition-colors hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
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
                className="w-full resize-none rounded-[16px] border border-white/[0.12] bg-transparent px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-subtle focus:border-brand-cyan focus:outline-none"
              />
              <button
                onClick={() => void handleSend()}
                disabled={!draft.trim() || isSendingText}
                className={cn(
                  "flex items-center justify-center gap-2 self-end rounded-full px-4 py-2 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
                  draft.trim() && !isSendingText
                    ? "bg-brand-cyan text-brand-deep hover:bg-brand-text"
                    : "cursor-not-allowed bg-white/[0.04] text-brand-subtle"
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
      ) : null}
    </div>
  );
}
