import { executeCode } from "@/lib/piston";
import { LANGUAGE_CONFIG, type SupportedLanguage } from "@/lib/constants";
import {
  compareProblemOutputs,
  wrapCodeForExecution,
} from "@/lib/problem-execution-support";

export type ExecutableTestCase = {
  input: string;
  expected_output: string;
  is_hidden: boolean;
};

export type ExecutedTestResult = {
  id: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  isHidden: boolean;
};

export type CodeExecutionPayload = {
  stdout: string;
  stderr: string;
  exit_code: number;
  test_results: ExecutedTestResult[];
  message?: string;
};

export async function executeProblemCode(options: {
  language: string;
  code: string;
  testCases?: ExecutableTestCase[];
  problemSlug?: string;
}): Promise<CodeExecutionPayload> {
  const { language, code, testCases = [], problemSlug } = options;

  if (language === "java" || language === "cpp") {
    return {
      stdout: "",
      stderr: "",
      exit_code: 0,
      test_results: [],
      message: `${language === "java" ? "Java" : "C++"} execution coming soon. Please switch to Python or JavaScript to run code.`,
    };
  }

  const config = LANGUAGE_CONFIG[language as SupportedLanguage];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  if (testCases.length === 0) {
    const rawResult = await executeCode(config.pistonId, config.version, code);
    return {
      stdout: rawResult.stdout,
      stderr: rawResult.stderr,
      exit_code: rawResult.exit_code,
      test_results:
        rawResult.stderr && rawResult.exit_code !== 0
          ? [
              {
                id: "compile-error",
                input: "",
                expected: "",
                actual: rawResult.stderr.slice(0, 500),
                passed: false,
                isHidden: false,
              },
            ]
          : [],
      message:
        rawResult.exit_code === 0
          ? "Code executed successfully. No test cases available for comparison."
          : undefined,
    };
  }

  const firstWrapped = wrapCodeForExecution({
    language,
    userCode: code,
    stdin: testCases[0].input,
    problemSlug,
  });
  const firstResult = await executeCode(
    config.pistonId,
    config.version,
    firstWrapped.code,
    firstWrapped.stdin
  );

  if (firstResult.stderr && firstResult.exit_code !== 0) {
    return {
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
    };
  }

  const firstCase = testCases[0];
  const firstComparison = compareProblemOutputs({
    actual: firstResult.stdout,
    expected: firstCase.expected_output,
    input: firstCase.input,
    problemSlug,
  });
  const firstTestResult = {
    id: "test-1",
    input: firstCase.is_hidden ? "Hidden" : firstCase.input,
    expected: firstCase.is_hidden ? "Hidden" : firstCase.expected_output,
    actual:
      firstCase.is_hidden && !firstComparison.passed
        ? "Wrong answer"
        : firstComparison.actualDisplay || firstResult.stderr.slice(0, 200) || "No output",
    passed: firstComparison.passed,
    isHidden: firstCase.is_hidden,
  };

  const remainingResults = await Promise.all(
    testCases.slice(1).map(async (testCase, index) => {
      try {
        const wrapped = wrapCodeForExecution({
          language,
          userCode: code,
          stdin: testCase.input,
          problemSlug,
        });
        const result = await executeCode(
          config.pistonId,
          config.version,
          wrapped.code,
          wrapped.stdin
        );

        const comparison = compareProblemOutputs({
          actual: result.stdout,
          expected: testCase.expected_output,
          input: testCase.input,
          problemSlug,
        });

        return {
          id: `test-${index + 2}`,
          input: testCase.is_hidden ? "Hidden" : testCase.input,
          expected: testCase.is_hidden ? "Hidden" : testCase.expected_output,
          actual:
            testCase.is_hidden && !comparison.passed
              ? "Wrong answer"
              : comparison.actualDisplay || result.stderr.slice(0, 200) || "No output",
          passed: comparison.passed,
          isHidden: testCase.is_hidden,
        };
      } catch {
        return {
          id: `test-${index + 2}`,
          input: testCase.is_hidden ? "Hidden" : testCase.input,
          expected: testCase.is_hidden ? "Hidden" : testCase.expected_output,
          actual: "Execution timeout",
          passed: false,
          isHidden: testCase.is_hidden,
        };
      }
    })
  );

  return {
    stdout: firstResult.stdout,
    stderr: firstResult.stderr,
    exit_code: firstResult.exit_code,
    test_results: [firstTestResult, ...remainingResults],
  };
}
