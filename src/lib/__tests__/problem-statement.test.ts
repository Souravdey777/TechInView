import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  diagramsForExamples,
  parseEmbeddedExamples,
  stripEmbeddedExamples,
} from "../problems/statement";

const PROBLEM_DIR = path.join(process.cwd(), "src/data/problems");

type Problem = {
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
};

function allProblems() {
  return readdirSync(PROBLEM_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({
      file: f,
      data: JSON.parse(
        readFileSync(path.join(PROBLEM_DIR, f), "utf8")
      ) as Problem,
    }));
}

test("parses the input and the diagram above it out of an example fence", () => {
  const description = [
    "Given the `root` of a binary tree, return its depth.",
    "",
    "**Example 1:**",
    "```",
    "    3",
    "   / \\",
    "  9  20",
    "",
    "Input: root = [3,9,20]",
    "Output: 2",
    "```",
  ].join("\n");

  assert.deepEqual(parseEmbeddedExamples(description), [
    { diagram: "    3\n   / \\\n  9  20", input: "root = [3,9,20]" },
  ]);
});

test("an example with no diagram parses as an empty one", () => {
  const description = "Sum them.\n\n**Example 1:**\n```\nInput: nums = [1]\nOutput: 1\n```";
  assert.deepEqual(parseEmbeddedExamples(description), [
    { diagram: "", input: "nums = [1]" },
  ]);
});

test("a description with no examples yields none", () => {
  assert.deepEqual(parseEmbeddedExamples("Just a statement."), []);
});

test("a diagram only lands on a structured example with the same input", () => {
  const description = [
    "Statement.",
    "",
    "**Example 1:**",
    "```",
    "  2",
    " / \\",
    "1   3",
    "",
    "Input: root = [2,1,3]",
    "Output: true",
    "```",
  ].join("\n");

  assert.deepEqual(
    diagramsForExamples(description, [{ input: "root = [2,1,3]" }]),
    ["  2\n / \\\n1   3"]
  );
  // The two lists were authored separately and diverge across the catalog, so
  // a mismatched input must not inherit somebody else's tree.
  assert.deepEqual(
    diagramsForExamples(description, [{ input: "root = [5,1,4]" }]),
    [undefined]
  );
});

test("every catalog diagram finds its structured example", () => {
  // 12 fences across the catalog draw the input as ASCII above `Input:`. Losing
  // one to a wording change in either list should fail here, not silently drop
  // the picture off the page.
  let carried = 0;

  for (const { file, data } of allProblems()) {
    const embedded = parseEmbeddedExamples(data.description);
    const diagrams = diagramsForExamples(data.description, data.examples);
    const drawn = embedded.filter((e) => e.diagram.trim()).length;
    const attached = diagrams.filter(Boolean).length;

    assert.equal(
      attached,
      drawn,
      `${file}: ${drawn} diagram(s) in prose but ${attached} attached`
    );
    carried += attached;
  }

  assert.equal(carried, 12);
});

test("no example survives in the prose the page renders", () => {
  for (const { file, data } of allProblems()) {
    const statement = stripEmbeddedExamples(data.description);
    assert.ok(
      !/\bInput:|\bOutput:|\*\*Example/.test(statement),
      `${file}: an example is still in the statement prose`
    );
  }
});
