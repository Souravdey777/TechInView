import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { z } from "zod";
import {
  getProblemExecutionSupport,
  parseTestInput,
  wrapCodeForExecution,
} from "../src/lib/problem-execution-support";

const PROBLEMS_DIR = path.join(process.cwd(), "src/data/problems");
const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
const PROBLEM_CATEGORIES = [
  "arrays",
  "strings",
  "trees",
  "graphs",
  "dp",
  "linked-lists",
  "stacks-queues",
  "binary-search",
  "heap",
  "backtracking",
  "sliding-window",
  "trie",
] as const;

const exampleSchema = z.object({
  input: z.string().min(1),
  output: z.string().min(1),
  explanation: z.string().min(1),
});

const testCaseSchema = z.object({
  input: z.string().min(1),
  expected_output: z.string().min(1),
  is_hidden: z.boolean(),
});

const problemSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  category: z.enum(PROBLEM_CATEGORIES),
  company_tags: z.array(z.string().min(1)).min(1),
  description: z.string().min(1),
  examples: z.array(exampleSchema).min(1),
  constraints: z.array(z.string().min(1)).min(1),
  starter_code: z.object({
    python: z.string().min(1),
    javascript: z.string().min(1),
    java: z.string().min(1),
    cpp: z.string().min(1),
  }),
  test_cases: z.array(testCaseSchema).min(1),
  solution_approach: z.string().min(1),
  hints: z.array(z.string().min(1)).min(1),
  optimal_complexity: z.object({
    time: z.string().min(1),
    space: z.string().min(1),
  }),
  follow_up_questions: z.array(z.string().min(1)).min(1),
});

type Problem = z.infer<typeof problemSchema>;
type IssueLevel = "error" | "warning";

type Issue = {
  level: IssueLevel;
  code: string;
  problem: string;
  message: string;
};

function extractParameterNames(signature: string): string[] {
  return signature
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(":")[0]?.split("=")[0]?.trim() ?? "")
    .filter(Boolean)
    .filter((part) => part !== "self");
}

function analyzePythonStubParams(code: string): string[] | null {
  const stripped = code.replace(/^\s*#.*$/gm, "");
  const hasSolutionClass = /^\s*class\s+Solution\b/m.test(stripped);

  if (hasSolutionClass) {
    const solutionSource = stripped.slice(stripped.search(/^\s*class\s+Solution\b/m));
    const methodMatch = solutionSource.match(/^\s+def\s+\w+\s*\(([^)]*)\)/m);
    if (methodMatch) {
      return extractParameterNames(methodMatch[1]);
    }
  }

  const topLevelMatch = stripped.match(/^def\s+\w+\s*\(([^)]*)\)/m);
  if (topLevelMatch) {
    return extractParameterNames(topLevelMatch[1]);
  }

  return null;
}

function runCommand(
  command: string,
  args: string[]
): { ok: boolean; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    });
    return { ok: true, stdout, stderr: "" };
  } catch (error) {
    const err = error as {
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      message?: string;
    };
    return {
      ok: false,
      stdout: typeof err.stdout === "string" ? err.stdout : err.stdout?.toString() ?? "",
      stderr: typeof err.stderr === "string" ? err.stderr : err.stderr?.toString() ?? err.message ?? "",
    };
  }
}

function shortenError(stderr: string): string {
  const lines = stderr
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.slice(-2).join(" | ");
}

function hasFlexibleOutputContract(problem: Problem): boolean {
  return /return .*any order|answer in .*any order|output .*does not matter|also a valid answer|return any valid|can return either|any of the peaks/i.test(
    problem.description
  );
}

function formatProblemList(problems: string[]): string {
  return problems.sort().join(", ");
}

function main() {
  const issues: Issue[] = [];
  const seenSlugs = new Map<string, string>();
  const seenTitles = new Map<string, string>();

  const files = fs
    .readdirSync(PROBLEMS_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();

  for (const file of files) {
    const filePath = path.join(PROBLEMS_DIR, file);
    const problemName = file.replace(/\.json$/, "");

    let rawProblem: unknown;
    try {
      rawProblem = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      issues.push({
        level: "error",
        code: "invalid_json",
        problem: problemName,
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    const parsed = problemSchema.safeParse(rawProblem);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      issues.push({
        level: "error",
        code: "schema_validation_failed",
        problem: problemName,
        message: details,
      });
      continue;
    }

    const problem = parsed.data;
    const support = getProblemExecutionSupport(problem.slug);

    if (file !== `${problem.slug}.json`) {
      issues.push({
        level: "error",
        code: "filename_slug_mismatch",
        problem: problem.slug,
        message: `filename is ${file}`,
      });
    }

    const existingSlug = seenSlugs.get(problem.slug);
    if (existingSlug) {
      issues.push({
        level: "error",
        code: "duplicate_slug",
        problem: problem.slug,
        message: `also declared in ${existingSlug}`,
      });
    } else {
      seenSlugs.set(problem.slug, file);
    }

    const existingTitle = seenTitles.get(problem.title);
    if (existingTitle) {
      issues.push({
        level: "error",
        code: "duplicate_title",
        problem: problem.slug,
        message: `title also used in ${existingTitle}`,
      });
    } else {
      seenTitles.set(problem.title, file);
    }

    const visibleCount = problem.test_cases.filter((testCase) => !testCase.is_hidden).length;
    const hiddenCount = problem.test_cases.filter((testCase) => testCase.is_hidden).length;
    if (visibleCount !== 3 || hiddenCount !== 2) {
      issues.push({
        level: "warning",
        code: "non_standard_test_case_count",
        problem: problem.slug,
        message: `found ${visibleCount} visible and ${hiddenCount} hidden test cases`,
      });
    }

    const testPairs = new Set(
      problem.test_cases.map((testCase) => `${testCase.input}|||${testCase.expected_output}`)
    );
    for (const example of problem.examples) {
      if (!testPairs.has(`${example.input}|||${example.output}`)) {
        issues.push({
          level: "warning",
          code: "example_not_covered_by_test_cases",
          problem: problem.slug,
          message: `missing example input "${example.input}" in test_cases`,
        });
      }
    }

    if (!support.handlesStructuredData && !support.handlesClassApi) {
      const firstTestCase = problem.test_cases[0];
      const parsedInputNames = parseTestInput(firstTestCase.input).map((param) => param.name);
      const stubParams = analyzePythonStubParams(problem.starter_code.python);
      if (
        stubParams &&
        parsedInputNames.length > 0 &&
        JSON.stringify(parsedInputNames) !== JSON.stringify(stubParams)
      ) {
        issues.push({
          level: "error",
          code: "stub_input_param_mismatch",
          problem: problem.slug,
          message: `test input params [${parsedInputNames.join(", ")}] do not match stub params [${stubParams.join(", ")}]`,
        });
      }
    }

    if (hasFlexibleOutputContract(problem) && !support.handlesFlexibleOutput) {
      issues.push({
        level: "warning",
        code: "unsupported_flexible_output_contract",
        problem: problem.slug,
        message: "problem description allows multiple valid outputs, but the runner uses exact comparison",
      });
    }

    const firstTestCase = problem.test_cases[0];
    const wrappedPython = wrapCodeForExecution({
      language: "python",
      userCode: problem.starter_code.python,
      stdin: firstTestCase.input,
      problemSlug: problem.slug,
    });
    const pythonResult = runCommand("python3", ["-c", wrappedPython.code]);
    if (!pythonResult.ok) {
      issues.push({
        level: "error",
        code: "python_runner_invocation_failed",
        problem: problem.slug,
        message: shortenError(pythonResult.stderr),
      });
    }

    const wrappedJavascript = wrapCodeForExecution({
      language: "javascript",
      userCode: problem.starter_code.javascript,
      stdin: firstTestCase.input,
      problemSlug: problem.slug,
    });
    const jsResult = runCommand("node", ["-e", wrappedJavascript.code]);
    if (!jsResult.ok) {
      issues.push({
        level: "error",
        code: "javascript_runner_invocation_failed",
        problem: problem.slug,
        message: shortenError(jsResult.stderr),
      });
    } else if (jsResult.stdout.trim().length === 0) {
      issues.push({
        level: "warning",
        code: "javascript_runner_no_output",
        problem: problem.slug,
        message: "runner executed without producing comparable output",
      });
    }
  }

  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warning");

  console.log(`Verified ${files.length} problem files in ${PROBLEMS_DIR}`);
  console.log("");
  console.log(
    errors.length === 0
      ? "Structural validation: PASS"
      : `Structural validation: FAIL (${errors.length} error${errors.length === 1 ? "" : "s"})`
  );
  console.log(
    `Warnings: ${warnings.length} issue${warnings.length === 1 ? "" : "s"} across ${new Set(warnings.map((issue) => issue.problem)).size} problem files`
  );

  const groupedIssues = new Map<string, Issue[]>();
  for (const issue of issues) {
    const key = `${issue.level}:${issue.code}`;
    const bucket = groupedIssues.get(key) ?? [];
    bucket.push(issue);
    groupedIssues.set(key, bucket);
  }

  console.log("");
  for (const [key, bucket] of [...groupedIssues.entries()].sort()) {
    const [level, code] = key.split(":");
    const problems = [...new Set(bucket.map((issue) => issue.problem))];
    console.log(`[${level}] ${code} (${bucket.length})`);
    console.log(`  Problems: ${formatProblemList(problems)}`);
    if (bucket.length <= 3) {
      for (const issue of bucket) {
        console.log(`  - ${issue.problem}: ${issue.message}`);
      }
    }
    console.log("");
  }

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

main();
