import { NextResponse } from "next/server";
import { DeepgramClient, DeepgramError } from "@deepgram/sdk";
import { createClient } from "@/lib/supabase/server";
import { enforceApiRateLimit } from "@/lib/api-security";
import {
  getVoiceLlmProxyUrl,
  signVoiceLlmToken,
  VOICE_LLM_TOKEN_SLACK_SECONDS,
} from "@/lib/voice-llm-token";

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
 *
 * With `{ interviewId }` in the body it also returns `llm`: our BYO think
 * endpoint plus a bearer token pinned to that interview's tier (free trial vs
 * paid), or null when the proxy can't be used (no public URL, unknown
 * interview) and the client should fall back to Deepgram-managed models.
 */
export async function POST(request: Request): Promise<Response> {
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

  const rateLimited = await enforceApiRateLimit({
    userId: user.id,
    action: "deepgram_token",
    limit: 12,
    windowSeconds: 60 * 60,
  });
  if (rateLimited) return rateLimited;

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
        llm: await resolveLlmEndpoint(request, user.id),
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

async function resolveLlmEndpoint(
  request: Request,
  userId: string,
): Promise<{ url: string; token: string } | null> {
  const url = getVoiceLlmProxyUrl();
  if (!url) return null;

  const body = (await request.json().catch(() => null)) as { interviewId?: unknown } | null;
  const interviewId = typeof body?.interviewId === "string" ? body.interviewId : null;
  if (!interviewId) return null;

  try {
    const { getInterview } = await import("@/lib/db/queries");
    const interview = await getInterview(interviewId);
    if (!interview || interview.user_id !== userId || interview.status !== "in_progress") {
      return null;
    }

    const token = signVoiceLlmToken({
      uid: userId,
      iid: interview.id,
      tier: interview.is_free_trial ? "free" : "paid",
      exp:
        Math.floor(Date.now() / 1000) +
        interview.max_duration_seconds +
        VOICE_LLM_TOKEN_SLACK_SECONDS,
    });
    return token ? { url, token } : null;
  } catch (e) {
    console.error("[deepgram-token] llm endpoint", e);
    return null;
  }
}
