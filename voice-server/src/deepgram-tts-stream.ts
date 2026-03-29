import WebSocket from "ws";

const DEEPGRAM_TTS_WS_URL = "wss://api.deepgram.com/v1/speak";

export class DeepgramTTSStream {
  public onAudio: (chunk: Buffer) => void = () => {};
  public onError: (err: Error) => void = () => {};
  public onFlushed: () => void = () => {};
  public onClose: () => void = () => {};

  private socket: WebSocket | null = null;
  private apiKey = "";
  private model: string;
  private connected = false;
  private connecting = false;
  private pendingMessages: string[] = [];

  constructor(model = "aura-2-asteria-en") {
    this.model = model;
  }

  public connect(apiKey: string): void {
    if (this.connected || this.connecting) {
      return;
    }

    this.apiKey = apiKey;
    this.connecting = true;

    const params = new URLSearchParams({
      model: this.model,
      encoding: "linear16",
      sample_rate: "24000",
    });

    const url = `${DEEPGRAM_TTS_WS_URL}?${params.toString()}`;

    this.socket = new WebSocket(url, {
      headers: { Authorization: `Token ${apiKey}` },
    });

    this.socket.on("open", () => {
      this.connected = true;
      this.connecting = false;
      console.log(`[deepgram-tts] Connected (model: ${this.model}).`);

      for (const msg of this.pendingMessages) {
        this.socket!.send(msg);
      }
      this.pendingMessages = [];
    });

    this.socket.on("message", (data: Buffer | string, isBinary: boolean) => {
      if (isBinary) {
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
        // Skip tiny frames that aren't real audio
        if (buf.length > 2) {
          this.onAudio(buf);
        }
        return;
      }

      // JSON control message from Deepgram
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "Flushed") {
          this.onFlushed();
        }
      } catch {
        // Ignore unparseable frames
      }
    });

    this.socket.on("error", (err: Error) => {
      console.error("[deepgram-tts] WebSocket error:", err.message);
      this.connecting = false;
      this.onError(err);
    });

    this.socket.on("close", (code: number, reason: Buffer) => {
      this.connected = false;
      this.connecting = false;
      console.log(`[deepgram-tts] Connection closed: ${code} ${reason.toString()}`);
      this.onClose();
    });
  }

  /**
   * Send text to Deepgram for synthesis. Call once per sentence for
   * low-latency pipelining with Claude's streaming output.
   */
  public synthesize(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    const msg = JSON.stringify({ type: "Speak", text: trimmed });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(msg);
    } else if (this.connecting) {
      this.pendingMessages.push(msg);
    } else {
      console.warn("[deepgram-tts] synthesize() called while not connected.");
    }
  }

  /** Signal end of the current text segment so Deepgram flushes remaining audio. */
  public flush(): void {
    const msg = JSON.stringify({ type: "Flush" });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(msg);
    } else if (this.connecting) {
      this.pendingMessages.push(msg);
    }
  }

  /** Reset the stream — useful after an interruption to clear any buffered state. */
  public reset(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ type: "Reset" }));
      } catch {
        // Ignore if socket is in a bad state
      }
    }
  }

  public close(): void {
    const sock = this.socket;
    this.socket = null;
    this.connected = false;
    this.connecting = false;
    this.pendingMessages = [];

    if (!sock) return;

    if (sock.readyState === WebSocket.OPEN) {
      try {
        sock.send(JSON.stringify({ type: "Close" }));
      } catch {
        // Socket may already be closing
      }
      sock.close();
    } else if (sock.readyState === WebSocket.CONNECTING) {
      sock.on("open", () => sock.close());
    }

    console.log("[deepgram-tts] Connection closed.");
  }

  /** Tear down and reconnect — used after interruptions. */
  public async reconnect(): Promise<void> {
    this.close();
    // Small delay to let the old connection fully close
    await new Promise((r) => setTimeout(r, 100));
    if (this.apiKey) {
      this.connect(this.apiKey);
      // Wait for the connection to open
      await this.waitForOpen(3000);
    }
  }

  public get isConnected(): boolean {
    return this.connected;
  }

  public get isConnecting(): boolean {
    return this.connecting;
  }

  private waitForOpen(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("[deepgram-tts] Connection timeout"));
      }, timeoutMs);

      const check = () => {
        if (this.connected) {
          clearTimeout(timeout);
          resolve();
        } else if (!this.connecting) {
          clearTimeout(timeout);
          reject(new Error("[deepgram-tts] Connection failed"));
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }
}
