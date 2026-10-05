import { cn, formatScore, getScoreColor } from "@/lib/utils";
import { HIRE_RECOMMENDATION_CONFIG } from "@/lib/constants";
import type { HireRecommendation } from "@/lib/constants";
import { BODY, LABEL } from "@/components/marketing/ds";

type ScoreSummaryProps = {
  overallScore: number;
  hireRecommendation: HireRecommendation;
  summary: string;
};

/** Verdict chip tone: semantic status, so green / amber / rose rather than cyan. */
function getHireRecommendationChipStyle(rec: HireRecommendation): string {
  if (rec === "strong_hire" || rec === "hire") {
    return "border-brand-green/30 text-brand-green";
  }
  if (rec === "lean_hire") {
    return "border-brand-amber/30 text-brand-amber";
  }
  return "border-brand-rose/30 text-brand-rose";
}

/**
 * Report header block: a very large font-normal overall score, the verdict as
 * a mono chip, the letter grade, and the interviewer's summary. No card or
 * ring; it sits on the page between hairlines like the sample report.
 */
export function ScoreSummary({ overallScore, hireRecommendation, summary }: ScoreSummaryProps) {
  const grade = formatScore(overallScore);
  const recConfig = HIRE_RECOMMENDATION_CONFIG[hireRecommendation];

  return (
    <div className="grid w-full gap-8 border-y border-white/[0.08] py-10 md:grid-cols-[auto_minmax(0,1fr)] md:items-end md:gap-14">
      <div>
        <p className={LABEL}>Overall score</p>
        <p className="mt-3 flex items-baseline gap-3">
          <span
            className={cn(
              "text-[clamp(88px,12vw,160px)] font-normal leading-[0.85] tracking-[-0.06em] tabular-nums",
              getScoreColor(overallScore)
            )}
          >
            {overallScore}
          </span>
          <span className="font-mono text-sm text-brand-subtle">/ 100</span>
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em]",
              getHireRecommendationChipStyle(hireRecommendation)
            )}
          >
            {recConfig.label}
          </span>
          <span className="inline-flex items-center rounded-full border border-white/[0.1] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] tabular-nums text-brand-muted">
            Grade {grade}
          </span>
        </div>
        <p className={cn(BODY, "mt-5 max-w-prose")}>{summary}</p>
      </div>
    </div>
  );
}
