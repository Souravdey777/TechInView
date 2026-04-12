"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { DsaExperienceToggle } from "@/components/dsa/DsaExperienceToggle";
import { Button } from "@/components/ui/button";
import type { DsaExperience } from "@/lib/dsa";

type PracticeModeCtaProps = {
  problemSlug: string;
  isFreeSolverEnabled: boolean;
  initialExperience?: DsaExperience;
};

export function PracticeModeCta({
  problemSlug,
  isFreeSolverEnabled,
  initialExperience = "practice",
}: PracticeModeCtaProps) {
  const [experience, setExperience] = useState<DsaExperience>(initialExperience);

  const primaryHref = useMemo(() => {
    if (experience === "practice" && isFreeSolverEnabled) {
      return `/practice/solve/${problemSlug}`;
    }

    return `/interview/setup?problem=${problemSlug}&dsaExperience=ai_interview`;
  }, [experience, isFreeSolverEnabled, problemSlug]);

  const primaryLabel = experience === "practice"
    ? isFreeSolverEnabled
      ? "Solve This Problem Free"
      : "Open in AI Interview Mode"
    : "Try 5-Minute Audio Interview";

  return (
    <section className="my-12 rounded-2xl border border-brand-cyan/20 bg-gradient-to-br from-brand-cyan/10 via-brand-surface to-brand-card px-6 py-8 sm:px-10">
      <div className="flex items-center gap-2 text-sm font-semibold text-brand-cyan">
        <Sparkles className="h-4 w-4" />
        One problem, two ways to prep
      </div>
      <h2 className="mt-3 text-xl font-bold text-brand-text sm:text-2xl">
        Choose between solo practice and interview simulation
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
        Practice Mode keeps things simple with code + tests. AI Interview Mode adds voice, pressure, and a post-round score summary.
      </p>

      <div className="mt-6">
        <DsaExperienceToggle
          value={experience}
          onChange={setExperience}
          practiceDescription={
            isFreeSolverEnabled
              ? "Open the LeetCode-style workspace with saved progress."
              : "This problem is not in the free solver subset yet."
          }
          aiDescription="Practice the same problem with a voice-based interviewer."
        />
      </div>

      {!isFreeSolverEnabled && experience === "practice" ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-amber/20 bg-brand-amber/10 px-3 py-1.5 text-xs text-brand-amber">
          <Lock className="h-3.5 w-3.5" />
          Practice Mode is available on the curated free subset only.
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href={primaryHref}>
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href={`/interview/setup?problem=${problemSlug}&dsaExperience=ai_interview`}>
            AI Interview Mode
          </Link>
        </Button>
      </div>
    </section>
  );
}
