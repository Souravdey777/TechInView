import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  type InterviewPhase,
  parseInterviewPhase,
  PHASE_ORDER_PROMPT_LIST,
} from "@/lib/interview-phases";

// Module-level singleton — reused across requests in the same serverless instance
const anthropic = new Anthropic();

type ProblemPayload = {
  title?: string;
  description?: string;
  solution_approach?: string;
  follow_up_questions?: string[];
} | null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      message,
      conversationHistory,
      problem,
      currentPhase,
      currentCode,
      elapsedSeconds,
      maxDurationSeconds,
    } = body as {
      message?: string;
      conversationHistory?: { role: string; content: string }[];
      problem?: ProblemPayload;
      currentPhase?: string;
      currentCode?: string;
      elapsedSeconds?: number;
      maxDurationSeconds?: number;
    };

    if (!message) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    const elapsed = typeof elapsedSeconds === "number" ? elapsedSeconds : 0;
    const maxDur =
      typeof maxDurationSeconds === "number" && maxDurationSeconds > 0
        ? maxDurationSeconds
        : 45 * 60;
    const totalMinutes = Math.max(1, Math.round(maxDur / 60));
    const minutes = Math.floor(elapsed / 60);

    const systemPrompt = buildSystemPrompt(
      problem ?? null,
      typeof currentPhase === "string" ? currentPhase : "INTRO",
      typeof currentCode === "string" ? currentCode : "",
      minutes,
      totalMinutes
    );

    const messages: Anthropic.MessageParam[] = [
      ...(conversationHistory || []).slice(-10).map((m) => ({
        role: m.role === "interviewer" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: systemPrompt,
      messages,
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = parseModelJson(rawText);

    if (parsed) {
      const phase = parsed.phase ?? undefined;
      return NextResponse.json({
        success: true,
        data: { message: parsed.reply, ...(phase ? { phase } : {}) },
      });
    }

    return NextResponse.json({
      success: true,
      data: { message: rawText.trim() },
    });
  } catch (_error) {
    const errMsg = _error instanceof Error ? _error.message : String(_error);
    console.error("Chat API error:", errMsg, _error);
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}

function parseModelJson(text: string): { reply: string; phase?: InterviewPhase } | null {
  const trimmed = text.trim();
  const tryParse = (s: string): { reply: string; phase?: InterviewPhase } | null => {
    try {
      const o = JSON.parse(s) as { reply?: unknown; phase?: unknown };
      if (typeof o.reply !== "string") return null;
      const phase = parseInterviewPhase(o.phase) ?? undefined;
      return { reply: o.reply, ...(phase ? { phase } : {}) };
    } catch {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence?.[1]) {
    const fromFence = tryParse(fence[1].trim());
    if (fromFence) return fromFence;
  }

  const obj = trimmed.match(/\{[\s\S]*"reply"[\s\S]*\}/);
  if (obj?.[0]) {
    const fromObj = tryParse(obj[0]);
    if (fromObj) return fromObj;
  }

  return null;
}

function buildSystemPrompt(
  problem: ProblemPayload,
  currentPhase: string,
  currentCode: string,
  minutesElapsed: number,
  totalMinutes: number
): string {
  let phaseInstruction = "";
  switch (currentPhase) {
    case "INTRO":
      phaseInstruction =
        "You are in the INTRO phase. Introduce yourself warmly, ask about their background briefly. Keep it to 2-3 sentences. Then transition to presenting the problem.";
      break;
    case "PROBLEM_PRESENTED":
      phaseInstruction =
        "You just presented the problem. Let the candidate read it and ask clarifying questions. Keep responses brief.";
      break;
    case "CLARIFICATION":
      phaseInstruction =
        "The candidate is asking clarifying questions. Answer truthfully based on the problem constraints. Be helpful but don't give away the solution.";
      break;
    case "APPROACH_DISCUSSION":
      phaseInstruction =
        "The candidate is discussing their approach. Evaluate it — if it's suboptimal, gently push back and ask if there's a better way. If it's good, encourage them to start coding.";
      break;
    case "CODING":
      phaseInstruction =
        "The candidate is coding. Be VERY brief — 1 sentence max. Only speak if they ask you something or if they seem stuck for over a minute. Don't interrupt their flow.";
      break;
    case "TESTING":
      phaseInstruction =
        "Ask the candidate to trace through their solution with an example. Point out any untested edge cases.";
      break;
    case "COMPLEXITY_ANALYSIS":
      phaseInstruction =
        "Ask about time and space complexity. Challenge incorrect analysis politely.";
      break;
    case "FOLLOW_UP": {
      const firstFollowUp =
        problem?.follow_up_questions && problem.follow_up_questions.length > 0
          ? problem.follow_up_questions[0]
          : null;
      phaseInstruction = firstFollowUp
        ? `You are in the FOLLOW_UP phase. Briefly pose this follow-up as a natural extension (do not read it verbatim if awkward — adapt for voice): "${firstFollowUp}" Keep it to 1-2 sentences for the prompt, then listen.`
        : `You are in the FOLLOW_UP phase. If time allows, pose a brief harder variant or extra constraint related to the main problem. Keep it conversational and short.`;
      break;
    }
    case "WRAP_UP":
      phaseInstruction =
        "Thank the candidate, give a brief positive note about their performance, and end the interview.";
      break;
    default:
      phaseInstruction = "Respond naturally as an interviewer.";
  }

  const problemBlock = problem
    ? `
## Problem Being Discussed
Title: ${problem.title}
Description: ${problem.description}
${problem.solution_approach ? `\nOptimal Approach (CONFIDENTIAL — guide the candidate toward this but NEVER reveal it directly): ${problem.solution_approach}` : ""}
`
    : "";

  return `You are Tia, a senior technical interviewer at a top tech company (FAANG-level). You are conducting a live coding interview.

Your personality:
- Friendly but professional
- Encouraging but rigorous
- You speak concisely — this is a voice conversation, so keep responses SHORT (1-3 sentences)
- Never use markdown formatting, bullet points, or code blocks in your speech — speak naturally

${problemBlock}

## Current Phase (conversation context): ${currentPhase}
${phaseInstruction}

## Time: ${minutesElapsed} minute(s) elapsed of a ${totalMinutes}-minute interview

${currentCode && currentCode.trim() ? `## Candidate's Current Code:\n${currentCode}` : ""}

## Phase you report (authoritative for the UI after this turn)
After this reply, set JSON field "phase" to the single phase that best matches where the interview should sit next — one of: ${PHASE_ORDER_PROMPT_LIST}.
- Advance when the conversation naturally moves on (e.g. after presenting the problem, use PROBLEM_PRESENTED or CLARIFICATION as appropriate).
- Do not skip far ahead unless the candidate has clearly already done that work.
- If uncertain, keep the same phase as now or advance by one step only.

## OUTPUT FORMAT (mandatory)
Reply with ONLY a single JSON object, no other text, no markdown fences:
{"reply":"<what Tia says aloud, plain text, 1-3 short sentences>","phase":"<one of ${PHASE_ORDER_PROMPT_LIST}>"}

The "reply" string must be natural speech only (no JSON inside it). Escape quotes inside reply if needed.`;
}
