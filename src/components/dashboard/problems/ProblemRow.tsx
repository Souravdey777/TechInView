import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  PROGRESS_CONFIG,
  categoryLabel,
  companyLabel,
  problemLaunchHrefs,
  problemProgress,
  type BankProblem,
} from "@/components/dashboard/problems/catalogue";

/** Shared by the row, the column header, and the loading skeleton. */
export const PROBLEM_ROW_GRID =
  "lg:grid lg:grid-cols-[0.5rem_minmax(0,1fr)_8.5rem_5rem_6rem_10.5rem] lg:items-center lg:gap-4";

function companiesText(companyTags: readonly string[], max: number) {
  if (companyTags.length === 0) return null;
  const shown = companyTags.slice(0, max).map(companyLabel).join(" · ");
  const rest = companyTags.length - max;
  return rest > 0 ? `${shown} +${rest}` : shown;
}

/** What the user has to show for this problem, or what it will cost them. */
function testsText(problem: BankProblem) {
  const attempt = problem.attempt;

  if (attempt) {
    const total = attempt.testsTotal ?? problem.testsTotal ?? 0;
    if (total > 0) return `${attempt.testsPassed ?? 0}/${total}`;
    return attempt.isSolved ? "Solved" : "Code saved";
  }

  return problem.testsTotal ? `${problem.testsTotal} tests` : "—";
}

/**
 * One hairline row in the bank: progress rail, problem, where it sits in the
 * catalogue, and the two ways to open it.
 */
export function ProblemRow({ problem }: { problem: BankProblem }) {
  const progress = problemProgress(problem);
  const progressConfig = PROGRESS_CONFIG[progress];
  const difficulty = DIFFICULTY_CONFIG[problem.difficulty];
  const hrefs = problemLaunchHrefs(problem);
  const isFree = problem.isFreeSolverEnabled;
  const primaryHref = isFree ? hrefs.practice : hrefs.round;
  const tests = testsText(problem);
  const allCompanies = problem.companyTags.map(companyLabel).join(", ");

  return (
    <div
      className={cn(
        "px-4 py-3 transition-colors hover:bg-brand-surface/50 sm:px-5",
        PROBLEM_ROW_GRID
      )}
    >
      <div className="flex flex-col gap-2 lg:contents">
        <span
          aria-hidden="true"
          className={cn(
            "hidden h-[7px] w-[7px] rounded-full lg:block",
            progressConfig.dotClassName
          )}
        />

        <div className="min-w-0">
          <div className="flex min-w-0 items-baseline gap-x-2.5">
            <span
              aria-hidden="true"
              className={cn(
                "h-[7px] w-[7px] shrink-0 rounded-full lg:hidden",
                progressConfig.dotClassName
              )}
            />
            <Link
              href={primaryHref}
              className="truncate text-sm font-medium text-brand-text hover:text-brand-cyan"
            >
              {problem.title}
            </Link>
            <span className="sr-only">{progressConfig.label}</span>
            {isFree ? (
              <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-brand-green/80 sm:inline">
                Free
              </span>
            ) : null}
            {problem.companyTags.length > 0 ? (
              <span
                title={allCompanies}
                className="hidden shrink truncate font-mono text-[10px] tracking-[0.06em] text-brand-subtle lg:inline lg:max-w-[13rem]"
              >
                {companiesText(problem.companyTags, 3)}
              </span>
            ) : null}
          </div>

          {/* Everything the desktop columns carry, folded into one line. */}
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] lg:hidden">
            <span className="text-brand-muted">
              {categoryLabel(problem.category)}
            </span>
            <span className={cn("font-bold", difficulty.color)}>
              {difficulty.label}
            </span>
            <span className={progressConfig.textClassName}>{tests}</span>
            {isFree ? (
              <span className="text-brand-green/80 sm:hidden">Free</span>
            ) : null}
            {problem.companyTags.length > 0 ? (
              <span className="min-w-0 truncate text-brand-subtle">
                {companiesText(problem.companyTags, 2)}
              </span>
            ) : null}
          </p>
        </div>

        <span className="hidden truncate font-mono text-[11px] tracking-[0.06em] text-brand-muted lg:block">
          {categoryLabel(problem.category)}
        </span>

        <span
          className={cn(
            "hidden font-mono text-[11px] font-bold tracking-[0.08em] lg:block",
            difficulty.color
          )}
        >
          {difficulty.label}
        </span>

        <span
          className={cn(
            "hidden font-mono text-[11px] lg:block lg:text-right",
            progressConfig.textClassName
          )}
        >
          {tests}
        </span>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 lg:justify-end">
          {isFree ? (
            <>
              <Link
                href={hrefs.practice}
                aria-label={`Practice ${problem.title}`}
                className="inline-flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-cyan hover:underline"
              >
                Practice
                <ChevronRight className="h-3 w-3" />
              </Link>
              <Link
                href={hrefs.round}
                aria-label={`Take ${problem.title} as an AI interview round`}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle hover:text-brand-muted"
              >
                As a round
              </Link>
            </>
          ) : (
            <Link
              href={hrefs.round}
              aria-label={`Start an AI interview round on ${problem.title}`}
              className="inline-flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-cyan hover:underline"
            >
              Start round
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
