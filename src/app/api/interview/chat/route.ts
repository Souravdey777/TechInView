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
