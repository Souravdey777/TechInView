"use client";

import { cn } from "@/lib/utils";
import { MonoLabel, Rack } from "@/components/shared/Rack";

type TranscriptMessage = {
  role: string;
  content: string;
  timestamp_ms: number;
};

type TranscriptReviewProps = {
  messages: TranscriptMessage[];
  interviewerName?: string;
};

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function getRoleLabel(role: string, interviewerName: string): string {
  if (role === "interviewer") return interviewerName;
  if (role === "candidate") return "You";
  return "System";
}

/**
 * Interview transcript read like the Prep Guru thread: a hairline rule between
 * turns, a mono speaker label and timestamp, no bubbles. Candidate turns are
 * set off by a quiet left rule; system notes are muted.
 */
export function TranscriptReview({
  messages,
  interviewerName = "Interviewer",
}: TranscriptReviewProps) {
  if (messages.length === 0) {
    return (
      <Rack label={<MonoLabel>Interview transcript</MonoLabel>} className="w-full">
        <p className="py-6 text-center text-sm text-brand-muted">
          No transcript available for this interview.
        </p>
      </Rack>
    );
  }

  return (
    <Rack
      label={<MonoLabel>Interview transcript</MonoLabel>}
      accessory={<MonoLabel className="tabular-nums">{messages.length} messages</MonoLabel>}
      className="w-full"
      bodyClassName="p-0"
    >
      <div className="scrollbar-thin max-h-[500px] divide-y divide-white/[0.08] overflow-y-auto px-5 sm:px-6">
        {messages.map((msg, index) => {
          const isCandidate = msg.role === "candidate";
          const isSystem = msg.role !== "candidate" && msg.role !== "interviewer";

          return (
            <div key={index} className="py-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <MonoLabel className={cn(msg.role === "interviewer" && "text-brand-text")}>
                  {getRoleLabel(msg.role, interviewerName)}
                </MonoLabel>
                <MonoLabel className="tabular-nums">{formatTimestamp(msg.timestamp_ms)}</MonoLabel>
              </div>
              <p
                className={cn(
                  "text-[15px] leading-relaxed",
                  isCandidate && "border-l border-white/[0.18] pl-4 text-brand-text",
                  isSystem ? "text-sm text-brand-muted" : !isCandidate && "text-brand-text/90"
                )}
              >
                {msg.content}
              </p>
            </div>
          );
        })}
      </div>
    </Rack>
  );
}
