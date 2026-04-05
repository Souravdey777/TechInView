/**
 * STT often mishears the interviewer name "Tia" as "dear" / "Dear".
 * Keep in sync with src/lib/voice/normalize-stt-transcript.ts in the web app.
 */
export function normalizeSttTranscript(text: string): string {
  return text.replace(/\b[Dd]ear\b/g, "Tia");
}
