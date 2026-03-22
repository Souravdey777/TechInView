/**
 * Deepgram streaming STT client.
 *
 * Full implementation is behind TODO comments — the class structure and public
 * API are complete so the rest of the voice pipeline can integrate against it.
 */

// TODO: pnpm add @deepgram/sdk when ready to wire up real STT
// import WebSocket from "ws";

const DEEPGRAM_WS_URL = "wss://api.deepgram.com/v1/listen";

/** Query params for the Deepgram Nova-2 streaming endpoint. */
const DEEPGRAM_PARAMS = new URLSearchParams({
  model: "nova-2",
  language: "en-US",
  smart_format: "true",
  interim_results: "true",
  utterance_end_ms: "1500",
  vad_events: "true",
  encoding: "opus",
  sample_rate: "16000",
  channels: "1",
});

export class DeepgramStream {
  /** Called with each transcript result. `isFinal` is true on utterance end. */
  public onTranscript: (transcript: string, isFinal: boolean) => void = () => {};
  /** Called when a connection or protocol error occurs. */
  public onError: (err: Error) => void = () => {};

  // TODO: private socket: WebSocket | null = null;
  private connected: boolean = false;

  /**
   * Open the WebSocket connection to Deepgram.
   * @param apiKey - Deepgram API key (passed as Authorization header).
   */
  public connect(apiKey: string): void {
    if (this.connected) {
      console.warn("[deepgram] Already connected.");
      return;
    }

    console.log("[deepgram] Connecting to Deepgram Nova-2...");

    // TODO: Implement real connection
    // const url = `${DEEPGRAM_WS_URL}?${DEEPGRAM_PARAMS.toString()}`;
    // this.socket = new WebSocket(url, {
    //   headers: { Authorization: `Token ${apiKey}` },
    // });
    //
    // this.socket.on("open", () => {
    //   this.connected = true;
    //   console.log("[deepgram] Connected.");
    // });
    //
    // this.socket.on("message", (data: Buffer) => {
    //   try {
    //     const msg = JSON.parse(data.toString());
    //     if (msg.type === "Results") {
    //       const channel = msg.channel?.alternatives?.[0];
    //       const transcript: string = channel?.transcript ?? "";
    //       const isFinal: boolean = msg.is_final === true;
    //       if (transcript) this.onTranscript(transcript, isFinal);
    //     } else if (msg.type === "UtteranceEnd") {
    //       // VAD detected end of utterance — already handled via is_final
    //     }
    //   } catch {
    //     // non-JSON keepalive frames — ignore
    //   }
    // });
    //
    // this.socket.on("error", (err) => this.onError(err));
    //
    // this.socket.on("close", (code, reason) => {
    //   this.connected = false;
    //   console.log(`[deepgram] Connection closed: ${code} ${reason.toString()}`);
    // });

    console.warn("[deepgram] connect() is stubbed — real implementation TODO.");
    this.connected = true; // stub: pretend connected
  }

  /**
   * Send a raw audio chunk (opus-encoded) to Deepgram for transcription.
   * @param chunk - Binary audio buffer captured by the browser MediaRecorder.
   */
  public send(chunk: Buffer): void {
    if (!this.connected) {
      console.warn("[deepgram] send() called before connect().");
      return;
    }

    // TODO: this.socket?.send(chunk);
    // Stub: do nothing — no real socket to write to
  }

  /** Gracefully close the Deepgram WebSocket. */
  public close(): void {
    if (!this.connected) return;

    // TODO: Send a CloseStream message per Deepgram protocol, then close socket.
    // this.socket?.send(JSON.stringify({ type: "CloseStream" }));
    // this.socket?.close();

    this.connected = false;
    console.log("[deepgram] Connection closed.");
  }
}
