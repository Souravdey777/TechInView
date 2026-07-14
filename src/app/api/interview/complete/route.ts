import { NextRequest, NextResponse } from "next/server";
import { scoreInterview } from "@/lib/ai/scorer";
import { captureServerEvent } from "@/lib/posthog/server";
import {
  enforceApiRateLimit,
  getAuthenticatedApiUser,
  unauthorizedResponse,
} from "@/lib/api-security";
import { resolveInterviewerPersona } from "@/lib/interviewer-personas";
import type { InterviewMode, RoundType } from "@/lib/constants";
import type { RoundContextSnapshot } from "@/lib/loops/types";

type CompleteInterviewBody = {
  interviewId: string;
  interviewerPersona?: string;
  mode?: InterviewMode;
  roundType?: RoundType;
  roundTitle?: string;
  finalCode: string;
  language?: string;
  transcript: { role: string; content: string; timestamp_ms: number }[];
  testsPassed: number;
  testsTotal: number;
  problem: {
    title: string;
    description: string;
    difficulty?: string;
    category?: string;
    optimal_complexity?: { time: string; space: string };
  } | null;
  roundContext?: RoundContextSnapshot | null;
};

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedApiUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const rateLimited = await enforceApiRateLimit({
      userId: user.id,
      action: "interview_complete",
      limit: 10,
      windowSeconds: 60 * 60,
    });
    if (rateLimited) return rateLimited;

    const body = (await req.json()) as CompleteInterviewBody;
    const {
      interviewId,
      finalCode,
      transcript,
      testsPassed,
      testsTotal,
    } = body;

    if (
      !Array.isArray(transcript) ||
      transcript.length > 250 ||
      typeof finalCode !== "string" ||
      finalCode.length > 100_000 ||
      !Number.isInteger(testsPassed) ||
      !Number.isInteger(testsTotal) ||
      testsPassed < 0 ||
      testsTotal < 0 ||
      testsPassed > testsTotal
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid interview completion payload" },
        { status: 400 }
      );
    }

    const invalidTranscript = transcript.some(
      (message) =>
        typeof message?.content !== "string" ||
        message.content.length > 10_000 ||
        !Number.isFinite(message.timestamp_ms) ||
        message.timestamp_ms < 0
    );
    if (invalidTranscript) {
      return NextResponse.json(
        { success: false, error: "Invalid transcript" },
        { status: 400 }
      );
    }

    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: "interviewId is required" },
        { status: 400 }
      );
    }

    if (interviewId.startsWith("demo-")) {
      return NextResponse.json(
        { success: false, error: "Demo interviews cannot be persisted." },
        { status: 400 }
      );
    }

    const { getInterview, getProblemById, completeInterviewForUser } = await import("@/lib/db/queries");
    const existingInterview = await getInterview(interviewId);
    if (!existingInterview || existingInterview.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      );
    }
    if (existingInterview.status !== "in_progress") {
      return NextResponse.json(
        { success: false, error: "Interview has already been completed" },
        { status: 409 }
      );
    }

    const storedProblem = existingInterview.problem_id
      ? await getProblemById(existingInterview.problem_id)
      : null;
    const mode = existingInterview.mode ?? "general_dsa";
    const roundType = existingInterview.round_type ?? "coding";
    const roundContext =
      (existingInterview.round_context_snapshot as RoundContextSnapshot | null) ?? null;
    const interviewerPersona = resolveInterviewerPersona(
      existingInterview.interviewer_persona
    );
    const resolvedRoundTitle =
      existingInterview.round_title ??
      roundContext?.title ??
      storedProblem?.title ??
      "Interview Round";

    // Score the interview via Claude AI (skip if no API key)
    let scoringResult: Awaited<ReturnType<typeof scoreInterview>> | null = null;
    if (transcript && transcript.length > 0 && process.env.ANTHROPIC_API_KEY) {
      try {
        scoringResult = await scoreInterview({
          messages: transcript,
          finalCode: finalCode || "",
          testsPassed: testsPassed ?? 0,
          testsTotal: testsTotal ?? 0,
          mode,
          roundType,
          roundTitle: resolvedRoundTitle,
          interviewerPersonaId: interviewerPersona,
          problem: storedProblem
            ? {
                title: storedProblem.title,
                description: storedProblem.description,
                optimal_complexity:
                  (storedProblem.optimal_complexity as { time: string; space: string } | null) ??
                  { time: "Unknown", space: "Unknown" },
              }
            : null,
          roundContext: roundContext ?? null,
        });
      } catch (scoreError) {
        console.error("AI scoring failed:", scoreError);
      }
    }

    const durationSeconds = transcript.length > 0
      ? Math.floor(transcript[transcript.length - 1].timestamp_ms / 1000)
      : 0;
    const savedInterview = await completeInterviewForUser({
      interviewId,
      userId: user.id,
      data: {
        status: "completed",
        interviewer_persona: interviewerPersona,
        mode,
        round_type: roundType,
        round_title: resolvedRoundTitle,
        round_context_snapshot: roundContext ?? null,
        final_code: finalCode,
        completed_at: new Date(),
        duration_seconds: durationSeconds,
        code_passed_tests: testsPassed === testsTotal && testsTotal > 0,
        tests_passed: testsPassed,
        tests_total: testsTotal,
        overall_score: scoringResult?.overall_score ?? null,
        scores: scoringResult?.scores ?? null,
        feedback_summary: scoringResult?.summary ?? null,
        hire_recommendation: (scoringResult?.hire_recommendation ?? null) as "strong_hire" | "hire" | "lean_hire" | "lean_no_hire" | "no_hire" | null,
      },
      messages: transcript.map((msg) => ({
        role: msg.role === "interviewer"
          ? "interviewer"
          : msg.role === "candidate"
            ? "candidate"
            : "system",
        content: msg.content,
        timestampMs: msg.timestamp_ms,
      })),
      progress:
        mode === "general_dsa" &&
        storedProblem?.category &&
        scoringResult?.overall_score != null
          ? { category: storedProblem.category, score: scoringResult.overall_score }
          : undefined,
    });

    if (!savedInterview) {
      return NextResponse.json(
        { success: false, error: "Interview has already been completed" },
        { status: 409 }
      );
    }

    captureServerEvent(user.id, "interview_completed", {
      interview_id: interviewId,
      interviewer_persona: interviewerPersona,
      mode,
      round_type: roundType,
      round_title: resolvedRoundTitle,
      overall_score: scoringResult?.overall_score ?? null,
      hire_recommendation: scoringResult?.hire_recommendation ?? null,
      duration_seconds: durationSeconds,
      tests_passed: testsPassed,
      tests_total: testsTotal,
      difficulty: storedProblem?.difficulty,
      category: storedProblem?.category,
    });

    return NextResponse.json({
      success: true,
      data: {
        interviewId,
        completedAt: new Date().toISOString(),
        scoring: scoringResult,
        savedToDb: true,
      },
    });
  } catch (error) {
    console.error("Complete interview error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to complete interview",
      },
      { status: 500 }
    );
  }
}
