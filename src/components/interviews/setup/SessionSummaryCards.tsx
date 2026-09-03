"use client";

import { cn } from "@/lib/utils";
import { VoiceVisualizer } from "@/components/interview/VoiceVisualizer";
import { SetupMonoLabel } from "@/components/interviews/setup/SetupRack";
import type { InterviewerPersona } from "@/lib/interviewer-personas";

/**
 * Voice-orb summary of the interviewer who will run the round.
 * The orb is a fixed 76px body with an overflowing glow, so it is scaled on a
 * wrapper that reserves enough room for the glow.
 */
export function InterviewerVoiceCard({ persona }: { persona: InterviewerPersona }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-brand-card p-5 sm:p-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-40 w-40 items-center justify-center">
          <div className="scale-[1.35]">
            <VoiceVisualizer state="idle" />
          </div>
        </div>
        <p className="font-heading text-xl font-bold tracking-tight text-brand-text">
          {persona.name}
        </p>
        <p className="mt-2">
          <SetupMonoLabel>
            {persona.companyLabel} · {persona.voiceModel}
          </SetupMonoLabel>
        </p>
        <p className="mt-3 text-xs leading-relaxed text-brand-muted">
          {persona.shortStyleSummary}
        </p>
      </div>
      <div className="mt-5 border-t border-brand-border pt-4">
        <SetupMonoLabel>Opener</SetupMonoLabel>
        <p className="mt-2 text-xs italic leading-relaxed text-brand-muted">
          “{persona.greeting}”
        </p>
      </div>
    </section>
  );
}

export type SessionFact = {
  label: string;
  value: string;
  emphasis?: boolean;
};

/** Key/value rail panel describing the session that is about to start. */
export function SessionFactsCard({
  title,
  facts,
}: {
  title: string;
  facts: readonly SessionFact[];
}) {
  return (
    <section className="rounded-2xl border border-brand-border bg-brand-card p-5">
      <SetupMonoLabel>{title}</SetupMonoLabel>
      <dl className="mt-4 space-y-3">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className={cn(
              "flex items-baseline justify-between gap-3",
              fact.emphasis && "border-t border-brand-border pt-3"
            )}
          >
            <dt className="text-xs text-brand-muted">{fact.label}</dt>
            <dd
              className={cn(
                "font-mono text-xs",
                fact.emphasis ? "font-semibold text-brand-cyan" : "text-brand-text"
              )}
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Rail panel walking through the shape of the round, step by step. */
export function SessionStepsCard({
  title,
  steps,
}: {
  title: string;
  steps: readonly string[];
}) {
  return (
    <section className="rounded-2xl border border-brand-border bg-brand-card p-5">
      <SetupMonoLabel>{title}</SetupMonoLabel>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="font-mono text-[10px] font-semibold leading-5 text-brand-cyan">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-xs leading-5 text-brand-muted">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
