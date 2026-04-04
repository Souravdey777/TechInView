import { NextResponse } from "next/server";
import { z } from "zod";
import { deepgramAuraSpeak } from "@/lib/voice/deepgram-aura-speak";

export const runtime = "nodejs";

const bodySchema = z.object({
  text: z.string().trim().min(1).max(6000),
});

const DEFAULT_MODEL = "aura-2-asteria-en";

/**
 * POST /api/voice/tts
 * Proxies text to Deepgram Aura 2 and streams audio (MP3 by default) for browser playback.
 */
export async function POST(req: Request): Promise<Response> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors.text?.[0] ?? "Invalid text" },
      { status: 400 }
    );
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Text-to-speech is not configured (missing DEEPGRAM_API_KEY)." },
      { status: 503 }
    );
  }

  const model = process.env.DEEPGRAM_VOICE_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const upstream = await deepgramAuraSpeak(parsed.data.text, { apiKey, model });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => upstream.statusText);
      console.error("[api/voice/tts] Deepgram error:", upstream.status, errText.slice(0, 500));
      return NextResponse.json(
        { success: false, error: "Speech synthesis failed. Please try again." },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "audio/mpeg";

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[api/voice/tts]", e);
    return NextResponse.json({ success: false, error: "Speech synthesis request failed." }, { status: 502 });
  }
}
