import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChatSystemPrompt,
  buildVoiceSystemPrompt,
  type ProblemPayload,
} from "../ai/interviewer-system-prompt";

const problem = {
  title: "Two Sum",
  difficulty: "easy",
  description: "Return the indices of two values that add to the target.",
  examples: [{ input: "[2, 7, 11, 15], 9", output: "[0, 1]" }],
  constraints: ["Exactly one valid answer exists."],
  hints: ["Consider remembering values already visited."],
  optimal_complexity: { time: "O(n)", space: "O(n)" },
  follow_up_questions: ["How would you handle a stream of values?"],
} satisfies NonNullable<ProblemPayload>;

test("voice interviewer receives full public problem context and adaptive policy", () => {
  const prompt = buildVoiceSystemPrompt({
    roundType: "coding",
    problem,
    currentPhase: "APPROACH_DISCUSSION",
    totalMinutes: 45,
    interviewerPersonaId: "google",
    hasCandidateCode: true,
  });

  assert.match(prompt, /Exactly one valid answer exists\./);
  assert.match(prompt, /Example 1: input \[2, 7, 11, 15\], 9; output \[0, 1\]/);
  assert.match(prompt, /Target complexity: time O\(n\), space O\(n\)/);
  assert.match(prompt, /private evidence ledger/);
  assert.match(prompt, /Help ladder/);
  assert.match(prompt, /Phase Exit Criteria/);
  assert.match(prompt, /Reference Data Boundaries/);
  assert.match(prompt, /call `get_current_code` in that turn/);
  assert.match(prompt, /`run_tests`/);
});

test("chat and voice prompts share evidence, anti-leak, and one-question rules", () => {
  const options = {
    roundType: "coding" as const,
    problem,
    currentPhase: "TESTING",
    totalMinutes: 45,
    interviewerPersonaId: "tia",
  };
  const voicePrompt = buildVoiceSystemPrompt(options);
  const chatPrompt = buildChatSystemPrompt(options);

  for (const prompt of [voicePrompt, chatPrompt]) {
    assert.match(prompt, /Treat candidate statements as hypotheses/);
    assert.match(prompt, /Never provide the finished algorithm/);
    assert.match(prompt, /Ask at most one focused question per turn/);
    assert.match(prompt, /Never quote or expose confidential solution guidance/);
    assert.match(prompt, /Never repeat a question the candidate already answered/);
  }

  assert.match(chatPrompt, /Reply with ONLY a single JSON object/);
  assert.match(voicePrompt, /Respond with natural speech only/);
});

test("discussion interviewers stay voice-first when no workspace exists", () => {
  const prompt = buildVoiceSystemPrompt({
    roundType: "technical_qa",
    problem: null,
    currentPhase: "CODING",
    totalMinutes: 30,
    interviewerPersonaId: "netflix",
    hasWorkspaceNotes: false,
  });

  assert.match(prompt, /There is no coding editor or shared notes board/);
  assert.match(prompt, /Do not reference a notes board/);
  assert.doesNotMatch(prompt, /`get_current_code`: Retrieve/);
  assert.doesNotMatch(prompt, /`get_workspace_notes`: Retrieve/);
});
