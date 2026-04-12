import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProblemGrid } from "@/components/dashboard/ProblemGrid";
import { InterviewTypeTabs } from "@/components/shared/InterviewTypeTabs";
import { getProblems } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const problems = await getProblems();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-brand-text mb-1">
          Problem Bank
        </h1>
        <p className="text-brand-muted text-sm">
          Browse and practice DSA problems across all categories.
        </p>
      </div>

      <InterviewTypeTabs>
        <ProblemGrid
          problems={problems.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            difficulty: p.difficulty as "easy" | "medium" | "hard",
            category: p.category,
            companyTags: (p.company_tags as string[]) || [],
            isFreeSolverEnabled: p.is_free_solver_enabled,
          }))}
        />
      </InterviewTypeTabs>
    </div>
  );
}
