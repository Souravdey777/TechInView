import WebSocket from "ws";

const DEEPGRAM_WS_URL = "wss://api.deepgram.com/v1/listen";

const DEEPGRAM_PARAMS = new URLSearchParams({
  model: "nova-2",
  language: "en-US",
  smart_format: "true",
  interim_results: "true",
  utterance_end_ms: "1500",
  vad_events: "true",
});

const KEEPALIVE_INTERVAL_MS = 8_000;

export class DeepgramStream {
  public onTranscript: (transcript: string, isFinal: boolean) => void = () => {};
  public onUtteranceEnd: () => void = () => {};
  public onError: (err: Error) => void = () => {};
  public onClose: () => void = () => {};

  private socket: WebSocket | null = null;
  private connected = false;
  private connecting = false;
  private apiKey = "";
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private pendingChunks: Buffer[] = [];

  public connect(apiKey: string): void {
    if (this.connected || this.connecting) {
      return;
    }
    this.apiKey = apiKey;

    this.connecting = true;
    const url = `${DEEPGRAM_WS_URL}?${DEEPGRAM_PARAMS.toString()}`;

    this.socket = new WebSocket(url, {
      headers: { Authorization: `Token ${apiKey}` },
    });

    this.socket.on("open", () => {
      this.connected = true;
      this.connecting = false;
      console.log("[deepgram-stt] Connected to Deepgram Nova-2.");
      this.startKeepAlive();

      // Flush any audio chunks that arrived while connecting
      for (const chunk of this.pendingChunks) {
        this.socket!.send(chunk);
      }
      this.pendingChunks = [];
    });

    this.socket.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "Results") {
          const alt = msg.channel?.alternatives?.[0];
          const transcript: string = alt?.transcript ?? "";
          const isFinal: boolean = msg.is_final === true;
          const speechFinal: boolean = msg.speech_final === true;

          if (transcript) {
            this.onTranscript(transcript, isFinal);
          }

          if (isFinal && speechFinal && transcript) {
            this.onUtteranceEnd();
          }
        } else if (msg.type === "UtteranceEnd") {
          this.onUtteranceEnd();
        }
      } catch {
        // Non-JSON keepalive frames — ignore
      }
    });

    this.socket.on("error", (err: Error) => {
      this.connecting = false;
      console.error("[deepgram-stt] WebSocket error:", err.message);
      this.onError(err);
    });

    this.socket.on("close", (code: number, reason: Buffer) => {
      this.connected = false;
      this.connecting = false;
      this.stopKeepAlive();
      console.log(`[deepgram-stt] Connection closed: ${code} ${reason.toString()}`);
      this.onClose();
    });
  }

  public send(chunk: Buffer): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(chunk);
      return;
    }
    // Buffer audio while connection is being established
    if (this.connecting) {
      this.pendingChunks.push(chunk);
    }
  }

  public close(): void {
    this.stopKeepAlive();

    const sock = this.socket;
    this.socket = null;
    this.connected = false;
    this.connecting = false;
    this.pendingChunks = [];

    if (!sock) return;

    if (sock.readyState === WebSocket.OPEN) {
      try {
        sock.send(JSON.stringify({ type: "CloseStream" }));
      } catch {
        // Socket may already be closing
      }
      sock.close();
    } else if (sock.readyState === WebSocket.CONNECTING) {
      sock.on("open", () => sock.close());
    }

    console.log("[deepgram-stt] Connection closed.");
  }

  public get isConnected(): boolean {
    return this.connected;
  }

  public get isConnecting(): boolean {
    return this.connecting;
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "KeepAlive" }));
      }
    }, KEEPALIVE_INTERVAL_MS);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }
}
