import type { ReactNode } from "react";

import { renderConstraint } from "@/components/interview/ProblemProse";
import { LABEL } from "@/components/marketing/ds";
import { DIFFICULTY_CONFIG, type DifficultyLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The example, constraint and complexity blocks of a public problem page.
 * The room panel (`components/interview/ProblemPanel`) shows the same material
 * in a 340px column; these are the reading-width marketing versions.
 */

type Example = {
  input: string;
  output: string;
  explanation?: string;
  /** ASCII drawing of the input, where the catalog has one. */
  diagram?: string;
};

/** Framed code surface; matches PROSE's `pre` so statement code and examples agree. */
export const CODE_PANEL = "rounded-[16px] border border-white/[0.08] bg-[#0B0C0F]";

const DOT: Record<DifficultyLevel, string> = {
  easy: "bg-brand-green",
  medium: "bg-brand-amber",
  hard: "bg-brand-rose",
};

/** Quiet difficulty marker: semantic dot + mono label, no filled badge. */
export function DifficultyMark({ difficulty, className }: { difficulty: string; className?: string }) {
  const level = (difficulty in DIFFICULTY_CONFIG ? difficulty : "medium") as DifficultyLevel;
  return (
    <span
      className={cn(
        // Only the dot carries the semantic colour; the label stays muted (one-accent rule).
        "inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-muted",
        className
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", DOT[level])} />
      {DIFFICULTY_CONFIG[level].label}
    </span>
  );
}

/** Numbered section heading: "02 · Examples" over a hairline. */
export function SectionLabel({ children, id, n }: { children: ReactNode; id?: string; n?: string }) {
  return (
    <h2
      id={id}
      className="mb-6 border-b border-white/[0.08] pb-4 font-mono text-xs font-normal uppercase tracking-[0.14em] text-brand-subtle"
    >
      {n ? `${n} · ` : null}
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-4">
      <span className={cn(LABEL, "pt-px sm:text-right")}>{label}</span>
      {children}
    </div>
  );
}

export function ProblemExamples({ examples, n }: { examples: Example[]; n?: string }) {
  if (examples.length === 0) return null;

  return (
    <section className="mb-16">
      <SectionLabel n={n}>Examples</SectionLabel>
      <div className="space-y-4">
        {examples.map((example, i) => (
          <div key={i} className={cn(CODE_PANEL, "overflow-hidden")}>
            <div className="border-b border-white/[0.08] px-5 py-3">
              <span className={LABEL}>Example {String(i + 1).padStart(2, "0")}</span>
            </div>

            <div className="space-y-3 px-5 py-5">
              {example.diagram && (
                <figure className="mb-2 overflow-x-auto border-b border-white/[0.06] pb-4">
                  <pre className="font-mono text-[13px] leading-[1.7] text-brand-muted" aria-label="Diagram of the input">
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
                <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-brand-cyan">
                  {example.output}
                </pre>
              </Field>

              {example.explanation && (
                <div className="border-t border-white/[0.06] pt-3">
                  <p className="text-pretty text-[15px] leading-relaxed text-brand-muted">{example.explanation}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProblemConstraints({ constraints, n }: { constraints: string[]; n?: string }) {
  if (constraints.length === 0) return null;

  return (
    <section className="mb-16">
      <SectionLabel n={n}>Constraints</SectionLabel>
      <ul className="border-t border-white/[0.08]">
        {constraints.map((constraint, i) => (
          <li
            key={i}
            className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 border-b border-white/[0.08] py-3"
          >
            <span className={cn(LABEL, "pt-0.5")}>{String(i + 1).padStart(2, "0")}</span>
            <span className="break-words font-mono text-[13px] leading-relaxed text-brand-muted">
              {renderConstraint(constraint, `con-${i}`)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
