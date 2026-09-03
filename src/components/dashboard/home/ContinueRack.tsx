import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonoLabel, Rack } from "@/components/shared/Rack";
import { cn } from "@/lib/utils";

export type ContinueAttempt = {
  id: string;
  title: string;
  slug: string;
  category: string;
  language: string;
  isSolved: boolean;
  testsPassed: number | null;
  testsTotal: number | null;
  updatedAt: string;
};

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Saved solo-practice attempts, newest first, with the two ways to resume. */
export function ContinueRack({
  attempts,
}: {
  attempts: readonly ContinueAttempt[];
}) {
  return (
    <Rack
      label={<MonoLabel className="tracking-[0.18em]">Pick up where you left off</MonoLabel>}
      accessory={
        <MonoLabel className="tracking-[0.12em]">
          {attempts.length} saved attempt{attempts.length === 1 ? "" : "s"}
        </MonoLabel>
      }
      bodyClassName="p-0"
    >
      <div className="divide-y divide-brand-border/60">
        {attempts.map((attempt) => (
          <div
            key={attempt.id}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <p className="truncate text-sm font-medium text-brand-text">
                  {attempt.title}
                </p>
                <MonoLabel className="text-[9px]">
                  {attempt.category} · {attempt.language}
                </MonoLabel>
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-brand-muted">
                <span
                  className={cn(
                    "font-mono",
                    attempt.isSolved ? "text-brand-green" : "text-brand-amber"
                  )}
                >
                  {attempt.testsTotal && attempt.testsTotal > 0
                    ? `${attempt.testsPassed ?? 0}/${attempt.testsTotal} tests`
                    : "Code saved"}
                </span>
                <span className="font-mono text-brand-subtle">
                  {formatShortDate(attempt.updatedAt)}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/practice/solve/${attempt.slug}`}>
                  Resume
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link
                  href={`/interview/setup?problem=${attempt.slug}&dsaExperience=ai_interview`}
                >
                  Take it as a round
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Rack>
  );
}
