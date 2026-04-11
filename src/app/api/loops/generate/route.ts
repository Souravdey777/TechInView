import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildLoopSummary, generateTargetedLoop, sanitizeJdText } from "@/lib/loops/generator";
import { createGeneratedLoop } from "@/lib/db/queries";

const GenerateLoopSchema = z.object({
  company: z.string().min(2),
  roleTitle: z.string().min(2),
  experienceLevel: z.enum(["junior", "mid", "senior", "staff"]),
  jdText: z.string().min(40),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GenerateLoopSchema.parse({
      ...body,
      jdText: sanitizeJdText(body?.jdText ?? ""),
    });

    const loop = generateTargetedLoop(parsed);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const persisted = await createGeneratedLoop({
      userId: user?.id ?? null,
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
