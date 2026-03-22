"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, CheckCircle2, XCircle, Terminal } from "lucide-react";
import { LANGUAGE_CONFIG } from "@/lib/constants";
import type { SupportedLanguage } from "@/lib/constants";

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

function getTestResultBg(passed: number, total: number): string {
  if (total === 0) return "bg-brand-surface border-brand-border";
  const ratio = passed / total;
  if (ratio === 1) return "bg-brand-green/10 border-brand-green/30";
  if (ratio >= 0.5) return "bg-brand-amber/10 border-brand-amber/30";
  return "bg-brand-rose/10 border-brand-rose/30";
}

export function CodeReview({ code, language, testsPassed, testsTotal }: CodeReviewProps) {
  const langConfig = isSupportedLanguage(language)
    ? LANGUAGE_CONFIG[language]
    : { label: language, monacoId: language };

  const allPassed = testsTotal > 0 && testsPassed === testsTotal;
  const testColor = getTestResultColor(testsPassed, testsTotal);
  const testBg = getTestResultBg(testsPassed, testsTotal);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Code2 className="h-4 w-4 text-brand-cyan" />
            Submitted Code
          </CardTitle>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Language badge */}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
              {langConfig.label}
            </span>

            {/* Test results badge */}
            {testsTotal > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
                  testBg,
                  testColor
                )}
              >
                {allPassed ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {testsPassed}/{testsTotal} tests passed
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Test results bar */}
        {testsTotal > 0 && (
          <div className="mb-4 rounded-lg border border-brand-border bg-brand-surface p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-brand-muted" />
                <span className="text-xs font-medium text-brand-text">Test Results</span>
              </div>
              <span className={cn("text-xs font-semibold", testColor)}>
                {testsTotal > 0
                  ? `${Math.round((testsPassed / testsTotal) * 100)}% pass rate`
                  : "No tests run"}
              </span>
            </div>

            {/* Progress bar made of dots */}
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: testsTotal }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 flex-1 min-w-[8px] rounded-full",
                    i < testsPassed ? "bg-brand-green" : "bg-brand-rose/50"
                  )}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="flex items-center gap-1 text-xs text-brand-green">
                <CheckCircle2 className="h-3 w-3" />
                {testsPassed} passed
              </span>
              {testsTotal - testsPassed > 0 && (
                <span className="flex items-center gap-1 text-xs text-brand-rose">
                  <XCircle className="h-3 w-3" />
                  {testsTotal - testsPassed} failed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Code block */}
        <div className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-brand-border bg-brand-deep/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-brand-rose/60" />
              <div className="w-3 h-3 rounded-full bg-brand-amber/60" />
              <div className="w-3 h-3 rounded-full bg-brand-green/60" />
            </div>
            <span className="text-xs text-brand-muted ml-1 font-mono">
              solution.{isSupportedLanguage(language)
                ? language === "cpp" ? "cpp" : language === "java" ? "java" : language === "javascript" ? "js" : "py"
                : language}
            </span>
          </div>
          <div className="overflow-x-auto">
            <pre className="p-4 text-sm font-mono text-brand-text leading-relaxed whitespace-pre">
              <code>{code || "// No code submitted"}</code>
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
