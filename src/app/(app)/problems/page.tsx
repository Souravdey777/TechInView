import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProblemGrid } from "@/components/dashboard/ProblemGrid";
import {
  summarizeBank,
  type BankProblem,
} from "@/components/dashboard/problems/catalogue";
import { MonoLabel } from "@/components/shared/Rack";
import type { DifficultyLevel } from "@/lib/constants";
import { getProblems, getRecentPracticeAttempts } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** One saved attempt per problem, so this covers the whole bank comfortably. */
const ATTEMPT_LIMIT = 250;

export default async function ProblemsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [problems, attempts] = await Promise.all([
    getProblems(),
    // Progress is a nice-to-have on this page: a failure here should not take
    // the catalogue down with it.
    getRecentPracticeAttempts(user.id, ATTEMPT_LIMIT).catch(() => []),
  ]);

  const attemptByProblem = new Map(
    attempts.map((attempt) => [attempt.problem_id, attempt])
  );

  const bankProblems: BankProblem[] = problems.map((problem) => {
    const attempt = attemptByProblem.get(problem.id);

    return {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty as DifficultyLevel,
      category: problem.category,
      companyTags: (problem.company_tags as string[] | null) ?? [],
      isFreeSolverEnabled: problem.is_free_solver_enabled,
      testsTotal: Array.isArray(problem.test_cases)
        ? problem.test_cases.length
        : 0,
      attempt: attempt
        ? {
            isSolved: attempt.is_solved,
            testsPassed: attempt.tests_passed,
            testsTotal: attempt.tests_total,
          }
        : null,
    };
  });

  const summary = summarizeBank(bankProblems);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <MonoLabel>Problem bank</MonoLabel>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            {summary.total > 0
              ? `${summary.total} problems, two ways in.`
              : "The problem bank."}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-muted">
            Solve one solo in the editor with hints and test runs, or hand it to
            a voice interviewer and get scored on it. Practice never spends a
            round.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="gap-2 text-base font-semibold">
            <Link href="/interview/setup?dsaExperience=ai_interview">
              Start a round
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link href="/interview/setup?dsaExperience=practice">
              Practice free
            </Link>
          </Button>
        </div>
      </header>

      <ProblemGrid problems={bankProblems} summary={summary} />
    </div>
  );
}
