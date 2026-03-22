import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProblemGrid } from "@/components/dashboard/ProblemGrid";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all problems from DB
  const { data: problems } = await supabase
    .from("problems")
    .select("id, title, slug, difficulty, category, company_tags")
    .order("difficulty")
    .order("title");

  return (
    <ProblemGrid
      problems={
        (problems || []).map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          difficulty: p.difficulty as "easy" | "medium" | "hard",
          category: p.category,
          companyTags: (p.company_tags as string[]) || [],
        }))
      }
    />
  );
}
