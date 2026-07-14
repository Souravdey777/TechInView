import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildLoopSummary, generateTargetedLoop, sanitizeJdText } from "@/lib/loops/generator";
import { createGeneratedLoop } from "@/lib/db/queries";
import {
  enforceApiRateLimit,
  getAuthenticatedApiUser,
  unauthorizedResponse,
} from "@/lib/api-security";

const GenerateLoopSchema = z.object({
  company: z.string().min(2).max(80),
  roleTitle: z.string().min(2).max(120),
  experienceLevel: z.enum(["junior", "mid", "senior", "staff"]),
  jdText: z.string().min(40).max(12_000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedApiUser();
    if (!user) return unauthorizedResponse();
    const rateLimited = await enforceApiRateLimit({
      userId: user.id,
      action: "targeted_loop_generate",
      limit: 10,
      windowSeconds: 60 * 60,
    });
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const parsed = GenerateLoopSchema.parse({
      ...body,
      jdText: sanitizeJdText(body?.jdText ?? ""),
    });

    const loop = generateTargetedLoop(parsed);
    const persisted = await createGeneratedLoop({
      userId: user.id,
      loop,
    });

    const responseLoop = persisted
      ? {
          ...loop,
          id: persisted.id,
          rounds: loop.rounds.map((round) => {
            const persistedRound = persisted.rounds.find((item) => item.order === round.order);
            return persistedRound ? { ...round, id: persistedRound.id } : round;
          }),
        }
      : loop;

    return NextResponse.json({
      success: true,
      data: {
        loop: responseLoop,
        summary: buildLoopSummary(responseLoop),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate loop",
      },
      { status: 400 }
    );
  }
}
