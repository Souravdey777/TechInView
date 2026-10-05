"use client";

import { cn } from "@/lib/utils";
import { MonoLabel, Rack } from "@/components/shared/Rack";

export type SessionFact = {
  label: string;
  value: string;
  emphasis?: boolean;
};

/** Hairline key/value rail rack describing the session that is about to start. */
export function SessionFactsCard({
  title,
  facts,
}: {
  title: string;
  facts: readonly SessionFact[];
}) {
  return (
    <Rack label={<MonoLabel>{title}</MonoLabel>} bodyClassName="py-2 sm:py-2">
      <dl className="divide-y divide-white/[0.08]">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex items-baseline justify-between gap-3 py-3"
          >
            <dt className="text-sm text-brand-muted">{fact.label}</dt>
            <dd
              className={cn(
                "text-right tabular-nums",
                fact.emphasis
                  ? "text-lg font-normal tracking-[-0.02em] text-brand-text"
                  : "font-mono text-xs text-brand-text"
              )}
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </Rack>
  );
}

/** Hairline rail rack walking through the shape of the round, step by step. */
export function SessionStepsCard({
  title,
  steps,
}: {
  title: string;
  steps: readonly string[];
}) {
  return (
    <Rack label={<MonoLabel>{title}</MonoLabel>} bodyClassName="py-2 sm:py-2">
      <ol className="divide-y divide-white/[0.08]">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-4 py-3">
            <span className="font-mono text-[11px] leading-5 text-brand-subtle">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-sm leading-5 text-brand-muted">{step}</span>
          </li>
        ))}
      </ol>
    </Rack>
  );
}
