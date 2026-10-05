import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTechnicalQaRoundContext } from "../technical-qa";

test("no frameworks scopes the round to language basics", () => {
  const round = buildTechnicalQaRoundContext({ language: "python", frameworks: [] });

  assert.match(round.prompt, /Scope: language basics only/);
  assert.match(round.prompt, /Do not ask about frameworks/);
  assert.match(round.summary, /no framework questions/);
});

test("picked frameworks keep the stack prompt and skip the basics scope", () => {
  const round = buildTechnicalQaRoundContext({ language: "javascript", frameworks: ["react"] });

  assert.doesNotMatch(round.prompt, /Scope: language basics only/);
  assert.match(round.prompt, /with React/);
});
