"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText, Bot, User, Info } from "lucide-react";

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

type RoleConfig = {
  label: string;
  badgeClass: string;
  bubbleClass: string;
  Icon: React.ElementType;
};

function getRoleConfig(role: string, interviewerName: string): RoleConfig {
  if (role === "interviewer") {
    return {
      label: interviewerName,
      badgeClass: "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30",
      bubbleClass: "bg-brand-surface border border-brand-border",
      Icon: Bot,
    };
  }
  if (role === "candidate") {
    return {
      label: "You",
      badgeClass: "bg-brand-green/15 text-brand-green border border-brand-green/30",
      bubbleClass: "bg-brand-card border border-brand-border/60",
      Icon: User,
    };
  }
  return {
    label: "System",
    badgeClass: "bg-brand-muted/15 text-brand-muted border border-brand-border",
    bubbleClass: "bg-brand-deep border border-brand-border/40",
    Icon: Info,
  };
}

export function TranscriptReview({
  messages,
  interviewerName = "Interviewer",
}: TranscriptReviewProps) {
  if (messages.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-brand-cyan" />
            Interview Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-brand-muted text-center py-8">
            No transcript available for this interview.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-brand-cyan" />
            Interview Transcript
          </CardTitle>
          <span className="text-xs text-brand-muted">
            {messages.length} messages
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto px-6 pb-6 space-y-3 scrollbar-thin">
          {messages.map((msg, index) => {
            const config = getRoleConfig(msg.role, interviewerName);
            const { Icon } = config;
            const isCandidate = msg.role === "candidate";

            return (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  isCandidate && "flex-row-reverse"
                )}
              >
                {/* Avatar icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border",
                    isCandidate
                      ? "bg-brand-green/10 border-brand-green/30"
                      : msg.role === "interviewer"
                      ? "bg-brand-cyan/10 border-brand-cyan/30"
                      : "bg-brand-surface border-brand-border"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isCandidate
                        ? "text-brand-green"
                        : msg.role === "interviewer"
                        ? "text-brand-cyan"
                        : "text-brand-muted"
                    )}
                  />
                </div>

                {/* Message bubble */}
                <div
                  className={cn(
                    "flex flex-col gap-1 max-w-[75%]",
                    isCandidate && "items-end"
                  )}
                >
                  {/* Role + timestamp header */}
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      isCandidate && "flex-row-reverse"
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        config.badgeClass
                      )}
                    >
                      {config.label}
                    </span>
                    <span className="text-xs text-brand-muted tabular-nums">
                      {formatTimestamp(msg.timestamp_ms)}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm text-brand-text leading-relaxed",
                      config.bubbleClass
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
