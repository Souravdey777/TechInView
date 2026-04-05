/**
 * STT often mishears the interviewer name "Tia" as "dear" / "Dear".
 * Replace standalone word matches only (not substrings like "dearer").
 */
export function normalizeSttTranscript(text: string): string {
  return text.replace(/\b[Dd]ear\b/g, "Tia");
}
