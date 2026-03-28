import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProblemGrid } from "@/components/dashboard/ProblemGrid";
import { InterviewTypeTabs } from "@/components/shared/InterviewTypeTabs";
import { Lock, CreditCard, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { count: paymentCount } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isPaidUser = (paymentCount ?? 0) > 0;

  // Fetch all problems from DB
  const { data: problems } = await supabase
    .from("problems")
    .select("id, title, slug, difficulty, category, company_tags")
    .order("difficulty")
    .order("title");

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

      {isPaidUser ? (
        <InterviewTypeTabs>
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
        </InterviewTypeTabs>
      ) : (
        <div className="relative">
          {/* Blurred preview */}
          <div className="pointer-events-none select-none blur-sm opacity-40">
            <InterviewTypeTabs>
              <ProblemGrid
                problems={
                  (problems || []).slice(0, 6).map((p) => ({
                    id: p.id,
                    title: p.title,
                    slug: p.slug,
                    difficulty: p.difficulty as "easy" | "medium" | "hard",
                    category: p.category,
                    companyTags: (p.company_tags as string[]) || [],
                  }))
                }
              />
            </InterviewTypeTabs>
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-brand-card/95 backdrop-blur-sm border border-brand-border rounded-2xl p-8 max-w-sm text-center shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-brand-amber/10 border border-brand-amber/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-brand-amber" />
              </div>
              <h2 className="text-lg font-bold text-brand-text mb-2">
                Unlock the Problem Bank
              </h2>
              <p className="text-brand-muted text-sm mb-6">
                Purchase interview credits to browse all problems, filter by category, and pick specific questions for your sessions.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-cyan text-brand-deep font-semibold text-sm rounded-lg hover:bg-brand-cyan/90 transition-all shadow-lg shadow-brand-cyan/20"
              >
                <CreditCard className="w-4 h-4" />
                Buy Credits
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
