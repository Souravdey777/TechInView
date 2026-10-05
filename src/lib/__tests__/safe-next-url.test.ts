import assert from "node:assert/strict";
import test from "node:test";
import { safeNextUrl } from "../supabase/middleware";

const at = (next: string) =>
  safeNextUrl({ nextUrl: new URL(`https://techinview.dev/signup?next=${encodeURIComponent(next)}`) }).toString();

test("safeNextUrl keeps same-origin paths and rejects off-site redirects", () => {
  assert.equal(at("/interview/setup?dsaExperience=practice"), "https://techinview.dev/interview/setup?dsaExperience=practice");
  for (const evil of ["//evil.com", "/\\evil.com", "\\\\evil.com", "https://evil.com", "/\\/evil.com", "javascript:alert(1)"]) {
    assert.equal(at(evil), "https://techinview.dev/dashboard", evil);
  }
});
