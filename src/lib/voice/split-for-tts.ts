/** Smaller chunks = less work per request → faster time to first playable audio (more round-trips). */
const MAX_CHARS = 220;

/**
 * Split interview copy into smaller segments so the first segment can be synthesized
 * and played while later ones are still generating (lower time-to-first-audio).
 */
export function splitTextForTts(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentences = normalized.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const chunks: string[] = [];

  for (const sentence of sentences) {
    if (sentence.length <= MAX_CHARS) {
      chunks.push(sentence);
      continue;
    }

    const parts = sentence.split(/(?<=[;,])\s+/);
    let acc = "";
    for (const p of parts) {
      const next = acc ? `${acc} ${p}` : p;
      if (next.length <= MAX_CHARS || !acc) {
        acc = next;
      } else {
        chunks.push(acc.trim());
        acc = p;
      }
    }
    if (acc.trim()) chunks.push(acc.trim());
  }

  return chunks.filter((c) => c.length > 0);
}
