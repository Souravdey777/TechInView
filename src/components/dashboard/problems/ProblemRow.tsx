import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FOCUS, LABEL, LINK_ARROW } from "@/components/marketing/ds";
import { DifficultyMark } from "@/components/practice/ProblemStatement";
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
  "lg:grid lg:grid-cols-[0.5rem_minmax(0,1fr)_9rem_6.5rem_6rem_11rem] lg:items-center lg:gap-6";

const SECONDARY_LINK = cn(
  "font-mono text-xs uppercase tracking-[0.08em] text-brand-muted transition-colors hover:text-brand-text",
  FOCUS
);

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

  return problem.testsTotal ? `${problem.testsTotal} tests` : "–";
}

/**
 * One hairline row in the bank: progress dot, problem, where it sits in the
 * catalogue, and the two ways to open it.
 */
export function ProblemRow({ problem }: { problem: BankProblem }) {
  const progress = problemProgress(problem);
  const progressConfig = PROGRESS_CONFIG[progress];
  const hrefs = problemLaunchHrefs(problem);
  const isFree = problem.isFreeSolverEnabled;
  const primaryHref = isFree ? hrefs.practice : hrefs.round;
  const tests = testsText(problem);
  const allCompanies = problem.companyTags.map(companyLabel).join(", ");

  return (
    <div
      className={cn(
        "py-5 transition-colors hover:bg-white/[0.02]",
        PROBLEM_ROW_GRID
      )}
    >
      <div className="flex flex-col gap-3 lg:contents">
        <span
          aria-hidden="true"
          className={cn(
            "hidden h-1.5 w-1.5 rounded-full lg:block",
            progressConfig.dotClassName
          )}
        />

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-x-3">
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full lg:hidden",
                progressConfig.dotClassName
              )}
            />
            <Link
              href={primaryHref}
              className={cn(
                "truncate text-[17px] font-normal tracking-[-0.01em] text-brand-text transition-colors hover:text-brand-cyan",
                FOCUS
              )}
            >
              {problem.title}
            </Link>
            <span className="sr-only">{progressConfig.label}</span>
            {isFree ? (
              <span className={cn(LABEL, "hidden shrink-0 text-brand-muted sm:inline")}>
                Free
              </span>
            ) : null}
          </div>

          {problem.companyTags.length > 0 ? (
            <p
              title={allCompanies}
              className="mt-1 hidden truncate font-mono text-[11px] uppercase tracking-[0.08em] text-brand-subtle lg:block"
            >
              {companiesText(problem.companyTags, 3)}
            </p>
          ) : null}

          {/* Everything the desktop columns carry, folded into one line. */}
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] lg:hidden">
            <DifficultyMark difficulty={problem.difficulty} />
            <span className="text-brand-muted">
              {categoryLabel(problem.category)}
            </span>
            <span className={cn("tabular-nums", progressConfig.textClassName)}>
              {tests}
            </span>
            {isFree ? (
              <span className="text-brand-muted sm:hidden">Free</span>
            ) : null}
            {problem.companyTags.length > 0 ? (
              <span className="min-w-0 truncate text-brand-subtle">
                {companiesText(problem.companyTags, 2)}
              </span>
            ) : null}
          </p>
        </div>

        <span className={cn(LABEL, "hidden truncate text-brand-muted lg:block")}>
          {categoryLabel(problem.category)}
        </span>

        <DifficultyMark
          difficulty={problem.difficulty}
          className="hidden lg:inline-flex"
        />

        <span
          className={cn(
            "hidden font-mono text-[11px] tabular-nums lg:block lg:text-right",
            progressConfig.textClassName
          )}
        >
          {tests}
        </span>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:justify-end">
          {isFree ? (
            <>
              <Link
                href={hrefs.practice}
                aria-label={`Practice ${problem.title}`}
                className={LINK_ARROW}
              >
                Practice
                <ChevronRight className="h-3 w-3" />
              </Link>
              <Link
                href={hrefs.round}
                aria-label={`Take ${problem.title} as an AI interview round`}
                className={SECONDARY_LINK}
              >
                As a round
              </Link>
            </>
          ) : (
            <Link
              href={hrefs.round}
              aria-label={`Start an AI interview round on ${problem.title}`}
              className={LINK_ARROW}
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
