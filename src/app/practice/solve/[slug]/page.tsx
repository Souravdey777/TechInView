import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProblemBySlug, getPracticeAttempt } from "@/lib/db/queries";
import { PracticeSolverWorkspace } from "@/components/practice/PracticeSolverWorkspace";

type PracticeSolvePageProps = {
  params: { slug: string };
};

export const dynamic = "force-dynamic";

export default async function PracticeSolvePage({ params }: PracticeSolvePageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/practice/solve/${params.slug}`)}`);
  }

  const problem = await getProblemBySlug(params.slug);

  if (!problem) {
    redirect("/practice");
  }

  if (!problem.is_free_solver_enabled) {
    redirect(`/practice/${params.slug}?locked=solver`);
  }

  const attempt = await getPracticeAttempt(user.id, problem.id);

  return (
    <PracticeSolverWorkspace
      problem={{
        id: problem.id,
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        category: problem.category,
        description: problem.description,
        examples: (problem.examples ?? []) as {
          input: string;
          output: string;
          explanation?: string;
        }[],
        constraints: problem.constraints ?? [],
        hints: problem.hints ?? [],
        starter_code: problem.starter_code as Record<
          "python" | "javascript" | "java" | "cpp",
          string
        >,
      }}
      initialAttempt={
        attempt
          ? {
              language: attempt.language as "python" | "javascript" | "java" | "cpp",
              lastCode: attempt.last_code ?? null,
              testsPassed: attempt.tests_passed ?? null,
              testsTotal: attempt.tests_total ?? null,
              isSolved: attempt.is_solved,
              updatedAt: attempt.updated_at.toISOString(),
            }
          : null
      }
    />
  );
}
