import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { stripEmbeddedExamples } from "../../components/interview/ProblemProse";

const PROBLEM_DIR = path.join(process.cwd(), "src/data/problems");

function allProblems() {
  return readdirSync(PROBLEM_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({
      file: f,
      data: JSON.parse(readFileSync(path.join(PROBLEM_DIR, f), "utf8")) as {
        description?: string;
        examples?: unknown[];
      },
    }));
}

test("stripEmbeddedExamples drops the prose copy of the examples", () => {
  const description =
    "Return the indices.\n\n**Example 1:**\n```\nInput: nums = [1]\nOutput: [0]\n```";
  const stripped = stripEmbeddedExamples(description);
  assert.equal(stripped, "Return the indices.");
  assert.ok(!stripped.includes("Example"));
});

test("stripEmbeddedExamples leaves a description with no examples alone", () => {
  const description = "Just a statement with `code` and **bold**.";
  assert.equal(stripEmbeddedExamples(description), description);
});

test("every catalog problem keeps prose after its examples are stripped", () => {
  for (const { file, data } of allProblems()) {
    const stripped = stripEmbeddedExamples(data.description ?? "");
    assert.ok(
      stripped.length > 0,
      `${file}: stripping examples emptied the description`
    );
  }
});

test("every catalog problem has balanced code fences once stripped", () => {
  // ProblemProse splits on ``` and treats odd segments as code, so an odd
  // number of fences would render prose as code.
  for (const { file, data } of allProblems()) {
    const stripped = stripEmbeddedExamples(data.description ?? "");
    const fences = stripped.split("```").length - 1;
    assert.equal(fences % 2, 0, `${file}: unbalanced code fence (${fences})`);
  }
});

test("no catalog problem leaves markdown unrendered", () => {
  const inline = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  for (const { file, data } of allProblems()) {
    const stripped = stripEmbeddedExamples(data.description ?? "");
    stripped.split("```").forEach((block, i) => {
      if (i % 2 === 1) return; // fenced code renders verbatim
      const plain = block.replace(inline, "");
      assert.ok(
        !/`|\*\*/.test(plain),
        `${file}: unmatched markdown left in prose — ${JSON.stringify(
          plain.match(/.{0,30}(`|\*\*).{0,20}/)?.[0]
        )}`
      );
    });
  }
});
