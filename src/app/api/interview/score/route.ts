import { NextRequest, NextResponse } from "next/server";
import { scoreInterview } from "@/lib/ai/scorer";
import { resolveInterviewerPersona } from "@/lib/interviewer-personas";
import type { InterviewMode, RoundType } from "@/lib/constants";
import type { RoundContextSnapshot } from "@/lib/loops/types";

type ScoreRequestBody = {
  transcript: { role: string; content: string }[];
  finalCode: string;
  testsPassed: number;
  testsTotal: number;
  interviewerPersona?: string;
  mode?: InterviewMode;
  roundType?: RoundType;
  roundTitle?: string;
  roundContext?: RoundContextSnapshot | null;
  problem?: {
    title: string;
    description: string;
    optimal_complexity: { time: string; space: string };
  } | null;
};

// ─── Mock scores returned when ANTHROPIC_API_KEY is not set ───────────────────

function getMockResult(
  testsPassed: number,
  testsTotal: number,
  mode: InterviewMode = "general_dsa"
) {
  const passRate = testsTotal > 0 ? testsPassed / testsTotal : 0;
  const baseScore = 55 + Math.round(passRate * 20);

  if (mode === "targeted_loop") {
    return {
      overall_score: baseScore,
      scores: {
        problem_solving: { dimension: "problem_solving", score: baseScore + 4, feedback: "Mock feedback: loop scoring unavailable (no API key)." },
        communication: { dimension: "communication", score: baseScore - 2, feedback: "Mock feedback: loop scoring unavailable (no API key)." },
        technical_depth: { dimension: "technical_depth", score: baseScore + 1, feedback: "Mock feedback: loop scoring unavailable (no API key)." },
        execution: { dimension: "execution", score: baseScore, feedback: "Mock feedback: loop scoring unavailable (no API key)." },
        judgment: { dimension: "judgment", score: baseScore - 1, feedback: "Mock feedback: loop scoring unavailable (no API key)." },
      },
      hire_recommendation: baseScore >= 70 ? "hire" : baseScore >= 55 ? "lean_hire" : "lean_no_hire",
      key_strengths: ["Completed the targeted round"],
      areas_to_improve: ["Set ANTHROPIC_API_KEY to enable real AI scoring"],
      summary: "AI scoring is currently unavailable because ANTHROPIC_API_KEY is not configured. These are placeholder scores for the shared five-dimension loop rubric.",
    };
  }

  return {
    overall_score: baseScore,
    scores: {
      problem_solving: { dimension: "problem_solving", score: baseScore + 5, feedback: "Mock feedback: scoring unavailable (no API key)." },
      code_quality: { dimension: "code_quality", score: baseScore, feedback: "Mock feedback: scoring unavailable (no API key)." },
      communication: { dimension: "communication", score: baseScore - 5, feedback: "Mock feedback: scoring unavailable (no API key)." },
      technical_knowledge: { dimension: "technical_knowledge", score: baseScore, feedback: "Mock feedback: scoring unavailable (no API key)." },
      testing: { dimension: "testing", score: baseScore - 10, feedback: "Mock feedback: scoring unavailable (no API key)." },
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
    const {
      transcript,
      finalCode,
      testsPassed,
      testsTotal,
      problem,
      mode = "general_dsa",
      roundType = "coding",
      roundTitle,
      roundContext,
    } = body;
    const interviewerPersona = resolveInterviewerPersona(body.interviewerPersona);

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { success: false, error: "transcript is required" },
        { status: 400 }
      );
    }

    // If no API key is set, return mock scores instead of crashing
    if (!process.env.ANTHROPIC_API_KEY) {
      const mockResult = getMockResult(testsPassed ?? 0, testsTotal ?? 0, mode);
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
      mode,
      roundType,
      roundTitle: roundTitle ?? roundContext?.title ?? problem?.title ?? "Interview Round",
      interviewerPersonaId: interviewerPersona,
      problem: problem
        ? {
            title: problem?.title ?? "Unknown Problem",
            description: problem?.description ?? "",
            optimal_complexity: problem?.optimal_complexity ?? { time: "Unknown", space: "Unknown" },
          }
        : null,
      roundContext: roundContext ?? null,
    });

    return NextResponse.json({
      success: true,
      data: result,
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
