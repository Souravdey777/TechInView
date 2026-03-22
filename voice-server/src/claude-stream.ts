import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 300; // Short responses for voice

type Message = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Stream a response from Claude token by token.
 *
 * @param messages     - Conversation history (rolling window of last N turns).
 * @param systemPrompt - Dynamic system prompt including interview state + code.
 * @yields             - Individual text tokens as they arrive from the API.
 *
 * @example
 * for await (const token of streamResponse(history, systemPrompt)) {
 *   process.stdout.write(token);
 * }
 */
export async function* streamResponse(
  messages: Message[],
  systemPrompt: string
): AsyncGenerator<string> {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

/**
 * Stream a Claude response and invoke `onSentence` for each complete sentence.
 *
 * Sentences are detected by terminal punctuation (. ! ?) so we can pipeline
 * each one to ElevenLabs before the full response is complete — this is the
 * primary latency optimization for the voice pipeline.
 *
 * @param messages     - Conversation history.
 * @param systemPrompt - Dynamic system prompt.
 * @param onSentence   - Async callback invoked for each complete sentence.
 *
 * @example
 * await streamWithSentenceCallbacks(history, prompt, async (sentence) => {
 *   await elevenlabs.synthesize(sentence);
 * });
 */
export async function streamWithSentenceCallbacks(
  messages: Message[],
  systemPrompt: string,
  onSentence: (sentence: string) => Promise<void>
): Promise<void> {
  let buffer = "";

  // Regex: sentence ends with . ! ? optionally followed by closing quote/paren,
  // then a space or end-of-string.
  const SENTENCE_END_RE = /[.!?][)'"]?\s/;

  for await (const token of streamResponse(messages, systemPrompt)) {
    buffer += token;

    // Flush complete sentences as they accumulate
    let match: RegExpExecArray | null;
    while ((match = SENTENCE_END_RE.exec(buffer)) !== null) {
      const sentenceEnd = match.index + match[0].length;
      const sentence = buffer.slice(0, sentenceEnd).trim();
      buffer = buffer.slice(sentenceEnd);

      if (sentence) {
        await onSentence(sentence);
      }
    }
  }

  // Flush any remaining text (sentence without terminal punctuation)
  const remaining = buffer.trim();
  if (remaining) {
    await onSentence(remaining);
  }
}
