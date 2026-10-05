import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProblemProse, renderConstraint } from "./ProblemProse";

// ─── Types ────────────────────────────────────────────────────────────────────

type Example = {
  input: string;
  output: string;
  explanation?: string;
};

type Problem = {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  description: string;
  examples: Example[];
  constraints: string[];
  hints: string[];
};

type ProblemPanelProps = {
  problem: Problem;
  showHints?: boolean;
};

// ─── Difficulty badge ─────────────────────────────────────────────────────────

const DIFFICULTY_STYLES = {
  easy: "text-brand-green border-brand-green/30",
  medium: "text-brand-amber border-brand-amber/30",
  hard: "text-brand-rose border-brand-rose/30",
} as const;

const DIFFICULTY_LABELS = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExampleBlock({
  example,
  index,
}: {
  example: Example;
  index: number;
}) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-white/[0.08]">
      <div className="border-b border-white/[0.08] px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-subtle">
          Example {index + 1}
        </span>
      </div>
      <div className="space-y-2.5 px-3 py-3">
        <div className="grid grid-cols-[52px_minmax(0,1fr)] items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle">
            Input
          </span>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-brand-text">
            {example.input}
          </pre>
        </div>
        <div className="grid grid-cols-[52px_minmax(0,1fr)] items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle">
            Output
          </span>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-brand-green">
            {example.output}
          </pre>
        </div>
        {example.explanation && (
          <div className="border-t border-white/[0.08] pt-2.5">
            <p className="text-xs leading-relaxed text-brand-muted [text-wrap:pretty]">
              {example.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function HintAccordion({ hints }: { hints: string[] }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [open, setOpen] = useState(false);

  if (!hints.length) return null;

  return (
    <div className="border-t border-white/[0.08] pt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-sm font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle transition-colors hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
      >
        <span className="flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5" />
          Hints ({hints.length} available)
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {hints.slice(0, revealedCount).map((hint, i) => (
            <div
              key={i}
              className="border-l border-white/[0.18] py-1 pl-3"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle">
                Hint {i + 1}
              </span>
              <p className="mt-1 text-xs leading-relaxed text-brand-text">
                {hint}
              </p>
            </div>
          ))}

          {revealedCount < hints.length && (
            <button
              onClick={() => setRevealedCount((c) => c + 1)}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-white/[0.18] px-3 py-2 text-xs text-brand-text transition-colors hover:border-brand-cyan hover:text-brand-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              {revealedCount === 0
                ? "Show first hint"
                : `Show hint ${revealedCount + 1}`}
            </button>
          )}

          {revealedCount === hints.length && hints.length > 0 && (
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle">
              All hints revealed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProblemPanel({ problem, showHints = true }: ProblemPanelProps) {
  return (
    <div className="h-full space-y-6 overflow-y-auto px-5 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-brand-border">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em]",
              DIFFICULTY_STYLES[problem.difficulty]
            )}
          >
            {DIFFICULTY_LABELS[problem.difficulty]}
          </span>
          <span className="rounded-full border border-white/[0.1] px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-muted">
            {problem.category}
          </span>
        </div>
        <h2 className="text-xl font-medium leading-snug tracking-[-0.02em] text-brand-text">
          {problem.title}
        </h2>
      </div>

      {/* Description */}
      <ProblemProse description={problem.description} />

      {/* Examples */}
      {problem.examples.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">
            Examples
          </h3>
          {problem.examples.map((ex, i) => (
            <ExampleBlock key={i} example={ex} index={i} />
          ))}
        </div>
      )}

      {/* Constraints */}
      {problem.constraints.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">
            Constraints
          </h3>
          <ul className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {problem.constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5 py-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-white/[0.24]" />
                <span className="font-mono text-xs leading-relaxed text-brand-muted">
                  {renderConstraint(c, `con-${i}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hints */}
      {showHints ? <HintAccordion hints={problem.hints} /> : null}
    </div>
  );
}
