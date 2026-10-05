import Link from "next/link";
import { cn } from "@/lib/utils";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import type { DifficultyLevel } from "@/lib/constants";
import { getProblemBySlug } from "@/lib/db/queries";
import { CHIP, HAIRLINE, LABEL, LINK_ARROW } from "@/components/marketing/ds";

export async function ProblemCard({ slug }: { slug: string }) {
  // Optional widget: a DB failure should not take the whole post down.
  const problem = await getProblemBySlug(slug).catch(() => null);
  if (!problem) return null;

  const cfg = DIFFICULTY_CONFIG[problem.difficulty as DifficultyLevel];
  const companyTags = problem.company_tags ?? [];

  return (
    <div className="not-prose my-10">
      <Link
        href={`/practice/${problem.slug}`}
        className={cn(
          "group block border-y py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan",
          HAIRLINE
        )}
      >
        <div className={cn(LABEL, "flex flex-wrap gap-x-3 gap-y-1")}>
          <span>Practice problem</span>
          <span aria-hidden>·</span>
          <span>{cfg?.label ?? problem.difficulty}</span>
          <span aria-hidden>·</span>
          <span>{problem.category}</span>
        </div>
        <p className="mt-3 text-xl font-normal tracking-[-0.02em] text-brand-text transition-colors group-hover:text-brand-cyan">
          {problem.title}
        </p>
        {companyTags.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {companyTags.slice(0, 3).map((tag) => (
              <span key={tag} className={CHIP}>
                {tag}
              </span>
            ))}
            {companyTags.length > 3 && (
              <span className={LABEL}>+{companyTags.length - 3}</span>
            )}
          </div>
        )}
        <span className={cn(LINK_ARROW, "mt-5")}>
          Open the problem <span aria-hidden>→</span>
        </span>
      </Link>
    </div>
  );
}
