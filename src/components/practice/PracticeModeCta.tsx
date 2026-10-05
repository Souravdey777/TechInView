"use client";

import { useState } from "react";
import { BODY, ButtonLink, CELL, Eyebrow, GRID, LABEL } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";
import { DEFAULT_DSA_EXPERIENCE, type DsaExperience } from "@/lib/dsa";

type PracticeModeCtaProps = {
  problemSlug: string;
  isFreeSolverEnabled: boolean;
  initialExperience?: DsaExperience;
  /** Section number for the eyebrow, e.g. "05". */
  n?: string;
};

export function PracticeModeCta({
  problemSlug,
  isFreeSolverEnabled,
  initialExperience = DEFAULT_DSA_EXPERIENCE,
  n,
}: PracticeModeCtaProps) {
  const [experience, setExperience] = useState<DsaExperience>(initialExperience);

  const interviewHref = `/interview/setup?problem=${problemSlug}&dsaExperience=ai_interview`;
  const canSolve = experience === "practice" && isFreeSolverEnabled;
  const primaryHref = canSolve ? `/practice/solve/${problemSlug}` : interviewHref;
  const primaryLabel =
    experience === "practice"
      ? isFreeSolverEnabled
        ? "Solve this problem free"
        : "Take it as an AI interview"
      : "Start a voice interview on this problem";

  const options: { id: DsaExperience; label: string; description: string }[] = [
    {
      id: "practice",
      label: "Practice Mode",
      description: isFreeSolverEnabled
        ? "Code in the browser, run the tests, and pick up where you left off."
        : "This problem is not in the free practice set yet.",
    },
    {
      id: "ai_interview",
      label: "AI Interview Mode",
      description: "Work through the same problem out loud with a voice interviewer.",
    },
  ];

  return (
    <section className="my-16 border-t border-white/[0.08] pt-12" aria-labelledby="practice-mode-cta">
      <Eyebrow n={n}>Two ways to work on it</Eyebrow>
      <h2
        id="practice-mode-cta"
        className="max-w-[20ch] text-balance text-[clamp(28px,3.4vw,44px)] font-normal leading-[1.05] tracking-[-0.035em]"
      >
        Practice it alone or rehearse it as an interview.
      </h2>
      <p className={cn(BODY, "mt-5 max-w-[560px]")}>
        Practice Mode gives you an editor and test runs, nothing else. AI Interview Mode puts a voice interviewer on the
        other side, adds a clock, and ends with a scored summary of the round.
      </p>

      <div className={cn(GRID, "mt-10 sm:grid-cols-2")} role="group" aria-label="Choose a mode">
        {options.map((option, i) => {
          const active = experience === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => setExperience(option.id)}
              className={cn(
                CELL,
                "px-6 py-6 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan",
                active ? "bg-brand-cyan/[0.06]" : "hover:bg-white/[0.02]"
              )}
            >
              <span className={cn(LABEL, active && "text-brand-cyan")}>
                {String(i + 1).padStart(2, "0")} · {active ? "Selected" : "Select"}
              </span>
              <span className={cn("mt-3 block text-lg tracking-[-0.02em]", active ? "text-brand-cyan" : "text-brand-text")}>
                {option.label}
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-brand-muted">{option.description}</span>
            </button>
          );
        })}
      </div>

      {!isFreeSolverEnabled && experience === "practice" ? (
        <p className={cn(LABEL, "mt-5 inline-flex items-center gap-2 text-brand-amber")}>
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand-amber" />
          Practice Mode is only available for problems in the free set
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={primaryHref}>
          {primaryLabel} <span className="font-mono" aria-hidden>→</span>
        </ButtonLink>
        {canSolve ? (
          <ButtonLink href={interviewHref} variant="ghost">
            AI Interview Mode
          </ButtonLink>
        ) : null}
      </div>
    </section>
  );
}
