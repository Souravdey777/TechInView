import Link from "next/link";
import { cn } from "@/lib/utils";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import type { DifficultyLevel } from "@/lib/constants";
import { getProblemBySlug } from "@/lib/db/queries";
import { Building2, ChevronRight } from "lucide-react";

export async function ProblemCard({ slug }: { slug: string }) {
  const problem = await getProblemBySlug(slug);
  if (!problem) return null;

  const cfg = DIFFICULTY_CONFIG[problem.difficulty as DifficultyLevel];
  const companyTags = problem.company_tags ?? [];

  return (
    <div className="not-prose my-6">
      <Link
        href={`/login`}
        className="group flex items-center justify-between gap-4 rounded-xl border border-brand-border bg-brand-card/60 p-5 transition-all hover:border-brand-cyan/30"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
                cfg.bgColor,
                cfg.color
              )}
            >
              {cfg.label}
            </span>
            <span className="text-xs text-brand-muted">
              {problem.category}
            </span>
          </div>
          <p className="text-base font-semibold text-brand-text group-hover:text-brand-cyan transition-colors">
            {problem.title}
          </p>
          {companyTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <Building2 className="w-3 h-3 text-brand-muted shrink-0" />
              {companyTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-1.5 py-0.5 rounded bg-brand-surface border border-brand-border text-brand-muted"
                >
                  {tag}
                </span>
              ))}
              {companyTags.length > 3 && (
                <span className="text-[11px] text-brand-muted">
                  +{companyTags.length - 3}
                </span>
              )}
            </div>
          )}
          <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-brand-cyan group-hover:underline">
            Start AI interview <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </Link>
    </div>
  );
}
