"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { CodeEditor } from "@/components/interview/CodeEditor";
import { PanelResizeHandle } from "@/components/interview/PanelResizeHandle";
import { ProblemPanel } from "@/components/interview/ProblemPanel";
import { TestRunner, type TestResult } from "@/components/interview/TestRunner";
import { PracticeControls } from "./PracticeControls";
import { useResizablePanel } from "@/hooks/useResizablePanel";
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

const DIFFICULTY_STYLES = {
  easy: "border-brand-green/30 bg-brand-green/10 text-brand-green",
  medium: "border-brand-amber/30 bg-brand-amber/10 text-brand-amber",
  hard: "border-brand-rose/30 bg-brand-rose/10 text-brand-rose",
} as const;

export function PracticeSolverWorkspace({
  problem,
  initialAttempt,
}: PracticeSolverWorkspaceProps) {
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

  // ── Resizable panel state (shared with the AI interview room) ─────────────
  const { width: panelWidth, isDragging, handleResizeStart, handleTouchResizeStart } =
    useResizablePanel();

  const currentCode = codeByLanguage[language] ?? problem.starter_code[language] ?? "";
  const lastSavedAt = initialAttempt ? new Date(initialAttempt.updatedAt).toLocaleString() : null;
  const interviewHref = `/interview/setup?problem=${problem.slug}&dsaExperience=ai_interview`;

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

  const handleRunCode = useCallback(async () => {
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
  }, [currentCode, language, persistAttempt, posthog, problem.slug]);

  function handleLanguageChange(nextLanguage: SupportedLanguage) {
    setLanguage(nextLanguage);
  }

  function handleCodeChange(nextCode: string) {
    setCodeByLanguage((prev) => ({
      ...prev,
      [language]: nextCode,
    }));
  }

  function handleResetCode() {
    const starter = problem.starter_code[language] ?? "";
    setCodeByLanguage((prev) => ({ ...prev, [language]: starter }));
    setTestResults([]);
    setError(null);
    posthog?.capture("practice_code_reset", {
      problem_slug: problem.slug,
      language,
    });
  }

  function handleUpgradeClick() {
    posthog?.capture("practice_upgrade_clicked", {
      problem_slug: problem.slug,
      source: "solver_workspace",
    });
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-brand-deep overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-brand-border bg-brand-card px-4">
        <div className="flex min-w-0 shrink items-center gap-3">
          <BrandLogo size="sm" wordmarkClassName="text-sm" />
          <span className="h-4 w-px shrink-0 bg-brand-border" aria-hidden />
          <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-subtle">
            Practice Mode
          </span>
          <span className="truncate text-xs text-brand-muted">{problem.title}</span>
          <span
            className={cn(
              "shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]",
              DIFFICULTY_STYLES[problem.difficulty]
            )}
          >
            {problem.difficulty}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleResetCode}
            className="flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-muted transition-colors hover:border-brand-subtle hover:text-brand-text"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset code
          </button>
          <Link
            href={interviewHref}
            onClick={handleUpgradeClick}
            className="flex items-center gap-1.5 rounded-lg bg-brand-cyan px-3 py-1.5 text-xs font-semibold text-brand-deep transition-colors hover:bg-brand-cyan/90"
          >
            Interview this one
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel (resizable) ── */}
        <aside
          className="flex shrink-0 flex-col border-r border-brand-border bg-brand-surface overflow-hidden"
          style={{ width: `${panelWidth}px` }}
        >
          <div className="flex flex-1 flex-col overflow-hidden">
            <ProblemPanel problem={problem} />
          </div>
        </aside>

        {/* ── Resize handle ── */}
        <PanelResizeHandle
          isDragging={isDragging}
          onMouseDown={handleResizeStart}
          onTouchStart={handleTouchResizeStart}
        />

        {/* ── Editor + tests ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              language={language}
              value={currentCode}
              onChange={handleCodeChange}
              onRunCode={handleRunCode}
              onLanguageChange={handleLanguageChange}
            />
          </div>

          {error && (
            <div className="shrink-0 border-t border-brand-rose/30 bg-brand-rose/10 px-4 py-2 text-xs text-brand-rose">
              {error}
            </div>
          )}

          <div className="h-48 shrink-0 overflow-hidden">
            <TestRunner testResults={testResults} isRunning={isRunning} />
          </div>
        </main>
      </div>

      {/* ── Bottom bar ── */}
      <PracticeControls
        language={language}
        saveLabel={saveLabel}
        testsPassed={testsPassed}
        testsTotal={testsTotal}
        isSolved={isSolved}
        isRunning={isRunning}
        onRunCode={handleRunCode}
      />
    </div>
  );
}
