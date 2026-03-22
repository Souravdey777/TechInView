"use client";

import Link from "next/link";
import { cn, formatDuration, getScoreColor } from "@/lib/utils";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import type { DifficultyLevel } from "@/lib/constants";
import { Clock, Calendar, ArrowRight, Mic } from "lucide-react";

type InterviewSummary = {
  id: string;
  problemTitle: string;
  difficulty: DifficultyLevel;
  score: number | null;
  date: string;
  duration: number | null;
  status: "completed" | "abandoned" | "in_progress";
};

type InterviewHistoryProps = {
  interviews: InterviewSummary[];
};

function StatusBadge({ status }: { status: InterviewSummary["status"] }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-green/10 text-brand-green border border-brand-green/20">
        Completed
      </span>
    );
  }
  if (status === "abandoned") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-rose/10 text-brand-rose border border-brand-rose/20">
        Abandoned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-amber/10 text-brand-amber border border-brand-amber/20">
      In Progress
    </span>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InterviewHistory({ interviews }: InterviewHistoryProps) {
  if (interviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 bg-brand-card rounded-xl border border-brand-border text-center">
        <div className="w-14 h-14 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mb-4">
          <Mic className="w-7 h-7 text-brand-cyan" />
        </div>
        <h3 className="text-brand-text font-semibold text-base mb-2">
          No interviews yet
        </h3>
        <p className="text-brand-muted text-sm max-w-xs mb-6">
          Complete your first mock interview to see your progress here.
        </p>
        <Link
          href="/interview/setup"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-cyan text-brand-deep font-semibold text-sm rounded-lg hover:bg-brand-cyan/90 transition-colors"
        >
          Start an Interview
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {interviews.map((interview) => {
        const diffConfig = DIFFICULTY_CONFIG[interview.difficulty];
        return (
          <Link
            key={interview.id}
            href={`/results/${interview.id}`}
            className="block bg-brand-card rounded-xl border border-brand-border hover:border-brand-cyan/30 hover:bg-brand-card/80 transition-all duration-150 group"
          >
            <div className="flex items-center gap-4 p-4">
              {/* Problem Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-brand-text font-medium text-sm truncate">
                    {interview.problemTitle}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                      diffConfig.bgColor,
                      diffConfig.color,
                      "border-current/20"
                    )}
                  >
                    {diffConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-brand-muted text-xs">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(interview.date)}
                  </span>
                  {interview.duration !== null && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(interview.duration)}
                    </span>
                  )}
                </div>
              </div>

              {/* Status + Score */}
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={interview.status} />
                {interview.score !== null && (
                  <div
                    className={cn(
                      "text-lg font-bold font-heading",
                      getScoreColor(interview.score)
                    )}
                  >
                    {interview.score}
                  </div>
                )}
                <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-cyan transition-colors" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
