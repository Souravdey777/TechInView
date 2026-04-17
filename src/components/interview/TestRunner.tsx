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
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border px-3 py-2",
          result.passed
            ? "border-brand-green/20 bg-brand-green/5"
            : "border-brand-rose/20 bg-brand-rose/5"
        )}
      >
        <div className="flex items-center gap-2">
          {result.passed ? (
            <CheckCircle className="h-4 w-4 text-brand-green" />
          ) : (
            <XCircle className="h-4 w-4 text-brand-rose" />
          )}
          <EyeOff className="h-3.5 w-3.5 text-brand-muted" />
          <span className="text-xs text-brand-muted">Hidden Test {index + 1}</span>
        </div>
        <span
          className={cn(
            "text-xs font-semibold",
            result.passed ? "text-brand-green" : "text-brand-rose"
          )}
        >
          {result.passed ? "Pass" : "Fail"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden",
        result.passed
          ? "border-brand-green/20 bg-brand-green/5"
          : "border-brand-rose/20 bg-brand-rose/5"
      )}
    >
      {/* Header row */}
      <div
        className={cn(
          "flex items-center justify-between border-b px-3 py-1.5",
          result.passed ? "border-brand-green/20" : "border-brand-rose/20"
        )}
      >
        <div className="flex items-center gap-2">
          {result.passed ? (
            <CheckCircle className="h-4 w-4 text-brand-green" />
          ) : (
            <XCircle className="h-4 w-4 text-brand-rose" />
          )}
          <span className="text-xs font-medium text-brand-text">
            Test {index + 1}
          </span>
        </div>
        <span
          className={cn(
            "text-xs font-semibold",
            result.passed ? "text-brand-green" : "text-brand-rose"
          )}
        >
          {result.passed ? "Pass" : "Fail"}
        </span>
      </div>

      {/* Detail rows */}
      <div className="grid grid-cols-1 gap-2 px-3 py-2 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
            Input
          </p>
          <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-brand-text">
            {result.input}
          </pre>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
            Expected
          </p>
          <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-brand-cyan">
            {result.expected}
          </pre>
        </div>
        {result.actual !== undefined && (
          <div className="sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
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
    <div className="flex h-full flex-col bg-brand-card border-t border-brand-border">
      {/* Summary bar */}
      <div className="flex flex-col gap-2 border-b border-brand-border px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-brand-text">
            Test Results
          </span>
          {total > 0 && !isRunning && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                allPassed
                  ? "bg-brand-green/10 text-brand-green"
                  : "bg-brand-rose/10 text-brand-rose"
              )}
            >
              {passed}/{total} passed
            </span>
          )}
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-brand-amber">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Running…
          </div>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && !isRunning && (
        <div className="h-1 w-full bg-brand-border">
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
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {isRunning ? (
          <div className="flex h-full items-center justify-center py-4">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
              <p className="text-xs text-brand-muted">Executing your code…</p>
            </div>
          </div>
        ) : total === 0 ? (
          <div className="flex h-full items-center justify-center py-4">
            <p className="text-xs text-brand-muted">
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
