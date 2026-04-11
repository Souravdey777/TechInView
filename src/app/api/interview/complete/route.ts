import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreInterview } from "@/lib/ai/scorer";
import { captureServerEvent } from "@/lib/posthog/server";
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
    // Get authenticated user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = (await req.json()) as CompleteInterviewBody;
    const {
      interviewId,
      finalCode,
      transcript,
      testsPassed,
      testsTotal,
      problem,
      roundContext,
      mode = "general_dsa",
      roundType = "coding",
      roundTitle,
    } = body;
    const interviewerPersona = resolveInterviewerPersona(body.interviewerPersona);
    const resolvedRoundTitle =
      roundTitle ?? roundContext?.title ?? problem?.title ?? "Interview Round";

    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: "interviewId is required" },
        { status: 400 }
      );
    }

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
          problem: problem
            ? {
                title: problem.title ?? "Unknown Problem",
                description: problem.description ?? "",
                optimal_complexity: problem.optimal_complexity ?? { time: "Unknown", space: "Unknown" },
              }
            : null,
          roundContext: roundContext ?? null,
        });
      } catch (scoreError) {
        console.error("AI scoring failed:", scoreError);
      }
    }

    // Persist to DB if user is authenticated and interviewId is a real UUID
    const isRealInterview = user && !interviewId.startsWith("demo-");
    if (isRealInterview) {
      try {
        const { updateInterview, addMessage, updateProgress } = await import("@/lib/db/queries");

        // Update interview record with results
        const durationSeconds = transcript.length > 0
          ? Math.floor(transcript[transcript.length - 1].timestamp_ms / 1000)
          : 0;

        await updateInterview(interviewId, {
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
        });

        // Save conversation messages in parallel
        if (transcript.length > 0) {
          await Promise.all(transcript.map((msg) => {
            const role = msg.role === "interviewer" ? "interviewer"
              : msg.role === "candidate" ? "candidate"
              : "system";
            return addMessage(
              interviewId,
              role as "interviewer" | "candidate" | "system",
              msg.content,
              msg.timestamp_ms
            );
          }));
        }

        // Update progress stats for this category
        if (
          user &&
          mode === "general_dsa" &&
          problem?.category &&
          scoringResult &&
          scoringResult.overall_score != null
        ) {
          await updateProgress(user.id, problem.category, scoringResult.overall_score);
        }

        console.log(`✓ Interview ${interviewId} saved to DB`);
      } catch (dbError) {
        // Log but don't fail — user still gets results
        console.error("Failed to save interview to DB:", dbError);
      }
    }

    if (user) {
      const durationSeconds = transcript.length > 0
        ? Math.floor(transcript[transcript.length - 1].timestamp_ms / 1000)
        : 0;
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
        difficulty: problem?.difficulty,
        category: problem?.category,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        interviewId,
        completedAt: new Date().toISOString(),
        scoring: scoringResult,
        savedToDb: !!isRealInterview,
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
