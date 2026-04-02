import Link from "next/link";
import { cn } from "@/lib/utils";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import type { DifficultyLevel } from "@/lib/constants";
import { getRelatedProblems } from "@/lib/db/queries";
import { getCategoriesForKeyword } from "@/lib/blog-problem-mapping";
import { ChevronRight } from "lucide-react";

function DifficultyBadge({ difficulty }: { difficulty: DifficultyLevel }) {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
        cfg.bgColor,
        cfg.color
      )}
    >
      {cfg.label}
    </span>
  );
}

export async function RelatedProblems({ keyword }: { keyword: string }) {
  const categories = getCategoriesForKeyword(keyword);
  if (categories.length === 0) return null;

  const problems = await getRelatedProblems(categories, 4);
  if (problems.length === 0) return null;

  return (
    <aside className="mt-14 pt-10 border-t border-brand-border">
      <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
        Practice related problems
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0">
        {problems.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/practice/${p.slug}`}
              className="group flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-card/60 p-4 transition-all hover:border-brand-cyan/30"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-text group-hover:text-brand-cyan transition-colors truncate">
                  {p.title}
                </p>
                <div className="mt-1.5">
                  <DifficultyBadge
                    difficulty={p.difficulty as DifficultyLevel}
                  />
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-brand-muted shrink-0 group-hover:text-brand-cyan transition-colors" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
