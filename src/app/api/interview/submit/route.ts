import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SubmitInterviewBody = {
  interviewId: string;
  finalCode: string;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as SubmitInterviewBody;
    const { interviewId, finalCode } = body;

    if (!interviewId || !finalCode) {
      return NextResponse.json(
        { success: false, error: "interviewId and finalCode are required" },
        { status: 400 }
      );
    }

    // TODO: Update interview record in DB:
    //   await db
    //     .update(interviews)
    //     .set({ status: "completed", final_code: finalCode, completed_at: new Date() })
    //     .where(and(eq(interviews.id, interviewId), eq(interviews.user_id, user.id)));

    return NextResponse.json({
      success: true,
      data: {
        interviewId,
        completedAt: new Date().toISOString(),
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "Failed to submit interview" },
      { status: 500 }
    );
  }
}
