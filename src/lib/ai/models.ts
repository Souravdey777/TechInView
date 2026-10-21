// Live voice rounds run on these through our own LLM proxy (/api/voice/llm),
// which Deepgram calls as a BYO Anthropic endpoint.
export const LIVE_INTERVIEW_FREE_MODEL = "claude-haiku-5-5";
export const LIVE_INTERVIEW_PAID_MODEL = "claude-sonnet-5-5";

// Deepgram's managed Anthropic provider does not list the 5.5 models yet. When
// the proxy is unreachable (local dev without a public URL), the voice hook
// falls back to Deepgram-managed models instead.
export const MANAGED_LIVE_INTERVIEW_FALLBACK: Record<string, string> = {
  [LIVE_INTERVIEW_FREE_MODEL]: "claude-haiku-4-5",
  [LIVE_INTERVIEW_PAID_MODEL]: "claude-sonnet-5",
};

export const INTERVIEW_MODEL = "claude-sonnet-5";
export const SCORING_MODEL = "claude-opus-5-5";
export const PREP_PLAN_PRIMARY_MODEL = "claude-haiku-4-5";
export const PREP_PLAN_FALLBACK_MODEL = "claude-sonnet-5";

export function getLiveInterviewModel(isFreeInterview: boolean): string {
  return isFreeInterview ? LIVE_INTERVIEW_FREE_MODEL : LIVE_INTERVIEW_PAID_MODEL;
}
