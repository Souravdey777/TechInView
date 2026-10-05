import { cn, getScoreBgColor, getScoreColor } from "@/lib/utils";
import { BODY, LABEL } from "@/components/marketing/ds";

type FeedbackCardProps = {
  dimension: string;
  score: number;
  weight: number;
  feedback: string;
};

function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Needs Work";
}

/**
 * One dimension of the breakdown: mono weight / score row, title, a thin score
 * bar and the interviewer's note. Draws no border of its own; the parent lays
 * these out as a hairline GRID with CELL on each wrapper.
 */
export function FeedbackCard({ dimension, score, weight, feedback }: FeedbackCardProps) {
  const weightPercent = Math.round(weight * 100);

  return (
    <div className="flex h-full w-full flex-col p-6">
      <div className={cn(LABEL, "flex justify-between gap-4")}>
        <span>{weightPercent}% weight</span>
        <span className="tabular-nums">
          <span className={getScoreColor(score)}>{score}</span>/100
        </span>
      </div>

      <h3 className="mt-5 text-[17px] tracking-[-0.01em] text-brand-text">{dimension}</h3>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-0.5 flex-1 bg-white/[0.08]">
          <div className={cn("h-full", getScoreBgColor(score))} style={{ width: `${Math.max(2, score)}%` }} />
        </div>
        <span className={cn("font-mono text-[11px] uppercase tracking-[0.08em]", getScoreColor(score))}>
          {getScoreLabel(score)}
        </span>
      </div>

      <p className={cn(BODY, "mt-4")}>{feedback}</p>
    </div>
  );
}
