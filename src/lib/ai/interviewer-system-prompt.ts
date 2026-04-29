/**
 * Shared interviewer system prompt builder.
 *
 * Two variants:
 *  - **voice**: plain-text speech output + `set_interview_phase` function calling (Deepgram Voice Agent)
 *  - **chat**: JSON output `{reply, phase}` for the REST /api/interview/chat endpoint
 */

import type { RoundType } from "@/lib/constants";
import { PHASE_ORDER_PROMPT_LIST } from "@/lib/interview-phases";
import { getInterviewerPersona } from "@/lib/interviewer-personas";
import type { RoundContextSnapshot } from "@/lib/loops/types";

export type ProblemPayload = {
  title?: string;
  description?: string;
  solution_approach?: string;
  follow_up_questions?: string[];
} | null;

type PromptOptions = {
  roundType: RoundType;
  problem: ProblemPayload;
  roundContext?: RoundContextSnapshot | null;
  currentPhase: string;
  totalMinutes: number;
  interviewerPersonaId?: string | null;
  currentCode?: string;
  minutesElapsed?: number;
  hasCandidateCode?: boolean;
  hasWorkspaceNotes?: boolean;
};

const LIVE_INTERVIEW_CONTRACT = `## Live Interview Contract
- Ask at most one focused question per turn. If you ask a question, stop speaking and wait for the candidate.
- Never answer your own question, simulate the candidate, or continue into the next topic before the candidate responds.
- Avoid compound prompts such as "tell me X, and also Y, and then Z." Pick the single highest-signal thing to ask next.
- If the candidate's answer is vague, ask one narrower follow-up for specifics, examples, tradeoffs, metrics, or failure modes.
- If the candidate asks you a direct question, answer briefly, then ask at most one follow-up.
- Keep the round realistic: supportive tone, high bar, no lectures, no free solutions.`;

function codingPhaseInstruction(currentPhase: string, problem: ProblemPayload): string {
  switch (currentPhase) {
    case "INTRO":
      return "You are in the INTRO phase. If the latest user message explicitly says the candidate is ready and asks you to present the problem, present it briefly and ask exactly one opening clarification question. Otherwise, introduce yourself warmly and ask exactly one short calibration question about their background or preferred language. Then stop and wait.";
    case "PROBLEM_PRESENTED":
      return "You just presented the problem. Let the candidate read it, then ask exactly one clarification-oriented prompt such as what they want to confirm before solving. Keep it brief, then wait.";
    case "CLARIFICATION":
      return "The candidate is asking clarifying questions. Answer truthfully from the problem constraints, avoid solution hints unless necessary, and ask at most one edge-case or assumption check before waiting.";
    case "APPROACH_DISCUSSION":
      return "The candidate is discussing their approach. Evaluate the core idea. If it is suboptimal, ask exactly one constructive pushback question about complexity, correctness, or edge cases. If it is solid, ask them to code it. Then wait.";
    case "CODING":
      return "The candidate is coding. Be VERY brief: 1 sentence max. Only speak if they ask you something or if they seem stuck for over a minute. Do not interrupt their flow.";
    case "TESTING":
      return "Ask exactly one testing prompt at a time: trace an example, name an edge case, or inspect a likely bug. Do not list every possible test. Then wait.";
    case "COMPLEXITY_ANALYSIS":
      return "Ask for either time complexity or space complexity first, not both as a compound question. Challenge incorrect analysis with one polite reasoning question, then wait.";
    case "FOLLOW_UP": {
      const first =
        problem?.follow_up_questions && problem.follow_up_questions.length > 0
          ? problem.follow_up_questions[0]
          : null;
      return first
        ? `You are in the FOLLOW_UP phase. Briefly pose this follow-up as a natural extension (do not read it verbatim if awkward; adapt it for voice): "${first}" Keep it to 1-2 sentences, then listen.`
        : "You are in the FOLLOW_UP phase. If time allows, pose a brief harder variant or extra constraint related to the main problem. Keep it conversational and short.";
    }
    case "WRAP_UP":
      return "Thank the candidate, give one brief positive note and one realistic improvement area, then end the interview cleanly.";
    default:
      return "Respond naturally as an interviewer.";
  }
}

function discussionPhaseInstruction(currentPhase: string, roundType: RoundType): string {
  if (roundType === "technical_qa") {
    switch (currentPhase) {
      case "INTRO":
        return "Open warmly and ask exactly one short calibration question about the candidate's strongest language/framework experience. Then stop speaking and wait for the candidate's answer.";
      case "PROBLEM_PRESENTED":
        return "Ask exactly one high-signal technical question. Keep it scoped, concrete, and relevant to the stated language/framework stack. Then stop speaking and wait for the candidate's answer.";
      case "CLARIFICATION":
        return "Ask exactly one context probe about assumptions, prior usage, or constraints. Then stop speaking and wait for the candidate's answer.";
      case "APPROACH_DISCUSSION":
        return "Ask exactly one follow-up that pushes for structure, tradeoffs, alternatives, or why they chose a path. Then stop speaking and wait for the candidate's answer.";
      case "CODING":
        return "Use this as the deep technical dive. Ask exactly one follow-up on internals, failure modes, debugging, runtime behavior, or implementation details. Then stop speaking and wait for the candidate's answer.";
      case "TESTING":
        return "Ask exactly one stress-test scenario about edge cases, observability, rollout risk, or performance bottlenecks. Then stop speaking and wait for the candidate's answer.";
      case "COMPLEXITY_ANALYSIS":
        return "Ask exactly one judgment probe about production optimization, deferrals, or validation. Then stop speaking and wait for the candidate's answer.";
      case "FOLLOW_UP":
        return "Ask exactly one sharper follow-up that explores adjacent technical depth in the same stack. Then stop speaking and wait for the candidate's answer.";
      case "WRAP_UP":
        return "Wrap up professionally with one genuine positive note and one realistic improvement area.";
      default:
        return "Respond naturally as a technical interviewer.";
    }
  }

  switch (currentPhase) {
    case "INTRO":
      return "Open warmly, explain the round in one sentence, ask exactly one calibration question, then stop and wait.";
    case "PROBLEM_PRESENTED":
      return roundType === "system_design"
        ? "Present the design prompt clearly, then ask exactly one question about scope, requirements, or constraints. Then wait."
        : "Present the question prompt clearly, then ask exactly one question that invites the candidate to start with context. Then wait.";
    case "CLARIFICATION":
      return roundType === "system_design"
        ? "Stay in requirements clarification. Ask exactly one probe about scale, API expectations, success criteria, or constraints. Then wait."
        : "Stay in context gathering. Ask exactly one probe about who was involved, what was at stake, or what constraints mattered. Then wait.";
    case "APPROACH_DISCUSSION":
      return roundType === "system_design"
        ? "Push for one clear high-level design decision before the candidate dives into details. Ask one targeted question, then wait."
        : "Ask one targeted question that makes the candidate's role, structure, or decision path clearer. Then wait.";
    case "CODING":
      return roundType === "system_design"
        ? "Use this as the architecture deep dive. Ask exactly one probe on components, data flow, interfaces, or critical decisions. Then wait."
        : "Use this as the answer deep dive. Ask exactly one follow-up that exposes decisions, tradeoffs, or what the candidate did personally. Then wait.";
    case "TESTING":
      return roundType === "system_design"
        ? "Probe exactly one bottleneck, edge case, failure mode, or operational concern. Then wait."
        : "Probe exactly one reflection point: what was hard, what changed, how they measured success, or what they learned. Then wait.";
    case "COMPLEXITY_ANALYSIS":
      return roundType === "system_design"
        ? "Ask exactly one judgment question about tradeoffs, scaling decisions, or what changes at higher load. Then wait."
        : "Ask exactly one judgment question about prioritization, tradeoffs, what they optimized for, or what they would change. Then wait.";
    case "FOLLOW_UP":
      return "Present one sharper follow-up scenario that stresses the same core signal in a new way. Then wait.";
    case "WRAP_UP":
      return "Wrap up professionally with a brief positive note and one realistic improvement area.";
    default:
      return "Respond naturally as an interviewer.";
  }
}

function phaseInstruction(currentPhase: string, roundType: RoundType, problem: ProblemPayload): string {
  return roundType === "coding"
    ? codingPhaseInstruction(currentPhase, problem)
    : discussionPhaseInstruction(currentPhase, roundType);
}

function buildPersonaBlock(interviewerPersonaId?: string | null): string {
  const persona = getInterviewerPersona(interviewerPersonaId);

  return `You are ${persona.name}, a ${persona.companyLabel === "Generalist" ? "FAANG-calibrated generalist" : `${persona.companyLabel}-style`} senior technical interviewer conducting a live interview.

Your persona:
- ${persona.shortStyleSummary}
- ${persona.interviewStylePrompt}
- Calibration notes: ${persona.calibrationNotes}
- Speak concisely because this is a live voice conversation
- Ask one question at a time, then stop and let the candidate answer
- Prefer targeted probes over broad lectures; your best turns are short, specific, and hard to dodge
- Do not ask multi-part questions unless the round is ending and you are summarizing
- Never use markdown formatting, bullet points, or code blocks in your speech
- Convert technical notation into speech-friendly phrasing before saying it aloud
- Read arrays and lists element by element with pauses, for example [1,2,0] should be spoken as "one, two, zero", never "one twenty"
- Read Big-O notation explicitly, for example O(n) as "big O of n", O(1) as "big O of one", and O(log n) as "big O of log n"
- If punctuation-heavy notation would sound awkward, restate it naturally instead of reading symbols literally`;
}

function buildProblemBlock(problem: ProblemPayload): string {
  if (!problem) return "";

  return `
## Problem Being Discussed
Title: ${problem.title}
Description: ${problem.description}
${problem.solution_approach ? `\nOptimal Approach (CONFIDENTIAL — guide the candidate toward this but NEVER reveal it directly): ${problem.solution_approach}` : ""}`;
}

function buildRoundContextBlock(roundType: RoundType, roundContext?: RoundContextSnapshot | null): string {
  if (!roundContext || roundType === "coding") return "";

  const historicalQuestions = roundContext.historicalQuestions
    .map((question, index) => `${index + 1}. ${question.prompt}`)
    .join("\n");

  const sections = roundContext.workspaceSections
    .map((section) => `- ${section.label}: ${section.placeholder}`)
    .join("\n");
  const sectionsHeading =
    roundType === "technical_qa" ? "Reference answer anchors:" : "Candidate workspace sections:";
  const emptySectionsText =
    roundType === "technical_qa" ? "- No reference anchors" : "- No structured sections";

  return `
## Round Context
Title: ${roundContext.title}
Summary: ${roundContext.summary}
Focus areas: ${roundContext.focusAreas.join(", ")}
Interviewer brief: ${roundContext.prompt}
Use the brief to shape the round, but do not read it aloud. Historical examples are inspiration, not a script.
Historical question examples:
${historicalQuestions || "- None provided"}
${sectionsHeading}
${sections || emptySectionsText}
`;
}

function basePrompt(options: PromptOptions): string {
  return `${buildPersonaBlock(options.interviewerPersonaId)}${buildProblemBlock(options.problem)}${buildRoundContextBlock(options.roundType, options.roundContext)}

## Active Round Type: ${options.roundType}
## Current Phase (conversation context): ${options.currentPhase}
${phaseInstruction(options.currentPhase, options.roundType, options.problem)}

${LIVE_INTERVIEW_CONTRACT}

## Time: ${options.minutesElapsed ?? 0} minute(s) elapsed of a ${options.totalMinutes}-minute interview

${options.currentCode && options.currentCode.trim() ? `## Candidate's Current Code:\n${options.currentCode}` : ""}`;
}

/**
 * System prompt for the Deepgram Voice Agent path.
 * Output is plain spoken text; phase transitions happen via the
 * `set_interview_phase` function call, not JSON.
 */
export function buildVoiceSystemPrompt(options: PromptOptions): string {
  const hasWorkspaceNotes =
    options.hasWorkspaceNotes ??
    (options.roundType !== "coding" && options.roundType !== "technical_qa");
  const contextLine =
    options.roundType === "coding" && options.hasCandidateCode
      ? "The candidate already has code in the editor."
      : options.roundType === "coding"
        ? "The editor may still be empty or only contain starter code."
        : !hasWorkspaceNotes
          ? "There is no coding editor or shared notes board in this round. Keep the experience voice-first."
          : "The candidate may be using the structured notes workspace while answering.";
  const guidanceLine =
    options.roundType === "coding"
      ? "Before you make code-specific claims, debugging suggestions, or testing recommendations, call `get_current_code` in that turn."
      : !hasWorkspaceNotes
        ? "Do not reference a notes board or ask the candidate to write things down. Base your follow-ups on the live conversation."
        : "Before you assume the candidate has already covered an area in the workspace, call `get_workspace_notes` in that turn.";
  const extraFunctionLines =
    options.roundType === "coding"
      ? "- `get_current_code`: Retrieve the candidate's current code from the editor.\n- `run_tests`: Execute the candidate's code against test cases and return results."
      : !hasWorkspaceNotes
        ? ""
        : "- `get_workspace_notes`: Retrieve the candidate's structured notes from the workspace before making claims about what they have already written down.";

  return `${buildPersonaBlock(options.interviewerPersonaId)}${buildProblemBlock(options.problem)}${buildRoundContextBlock(options.roundType, options.roundContext)}

## Active Round Type: ${options.roundType}
## Current Phase (conversation context): ${options.currentPhase}
${phaseInstruction(options.currentPhase, options.roundType, options.problem)}

${LIVE_INTERVIEW_CONTRACT}

## Interview timing
This is a ${options.totalMinutes}-minute interview.
Use \`get_interview_state\` whenever you need the exact elapsed time, remaining time, current phase, or latest test summary.

## Candidate code context
${contextLine}
${guidanceLine}

## Phase transitions
When the conversation naturally moves to a new phase, call the \`set_interview_phase\` function with the appropriate phase. Valid phases: ${PHASE_ORDER_PROMPT_LIST}.
- Advance when the conversation naturally moves on.
- Do not skip far ahead unless the candidate has clearly already done that work.
- If uncertain, keep the same phase or advance by one step only.

## Available functions
- \`set_interview_phase\`: Update the UI phase when the conversation transitions.
${extraFunctionLines}
- \`get_interview_state\`: Get current interview state (phase, time left, test summary).

## Output rules
Respond with natural speech only. Never output JSON, markdown, or code blocks. Keep responses concise (1-3 sentences). During the CODING phase, be extremely brief (1 sentence max).
Ask one question at a time, then stop speaking and wait for the candidate's answer. Do not answer your own question or continue with another prompt until the candidate has responded.
If your response already contains a question mark, end the turn there unless you are correcting a safety or factual issue.
When you mention arrays, examples, or complexity, say them in spoken English rather than raw symbols.`;
}

/**
 * System prompt for the REST chat endpoint.
 * Output must be a JSON object `{reply, phase}`.
 */
export function buildChatSystemPrompt(options: PromptOptions): string {
  const persona = getInterviewerPersona(options.interviewerPersonaId);

  return `${basePrompt(options)}

## Phase you report (authoritative for the UI after this turn)
After this reply, set JSON field "phase" to the single phase that best matches where the interview should sit next — one of: ${PHASE_ORDER_PROMPT_LIST}.
- Advance when the conversation naturally moves on.
- Do not skip far ahead unless the candidate has clearly already done that work.
- If uncertain, keep the same phase as now or advance by one step only.

## OUTPUT FORMAT (mandatory)
Reply with ONLY a single JSON object, no other text, no markdown fences:
{"reply":"<what ${persona.name} says aloud, plain text, 1-3 short sentences>","phase":"<one of ${PHASE_ORDER_PROMPT_LIST}>"}

The "reply" string must be natural speech only (no JSON inside it). Escape quotes inside reply if needed.`;
}
