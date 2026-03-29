import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertInterviewFeedback, getInterviewFeedback } from "@/lib/db/queries";
import { captureServerEvent } from "@/lib/posthog/server";

const RATING_KEYS = [
  "realism",
  "ai_quality",
  "problem_fit",
  "scoring_accuracy",
  "overall",
] as const;

type Ratings = Record<(typeof RATING_KEYS)[number], number> & { nps: number };

type FeedbackBody = {
  interviewId: string;
  ratings: Ratings;
  wentWell?: string;
  toImprove?: string;
};

function validateRatings(ratings: unknown): ratings is Ratings {
  if (!ratings || typeof ratings !== "object") return false;
  const r = ratings as Record<string, unknown>;

  for (const key of RATING_KEYS) {
    const val = r[key];
    if (typeof val !== "number" || val < 1 || val > 5) return false;
  }

  if (typeof r.nps !== "number" || r.nps < 1 || r.nps > 10) return false;

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as FeedbackBody;
    const { interviewId, ratings, wentWell, toImprove } = body;

    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: "interviewId is required" },
        { status: 400 }
      );
    }

    if (!validateRatings(ratings)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ratings object is required with realism, ai_quality, problem_fit, scoring_accuracy, overall (1-5) and nps (1-10)",
        },
        { status: 400 }
      );
    }

    const feedback = await insertInterviewFeedback({
      interview_id: interviewId,
      user_id: user.id,
      rating: ratings.overall,
      ratings,
      went_well: wentWell?.trim() || undefined,
      to_improve: toImprove?.trim() || undefined,
    });

    captureServerEvent(user.id, "interview_feedback_submitted", {
      interview_id: interviewId,
      realism_rating: ratings.realism,
      ai_quality_rating: ratings.ai_quality,
      problem_fit_rating: ratings.problem_fit,
      scoring_accuracy_rating: ratings.scoring_accuracy,
      overall_rating: ratings.overall,
      nps_score: ratings.nps,
      has_went_well: !!wentWell?.trim(),
      has_to_improve: !!toImprove?.trim(),
    });

    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    console.error("Interview feedback error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save feedback",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const interviewId = req.nextUrl.searchParams.get("interviewId");
    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: "interviewId query param is required" },
        { status: 400 }
      );
    }

    const feedback = await getInterviewFeedback(interviewId);
    return NextResponse.json({ success: true, data: feedback ?? null });
  } catch (error) {
    console.error("Get interview feedback error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch feedback",
      },
      { status: 500 }
    );
  }
}
