"use client";

import { cn } from "@/lib/utils";
import { SetupMonoLabel } from "@/components/interviews/setup/SetupRack";

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
