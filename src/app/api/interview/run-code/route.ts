import { NextRequest, NextResponse } from "next/server";
import { executeCode } from "@/lib/piston";
import { LANGUAGE_CONFIG, type SupportedLanguage } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { captureServerEvent } from "@/lib/posthog/server";

type TestCase = {
  input: string;
  expected_output: string;
  is_hidden: boolean;
};

function wrapCodeForExecution(
  language: string,
  userCode: string,
  stdin: string
): { code: string; stdin: string } {
  // Generic stdin-based execution: user code runs with test input as stdin.
  // The test case `input` is passed as stdin and stdout is compared to `expected_output`.
  // Problem starter code should read from stdin and print to stdout.
  // For function-based problems (LeetCode style), we rely on the user providing
  // a main block or use the wrapping below for common patterns.

  switch (language) {
    case "python":
      // Run user code as-is with stdin provided. User code is expected to
      // read stdin and print the result.
      return { code: userCode, stdin };

    case "javascript":
      // Run user code as-is with stdin provided via process.stdin.
      return { code: userCode, stdin };

    default:
      return { code: userCode, stdin };
  }
}

function normalizeOutput(s: string): string {
  return s.trim().replace(/\s+/g, " ").replace(/,\s*/g, ", ");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, language, problemSlug, testCases: bodyTestCases } = body;

    if (!code || !language) {
      return NextResponse.json(
        { success: false, error: "code and language are required" },
        { status: 400 }
      );
    }

    // Java and C++ are not supported via Wandbox in V1
    if (language === "java" || language === "cpp") {
      return NextResponse.json({
        success: true,
        data: {
          stdout: "",
          stderr: "",
          exit_code: 0,
          test_results: [],
          message: `${language === "java" ? "Java" : "C++"} execution coming soon. Please switch to Python or JavaScript to run code.`,
        },
      });
    }

    const config = LANGUAGE_CONFIG[language as SupportedLanguage];
    if (!config) {
      return NextResponse.json(
        { success: false, error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    // Resolve test cases: DB > body > none
    let testCases: TestCase[] = [];

    if (problemSlug) {
      const { getProblemBySlug } = await import("@/lib/db/queries");
      const problem = await getProblemBySlug(problemSlug);
      if (problem?.test_cases) {
        testCases = problem.test_cases as TestCase[];
      }
    } else if (bodyTestCases && Array.isArray(bodyTestCases)) {
      testCases = bodyTestCases as TestCase[];
    }

    // First, do a raw syntax-check run with no stdin
    const rawResult = await executeCode(config.pistonId, config.version, code);

    if (rawResult.stderr && rawResult.exit_code !== 0) {
      return NextResponse.json({
        success: true,
        data: {
          stdout: rawResult.stdout,
          stderr: rawResult.stderr,
          exit_code: rawResult.exit_code,
          test_results: [
            {
              id: "compile-error",
              input: "",
              expected: "",
              actual: rawResult.stderr.slice(0, 500),
              passed: false,
              isHidden: false,
            },
          ],
        },
      });
    }

    // No test cases: just return the raw run result
    if (testCases.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          stdout: rawResult.stdout,
          stderr: rawResult.stderr,
          exit_code: rawResult.exit_code,
          test_results: [],
          message: "Code executed successfully. No test cases available for comparison.",
        },
      });
    }

    // Run against all test cases in parallel
    const testResults = await Promise.all(
      testCases.map(async (tc, i) => {
        try {
          const wrapped = wrapCodeForExecution(language, code, tc.input);
          const result = await executeCode(
            config.pistonId,
            config.version,
            wrapped.code,
            wrapped.stdin
          );

          const actual = normalizeOutput(result.stdout);
          const expected = normalizeOutput(tc.expected_output);
          const passed = actual === expected;

          return {
            id: `test-${i + 1}`,
            input: tc.is_hidden ? "Hidden" : tc.input,
            expected: tc.is_hidden ? "Hidden" : tc.expected_output,
            actual:
              tc.is_hidden && !passed
                ? "Wrong answer"
                : actual || result.stderr.slice(0, 200) || "No output",
            passed,
            isHidden: tc.is_hidden,
          };
        } catch {
          return {
            id: `test-${i + 1}`,
            input: tc.is_hidden ? "Hidden" : tc.input,
            expected: tc.is_hidden ? "Hidden" : tc.expected_output,
            actual: "Execution timeout",
            passed: false,
            isHidden: tc.is_hidden,
          };
        }
      })
    );

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const passed = testResults.filter((t) => t.passed).length;
        captureServerEvent(user.id, "code_executed", {
          language,
          tests_passed: passed,
          tests_total: testResults.length,
        });
      }
    } catch {
      // analytics should never block the response
    }

    return NextResponse.json({
      success: true,
      data: {
        stdout: rawResult.stdout,
        stderr: rawResult.stderr,
        exit_code: rawResult.exit_code,
        test_results: testResults,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to execute code";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
