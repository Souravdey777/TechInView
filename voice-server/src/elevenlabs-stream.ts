/**
 * ElevenLabs streaming TTS client.
 *
 * Uses the ElevenLabs WebSocket streaming endpoint for low-latency audio.
 * Core HTTP/WebSocket logic is behind TODO comments — class API is complete.
 */

// TODO: pnpm add @elevenlabs/elevenlabs-js when ready to wire up real TTS
// import https from "https";

const ELEVENLABS_WS_BASE = "wss://api.elevenlabs.io/v1/text-to-speech";
const ELEVENLABS_MODEL = "eleven_turbo_v2_5";

type ElevenLabsWSMessage =
  | { text: string; voice_settings?: { stability: number; similarity_boost: number }; xi_api_key: string }
  | { text: ""; flush: true };

export class ElevenLabsStream {
  /** Called for each audio chunk (PCM/MP3 binary) received from ElevenLabs. */
  public onAudio: (chunk: Buffer) => void = () => {};
  /** Called when a connection or synthesis error occurs. */
  public onError: (err: Error) => void = () => {};

  // TODO: private socket: WebSocket | null = null;
  private apiKey: string = "";
  private voiceId: string = "";
  private connected: boolean = false;

  /**
   * Open the ElevenLabs WebSocket connection for the given voice.
   * @param apiKey  - ElevenLabs API key.
   * @param voiceId - Pre-selected voice ID for "Tia".
   */
  public connect(apiKey: string, voiceId: string): void {
    this.apiKey = apiKey;
    this.voiceId = voiceId;

    if (this.connected) {
      console.warn("[elevenlabs] Already connected.");
      return;
    }

    console.log(`[elevenlabs] Connecting to ElevenLabs (voice: ${voiceId})...`);

    // TODO: Implement real WebSocket connection
    // const url = `${ELEVENLABS_WS_BASE}/${voiceId}/stream-input?model_id=${ELEVENLABS_MODEL}&output_format=mp3_44100_128`;
    // this.socket = new WebSocket(url);
    //
    // this.socket.on("open", () => {
    //   this.connected = true;
    //   console.log("[elevenlabs] Connected.");
    //   // Send BOS (beginning of stream) with auth
    //   const bos: ElevenLabsWSMessage = {
    //     text: " ",
    //     voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    //     xi_api_key: this.apiKey,
    //   };
    //   this.socket?.send(JSON.stringify(bos));
    // });
    //
    // this.socket.on("message", (data: Buffer) => {
    //   try {
    //     const msg = JSON.parse(data.toString());
    //     if (msg.audio) {
    //       const audioChunk = Buffer.from(msg.audio, "base64");
    //       this.onAudio(audioChunk);
    //     }
    //     if (msg.isFinal) {
    //       // EOS received — audio stream complete for this utterance
    //     }
    //   } catch {
    //     // binary frame — shouldn't happen with this endpoint, but handle gracefully
    //   }
    // });
    //
    // this.socket.on("error", (err) => this.onError(err));
    //
    // this.socket.on("close", (code, reason) => {
    //   this.connected = false;
    //   console.log(`[elevenlabs] Connection closed: ${code} ${reason.toString()}`);
    // });

    console.warn("[elevenlabs] connect() is stubbed — real implementation TODO.");
    this.connected = true; // stub: pretend connected
  }

  /**
   * Send text to ElevenLabs for synthesis.
   * Sends sentence by sentence for low latency (called per sentence from claude-stream).
   * @param text - A single sentence to synthesize.
   */
  public async synthesize(text: string): Promise<void> {
    if (!this.connected) {
      console.warn("[elevenlabs] synthesize() called before connect().");
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    console.log(`[elevenlabs] Synthesizing: "${trimmed.slice(0, 60)}${trimmed.length > 60 ? "..." : ""}"`);

    // TODO: Send text chunk over WebSocket
    // const msg: ElevenLabsWSMessage = { text: trimmed + " ", xi_api_key: this.apiKey };
    // this.socket?.send(JSON.stringify(msg));
    //
    // Alternative: REST streaming endpoint (simpler, slightly higher latency)
    // const response = await fetch(
    //   `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "xi-api-key": this.apiKey,
    //       "Content-Type": "application/json",
    //       Accept: "audio/mpeg",
    //     },
    //     body: JSON.stringify({
    //       text: trimmed,
    //       model_id: ELEVENLABS_MODEL,
    //       voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    //     }),
    //   }
    // );
    // for await (const chunk of response.body!) {
    //   this.onAudio(Buffer.from(chunk));
    // }

    console.warn("[elevenlabs] synthesize() is stubbed — no audio emitted.");
  }

  /** Flush pending text and close the WebSocket connection. */
  public close(): void {
    if (!this.connected) return;

    // TODO: Send EOS marker before closing
    // const eos: ElevenLabsWSMessage = { text: "", flush: true };
    // this.socket?.send(JSON.stringify(eos));
    // this.socket?.close();

    this.connected = false;
    console.log("[elevenlabs] Connection closed.");
  }
}
