export const LIVE_INTERVIEW_FREE_MODEL = "claude-haiku-4-5";
export const LIVE_INTERVIEW_PAID_MODEL = "claude-sonnet-5";

export const INTERVIEW_MODEL = "claude-sonnet-5";
export const PREP_PLAN_PRIMARY_MODEL = "claude-haiku-4-5";
export const PREP_PLAN_FALLBACK_MODEL = "claude-sonnet-5";

export function getLiveInterviewModel(isFreeInterview: boolean): string {
  return isFreeInterview ? LIVE_INTERVIEW_FREE_MODEL : LIVE_INTERVIEW_PAID_MODEL;
}
