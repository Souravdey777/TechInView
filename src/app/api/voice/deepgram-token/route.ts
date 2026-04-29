import { NextResponse } from "next/server";
import { DeepgramClient, DeepgramError } from "@deepgram/sdk";
import { createClient } from "@/lib/supabase/server";

const VOICE_TOKEN_SERVER_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), VOICE_TOKEN_SERVER_TIMEOUT_MS);
    }),
  ]);
}

/**
 * POST /api/voice/deepgram-token
 *
 * Mints a short-lived Deepgram JWT for browser Voice Agent WebSocket auth
 * via @deepgram/sdk (POST /v1/auth/grant).
 */
export async function POST(): Promise<Response> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Voice agent not configured (missing DEEPGRAM_API_KEY)" },
      { status: 503 },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await withTimeout(
    supabase.auth.getUser(),
    "Authentication lookup timed out"
  );

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const client = new DeepgramClient({ apiKey });
    const grant = await withTimeout(
      client.auth.v1.tokens.grant({ ttl_seconds: 600 }),
      "Deepgram token grant timed out"
    );

    return NextResponse.json({
      success: true,
      data: {
        token: grant.access_token,
        expiresIn: grant.expires_in ?? 600,
      },
    });
  } catch (e) {
    console.error("[deepgram-token]", e);
    if (e instanceof DeepgramError) {
      return NextResponse.json(
        { success: false, error: e.message || "Deepgram token grant failed" },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Token request failed" },
      { status: 502 },
    );
  }
}
