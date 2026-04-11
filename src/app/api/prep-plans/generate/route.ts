import { NextRequest, NextResponse } from "next/server";
import { generatePrepPlanSummary } from "@/lib/ai/prep-plan-planner";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const plan = await generatePrepPlanSummary(body);

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate prep plan";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
