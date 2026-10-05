import Link from "next/link";
import { cn } from "@/lib/utils";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import type { DifficultyLevel } from "@/lib/constants";
import { getRelatedProblems } from "@/lib/db/queries";
import { getCategoriesForKeyword } from "@/lib/blog-problem-mapping";
import { CELL, GRID, LABEL } from "@/components/marketing/ds";

export async function RelatedProblems({ keyword }: { keyword: string }) {
  const categories = getCategoriesForKeyword(keyword);
  if (categories.length === 0) return null;

  // Optional widget: a DB failure should not take the whole post down.
  const problems = await getRelatedProblems(categories, 4).catch(() => []);
  if (problems.length === 0) return null;

  return (
    <aside className="mt-16">
      <h2 className="mb-5 font-mono text-xs uppercase tracking-[0.14em] text-brand-subtle">
        Practice related problems
      </h2>
      <ul className={cn(GRID, "m-0 list-none grid-cols-1 p-0 sm:grid-cols-2")}>
        {problems.map((p) => (
          <li key={p.slug} className={cn(CELL, "min-w-0")}>
            <Link
              href={`/practice/${p.slug}`}
              className="group flex h-full items-start justify-between gap-4 p-5 transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan"
            >
              <div className="min-w-0">
                <p className={LABEL}>
                  {DIFFICULTY_CONFIG[p.difficulty as DifficultyLevel]?.label ??
                    p.difficulty}
                </p>
                <p className="mt-2 truncate text-[15px] text-brand-text transition-colors group-hover:text-brand-cyan">
                  {p.title}
                </p>
              </div>
              <span
                aria-hidden
                className="font-mono text-brand-subtle transition-colors group-hover:text-brand-cyan"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
