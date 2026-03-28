import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertInterviewFeedback, getInterviewFeedback } from "@/lib/db/queries";
import { captureServerEvent } from "@/lib/posthog/server";

type FeedbackBody = {
  interviewId: string;
  rating: number;
  wentWell?: string;
  toImprove?: string;
};

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
    const { interviewId, rating, wentWell, toImprove } = body;

    if (!interviewId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "interviewId and rating (1-5) are required" },
        { status: 400 }
      );
    }

    const feedback = await insertInterviewFeedback({
      interview_id: interviewId,
      user_id: user.id,
      rating,
      went_well: wentWell?.trim() || undefined,
      to_improve: toImprove?.trim() || undefined,
    });

    captureServerEvent(user.id, "interview_feedback_submitted", {
      interview_id: interviewId,
      rating,
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
