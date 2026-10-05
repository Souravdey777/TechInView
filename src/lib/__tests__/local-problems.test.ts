import assert from "node:assert/strict";
import test from "node:test";
import { localProblemCatalog } from "../db/local-problems";

test("local problem catalog mirrors src/data/problems for DB-less dev", () => {
  const problems = localProblemCatalog();
  assert.ok(problems.length > 0);
  const twoSum = problems.find((p) => p.slug === "two-sum");
  assert.ok(twoSum, "two-sum should be present");
  assert.equal(twoSum.id, "local:two-sum");
  assert.ok(Array.isArray(twoSum.company_tags));
  // sorted by title like the SQL query
  const titles = problems.map((p) => p.title);
  assert.deepEqual(titles, [...titles].sort((a, b) => a.localeCompare(b)));
});
