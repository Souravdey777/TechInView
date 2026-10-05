"use client";

import { CheckCircle, XCircle, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TestResult = {
  id: string;
  input: string;
  expected: string;
  actual?: string;
  passed: boolean;
  isHidden: boolean;
};

type TestRunnerProps = {
  testResults: TestResult[];
  isRunning: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function summarize(results: TestResult[]): { passed: number; total: number } {
  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TestRow({
  result,
  index,
}: {
  result: TestResult;
  index: number;
}) {
  if (result.isHidden) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          {result.passed ? (
            <CheckCircle className="h-4 w-4 text-brand-green" />
          ) : (
            <XCircle className="h-4 w-4 text-brand-rose" />
          )}
          <EyeOff className="h-3.5 w-3.5 text-brand-muted" />
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-muted">Hidden Test {index + 1}</span>
        </div>
        <span
          className={cn(
            "font-mono text-[11px] uppercase tracking-[0.1em]",
            result.passed ? "text-brand-green" : "text-brand-rose"
          )}
        >
          {result.passed ? "Pass" : "Fail"}
        </span>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {result.passed ? (
            <CheckCircle className="h-4 w-4 text-brand-green" />
          ) : (
            <XCircle className="h-4 w-4 text-brand-rose" />
          )}
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-text">
            Test {index + 1}
          </span>
        </div>
        <span
          className={cn(
            "font-mono text-[11px] uppercase tracking-[0.1em]",
            result.passed ? "text-brand-green" : "text-brand-rose"
          )}
        >
          {result.passed ? "Pass" : "Fail"}
        </span>
      </div>

      {/* Detail rows */}
      <div className="mt-2 grid grid-cols-1 gap-2 pl-6 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle">
            Input
          </p>
          <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-brand-text">
            {result.input}
          </pre>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle">
            Expected
          </p>
          <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-brand-text">
            {result.expected}
          </pre>
        </div>
        {result.actual !== undefined && (
          <div className="sm:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle">
              Your Output
            </p>
            <pre
              className={cn(
                "mt-0.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs",
                result.passed ? "text-brand-green" : "text-brand-rose"
              )}
            >
              {result.actual}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TestRunner({ testResults, isRunning }: TestRunnerProps) {
  const { passed, total } = summarize(testResults);
  const allPassed = passed === total && total > 0;
  const progressPct = total > 0 ? (passed / total) * 100 : 0;

  return (
    <div className="flex h-full flex-col border-t border-white/[0.08] bg-brand-deep">
      {/* Summary bar */}
      <div className="flex flex-col gap-2 border-b border-white/[0.08] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">
            Test Results
          </span>
          {total > 0 && !isRunning && (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 font-mono text-[11px] tabular-nums uppercase tracking-[0.08em]",
                allPassed
                  ? "border-brand-green/30 text-brand-green"
                  : "border-brand-rose/30 text-brand-rose"
              )}
            >
              {passed}/{total} passed
            </span>
          )}
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-brand-amber">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Running…
          </div>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && !isRunning && (
        <div className="h-px w-full bg-white/[0.06]">
          <div
            className={cn(
              "h-full transition-all duration-500",
              allPassed ? "bg-brand-green" : "bg-brand-rose"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Test list */}
      <div className="flex-1 divide-y divide-white/[0.08] overflow-y-auto px-4 py-1">
        {isRunning ? (
          <div className="flex h-full items-center justify-center py-4">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">Executing your code…</p>
            </div>
          </div>
        ) : total === 0 ? (
          <div className="flex h-full items-center justify-center py-4">
            <p className="text-xs text-brand-subtle">
              Run your code to see test results.
            </p>
          </div>
        ) : (
          testResults.map((result, i) => (
            <TestRow key={result.id} result={result} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
