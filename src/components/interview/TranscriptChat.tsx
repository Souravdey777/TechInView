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
  const interviewerInitial = interviewerName.charAt(0).toUpperCase() || "A";

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
      <div className="flex h-9 shrink-0 items-center justify-between border-y border-brand-border bg-brand-card px-4">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-brand-muted">
          Transcript
        </span>
        {messages.length > 0 ? (
          <span className="font-mono text-[10px] text-brand-subtle">
            {messages.length} {messages.length === 1 ? "turn" : "turns"}
          </span>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !isThinking ? (
          <p className="pt-6 text-center text-[11px] leading-relaxed text-brand-muted">
            {interviewerName} will start the conversation shortly...
          </p>
        ) : null}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2",
              msg.role === "candidate" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                msg.role === "interviewer"
                  ? "bg-brand-cyan/20 text-brand-cyan"
                  : "bg-brand-green/20 text-brand-green"
              )}
            >
              {msg.role === "interviewer" ? interviewerInitial : "Y"}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-3 py-2",
                msg.role === "interviewer"
                  ? "rounded-tl-none border border-brand-border bg-brand-card"
                  : "rounded-tr-none border border-brand-cyan/20 bg-brand-cyan/10"
              )}
            >
              <p className="text-xs leading-relaxed text-brand-text">
                {msg.content}
              </p>
              <span className="mt-1 block text-[10px] text-brand-muted">
                {msg.time}
              </span>
            </div>
          </div>
        ))}

        {isThinking ? (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-cyan/20 text-[10px] font-bold text-brand-cyan">
              {interviewerInitial}
            </div>
            <div className="rounded-xl rounded-tl-none border border-brand-border bg-brand-card px-3 py-2">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-amber" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-amber" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-amber" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-brand-border bg-brand-card px-3 py-3">
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
            className="w-full resize-none rounded-lg border border-brand-border bg-brand-surface py-2.5 pl-3 pr-11 text-sm text-brand-text placeholder:text-brand-muted/60 focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            aria-label={isSendingText ? "Sending" : "Send message"}
            aria-busy={isSendingText}
            className={cn(
              "absolute bottom-2.5 right-2 flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-card",
              canSend
                ? "bg-brand-cyan text-brand-deep hover:bg-brand-cyan/90"
                : "cursor-not-allowed bg-brand-border/30 text-brand-muted"
            )}
          >
            {isSendingText ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-muted border-t-brand-cyan" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-brand-subtle">
          Enter to send &middot; Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
