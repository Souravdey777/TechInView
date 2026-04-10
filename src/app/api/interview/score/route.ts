import { NextRequest, NextResponse } from "next/server";
import { scoreInterview } from "@/lib/ai/scorer";
import { resolveInterviewerPersona } from "@/lib/interviewer-personas";

type ScoreRequestBody = {
  transcript: { role: string; content: string }[];
  finalCode: string;
  testsPassed: number;
  testsTotal: number;
  interviewerPersona?: string;
  problem: {
    title: string;
    description: string;
    optimal_complexity: { time: string; space: string };
  };
};

// ─── Mock scores returned when ANTHROPIC_API_KEY is not set ───────────────────

function getMockResult(testsPassed: number, testsTotal: number) {
  const passRate = testsTotal > 0 ? testsPassed / testsTotal : 0;
  const baseScore = 55 + Math.round(passRate * 20);

  return {
    overall_score: baseScore,
    scores: {
      problem_solving: { score: baseScore + 5, feedback: "Mock feedback: scoring unavailable (no API key)." },
      code_quality: { score: baseScore, feedback: "Mock feedback: scoring unavailable (no API key)." },
      communication: { score: baseScore - 5, feedback: "Mock feedback: scoring unavailable (no API key)." },
      technical_knowledge: { score: baseScore, feedback: "Mock feedback: scoring unavailable (no API key)." },
      testing: { score: baseScore - 10, feedback: "Mock feedback: scoring unavailable (no API key)." },
    },
    hire_recommendation: baseScore >= 70 ? "hire" : baseScore >= 55 ? "lean_hire" : "lean_no_hire",
    key_strengths: ["Completed the interview session"],
    areas_to_improve: ["Set ANTHROPIC_API_KEY to enable real AI scoring"],
    summary: "AI scoring is currently unavailable because ANTHROPIC_API_KEY is not configured. These are placeholder scores based on test pass rate.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ScoreRequestBody;
    const { transcript, finalCode, testsPassed, testsTotal, problem } = body;
    const interviewerPersona = resolveInterviewerPersona(body.interviewerPersona);

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { success: false, error: "transcript is required" },
        { status: 400 }
      );
    }

    // If no API key is set, return mock scores instead of crashing
    if (!process.env.ANTHROPIC_API_KEY) {
      const mockResult = getMockResult(testsPassed ?? 0, testsTotal ?? 0);
      return NextResponse.json({ success: true, data: mockResult });
    }

    // Attach placeholder timestamps so the scorer's type is satisfied
    const messagesWithTimestamps = transcript.map((msg, i) => ({
      ...msg,
      timestamp_ms: i * 30000,
    }));

    const result = await scoreInterview({
      messages: messagesWithTimestamps,
      finalCode: finalCode || "",
      testsPassed: testsPassed ?? 0,
      testsTotal: testsTotal ?? 0,
      interviewerPersonaId: interviewerPersona,
      problem: {
        title: problem?.title ?? "Unknown Problem",
        description: problem?.description ?? "",
        optimal_complexity: problem?.optimal_complexity ?? { time: "Unknown", space: "Unknown" },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        overall_score: result.overall_score,
        scores: {
          problem_solving: { score: result.scores.problem_solving.score, feedback: result.scores.problem_solving.feedback },
          code_quality: { score: result.scores.code_quality.score, feedback: result.scores.code_quality.feedback },
          communication: { score: result.scores.communication.score, feedback: result.scores.communication.feedback },
          technical_knowledge: { score: result.scores.technical_knowledge.score, feedback: result.scores.technical_knowledge.feedback },
          testing: { score: result.scores.testing.score, feedback: result.scores.testing.feedback },
        },
        hire_recommendation: result.hire_recommendation,
        key_strengths: result.key_strengths,
        areas_to_improve: result.areas_to_improve,
        summary: result.summary,
      },
    });
  } catch (error) {
    console.error("Scoring error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to score interview",
      },
      { status: 500 }
    );
  }
}
