import { cn, formatScore, getScoreColor } from "@/lib/utils";
import { HIRE_RECOMMENDATION_CONFIG } from "@/lib/constants";
import type { HireRecommendation } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

type ScoreSummaryProps = {
  overallScore: number;
  hireRecommendation: HireRecommendation;
  summary: string;
};

function getHireRecommendationBadgeStyle(rec: HireRecommendation): string {
  if (rec === "strong_hire" || rec === "hire") {
    return "bg-brand-green/15 text-brand-green border border-brand-green/30";
  }
  if (rec === "lean_hire") {
    return "bg-brand-amber/15 text-brand-amber border border-brand-amber/30";
  }
  return "bg-brand-rose/15 text-brand-rose border border-brand-rose/30";
}

function getScoreRingColor(score: number): string {
  if (score >= 85) return "stroke-brand-green";
  if (score >= 70) return "stroke-brand-cyan";
  if (score >= 55) return "stroke-brand-amber";
  return "stroke-brand-rose";
}

function getTrendIcon(score: number) {
  if (score >= 70) return <TrendingUp className="h-4 w-4" />;
  if (score >= 55) return <Minus className="h-4 w-4" />;
  return <TrendingDown className="h-4 w-4" />;
}

export function ScoreSummary({ overallScore, hireRecommendation, summary }: ScoreSummaryProps) {
  const grade = formatScore(overallScore);
  const scoreColorClass = getScoreColor(overallScore);
  const recConfig = HIRE_RECOMMENDATION_CONFIG[hireRecommendation];
  const badgeStyle = getHireRecommendationBadgeStyle(hireRecommendation);
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - overallScore / 100);

  return (
    <Card className="w-full">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Score Circle */}
          <div className="relative flex-shrink-0">
            <svg
              width="140"
              height="140"
              viewBox="0 0 140 140"
              className="-rotate-90"
              aria-hidden="true"
            >
              {/* Background track */}
              <circle
                cx="70"
                cy="70"
                r="54"
                fill="none"
                className="stroke-brand-border"
                strokeWidth="10"
              />
              {/* Progress arc */}
              <circle
                cx="70"
                cy="70"
                r="54"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={cn("transition-all duration-1000 ease-out", getScoreRingColor(overallScore))}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-4xl font-bold tabular-nums", scoreColorClass)}>
                {overallScore}
              </span>
              <span className="text-xs text-brand-muted mt-0.5">/ 100</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col gap-4 text-center sm:text-left">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-brand-amber" />
                <span className="text-xl font-bold text-brand-text">Overall Score</span>
              </div>
              {/* Letter grade badge */}
              <span
                className={cn(
                  "inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-sm font-bold tabular-nums",
                  scoreColorClass,
                  "bg-brand-surface border border-brand-border"
                )}
              >
                {grade}
              </span>
            </div>

            {/* Hire recommendation badge */}
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold",
                  badgeStyle
                )}
              >
                {getTrendIcon(overallScore)}
                {recConfig.label}
              </span>
            </div>

            {/* Summary text */}
            <p className="text-sm text-brand-muted leading-relaxed max-w-prose">
              {summary}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
