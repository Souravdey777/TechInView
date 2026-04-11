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

function codingPhaseInstruction(currentPhase: string, problem: ProblemPayload): string {
  switch (currentPhase) {
    case "INTRO":
      return "You are in the INTRO phase. Introduce yourself warmly, ask about their background briefly, and keep it to 2-3 sentences. Then transition naturally toward presenting the problem.";
    case "PROBLEM_PRESENTED":
      return "You just presented the problem. Let the candidate read it and ask clarifying questions. Keep responses brief.";
    case "CLARIFICATION":
      return "The candidate is asking clarifying questions. Answer truthfully based on the problem constraints. Be helpful but do not give away the solution.";
    case "APPROACH_DISCUSSION":
      return "The candidate is discussing their approach. Evaluate it. If it is suboptimal, push back in a constructive way and ask if there is a better option. If it is solid, encourage them to start coding.";
    case "CODING":
      return "The candidate is coding. Be VERY brief: 1 sentence max. Only speak if they ask you something or if they seem stuck for over a minute. Do not interrupt their flow.";
    case "TESTING":
      return "Ask the candidate to trace through their solution with an example. Point out any untested edge cases.";
    case "COMPLEXITY_ANALYSIS":
      return "Ask about time and space complexity. Challenge incorrect analysis politely.";
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
      return "Thank the candidate, give a brief positive note about their performance, and end the interview.";
    default:
      return "Respond naturally as an interviewer.";
  }
}

function discussionPhaseInstruction(currentPhase: string, roundType: RoundType): string {
  if (roundType === "technical_qa") {
    switch (currentPhase) {
      case "INTRO":
        return "Open warmly, confirm the candidate's strongest language and frameworks, and explain that this will be a practical technical Q&A round.";
      case "PROBLEM_PRESENTED":
        return "Start the first high-signal technical question. Keep it scoped, concrete, and relevant to the stated language/framework stack.";
      case "CLARIFICATION":
        return "Probe for context: ask what assumptions the candidate is making, where they have used the technology, and what constraints matter.";
      case "APPROACH_DISCUSSION":
        return "Push the candidate to structure the answer clearly. Ask for tradeoffs, alternatives, and why they would choose one path over another.";
      case "CODING":
        return "Use this as the deep technical dive. Ask follow-up questions on internals, failure modes, debugging, runtime behavior, and practical implementation details.";
      case "TESTING":
        return "Stress-test the answer with scenarios, edge cases, observability, rollout risks, or performance bottlenecks.";
      case "COMPLEXITY_ANALYSIS":
        return "Probe on judgment: ask what they would optimize for in production, what they would defer, and how they would validate their approach.";
      case "FOLLOW_UP":
        return "Ask one sharper follow-up that explores adjacent technical depth in the same stack.";
      case "WRAP_UP":
        return "Wrap up professionally with one genuine positive note and one realistic improvement area.";
      default:
        return "Respond naturally as a technical interviewer.";
    }
  }

  switch (currentPhase) {
    case "INTRO":
      return "Open warmly, explain how this round will work, and let the candidate settle in before you probe.";
    case "PROBLEM_PRESENTED":
      return roundType === "system_design"
        ? "Present the design prompt clearly, then ask the candidate to clarify scope, requirements, and constraints."
        : "Present the question prompt clearly, then invite the candidate to take a moment and start with context.";
    case "CLARIFICATION":
      return roundType === "system_design"
        ? "Stay in requirements clarification. Ask for scale assumptions, API expectations, and success criteria."
        : "Stay in context gathering. Ask who was involved, what the stakes were, and what constraints mattered.";
    case "APPROACH_DISCUSSION":
      return roundType === "system_design"
        ? "Push for a clear high-level design before the candidate dives into details."
        : "Ask the candidate to structure the answer, make their role clear, and avoid vague storytelling.";
    case "CODING":
      return roundType === "system_design"
        ? "Use this as the architecture deep dive. Probe on components, data flow, interfaces, and critical decisions."
        : "Use this as the answer deep dive. Ask follow-ups that expose decisions, tradeoffs, and what the candidate did personally.";
    case "TESTING":
      return roundType === "system_design"
        ? "Probe for bottlenecks, edge cases, failure modes, and operational concerns."
        : "Probe for reflection and signal quality. Ask what was hard, what changed, and how they knew the outcome was good.";
    case "COMPLEXITY_ANALYSIS":
      return roundType === "system_design"
        ? "Probe on tradeoffs, scaling decisions, and what they would do next at higher load."
        : "Probe on judgment, prioritization, and tradeoffs. Ask what they optimized for and what they would change with more time.";
    case "FOLLOW_UP":
      return "Present one sharper follow-up scenario that stresses the same core signal in a new way.";
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
