import { NextRequest, NextResponse } from "next/server";
import { generatePrepPlanSummary } from "@/lib/ai/prep-plan-planner";
import { hasCapturedPayment } from "@/lib/db/queries";
import {
  enforceApiRateLimit,
  getAuthenticatedApiUser,
  unauthorizedResponse,
} from "@/lib/api-security";
import { captureServerEvent } from "@/lib/posthog/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedApiUser();
    if (!user) return unauthorizedResponse();
    if (!(await hasCapturedPayment(user.id))) {
      return NextResponse.json(
        {
          success: false,
          error: "Prep Guru is available on paid plans. Buy an interview pack to unlock it.",
        },
        { status: 403 }
      );
    }
    const rateLimited = await enforceApiRateLimit({
      userId: user.id,
      action: "prep_plan_generate",
      limit: 10,
      windowSeconds: 60 * 60,
    });
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const plan = await generatePrepPlanSummary(body);
    captureServerEvent(user.id, "prep_guru_plan_generated", {
      company: plan.company,
      role: plan.role,
      round_count: plan.tracks.length,
      has_jd: typeof body?.jdText === "string" && body.jdText.length > 0,
    });

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
