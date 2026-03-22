import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ScoreInterviewBody = {
  interviewId: string;
};

type DimensionScore = {
  score: number;
  feedback: string;
};

type MockScoreData = {
  interviewId: string;
  overall_score: number;
  hire_recommendation: string;
  feedback_summary: string;
  scores: {
    problem_solving: DimensionScore;
    code_quality: DimensionScore;
    communication: DimensionScore;
    technical_knowledge: DimensionScore;
    testing: DimensionScore;
  };
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

    const body = (await req.json()) as ScoreInterviewBody;
    const { interviewId } = body;

    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: "interviewId is required" },
        { status: 400 }
      );
    }

    // TODO: Fetch the completed interview record and message transcript from DB,
    // then call scoreInterview() from @/lib/ai/scorer with the full context.
    // const interview = await db.query.interviews.findFirst({
    //   where: and(eq(interviews.id, interviewId), eq(interviews.user_id, user.id)),
    // });
    // const transcript = await db.query.messages.findMany({
    //   where: eq(messages.interview_id, interviewId),
    //   orderBy: asc(messages.timestamp_ms),
    // });
    // const scoreResult = await scoreInterview({ interview, transcript });

    // Mock scoring data returned until AI scorer is wired to DB
    const mockScore: MockScoreData = {
      interviewId,
      overall_score: 72,
      hire_recommendation: "hire",
      feedback_summary:
        "Strong performance overall. You identified an optimal hash map approach and implemented it cleanly. Time complexity analysis was accurate. Focus on verbalizing edge cases more proactively before coding.",
      scores: {
        problem_solving: {
          score: 75,
          feedback:
            "Good clarifying questions about edge cases. You correctly identified the hash map approach after briefly considering brute force.",
        },
        code_quality: {
          score: 78,
          feedback:
            "Clean, readable code with good variable naming. Minor improvement: prefer early returns to reduce nesting.",
        },
        communication: {
          score: 68,
          feedback:
            "Explained your approach clearly at a high level. Could improve by narrating implementation decisions as you code.",
        },
        technical_knowledge: {
          score: 70,
          feedback:
            "Correctly stated O(n) time and O(n) space. Showed understanding of hash map trade-offs.",
        },
        testing: {
          score: 65,
          feedback:
            "Tested the provided examples. Missed checking for negative numbers and target = 0 edge cases.",
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: mockScore,
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "Failed to score interview" },
      { status: 500 }
    );
  }
}
