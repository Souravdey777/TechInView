import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { type InterviewPhase, parseInterviewPhase } from "@/lib/interview-phases";
import { buildChatSystemPrompt, type ProblemPayload } from "@/lib/ai/interviewer-system-prompt";

// Module-level singleton — reused across requests in the same serverless instance
const anthropic = new Anthropic();

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
      interviewerPersona,
    } = body as {
      message?: string;
      conversationHistory?: { role: string; content: string }[];
      problem?: ProblemPayload;
      currentPhase?: string;
      currentCode?: string;
      elapsedSeconds?: number;
      maxDurationSeconds?: number;
      interviewerPersona?: string;
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

    const systemPrompt = buildChatSystemPrompt(
      (problem as ProblemPayload) ?? null,
      typeof currentPhase === "string" ? currentPhase : "INTRO",
      typeof currentCode === "string" ? currentCode : "",
      minutes,
      totalMinutes,
      interviewerPersona,
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
