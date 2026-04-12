"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  Play,
  Save,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/interview/CodeEditor";
import { ProblemPanel } from "@/components/interview/ProblemPanel";
import { TestRunner, type TestResult } from "@/components/interview/TestRunner";
import type { SupportedLanguage } from "@/lib/constants";

type ProblemExample = {
  input: string;
  output: string;
  explanation?: string;
};

type PracticeProblem = {
  id: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  description: string;
  examples: ProblemExample[];
  constraints: string[];
  hints: string[];
  starter_code: Record<SupportedLanguage, string>;
};

type PracticeAttemptSnapshot = {
  language: SupportedLanguage;
  lastCode: string | null;
  testsPassed: number | null;
  testsTotal: number | null;
  isSolved: boolean;
  updatedAt: string;
} | null;

type PracticeSolverWorkspaceProps = {
  problem: PracticeProblem;
  initialAttempt: PracticeAttemptSnapshot;
};

type RunCodeResponse = {
  success: boolean;
  data?: {
    stdout: string;
    stderr: string;
    exit_code: number;
    message?: string;
    test_results: TestResult[];
  };
  error?: string;
};

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  "python",
  "javascript",
  "java",
  "cpp",
];

export function PracticeSolverWorkspace({
  problem,
  initialAttempt,
}: PracticeSolverWorkspaceProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const [language, setLanguage] = useState<SupportedLanguage>(initialAttempt?.language ?? "python");
  const [codeByLanguage, setCodeByLanguage] = useState<Record<SupportedLanguage, string>>(() => {
    const defaults = SUPPORTED_LANGUAGES.reduce(
      (acc, currentLanguage) => ({
        ...acc,
        [currentLanguage]: problem.starter_code[currentLanguage] ?? "",
      }),
      {} as Record<SupportedLanguage, string>
    );

    if (initialAttempt?.language && initialAttempt.lastCode) {
      defaults[initialAttempt.language] = initialAttempt.lastCode;
    }

    return defaults;
  });
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [testsPassed, setTestsPassed] = useState<number | null>(initialAttempt?.testsPassed ?? null);
  const [testsTotal, setTestsTotal] = useState<number | null>(initialAttempt?.testsTotal ?? null);
  const [isSolved, setIsSolved] = useState(initialAttempt?.isSolved ?? false);
  const hasMountedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCode = codeByLanguage[language] ?? problem.starter_code[language] ?? "";
  const lastSavedAt = initialAttempt ? new Date(initialAttempt.updatedAt).toLocaleString() : null;

  const persistAttempt = useCallback(
    async (payload?: {
      code?: string;
      language?: SupportedLanguage;
      testsPassed?: number | null;
      testsTotal?: number | null;
      isSolved?: boolean;
    }) => {
      setSaveState("saving");
      try {
        const res = await fetch("/api/practice/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problemSlug: problem.slug,
            language: payload?.language ?? language,
            code: payload?.code ?? currentCode,
            testsPassed: payload?.testsPassed ?? testsPassed,
            testsTotal: payload?.testsTotal ?? testsTotal,
            isSolved: payload?.isSolved ?? isSolved,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to save progress");
        }

        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [currentCode, isSolved, language, problem.slug, testsPassed, testsTotal]
  );

  useEffect(() => {
    posthog?.capture(initialAttempt ? "practice_resumed" : "practice_started", {
      problem_slug: problem.slug,
      language,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      void persistAttempt();
    }, 900);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentCode, language, persistAttempt]);

  const saveLabel = useMemo(() => {
    if (saveState === "saving") return "Saving...";
    if (saveState === "saved") return "Saved";
    if (saveState === "error") return "Save failed";
    return lastSavedAt ? `Last saved ${lastSavedAt}` : "Progress autosaves";
  }, [lastSavedAt, saveState]);

  async function handleRunCode() {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: problem.slug,
          language,
          code: currentCode,
        }),
      });

      const json = (await res.json()) as RunCodeResponse;
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error ?? "Failed to run code");
      }

      setTestResults(json.data.test_results);
      const passed = json.data.test_results.filter((test) => test.passed).length;
      const total = json.data.test_results.length;
      const solved = total > 0 && passed === total;
      setTestsPassed(passed);
      setTestsTotal(total);
      setIsSolved(solved);

      posthog?.capture("practice_code_run", {
        problem_slug: problem.slug,
        language,
        tests_passed: passed,
        tests_total: total,
        is_solved: solved,
      });

      await persistAttempt({
        testsPassed: passed,
        testsTotal: total,
        isSolved: solved,
      });
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Failed to run code");
    } finally {
      setIsRunning(false);
    }
  }

  function handleLanguageChange(nextLanguage: SupportedLanguage) {
    setLanguage(nextLanguage);
  }

  function handleCodeChange(nextCode: string) {
    setCodeByLanguage((prev) => ({
      ...prev,
      [language]: nextCode,
    }));
  }

  function handleUpgradeClick() {
    posthog?.capture("practice_upgrade_clicked", {
      problem_slug: problem.slug,
      source: "solver_workspace",
    });
    router.push(`/interview/setup?problem=${problem.slug}&dsaExperience=ai_interview`);
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-brand-border bg-brand-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
              Practice Mode
            </p>
            <h1 className="mt-2 text-2xl font-bold text-brand-text">{problem.title}</h1>
            <p className="mt-1 text-sm text-brand-muted">
              Solve on your own, run tests whenever you want, and switch to AI Interview Mode when you want pressure and feedback.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleRunCode}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Code
                </>
              )}
            </Button>
            <Button type="button" onClick={handleUpgradeClick}>
              Try 5-Minute Audio Interview
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]">
          <section className="overflow-hidden rounded-2xl border border-brand-border bg-brand-card">
            <ProblemPanel problem={problem} showHints={false} />
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-brand-cyan/20 bg-brand-cyan/5 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-text">Want the real interview feel?</p>
                  <p className="mt-1 text-sm text-brand-muted">
                    AI Interview Mode adds voice back-and-forth, interview pressure, and a scored review of your performance.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-brand-muted">
                  <span className="rounded-full border border-brand-cyan/20 bg-brand-surface px-3 py-1">
                    Voice interviewer
                  </span>
                  <span className="rounded-full border border-brand-cyan/20 bg-brand-surface px-3 py-1">
                    Real-time pressure
                  </span>
                  <span className="rounded-full border border-brand-cyan/20 bg-brand-surface px-3 py-1">
                    Score + transcript
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border bg-brand-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-4 py-3">
                <div className="flex items-center gap-3 text-xs text-brand-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    {saveLabel}
                  </span>
                  {testsTotal !== null ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
                      {testsPassed}/{testsTotal} tests
                    </span>
                  ) : null}
                  {isSolved ? (
                    <span className="inline-flex items-center gap-1.5 text-brand-green">
                      <Sparkles className="h-3.5 w-3.5" />
                      Solved
                    </span>
                  ) : null}
                </div>
                <Link
                  href={`/interview/setup?problem=${problem.slug}&dsaExperience=ai_interview`}
                  className="text-xs font-medium text-brand-cyan hover:underline"
                >
                  Open in AI Interview Mode
                </Link>
              </div>
              <div className="h-[28rem] overflow-hidden">
                <CodeEditor
                  language={language}
                  value={currentCode}
                  onChange={handleCodeChange}
                  onRunCode={handleRunCode}
                  onLanguageChange={handleLanguageChange}
                />
              </div>
            </div>

            <div className="h-[18rem] overflow-hidden rounded-2xl border border-brand-border bg-brand-card">
              <TestRunner testResults={testResults} isRunning={isRunning} />
            </div>

            {error ? (
              <div className="rounded-xl border border-brand-rose/20 bg-brand-rose/5 px-4 py-3 text-sm text-brand-rose">
                {error}
              </div>
            ) : null}

            <div className="rounded-xl border border-brand-border bg-brand-card px-4 py-3 text-xs text-brand-muted">
              <div className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" />
                <span>Use Ctrl/Cmd + Enter to run code quickly.</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
