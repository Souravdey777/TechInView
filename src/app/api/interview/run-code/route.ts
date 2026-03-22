import { NextRequest, NextResponse } from "next/server";
import { executeCode } from "@/lib/piston";
import { LANGUAGE_CONFIG, type SupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/constants";

// Mock test cases for Two Sum (until we wire up real DB)
const MOCK_TEST_CASES = [
  { input: "[2,7,11,15]\n9", expected_output: "[0, 1]", is_hidden: false },
  { input: "[3,2,4]\n6", expected_output: "[1, 2]", is_hidden: false },
  { input: "[3,3]\n6", expected_output: "[0, 1]", is_hidden: true },
];

// Wrappers that call the user's function and print the result
function wrapCode(language: string, userCode: string, testInput: string): { code: string; stdin: string } {
  const [numsStr, targetStr] = testInput.split("\n");

  switch (language) {
    case "python":
      return {
        code: `${userCode}\n\nimport json\nnums = json.loads('${numsStr}')\ntarget = ${targetStr}\nresult = twoSum(nums, target)\nprint(json.dumps(sorted(result)))`,
        stdin: "",
      };
    case "javascript":
      return {
        code: `${userCode}\n\nconst nums = ${numsStr};\nconst target = ${targetStr};\nconst result = twoSum(nums, target);\nconsole.log(JSON.stringify(result.sort((a,b)=>a-b)));`,
        stdin: "",
      };
    default:
      return { code: userCode, stdin: testInput };
  }
}

function normalizeOutput(s: string): string {
  return s.trim().replace(/\s+/g, " ").replace(/,\s*/g, ", ");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, language } = body;

    if (!code || !language) {
      return NextResponse.json(
        { success: false, error: "code and language are required" },
        { status: 400 }
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
      return NextResponse.json(
        { success: false, error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    const config = LANGUAGE_CONFIG[language as SupportedLanguage];

    // First, just run the raw code to check for syntax errors
    const rawResult = await executeCode(config.pistonId, config.version, code);

    if (rawResult.stderr && rawResult.exit_code !== 0) {
      return NextResponse.json({
        success: true,
        data: {
          stdout: rawResult.stdout,
          stderr: rawResult.stderr,
          exit_code: rawResult.exit_code,
          test_results: [{
            id: "compile-error",
            input: "",
            expected: "",
            actual: rawResult.stderr.slice(0, 500),
            passed: false,
            isHidden: false,
          }],
        },
      });
    }

    // Run against test cases
    const testResults = [];

    for (let i = 0; i < MOCK_TEST_CASES.length; i++) {
      const tc = MOCK_TEST_CASES[i];
      try {
        const wrapped = wrapCode(language, code, tc.input);
        const result = await executeCode(config.pistonId, config.version, wrapped.code, wrapped.stdin);

        const actual = normalizeOutput(result.stdout);
        const expected = normalizeOutput(tc.expected_output);
        const passed = actual === expected;

        testResults.push({
          id: `test-${i + 1}`,
          input: tc.is_hidden ? "Hidden" : tc.input.replace("\n", ", target = "),
          expected: tc.is_hidden ? "Hidden" : tc.expected_output,
          actual: tc.is_hidden && !passed ? "Wrong answer" : actual || result.stderr.slice(0, 200) || "No output",
          passed,
          isHidden: tc.is_hidden,
        });
      } catch {
        testResults.push({
          id: `test-${i + 1}`,
          input: tc.is_hidden ? "Hidden" : tc.input,
          expected: tc.is_hidden ? "Hidden" : tc.expected_output,
          actual: "Execution timeout",
          passed: false,
          isHidden: tc.is_hidden,
        });
      }
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
  } catch (_error) {
    const msg = _error instanceof Error ? _error.message : "Failed to execute code";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
