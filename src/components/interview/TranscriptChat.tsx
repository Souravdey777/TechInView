"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export type TranscriptMessage = {
  id: string;
  role: "interviewer" | "candidate";
  content: string;
  time: string;
};

type TranscriptChatProps = {
  messages: TranscriptMessage[];
  interviewerName: string;
  isThinking: boolean;
  isSendingText?: boolean;
  textError?: string | null;
  onSendText: (text: string) => boolean | Promise<boolean>;
};

/**
 * The running transcript with the text composer attached beneath it. Typing is
 * a fallback for a dead or denied microphone, so it belongs where the
 * conversation is rather than tucked inside the voice controls.
 */
export function TranscriptChat({
  messages,
  interviewerName,
  isThinking,
  isSendingText = false,
  textError,
  onSendText,
}: TranscriptChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isSendingText) return;
    const sent = await onSendText(trimmed);
    if (sent) setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const canSend = Boolean(draft.trim()) && !isSendingText;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between border-y border-white/[0.08] px-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">
          Transcript
        </span>
        {messages.length > 0 ? (
          <span className="font-mono text-[11px] tabular-nums text-brand-subtle">
            {messages.length} {messages.length === 1 ? "turn" : "turns"}
          </span>
        ) : null}
      </div>

      {/* Turns read like a transcript: hairline above each, mono speaker label,
          the candidate set off by a quiet left rule (same idiom as PrepGuruTurn). */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
        {messages.length === 0 && !isThinking ? (
          <p className="pt-6 text-center text-xs leading-relaxed text-brand-subtle">
            {interviewerName} will start the conversation shortly...
          </p>
        ) : null}

        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={cn("py-3", i > 0 && "border-t border-white/[0.08]")}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em]">
              <span className={msg.role === "interviewer" ? "text-brand-text" : "text-brand-subtle"}>
                {msg.role === "interviewer" ? interviewerName : "You"}
              </span>
              <span className="tabular-nums text-brand-subtle">{msg.time}</span>
            </div>
            <p
              className={cn(
                "text-[13px] leading-relaxed",
                msg.role === "interviewer"
                  ? "text-brand-text"
                  : "border-l border-white/[0.18] pl-3 text-brand-muted"
              )}
            >
              {msg.content}
            </p>
          </div>
        ))}

        {isThinking ? (
          <div className={cn("py-3", messages.length > 0 && "border-t border-white/[0.08]")}>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-text">
              {interviewerName}
            </div>
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-subtle" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-subtle" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-subtle" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-white/[0.08] px-3 py-3">
        {textError ? (
          <p className="mb-2 text-[11px] leading-relaxed text-brand-rose">
            {textError}
          </p>
        ) : null}
        <div className="relative">
          <label htmlFor="transcript-composer" className="sr-only">
            Type a response instead of speaking
          </label>
          <textarea
            id="transcript-composer"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type instead of speaking..."
            rows={2}
            className="w-full resize-none rounded-[16px] border border-white/[0.12] bg-transparent py-2.5 pl-3.5 pr-11 text-sm text-brand-text placeholder:text-brand-subtle focus:border-brand-cyan focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            aria-label={isSendingText ? "Sending" : "Send message"}
            aria-busy={isSendingText}
            className={cn(
              "absolute bottom-2.5 right-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
              canSend
                ? "bg-brand-cyan text-brand-deep hover:bg-brand-text"
                : "cursor-not-allowed bg-white/[0.04] text-brand-subtle"
            )}
          >
            {isSendingText ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-muted border-t-brand-cyan" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-brand-subtle">
          Enter to send &middot; Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
