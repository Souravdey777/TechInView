import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PHASE_ORDER,
  phaseFromElapsedFraction,
  resolveAgentPhase,
} from "../interview-phases";

test("resolveAgentPhase advances when the agent moves forward", () => {
  assert.equal(
    resolveAgentPhase("INTRO", "PROBLEM_PRESENTED", "INTRO"),
    "PROBLEM_PRESENTED",
  );
  assert.equal(
    resolveAgentPhase("CLARIFICATION", "CODING", "INTRO"),
    "CODING",
  );
});

test("resolveAgentPhase never moves backward", () => {
  // The agent re-emitting INTRO after the problem was presented used to reset
  // the phase, which re-armed the INTRO instruction and made the interviewer
  // narrate the problem a second time.
  assert.equal(
    resolveAgentPhase("PROBLEM_PRESENTED", "INTRO", "INTRO"),
    "PROBLEM_PRESENTED",
  );
  assert.equal(
    resolveAgentPhase("CODING", "CLARIFICATION", "INTRO"),
    "CODING",
  );
  assert.equal(resolveAgentPhase("WRAP_UP", "INTRO", "INTRO"), "WRAP_UP");
});

test("resolveAgentPhase holds a repeated phase steady", () => {
  for (const phase of PHASE_ORDER) {
    assert.equal(resolveAgentPhase(phase, phase, "INTRO"), phase);
  }
});

test("resolveAgentPhase still respects the time floor", () => {
  const lateFloor = phaseFromElapsedFraction(0.9);
  assert.equal(
    resolveAgentPhase("INTRO", "INTRO", lateFloor),
    lateFloor,
    "a stalled agent is still pulled forward by elapsed time",
  );
});

test("resolveAgentPhase takes the furthest of the three inputs", () => {
  assert.equal(
    resolveAgentPhase("CLARIFICATION", "APPROACH_DISCUSSION", "PROBLEM_PRESENTED"),
    "APPROACH_DISCUSSION",
  );
});
