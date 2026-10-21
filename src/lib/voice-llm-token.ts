import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Short-lived bearer token Deepgram sends to /api/voice/llm on every think
 * turn. It travels in the browser-built Settings message, so it must never be
 * (or reveal) the Anthropic key: it only names who may use the proxy, on which
 * model tier, until when.
 */
export type VoiceLlmClaims = { uid: string; tier: "free" | "paid"; exp: number };

// Longest interview plus slack; Deepgram reuses the header for the whole session.
export const VOICE_LLM_TOKEN_TTL_SECONDS = 2 * 60 * 60;

function signingKey(): Buffer | null {
  const secret = process.env.VOICE_LLM_PROXY_SECRET || process.env.ANTHROPIC_API_KEY;
  if (!secret) return null;
  // Derived, so the raw Anthropic key is never the HMAC key itself.
  return createHmac("sha256", secret).update("techinview-voice-llm-proxy").digest();
}

export function signVoiceLlmToken(claims: VoiceLlmClaims): string | null {
  const key = signingKey();
  if (!key) return null;
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const sig = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyVoiceLlmToken(token: string, now = Date.now()): VoiceLlmClaims | null {
  const key = signingKey();
  const [body, sig] = token.split(".");
  if (!key || !body || !sig) return null;
  const expected = createHmac("sha256", key).update(body).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, "base64url").toString()) as VoiceLlmClaims;
    if (typeof claims.exp !== "number" || claims.exp * 1000 < now) return null;
    if (claims.tier !== "free" && claims.tier !== "paid") return null;
    return claims;
  } catch {
    return null;
  }
}

/**
 * Public URL Deepgram's cloud can reach. Explicit override wins (e.g. a tunnel
 * in local dev); otherwise derive from the app URL unless that is localhost.
 */
export function getVoiceLlmProxyUrl(): string | null {
  if (process.env.VOICE_LLM_PROXY_URL) return process.env.VOICE_LLM_PROXY_URL;
  const app = process.env.NEXT_PUBLIC_APP_URL;
  if (!app || /\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(app)) return null;
  return `${app.replace(/\/$/, "")}/api/voice/llm`;
}
