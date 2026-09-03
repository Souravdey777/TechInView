import type { ReactNode } from "react";

import { renderConstraint } from "@/components/interview/ProblemProse";

/**
 * The example, constraint and complexity blocks of a problem page. The room
 * panel (`components/interview/ProblemPanel`) shows the same material in a
 * 340px column; these are the reading-width versions — same label grammar and
 * same colour roles, larger type.
 */

type Example = {
  input: string;
  output: string;
  explanation?: string;
  /** ASCII drawing of the input, where the catalog has one. */
  diagram?: string;
};

/** Mono, tracked, uppercase — the label voice used across the product. */
export function SectionLabel({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="mb-4 border-b border-brand-border pb-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-brand-subtle"
    >
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[68px_minmax(0,1fr)] sm:gap-4">
      <span className="pt-px font-mono text-[10px] uppercase tracking-[0.14em] text-brand-subtle sm:text-right">
        {label}
      </span>
      {children}
    </div>
  );
}

export function ProblemExamples({ examples }: { examples: Example[] }) {
  if (examples.length === 0) return null;

  return (
    <section className="mb-12">
      <SectionLabel>Examples</SectionLabel>
      <div className="space-y-4">
        {examples.map((example, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface"
          >
            <div className="border-b border-brand-border bg-brand-card/60 px-4 py-2">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-brand-muted">
                Example {i + 1}
              </span>
            </div>

            <div className="space-y-3 px-4 py-4">
              {example.diagram && (
                <figure className="my-1 overflow-x-auto rounded-lg bg-brand-deep px-4 py-3">
                  <pre
                    className="font-mono text-[13px] leading-[1.7] text-brand-muted"
                    aria-label="Diagram of the input"
                  >
                    {example.diagram}
                  </pre>
                </figure>
              )}

              <Field label="Input">
                <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-brand-text">
                  {example.input}
                </pre>
              </Field>

              <Field label="Output">
                <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-brand-green">
                  {example.output}
                </pre>
              </Field>

              {example.explanation && (
                <div className="border-t border-brand-border pt-3">
                  <p className="text-sm leading-relaxed text-brand-muted [text-wrap:pretty]">
                    {example.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProblemConstraints({ constraints }: { constraints: string[] }) {
  if (constraints.length === 0) return null;

  return (
    <section className="mb-12">
      <SectionLabel>Constraints</SectionLabel>
      <ul className="space-y-2 rounded-xl border border-brand-border bg-brand-surface px-4 py-3.5">
        {constraints.map((constraint, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand-cyan"
              aria-hidden
            />
            <span className="font-mono text-[13px] leading-relaxed text-brand-muted">
              {renderConstraint(constraint, `con-${i}`)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
