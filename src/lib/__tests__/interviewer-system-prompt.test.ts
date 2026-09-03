import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChatSystemPrompt,
  buildVoiceSystemPrompt,
  hasPresentedProblem,
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

test("coding introduction requires candidate calibration before presenting the problem", () => {
  const voicePrompt = buildVoiceSystemPrompt({
    roundType: "coding",
    problem,
    currentPhase: "INTRO",
    totalMinutes: 45,
    interviewerPersonaId: "tia",
  });

  assert.match(voicePrompt, /generic instruction to start the interview is not evidence/i);
  assert.match(voicePrompt, /software engineering and coding interview experience/i);
  assert.match(voicePrompt, /Do not ask about their preferred language/i);
  assert.match(voicePrompt, /without presenting the problem/i);
  assert.match(voicePrompt, /Once the candidate has answered that question/i);
  assert.match(voicePrompt, /present the problem exactly once/i);
  assert.match(voicePrompt, /if any assistant turn has already named or described the problem, do not narrate it again/i);
});

test("presented-problem phase forbids unsolicited repetition", () => {
  const voicePrompt = buildVoiceSystemPrompt({
    roundType: "coding",
    problem,
    currentPhase: "PROBLEM_PRESENTED",
    totalMinutes: 45,
    interviewerPersonaId: "tia",
  });

  assert.match(voicePrompt, /problem has already been presented/i);
  assert.match(voicePrompt, /Never repeat its title, statement, examples, or constraints/i);
  assert.match(voicePrompt, /finish saying the problem exactly once before calling `set_interview_phase`/i);
});

// ─── Repeated problem narration ───────────────────────────────────────────────

test("hasPresentedProblem only counts interviewer turns", () => {
  const title = "Two Sum";
  assert.equal(
    hasPresentedProblem(
      [{ role: "candidate", content: "I have done Two Sum before" }],
      title,
    ),
    false,
    "the candidate naming the problem is not the interviewer presenting it",
  );
  assert.equal(
    hasPresentedProblem(
      [{ role: "interviewer", content: "Let's look at Two Sum. Given an array..." }],
      title,
    ),
    true,
  );
  assert.equal(
    hasPresentedProblem(
      [{ role: "assistant", content: "Today's question is TWO  SUM!" }],
      title,
    ),
    true,
    "matching ignores case, punctuation and extra whitespace",
  );
});

test("hasPresentedProblem is false before the problem is named", () => {
  assert.equal(
    hasPresentedProblem(
      [
        { role: "interviewer", content: "Hi, tell me about your experience." },
        { role: "candidate", content: "Eight years of backend work." },
      ],
      "Two Sum",
    ),
    false,
  );
  assert.equal(hasPresentedProblem([], "Two Sum"), false);
  assert.equal(hasPresentedProblem([{ role: "interviewer", content: "x" }], ""), false);
});

test("INTRO stops instructing narration once the problem was presented", () => {
  const base = {
    roundType: "coding" as const,
    problem,
    currentPhase: "INTRO",
    totalMinutes: 45,
  };

  const first = buildVoiceSystemPrompt(base);
  assert.match(first, /present the problem exactly once/i);

  const again = buildVoiceSystemPrompt({ ...base, problemAlreadyPresented: true });
  assert.doesNotMatch(
    again,
    /present the problem exactly once/i,
    "an INTRO phase that never advanced must not re-arm narration",
  );
  assert.match(again, /already been presented/i);
  assert.match(again, /set_interview_phase/);
});

test("both transports share the already-presented instruction", () => {
  const base = {
    roundType: "coding" as const,
    problem,
    currentPhase: "INTRO",
    totalMinutes: 45,
    problemAlreadyPresented: true,
  };
  for (const prompt of [buildVoiceSystemPrompt(base), buildChatSystemPrompt(base)]) {
    assert.match(prompt, /already been presented/i);
    assert.doesNotMatch(prompt, /present the problem exactly once/i);
  }
});
