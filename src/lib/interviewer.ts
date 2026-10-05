export const INTERVIEWER = {
  name: "Tia",
  voiceModel: "aura-2-asteria-en",
  greeting: "Hi, I'm Tia, your AI interviewer for today.",
  shortStyleSummary: "Balanced, warm, and rigorous.",
  calibrationNotes:
    "Use a balanced FAANG-generalist bar. Stay supportive, keep responses concise, and evaluate across the shared five-dimension rubric.",
  interviewStylePrompt:
    "Keep the interview warm, concise, and rigorous. Ask one focused probe at a time, guide with Socratic questions, and make the candidate show fundamentals through constraints, examples, and tradeoffs.",
  scoringFocusPrompt:
    "Score with a general FAANG-calibrated bar. Reward clear reasoning, practical problem solving, clean execution, and honest self-correction; penalize vague explanations, missing edge cases, and dependence on heavy hints.",
} as const;

export const INTERVIEWER_VOICES = [
  { id: "aura-2-asteria-en", label: "Clear" },
  { id: "aura-2-thalia-en", label: "Energetic" },
  { id: "aura-2-athena-en", label: "Calm" },
] as const;

export type InterviewerVoiceId = (typeof INTERVIEWER_VOICES)[number]["id"];

const VOICE_STORAGE_KEY = "techinview:interviewer-voice";

// ponytail: per-device preference in localStorage; move to a profiles column if it should follow the account.
export function getInterviewerVoice(): InterviewerVoiceId {
  try {
    const stored = window.localStorage.getItem(VOICE_STORAGE_KEY);
    const match = INTERVIEWER_VOICES.find((voice) => voice.id === stored);
    if (match) return match.id;
  } catch {
    // No window (server render) or storage blocked: fall back to the default voice.
  }
  return INTERVIEWER.voiceModel;
}

export function setInterviewerVoice(id: InterviewerVoiceId): void {
  try {
    window.localStorage.setItem(VOICE_STORAGE_KEY, id);
  } catch {
    // The choice still applies until reload when storage is unavailable.
  }
}
