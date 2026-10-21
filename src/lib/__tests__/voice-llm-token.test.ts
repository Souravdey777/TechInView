import test from "node:test";
import assert from "node:assert/strict";
import { signVoiceLlmToken, verifyVoiceLlmToken } from "../voice-llm-token";

test("voice LLM token round-trips, rejects tampering and expiry", () => {
  process.env.VOICE_LLM_PROXY_SECRET = "test-secret";
  const exp = Math.floor(Date.now() / 1000) + 60;
  const token = signVoiceLlmToken({ uid: "u1", tier: "free", exp });
  assert.ok(token);
  assert.deepEqual(verifyVoiceLlmToken(token), { uid: "u1", tier: "free", exp });

  const [body, sig] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ uid: "u1", tier: "paid", exp })).toString("base64url");
  assert.equal(verifyVoiceLlmToken(`${forged}.${sig}`), null);
  assert.equal(verifyVoiceLlmToken(`${body}.`), null);
  assert.equal(verifyVoiceLlmToken(token, (exp + 1) * 1000), null);
});
