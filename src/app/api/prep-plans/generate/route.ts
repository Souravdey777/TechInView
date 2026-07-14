import { NextRequest, NextResponse } from "next/server";
import { generatePrepPlanSummary } from "@/lib/ai/prep-plan-planner";
import {
  enforceApiRateLimit,
  getAuthenticatedApiUser,
  unauthorizedResponse,
} from "@/lib/api-security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedApiUser();
    if (!user) return unauthorizedResponse();
    const rateLimited = await enforceApiRateLimit({
      userId: user.id,
      action: "prep_plan_generate",
      limit: 10,
      windowSeconds: 60 * 60,
    });
    if (rateLimited) return rateLimited;

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
