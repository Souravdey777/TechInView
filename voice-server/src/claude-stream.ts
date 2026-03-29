import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 300;

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

type SystemBlock = Anthropic.TextBlockParam & {
  cache_control?: { type: "ephemeral" };
};

/**
 * Stream a response from Claude token by token with prompt caching.
 *
 * Accepts system prompt as an array of TextBlockParam so the caller can
 * place cache_control breakpoints on stable blocks (persona + problem)
 * while leaving dynamic blocks (phase, time, code) uncached.
 */
export async function* streamResponse(
  messages: Message[],
  systemBlocks: SystemBlock[]
): AsyncGenerator<string> {
  const stream = getClient().messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemBlocks,
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
 * each one to Deepgram TTS before the full response is complete — this is the
 * primary latency optimization for the voice pipeline.
 */
export async function streamWithSentenceCallbacks(
  messages: Message[],
  systemBlocks: SystemBlock[],
  onSentence: (sentence: string) => Promise<void>
): Promise<void> {
  let buffer = "";

  const SENTENCE_END_RE = /[.!?][)'"]?\s/;

  for await (const token of streamResponse(messages, systemBlocks)) {
    buffer += token;

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

  const remaining = buffer.trim();
  if (remaining) {
    await onSentence(remaining);
  }
}
