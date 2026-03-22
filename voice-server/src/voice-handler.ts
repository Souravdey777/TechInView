import { WebSocket } from "ws";
import { streamWithSentenceCallbacks } from "./claude-stream.js";
import { DeepgramStream } from "./deepgram-stream.js";
import { ElevenLabsStream } from "./elevenlabs-stream.js";

type MessageRole = "interviewer" | "candidate" | "system";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type ControlMessage =
  | { type: "state_update"; state: string }
  | { type: "code_update"; code: string; language: string }
  | { type: "interrupt" };

const MAX_HISTORY = 20; // rolling window: last 20 turns
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY ?? "";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? "";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

export class VoiceHandler {
  private ws: WebSocket;
  private conversationHistory: ConversationMessage[] = [];
  private interviewState: string = "INTRO";
  private currentCode: string = "";
  private currentLanguage: string = "python";
  private deepgram: DeepgramStream;
  private elevenlabs: ElevenLabsStream;
  private isSpeaking: boolean = false;
  private turnCount: number = 0;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.deepgram = new DeepgramStream();
    this.elevenlabs = new ElevenLabsStream();

    this.setupDeepgram();
    this.setupElevenLabs();
    this.setupWsMessageHandler();
  }

  // ---- Setup ---------------------------------------------------------------

  private setupWsMessageHandler(): void {
    this.ws.on("message", (data: Buffer | ArrayBuffer | Buffer[], isBinary) => {
      if (isBinary) {
        // Raw audio frame from the browser MediaRecorder
        const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
        this.deepgram.send(chunk);
        return;
      }

      // JSON control message
      try {
        const msg: ControlMessage = JSON.parse(data.toString());
        this.handleControlMessage(msg);
      } catch {
        console.warn("[voice-handler] Received non-binary, non-JSON message — ignoring.");
      }
    });
  }

  private setupDeepgram(): void {
    this.deepgram.onTranscript = (transcript: string, isFinal: boolean) => {
      if (!isFinal) {
        // Forward interim transcript so UI can show live captions
        this.sendJson({ type: "transcript_interim", text: transcript });
        return;
      }

      const trimmed = transcript.trim();
      if (!trimmed) return;

      console.log(`[voice-handler] Final transcript: "${trimmed}"`);
      this.sendJson({ type: "transcript_final", text: trimmed });

      // Append candidate turn to history
      this.conversationHistory.push({ role: "user", content: trimmed });
      this.trimHistory();

      // Fire off the Claude → ElevenLabs pipeline (non-blocking)
      this.generateAndSpeakResponse().catch((err) => {
        console.error("[voice-handler] generateAndSpeakResponse error:", err);
      });
    };

    this.deepgram.onError = (err) => {
      console.error("[voice-handler] Deepgram error:", err);
      this.sendJson({ type: "error", source: "stt", message: err.message });
    };

    // Connect only if key is present
    if (DEEPGRAM_API_KEY) {
      this.deepgram.connect(DEEPGRAM_API_KEY);
    } else {
      console.warn("[voice-handler] DEEPGRAM_API_KEY not set — STT stubbed.");
    }
  }

  private setupElevenLabs(): void {
    this.elevenlabs.onAudio = (chunk: Buffer) => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(chunk); // binary audio back to browser
      }
    };

    this.elevenlabs.onError = (err) => {
      console.error("[voice-handler] ElevenLabs error:", err);
      this.sendJson({ type: "error", source: "tts", message: err.message });
    };

    if (ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID) {
      this.elevenlabs.connect(ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID);
    } else {
      console.warn("[voice-handler] ElevenLabs credentials not set — TTS stubbed.");
    }
  }

  // ---- Control messages ----------------------------------------------------

  private handleControlMessage(msg: ControlMessage): void {
    switch (msg.type) {
      case "state_update":
        console.log(`[voice-handler] State → ${msg.state}`);
        this.interviewState = msg.state;
        break;

      case "code_update":
        this.currentCode = msg.code;
        this.currentLanguage = msg.language;
        break;

      case "interrupt":
        console.log("[voice-handler] Interrupt received — flushing TTS buffer.");
        this.isSpeaking = false;
        this.elevenlabs.close();
        // Reconnect ElevenLabs for next utterance
        if (ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID) {
          this.elevenlabs = new ElevenLabsStream();
          this.setupElevenLabs();
          this.elevenlabs.connect(ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID);
        }
        break;

      default:
        console.warn("[voice-handler] Unknown control message type:", (msg as { type: string }).type);
    }
  }

  // ---- Claude → ElevenLabs pipeline ----------------------------------------

  private buildSystemPrompt(): string {
    return [
      "You are Alex, an AI technical interviewer at a top-tier tech company.",
      "You are conducting a Data Structures & Algorithms interview.",
      `Current interview phase: ${this.interviewState}.`,
      this.currentCode
        ? `\nCandidate's current code (${this.currentLanguage}):\n\`\`\`\n${this.currentCode}\n\`\`\``
        : "",
      "\nKeep responses SHORT and conversational — 1-3 sentences maximum.",
      "During CODING phase, be minimal. Only speak if necessary.",
      "Speak naturally, as if on a real voice call. No markdown.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  private async generateAndSpeakResponse(): Promise<void> {
    if (!ANTHROPIC_API_KEY) {
      console.warn("[voice-handler] ANTHROPIC_API_KEY not set — Claude response stubbed.");
      const stub = "I heard you — Claude integration is not yet configured.";
      this.sendJson({ type: "ai_text", text: stub });
      return;
    }

    this.isSpeaking = true;
    this.turnCount++;
    const systemPrompt = this.buildSystemPrompt();

    let fullResponse = "";

    try {
      await streamWithSentenceCallbacks(
        this.conversationHistory,
        systemPrompt,
        async (sentence) => {
          if (!this.isSpeaking) return; // interrupted
          fullResponse += (fullResponse ? " " : "") + sentence;
          // Forward sentence text to UI
          this.sendJson({ type: "ai_text_partial", text: sentence });
          // Send to TTS
          await this.elevenlabs.synthesize(sentence);
        }
      );
    } finally {
      this.isSpeaking = false;
    }

    if (fullResponse) {
      // Append AI turn to history
      this.conversationHistory.push({ role: "assistant", content: fullResponse });
      this.trimHistory();
      this.sendJson({ type: "ai_text_complete", text: fullResponse });
    }
  }

  // ---- Helpers --------------------------------------------------------------

  private trimHistory(): void {
    if (this.conversationHistory.length > MAX_HISTORY) {
      // Always drop from the front, keep recency
      this.conversationHistory = this.conversationHistory.slice(
        this.conversationHistory.length - MAX_HISTORY
      );
    }
  }

  private sendJson(payload: Record<string, unknown>): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  // ---- Cleanup --------------------------------------------------------------

  public cleanup(): void {
    this.isSpeaking = false;
    this.deepgram.close();
    this.elevenlabs.close();
    console.log("[voice-handler] Cleaned up.");
  }
}
