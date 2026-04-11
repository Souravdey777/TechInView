import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { captureServerEvent } from "@/lib/posthog/server";
import { resolveInterviewerPersona } from "@/lib/interviewer-personas";
import {
  FREE_TRIAL_DURATION_SECONDS,
  FULL_INTERVIEW_DURATION_SECONDS,
  type InterviewMode,
  type RoundType,
} from "@/lib/constants";
import type { LoopSummarySnapshot, RoundContextSnapshot } from "@/lib/loops/types";

function trimOrNull(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function inferCategoriesFromRound(round: RoundContextSnapshot | null): string[] {
  if (!round) return [];

  const haystack = `${round.focusAreas.join(" ")} ${round.historicalQuestions.map((question) => question.topics.join(" ")).join(" ")}`.toLowerCase();
  const matches = new Set<string>();

  if (haystack.includes("array") || haystack.includes("hash")) matches.add("arrays");
  if (haystack.includes("string")) matches.add("strings");
  if (haystack.includes("graph")) matches.add("graphs");
  if (haystack.includes("tree")) matches.add("trees");
  if (haystack.includes("heap")) matches.add("heap");
  if (haystack.includes("dynamic")) matches.add("dp");
  if (haystack.includes("backtracking")) matches.add("backtracking");
  if (haystack.includes("binary")) matches.add("binary-search");

  return Array.from(matches);
}

type StartInterviewBody = {
  difficulty?: string;
  category?: string;
  language: string;
  company?: string | null;
  roleTitle?: string | null;
  maxDurationSeconds?: number;
  problemSlug?: string;
  interviewerPersona?: string;
  mode?: InterviewMode;
  roundType?: RoundType;
  generatedLoopId?: string | null;
  generatedLoopRoundId?: string | null;
  generatedLoopSummary?: LoopSummarySnapshot | null;
  generatedLoopRoundSnapshot?: RoundContextSnapshot | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StartInterviewBody;
    const { language } = body;

    if (!language) {
      return NextResponse.json(
        { success: false, error: "language is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const {
      getProfile,
      getRandomProblem,
      getRandomProblemForCompany,
      getProblemBySlug,
      createInterview,
      decrementCredits,
      updateProfile,
    } = await import("@/lib/db/queries");

    let isFreeInterview = false;
    let maxDuration = body.maxDurationSeconds ?? FULL_INTERVIEW_DURATION_SECONDS;
    let difficulty = body.difficulty as "easy" | "medium" | "hard" | undefined;
    const category = body.category;
    const mode = body.mode ?? "general_dsa";
    const roundType = body.roundType ?? "coding";
    const generatedLoopSummary = body.generatedLoopSummary ?? null;
    const generatedLoopRoundSnapshot = body.generatedLoopRoundSnapshot ?? null;
    const companyFromLoop = generatedLoopSummary?.company ?? trimOrNull(body.company);
    const roleTitleFromPayload = trimOrNull(body.roleTitle);
    let targetCompany: string | null = companyFromLoop;

    if (user) {
      const profile = await getProfile(user.id);

      if (!profile || profile.interview_credits <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No interview credits remaining. Buy an interview pack to continue.",
          },
          { status: 403 }
        );
      }

      targetCompany = companyFromLoop ?? profile.target_company ?? null;
      isFreeInterview = mode === "general_dsa" ? !profile.has_used_free_trial : false;

      if (isFreeInterview) {
        difficulty = "easy";
        maxDuration = FREE_TRIAL_DURATION_SECONDS;
      }
    }

    const interviewerPersona = resolveInterviewerPersona(body.interviewerPersona, {
      isFreeTrial: isFreeInterview,
      targetCompany,
    });

    let problem = null;
    const roundTitle = generatedLoopRoundSnapshot?.title ?? null;

    if (body.problemSlug) {
      problem = await getProblemBySlug(body.problemSlug);
    }

    if (!problem && mode === "targeted_loop" && roundType === "coding") {
      problem = await getRandomProblemForCompany({
        company: targetCompany,
        difficulty: generatedLoopRoundSnapshot?.difficulty ?? difficulty,
        categories: inferCategoriesFromRound(generatedLoopRoundSnapshot),
      });
    }

    if (!problem && mode === "general_dsa") {
      problem = await getRandomProblem(difficulty, category);
    }

    if (roundType === "coding" && !problem) {
      return NextResponse.json(
        { success: false, error: "No matching problem found for the given filters" },
        { status: 404 }
      );
    }

    let interviewId: string;
    if (user) {
      const interview = await createInterview({
        userId: user.id,
        problemId: problem?.id ?? null,
        interviewerPersona,
        language,
        maxDuration,
        isFreeTrial: isFreeInterview,
        mode,
        roundType,
        roundTitle,
        generatedLoopId: body.generatedLoopId ?? null,
        generatedLoopRoundId: body.generatedLoopRoundId ?? null,
        companySnapshot: targetCompany,
        roleTitleSnapshot: generatedLoopSummary?.roleTitle ?? roleTitleFromPayload,
        loopSummarySnapshot: generatedLoopSummary,
        roundContextSnapshot: generatedLoopRoundSnapshot,
      });
      interviewId = interview.id;

      await decrementCredits(user.id);

      if (isFreeInterview) {
        await updateProfile(user.id, { has_used_free_trial: true });
      }
    } else {
      interviewId = `demo-${Date.now()}`;
    }

    if (user) {
      captureServerEvent(user.id, "interview_started", {
        difficulty: problem?.difficulty ?? generatedLoopRoundSnapshot?.difficulty ?? null,
        category: problem?.category ?? null,
        language,
        interviewer_persona: interviewerPersona,
        is_free_trial: isFreeInterview,
        mode,
        round_type: roundType,
        problem_title: problem?.title ?? generatedLoopRoundSnapshot?.title ?? null,
        interview_id: interviewId,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        interviewId,
        isFreeInterview,
        interviewerPersona,
        mode,
        roundType,
        round: generatedLoopRoundSnapshot,
        generatedLoopSummary,
        problem: problem
          ? {
              id: problem.id,
              title: problem.title,
              slug: problem.slug,
              difficulty: problem.difficulty,
              category: problem.category,
              description: problem.description,
              examples: problem.examples,
              constraints: problem.constraints,
              starter_code: problem.starter_code,
              hints: problem.hints,
              test_cases: problem.test_cases,
              solution_approach: problem.solution_approach,
              optimal_complexity: problem.optimal_complexity,
              follow_up_questions: problem.follow_up_questions,
            }
          : null,
        language,
        maxDuration,
        startedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to start interview";
    console.error("Start interview error:", error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
