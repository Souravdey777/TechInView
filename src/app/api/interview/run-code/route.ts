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

/**
 * Parse a test-case input string like `nums = [2,7,11,15], target = 9`
 * into an ordered list of {name, value} pairs.
 */
function parseTestInput(input: string): { name: string; value: string }[] {
  const params: { name: string; value: string }[] = [];
  let rest = input.trim();

  while (rest.length > 0) {
    const eqIdx = rest.indexOf("=");
    if (eqIdx === -1) break;

    const name = rest.slice(0, eqIdx).trim();
    rest = rest.slice(eqIdx + 1).trimStart();

    let depth = 0;
    let inStr: string | null = null;
    let i = 0;

    for (; i < rest.length; i++) {
      const ch = rest[i];
      if (inStr) {
        if (ch === inStr && rest[i - 1] !== "\\") inStr = null;
        continue;
      }
      if (ch === '"' || ch === "'") { inStr = ch; continue; }
      if (ch === "[" || ch === "{" || ch === "(") { depth++; continue; }
      if (ch === "]" || ch === "}" || ch === ")") { depth--; continue; }
      if (ch === "," && depth === 0) break;
    }

    params.push({ name, value: rest.slice(0, i).trim() });
    rest = rest.slice(i + 1).trimStart();
  }

  return params;
}

function wrapCodeForExecution(
  language: string,
  userCode: string,
  stdin: string
): { code: string; stdin: string } {
  const params = parseTestInput(stdin);
  if (params.length === 0) {
    return { code: userCode, stdin: "" };
  }

  const argValues = params.map((p) => p.value);

  if (language === "python") {
    const hasSolutionClass = /class\s+Solution\b/.test(userCode);
    const fnMatch = userCode.match(
      /def\s+(\w+)\s*\(\s*self\s*,/
    ) ?? userCode.match(
      /def\s+(\w+)\s*\(/
    );
    const fnName = fnMatch?.[1];

    if (!fnName) {
      return { code: userCode, stdin: "" };
    }

    const callArgs = argValues.join(", ");
    const driver = hasSolutionClass
      ? `\n__result = Solution().${fnName}(${callArgs})\n`
      : `\n__result = ${fnName}(${callArgs})\n`;

    const printer = [
      "if isinstance(__result, bool):",
      "    print(str(__result).lower())",
      "elif isinstance(__result, list):",
      "    import json",
      "    print(json.dumps(__result))",
      "else:",
      "    print(__result)",
    ].join("\n");

    return { code: userCode + "\n" + driver + printer, stdin: "" };
  }

  if (language === "javascript") {
    const fnMatch = userCode.match(
      /(?:function|const|let|var)\s+(\w+)/
    );
    const fnName = fnMatch?.[1];

    if (!fnName) {
      return { code: userCode, stdin: "" };
    }

    const callArgs = argValues.join(", ");
    const driver = [
      "",
      `const __result = ${fnName}(${callArgs});`,
      "if (typeof __result === 'boolean') {",
      "  console.log(__result ? 'true' : 'false');",
      "} else {",
      "  console.log(JSON.stringify(__result));",
      "}",
    ].join("\n");

    return { code: userCode + driver, stdin: "" };
  }

  return { code: userCode, stdin: "" };
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

    // No test cases: do a plain run and return the output
    if (testCases.length === 0) {
      const rawResult = await executeCode(config.pistonId, config.version, code);
      return NextResponse.json({
        success: true,
        data: {
          stdout: rawResult.stdout,
          stderr: rawResult.stderr,
          exit_code: rawResult.exit_code,
          test_results: rawResult.stderr && rawResult.exit_code !== 0
            ? [{
                id: "compile-error",
                input: "",
                expected: "",
                actual: rawResult.stderr.slice(0, 500),
                passed: false,
                isHidden: false,
              }]
            : [],
          message: rawResult.exit_code === 0
            ? "Code executed successfully. No test cases available for comparison."
            : undefined,
        },
      });
    }

    // Run the first test case to catch syntax/compile errors early
    const firstWrapped = wrapCodeForExecution(language, code, testCases[0].input);
    const firstResult = await executeCode(
      config.pistonId,
      config.version,
      firstWrapped.code,
      firstWrapped.stdin
    );

    if (firstResult.stderr && firstResult.exit_code !== 0) {
      return NextResponse.json({
        success: true,
        data: {
          stdout: firstResult.stdout,
          stderr: firstResult.stderr,
          exit_code: firstResult.exit_code,
          test_results: [
            {
              id: "compile-error",
              input: "",
              expected: "",
              actual: firstResult.stderr.slice(0, 500),
              passed: false,
              isHidden: false,
            },
          ],
        },
      });
    }

    // Build the first test result, then run remaining in parallel
    const firstActual = normalizeOutput(firstResult.stdout);
    const firstExpected = normalizeOutput(testCases[0].expected_output);
    const firstPassed = firstActual === firstExpected;
    const tc0 = testCases[0];
    const firstTestResult = {
      id: "test-1",
      input: tc0.is_hidden ? "Hidden" : tc0.input,
      expected: tc0.is_hidden ? "Hidden" : tc0.expected_output,
      actual: tc0.is_hidden && !firstPassed
        ? "Wrong answer"
        : firstActual || firstResult.stderr.slice(0, 200) || "No output",
      passed: firstPassed,
      isHidden: tc0.is_hidden,
    };

    const remainingResults = await Promise.all(
      testCases.slice(1).map(async (tc, i) => {
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
            id: `test-${i + 2}`,
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
            id: `test-${i + 2}`,
            input: tc.is_hidden ? "Hidden" : tc.input,
            expected: tc.is_hidden ? "Hidden" : tc.expected_output,
            actual: "Execution timeout",
            passed: false,
            isHidden: tc.is_hidden,
          };
        }
      })
    );

    const testResults = [firstTestResult, ...remainingResults];

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
        stdout: firstResult.stdout,
        stderr: firstResult.stderr,
        exit_code: firstResult.exit_code,
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
