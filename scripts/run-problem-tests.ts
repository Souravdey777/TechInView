// Runs a reference solution against a problem's test_cases through the real runner wrapper.
// Usage: node --import tsx scripts/run-problem-tests.ts <slug> <solution.py|solution.js>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { compareProblemOutputs, wrapCodeForExecution } from "../src/lib/problem-execution-support";

const [slug, solutionPath] = process.argv.slice(2);
if (!slug || !solutionPath) {
  console.error("usage: run-problem-tests.ts <slug> <solution.py|solution.js>");
  process.exit(2);
}

const problem = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src/data/problems", `${slug}.json`), "utf8")
);
const language = solutionPath.endsWith(".py") ? "python" : "javascript";
const userCode = fs.readFileSync(solutionPath, "utf8");
let failed = 0;

for (const [i, tc] of problem.test_cases.entries()) {
  const wrapped = wrapCodeForExecution({ language, userCode, stdin: tc.input, problemSlug: slug });
  let actual = "";
  try {
    actual = execFileSync(language === "python" ? "python3" : "node", [language === "python" ? "-c" : "-e", wrapped.code], {
      input: wrapped.stdin,
      encoding: "utf8",
      timeout: 10_000,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    const err = error as { stderr?: string };
    actual = `RUNTIME_ERROR: ${(err.stderr ?? String(error)).trim().split("\n").slice(-2).join(" | ")}`;
  }
  const result = compareProblemOutputs({ actual, expected: tc.expected_output, input: tc.input, problemSlug: slug });
  if (!result.passed) failed++;
  console.log(
    `${result.passed ? "PASS" : "FAIL"} #${i}${tc.is_hidden ? " (hidden)" : ""} input=${tc.input} expected=${result.expectedDisplay} actual=${result.actualDisplay}`
  );
}

console.log(`${problem.test_cases.length - failed}/${problem.test_cases.length} passed`);
process.exitCode = failed ? 1 : 0;
