import { NextRequest, NextResponse } from "next/server";
import { REVIEWED_HISTORICAL_QUESTIONS } from "@/data/historical-questions";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company")?.trim().toLowerCase();
    const roundType = searchParams.get("roundType")?.trim().toLowerCase();
    const topic = searchParams.get("topic")?.trim().toLowerCase();
    const search = searchParams.get("search")?.trim().toLowerCase();

    const questions = REVIEWED_HISTORICAL_QUESTIONS.filter((question) => {
      if (question.reviewStatus !== "reviewed") return false;
      if (company && question.company !== company && question.company !== "generic") return false;
      if (roundType && question.roundType !== roundType) return false;
      if (topic && !question.topics.some((value) => value.toLowerCase().includes(topic))) return false;
      if (
        search &&
        !(
          question.prompt.toLowerCase().includes(search) ||
          question.topics.some((value) => value.toLowerCase().includes(search)) ||
          question.jdTags.some((value) => value.toLowerCase().includes(search))
        )
      ) {
        return false;
      }

      return true;
    });

    return NextResponse.json({
      success: true,
      data: {
        questions,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch historical questions",
      },
      { status: 500 }
    );
  }
}
