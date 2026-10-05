import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ButtonLink, Eyebrow, LEAD } from "@/components/marketing/ds";
import { ProblemGrid } from "@/components/dashboard/ProblemGrid";
import {
  summarizeBank,
  type BankProblem,
} from "@/components/dashboard/problems/catalogue";
import type { DifficultyLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";
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
    <div className="space-y-12">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="min-w-0">
          <Eyebrow>Problem bank</Eyebrow>
          <h1 className="text-balance text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
            {summary.total > 0
              ? `${summary.total} problems, two ways in.`
              : "The problem bank."}
          </h1>
          <p className={cn(LEAD, "mt-5 max-w-xl")}>
            Solve one solo in the editor with hints and test runs, or hand it to
            a voice interviewer and get scored on it. Practice never spends a
            round.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/interview/setup?dsaExperience=ai_interview">
            Start a round
            <ChevronRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/interview/setup?dsaExperience=practice" variant="ghost">
            Practice free
          </ButtonLink>
        </div>
      </header>

      <ProblemGrid problems={bankProblems} summary={summary} />
    </div>
  );
}
