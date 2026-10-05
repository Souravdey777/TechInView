"use client";

import { cn } from "@/lib/utils";
import { LANGUAGE_CONFIG } from "@/lib/constants";
import type { SupportedLanguage } from "@/lib/constants";
import { CHIP, LABEL, PANEL } from "@/components/marketing/ds";

type CodeReviewProps = {
  code: string;
  language: string;
  testsPassed: number;
  testsTotal: number;
};

function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return lang === "python" || lang === "javascript" || lang === "java" || lang === "cpp";
}

function getTestResultColor(passed: number, total: number): string {
  if (total === 0) return "text-brand-muted";
  const ratio = passed / total;
  if (ratio === 1) return "text-brand-green";
  if (ratio >= 0.5) return "text-brand-amber";
  return "text-brand-rose";
}

/**
 * Submitted code as the report's one framed specimen (PANEL): a mono file
 * header with the language and test tally, a thin per-test strip, then the
 * code itself.
 */
export function CodeReview({ code, language, testsPassed, testsTotal }: CodeReviewProps) {
  const langConfig = isSupportedLanguage(language)
    ? LANGUAGE_CONFIG[language]
    : { label: language, monacoId: language };

  const testColor = getTestResultColor(testsPassed, testsTotal);
  const failed = testsTotal - testsPassed;

  return (
    <div className="w-full">
      <h2 className="mb-6 text-2xl font-normal tracking-[-0.03em] text-brand-text sm:text-3xl">Submitted code</h2>

      <div className={cn(PANEL, "overflow-hidden")}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-3">
          <span className="font-mono text-xs text-brand-muted">
            solution.{isSupportedLanguage(language)
              ? language === "cpp" ? "cpp" : language === "java" ? "java" : language === "javascript" ? "js" : "py"
              : language}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className={CHIP}>{langConfig.label}</span>
            {testsTotal > 0 && (
              <span className={cn(CHIP, "tabular-nums", testColor)}>
                {testsPassed}/{testsTotal} tests passed
              </span>
            )}
          </div>
        </div>

        {/* Per-test strip */}
        {testsTotal > 0 && (
          <div className="border-b border-white/[0.08] px-5 py-4">
            <div className={cn(LABEL, "mb-3 flex items-center justify-between gap-3")}>
              <span>Test results</span>
              <span className={cn("tabular-nums", testColor)}>
                {Math.round((testsPassed / testsTotal) * 100)}% pass rate
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: testsTotal }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-0.5 min-w-[8px] flex-1",
                    i < testsPassed ? "bg-brand-green" : "bg-brand-rose/60"
                  )}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.08em] tabular-nums">
              <span className="text-brand-green">{testsPassed} passed</span>
              {failed > 0 && <span className="text-brand-rose">{failed} failed</span>}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <pre className="whitespace-pre p-5 font-mono text-[13px] leading-relaxed text-brand-text">
            <code>{code || "// No code submitted"}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
