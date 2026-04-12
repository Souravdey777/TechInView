import { executeCode } from "@/lib/piston";
import { LANGUAGE_CONFIG, type SupportedLanguage } from "@/lib/constants";

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
      if (ch === '"' || ch === "'") {
        inStr = ch;
        continue;
      }
      if (ch === "[" || ch === "{" || ch === "(") {
        depth++;
        continue;
      }
      if (ch === "]" || ch === "}" || ch === ")") {
        depth--;
        continue;
      }
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
    const fnMatch =
      userCode.match(/def\s+(\w+)\s*\(\s*self\s*,/) ?? userCode.match(/def\s+(\w+)\s*\(/);
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
    const fnMatch = userCode.match(/(?:function|const|let|var)\s+(\w+)/);
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

export async function executeProblemCode(options: {
  language: string;
  code: string;
  testCases?: ExecutableTestCase[];
}): Promise<CodeExecutionPayload> {
  const { language, code, testCases = [] } = options;

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

  const firstWrapped = wrapCodeForExecution(language, code, testCases[0].input);
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

  const firstActual = normalizeOutput(firstResult.stdout);
  const firstExpected = normalizeOutput(testCases[0].expected_output);
  const firstPassed = firstActual === firstExpected;
  const firstCase = testCases[0];
  const firstTestResult = {
    id: "test-1",
    input: firstCase.is_hidden ? "Hidden" : firstCase.input,
    expected: firstCase.is_hidden ? "Hidden" : firstCase.expected_output,
    actual:
      firstCase.is_hidden && !firstPassed
        ? "Wrong answer"
        : firstActual || firstResult.stderr.slice(0, 200) || "No output",
    passed: firstPassed,
    isHidden: firstCase.is_hidden,
  };

  const remainingResults = await Promise.all(
    testCases.slice(1).map(async (testCase, index) => {
      try {
        const wrapped = wrapCodeForExecution(language, code, testCase.input);
        const result = await executeCode(
          config.pistonId,
          config.version,
          wrapped.code,
          wrapped.stdin
        );

        const actual = normalizeOutput(result.stdout);
        const expected = normalizeOutput(testCase.expected_output);
        const passed = actual === expected;

        return {
          id: `test-${index + 2}`,
          input: testCase.is_hidden ? "Hidden" : testCase.input,
          expected: testCase.is_hidden ? "Hidden" : testCase.expected_output,
          actual:
            testCase.is_hidden && !passed
              ? "Wrong answer"
              : actual || result.stderr.slice(0, 200) || "No output",
          passed,
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
