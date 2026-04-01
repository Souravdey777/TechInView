import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getInterviewerSystemPrompt } from "@/lib/ai/prompts";

const anthropic = new Anthropic();

const PHASE_MAP: Record<string, string> = {
  INTRO: "intro",
  PROBLEM_PRESENTED: "problem_presented",
  CLARIFICATION: "clarification",
  APPROACH_DISCUSSION: "approach",
  CODING: "coding",
  TESTING: "testing",
  COMPLEXITY_ANALYSIS: "complexity",
  FOLLOW_UP: "follow_up",
  WRAP_UP: "wrapup",
};

export async function POST(request: Request) {
  try {
    const { message, conversationHistory, problem, currentPhase, currentCode, elapsedSeconds, hintsGiven } = await request.json();

    if (!message) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    const systemPrompt = getInterviewerSystemPrompt({
      problemTitle: problem?.title ?? "Unknown",
      problemDescription: problem?.description ?? "",
      solutionApproach: problem?.solution_approach ?? "",
      constraints: problem?.constraints ?? [],
      examples: problem?.examples ?? [],
      currentPhase: PHASE_MAP[currentPhase] ?? currentPhase,
      elapsedSeconds: elapsedSeconds ?? 0,
      hintsGiven: hintsGiven ?? 0,
      currentCode: currentCode ?? "",
    });

    const messages: Anthropic.MessageParam[] = [
      ...(conversationHistory || []).slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role === "interviewer" ? "assistant" as const : "user" as const,
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages,
      cache_control: { type: "ephemeral" },
    });

    const aiMessage = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({
      success: true,
      data: { message: aiMessage },
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

function buildSystemPrompt(
  problem: { title?: string; description?: string; solution_approach?: string } | null,
  currentPhase: string,
  currentCode: string,
  elapsedSeconds: number
): string {
  const minutes = Math.floor(elapsedSeconds / 60);

  let phaseInstruction = "";
  switch (currentPhase) {
    case "INTRO":
      phaseInstruction = "You are in the INTRO phase. Introduce yourself warmly, ask about their background briefly. Keep it to 2-3 sentences. Then transition to presenting the problem.";
      break;
    case "PROBLEM_PRESENTED":
      phaseInstruction = "You just presented the problem. Let the candidate read it and ask clarifying questions. Keep responses brief.";
      break;
    case "CLARIFICATION":
      phaseInstruction = "The candidate is asking clarifying questions. Answer truthfully based on the problem constraints. Be helpful but don't give away the solution.";
      break;
    case "APPROACH_DISCUSSION":
      phaseInstruction = "The candidate is discussing their approach. Evaluate it — if it's suboptimal, gently push back and ask if there's a better way. If it's good, encourage them to start coding.";
      break;
    case "CODING":
      phaseInstruction = "The candidate is coding. Be VERY brief — 1 sentence max. Only speak if they ask you something or if they seem stuck for over a minute. Don't interrupt their flow.";
      break;
    case "TESTING":
      phaseInstruction = "Ask the candidate to trace through their solution with an example. Point out any untested edge cases.";
      break;
    case "COMPLEXITY_ANALYSIS":
      phaseInstruction = "Ask about time and space complexity. Challenge incorrect analysis politely.";
      break;
    case "WRAP_UP":
      phaseInstruction = "Thank the candidate, give a brief positive note about their performance, and end the interview.";
      break;
    default:
      phaseInstruction = "Respond naturally as an interviewer.";
  }

  return `You are Tia, a senior technical interviewer at a top tech company (FAANG-level). You are conducting a live coding interview.

Your personality:
- Friendly but professional
- Encouraging but rigorous
- You speak concisely — this is a voice conversation, so keep responses SHORT (1-3 sentences)
- Never use markdown formatting, bullet points, or code blocks in your speech — speak naturally

${problem ? `
## Problem Being Discussed
Title: ${problem.title}
Description: ${problem.description}
${problem.solution_approach ? `\nOptimal Approach (CONFIDENTIAL — guide the candidate toward this but NEVER reveal it directly): ${problem.solution_approach}` : ""}
` : ""}

## Current Phase: ${currentPhase}
${phaseInstruction}

## Time: ${minutes} minutes into a 45-minute interview

${currentCode && currentCode.trim() ? `## Candidate's Current Code:\n${currentCode}` : ""}

IMPORTANT: Keep responses SHORT for voice. 1-3 sentences maximum. Speak naturally as if talking out loud.`;
}
