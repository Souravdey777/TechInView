import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ButtonLink, Eyebrow, LEAD } from "@/components/marketing/ds";
import { ProblemGrid } from "@/components/dashboard/ProblemGrid";
import { summarizeBank } from "@/components/dashboard/problems/catalogue";
import { cn } from "@/lib/utils";
import { getBankProblems, pageProblems } from "@/lib/problem-list";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const bank = await getBankProblems(user.id);
  const summary = summarizeBank(bank);
  const initial = pageProblems(bank);

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

      <ProblemGrid initial={initial} summary={summary} />
    </div>
  );
}
