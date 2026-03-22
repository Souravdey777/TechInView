import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

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
};

// ─── Difficulty badge ─────────────────────────────────────────────────────────

const DIFFICULTY_STYLES = {
  easy: "bg-brand-green/10 text-brand-green border-brand-green/30",
  medium: "bg-brand-amber/10 text-brand-amber border-brand-amber/30",
  hard: "bg-brand-rose/10 text-brand-rose border-brand-rose/30",
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
    <div className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden">
      <div className="border-b border-brand-border px-3 py-1.5">
        <span className="text-xs font-medium text-brand-muted">
          Example {index + 1}
        </span>
      </div>
      <div className="space-y-2 px-3 py-2.5">
        <div>
          <span className="text-xs font-semibold text-brand-muted">Input</span>
          <pre className="mt-0.5 font-mono text-xs text-brand-text leading-relaxed whitespace-pre-wrap break-all">
            {example.input}
          </pre>
        </div>
        <div>
          <span className="text-xs font-semibold text-brand-muted">Output</span>
          <pre className="mt-0.5 font-mono text-xs text-brand-cyan leading-relaxed whitespace-pre-wrap break-all">
            {example.output}
          </pre>
        </div>
        {example.explanation && (
          <div>
            <span className="text-xs font-semibold text-brand-muted">
              Explanation
            </span>
            <p className="mt-0.5 text-xs text-brand-muted leading-relaxed">
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
    <div className="border-t border-brand-border pt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-medium text-brand-muted hover:text-brand-text transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-brand-amber" />
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
              className="rounded-lg border border-brand-amber/20 bg-brand-amber/5 px-3 py-2.5"
            >
              <span className="text-xs font-semibold text-brand-amber">
                Hint {i + 1}
              </span>
              <p className="mt-0.5 text-xs text-brand-text leading-relaxed">
                {hint}
              </p>
            </div>
          ))}

          {revealedCount < hints.length && (
            <button
              onClick={() => setRevealedCount((c) => c + 1)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand-amber/30 px-3 py-2 text-xs font-medium text-brand-amber hover:bg-brand-amber/5 transition-colors"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              {revealedCount === 0
                ? "Show first hint"
                : `Show hint ${revealedCount + 1}`}
            </button>
          )}

          {revealedCount === hints.length && hints.length > 0 && (
            <p className="text-center text-xs text-brand-muted">
              All hints revealed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProblemPanel({ problem }: ProblemPanelProps) {
  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-brand-border">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              DIFFICULTY_STYLES[problem.difficulty]
            )}
          >
            {DIFFICULTY_LABELS[problem.difficulty]}
          </span>
          <span className="rounded-full border border-brand-border bg-brand-card px-2.5 py-0.5 text-xs text-brand-muted capitalize">
            {problem.category}
          </span>
        </div>
        <h2 className="text-base font-bold text-brand-text leading-snug">
          {problem.title}
        </h2>
      </div>

      {/* Description */}
      <div>
        <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">
          {problem.description}
        </p>
      </div>

      {/* Examples */}
      {problem.examples.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
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
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Constraints
          </h3>
          <ul className="space-y-1">
            {problem.constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-cyan" />
                <span className="font-mono text-xs text-brand-muted leading-relaxed">
                  {c}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hints */}
      <HintAccordion hints={problem.hints} />
    </div>
  );
}
