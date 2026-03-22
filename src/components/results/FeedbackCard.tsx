import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MessageSquare } from "lucide-react";

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

function getScoreTextColor(score: number): string {
  if (score >= 70) return "text-brand-green";
  if (score >= 50) return "text-brand-amber";
  return "text-brand-rose";
}

function getProgressIndicatorClass(score: number): string {
  if (score >= 70) return "bg-brand-green";
  if (score >= 50) return "bg-brand-amber";
  return "bg-brand-rose";
}

export function FeedbackCard({ dimension, score, weight, feedback }: FeedbackCardProps) {
  const scoreColor = getScoreTextColor(score);
  const label = getScoreLabel(score);
  const weightPercent = Math.round(weight * 100);

  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-tight">{dimension}</CardTitle>
          <span className="flex-shrink-0 text-xs text-brand-muted bg-brand-surface border border-brand-border px-2 py-0.5 rounded-full">
            {weightPercent}% weight
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex flex-col gap-4 flex-1">
        {/* Score row */}
        <div className="flex items-center justify-between">
          <span className={cn("text-2xl font-bold tabular-nums", scoreColor)}>
            {score}
            <span className="text-sm font-normal text-brand-muted">/100</span>
          </span>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              score >= 70
                ? "bg-brand-green/15 text-brand-green"
                : score >= 50
                ? "bg-brand-amber/15 text-brand-amber"
                : "bg-brand-rose/15 text-brand-rose"
            )}
          >
            {label}
          </span>
        </div>

        {/* Progress bar */}
        <Progress
          value={score}
          indicatorClassName={getProgressIndicatorClass(score)}
        />

        {/* Feedback text */}
        <div className="flex gap-2.5 mt-auto pt-1">
          <MessageSquare className="h-4 w-4 text-brand-muted flex-shrink-0 mt-0.5" />
          <p className="text-sm text-brand-muted leading-relaxed">{feedback}</p>
        </div>
      </CardContent>
    </Card>
  );
}
