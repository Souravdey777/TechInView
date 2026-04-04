/**
 * Server-side Deepgram Aura 2 REST TTS (single utterance).
 * @see https://developers.deepgram.com/reference/text-to-speech-api/speak
 */

const DEEPGRAM_SPEAK_URL = "https://api.deepgram.com/v1/speak";

export type DeepgramAuraSpeakOptions = {
  apiKey: string;
  /** e.g. aura-2-asteria-en */
  model: string;
};

/**
 * Request speech audio from Deepgram. Caller should check `response.ok` and stream or buffer the body.
 */
export function deepgramAuraSpeak(text: string, options: DeepgramAuraSpeakOptions): Promise<Response> {
  // MP3 is smaller and usually faster end-to-end than WAV. Safari Web Audio may fail to decode MP3 — client uses <audio> fallback.
  const params = new URLSearchParams({
    model: options.model,
    encoding: "mp3",
    bit_rate: "48000",
  });

  return fetch(`${DEEPGRAM_SPEAK_URL}?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
}
