"use client";
import { useState, useCallback } from "react";

type TestResult = {
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  is_hidden: boolean;
};

type ExecutionResult = {
  stdout: string;
  stderr: string;
  exit_code: number;
  test_results: TestResult[];
};

export function useCodeExecution() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCode = useCallback(
    async (interviewId: string, code: string, language: string) => {
      setIsRunning(true);
      setError(null);
      try {
        const res = await fetch("/api/interview/run-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId, code, language }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Execution failed");
        setResult(data.data);
        return data.data as ExecutionResult;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        return null;
      } finally {
        setIsRunning(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { runCode, isRunning, result, error, reset };
}
