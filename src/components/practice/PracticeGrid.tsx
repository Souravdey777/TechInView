"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ProblemPage } from "@/lib/problem-list";
import { LABEL, LINK_ARROW } from "@/components/marketing/ds";
import { DifficultyMark } from "@/components/practice/ProblemStatement";
import { LoadMore, ProblemFilterBar } from "@/components/dashboard/problems/ProblemFilterBar";
import { categoryLabel, companyLabel } from "@/components/dashboard/problems/catalogue";
import { useProblemFilters } from "@/components/dashboard/problems/useProblemFilters";

type PracticeGridProps = {
  /** First page, rendered on the server; later pages are fetched as the list scrolls. */
  initial: ProblemPage;
};

/** Shared column template: header and rows must agree. */
const COLS = "md:grid md:grid-cols-[44px_minmax(0,1fr)_96px_140px_minmax(0,180px)_150px] md:items-center md:gap-6";

/** Public problem index. Same filters as the signed-in bank (/problems), without progress. */
export function PracticeGrid({ initial }: PracticeGridProps) {
  const filters = useProblemFilters(initial);
  const { total, bankTotal, visible, isFiltered, clear: reset } = filters;

  return (
    <div>
      <div className="mb-10">
        <ProblemFilterBar filters={filters} />
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <p className={LABEL} aria-live="polite">
          {total === bankTotal
            ? `All ${bankTotal} problems`
            : `${total} of ${bankTotal} problems`}
        </p>
        {isFiltered && (
          <button type="button" onClick={reset} className={LINK_ARROW}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table head (desktop only; rows stack on small screens) */}
      <div className={cn(COLS, "hidden border-t border-white/[0.08] py-3", LABEL)} aria-hidden>
        <span>#</span>
        <span>Problem</span>
        <span>Level</span>
        <span>Topic</span>
        <span>Companies</span>
        <span className="text-right">Start</span>
      </div>

      <ul className="m-0 list-none border-t border-white/[0.08] p-0">
        {visible.map((p, i) => {
          const interviewHref = `/interview/setup?problem=${p.slug}&dsaExperience=ai_interview`;
          return (
            <li
              key={p.slug}
              className={cn(
                COLS,
                "group border-b border-white/[0.08] py-5 transition-colors hover:bg-white/[0.02]",
                // Rows ease in as they mount: first paint, a filter change, or a loaded page.
                "animate-[soft-rise_0.4s_ease-out_backwards] motion-reduce:animate-none"
              )}
              style={{ animationDelay: `${Math.min(i % 20, 10) * 25}ms` }}
            >
              <span className={cn(LABEL, "hidden transition-colors group-hover:text-brand-cyan md:block")}>{String(i + 1).padStart(2, "0")}</span>

              <div className="min-w-0">
                <h3 className="text-[17px] font-normal tracking-[-0.01em] text-brand-text transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none">
                  <Link href={`/practice/${p.slug}`} className="transition-colors hover:text-brand-cyan">
                    {p.title}
                  </Link>
                </h3>
                <p
                  className={cn(
                    "mt-1 font-mono text-[11px] uppercase tracking-[0.08em]",
                    p.isFreeSolverEnabled ? "text-brand-muted" : "text-brand-subtle"
                  )}
                >
                  {p.isFreeSolverEnabled ? "Free practice" : "Locked · AI interview only"}
                </p>
              </div>

              {/* Mobile: level + topic + companies on one wrapping meta line */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 md:contents">
                <DifficultyMark difficulty={p.difficulty} />
                <span className={cn(LABEL, "text-brand-muted")}>
                  {categoryLabel(p.category)}
                </span>
                <span className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-brand-subtle">
                  {p.companyTags.length > 0
                    ? `${p.companyTags.slice(0, 3).map(companyLabel).join(", ")}${p.companyTags.length > 3 ? ` +${p.companyTags.length - 3}` : ""}`
                    : <span className="hidden md:inline">-</span>}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 md:mt-0 md:justify-end">
                {p.isFreeSolverEnabled ? (
                  <>
                    <Link
                      href={`/practice/solve/${p.slug}`}
                      className={LINK_ARROW}
                      aria-label={`Practice: ${p.title}`}
                    >
                      Practice <span aria-hidden>→</span>
                    </Link>
                    <Link
                      href={interviewHref}
                      className="font-mono text-xs uppercase tracking-[0.08em] text-brand-muted transition-colors hover:text-brand-text"
                      aria-label={`AI interview: ${p.title}`}
                    >
                      Interview
                    </Link>
                  </>
                ) : (
                  <Link href={interviewHref} className={LINK_ARROW} aria-label={`AI interview: ${p.title}`}>
                    Interview <span aria-hidden>→</span>
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <LoadMore filters={filters} />

      {total === 0 && (
        <div className="border-b border-white/[0.08] py-16 text-center">
          <p className="text-[15px] text-brand-muted">No problems match these filters.</p>
          <button
            type="button"
            onClick={reset}
            className={cn(LINK_ARROW, "mt-4")}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
