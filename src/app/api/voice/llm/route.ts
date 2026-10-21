import Anthropic from "@anthropic-ai/sdk";
import { LIVE_INTERVIEW_FREE_MODEL, LIVE_INTERVIEW_PAID_MODEL } from "@/lib/ai/models";
import { verifyVoiceLlmToken } from "@/lib/voice-llm-token";

// Voice replies are a few sentences plus the odd tool call.
const MAX_OUTPUT_TOKENS = 2048;

const anthropic = new Anthropic({ maxRetries: 1 });

/**
 * POST /api/voice/llm
 *
 * BYO Anthropic endpoint for Deepgram Voice Agent's think stage. Deepgram's
 * cloud calls this with the Messages API body it built from our Settings; we
 * authenticate the session token, pin the model to the token's tier, apply the
 * per-model thinking/effort settings Deepgram can't express, enable prompt
 * caching, and stream Anthropic's SSE straight back. The Anthropic key never
 * leaves the server.
 */
export async function POST(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization") ?? "";
  const claims = verifyVoiceLlmToken(auth.replace(/^Bearer\s+/i, ""));
  if (!claims) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.messages)) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  const isFree = claims.tier === "free";
  const toolChoice = body.tool_choice as { type?: string } | undefined;

  // Allowlist: whatever else Deepgram (or a token holder) sends is dropped, so
  // the proxy can't be used for server tools, other models, or long outputs.
  const params = {
    model: isFree ? LIVE_INTERVIEW_FREE_MODEL : LIVE_INTERVIEW_PAID_MODEL,
    max_tokens: Math.min(Number(body.max_tokens) || MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS),
    stream: body.stream !== false,
    system: body.system,
    messages: body.messages,
    // Custom (client) tools only.
    tools: Array.isArray(body.tools)
      ? (body.tools as { type?: string }[]).filter((t) => !t.type || t.type === "custom")
      : undefined,
    // Forced tool_choice (any/tool) is a 400 on the 5.5 models.
    tool_choice:
      toolChoice?.type === "auto" || toolChoice?.type === "none" ? toolChoice : undefined,
    // Lowest-latency thinking setting each model accepts: Haiku 5.5 takes
    // `disabled` at low effort; Sonnet 5.5 rejects `disabled` and uses
    // `between_tools` (no extended thinking) instead.
    thinking: { type: isFree ? "disabled" : "between_tools" },
    output_config: { effort: "low" },
    // Auto-cache the growing prefix (tools -> system -> messages) each turn.
    cache_control: { type: "ephemeral" },
  } as unknown as Anthropic.MessageCreateParams;

  try {
    const upstream = await anthropic.messages.create(params).asResponse();
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "text/event-stream",
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error("[voice-llm]", e.status, e.message);
      return Response.json(e.error ?? { error: e.message }, { status: e.status ?? 502 });
    }
    console.error("[voice-llm]", e);
    return Response.json({ error: "upstream failed" }, { status: 502 });
  }
}
