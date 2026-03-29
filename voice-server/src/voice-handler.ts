import { WebSocket } from "ws";
import { streamWithSentenceCallbacks } from "./claude-stream.js";
import { DeepgramStream } from "./deepgram-stream.js";
import { DeepgramTTSStream } from "./deepgram-tts-stream.js";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type ProblemContext = {
  title: string;
  description: string;
  solution_approach?: string;
  constraints?: string[];
};

type ControlMessage =
  | { type: "state_update"; state: string }
  | { type: "code_update"; code: string; language: string }
  | { type: "interrupt" }
  | { type: "start"; problem: ProblemContext; phase: string }
  | { type: "text_input"; text: string };

const MAX_HISTORY = 20;

export class VoiceHandler {
  private ws: WebSocket;
  private conversationHistory: ConversationMessage[] = [];
  private interviewState = "INTRO";
  private currentCode = "";
  private currentLanguage = "python";
  private problem: ProblemContext | null = null;
  private deepgram: DeepgramStream;
  private tts: DeepgramTTSStream;
  private isSpeaking = false;
  private turnCount = 0;
  private pendingTranscript = "";
  private deepgramApiKey: string;
  private anthropicApiKey: string;

  private sttReady = false;
  private ttsReady = false;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.deepgramApiKey = process.env.DEEPGRAM_API_KEY ?? "";
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? "";
    const ttsModel = process.env.DEEPGRAM_TTS_MODEL ?? "aura-2-asteria-en";

    this.deepgram = new DeepgramStream();
    this.tts = new DeepgramTTSStream(ttsModel);

    this.setupDeepgramCallbacks();
    this.setupTTSCallbacks();
    this.setupWsMessageHandler();
  }

  // ---- Setup ---------------------------------------------------------------

  private setupWsMessageHandler(): void {
    this.ws.on("message", (data: Buffer | ArrayBuffer | Buffer[], isBinary) => {
      if (isBinary) {
        // Always forward audio to Deepgram to keep the STT connection alive.
        // Transcription results from echo are discarded in setupDeepgramCallbacks.
        this.ensureSTTConnected();
        const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
        this.deepgram.send(chunk);
        return;
      }

      try {
        const msg: ControlMessage = JSON.parse(data.toString());
        this.handleControlMessage(msg);
      } catch {
        console.warn("[voice-handler] Received non-binary, non-JSON message — ignoring.");
      }
    });
  }

  private setupDeepgramCallbacks(): void {
    this.deepgram.onTranscript = (transcript: string, isFinal: boolean) => {
      // Discard any transcription while Tia is speaking (echo from speakers)
      if (this.isSpeaking || this.isGenerating) return;

      if (!isFinal) {
        this.sendJson({ type: "transcript_interim", text: transcript });
        return;
      }

      const trimmed = transcript.trim();
      if (!trimmed) return;

      this.pendingTranscript += (this.pendingTranscript ? " " : "") + trimmed;
      console.log(`[voice-handler] Final segment: "${trimmed}" (pending: "${this.pendingTranscript}")`);
      this.sendJson({ type: "transcript_final", text: this.pendingTranscript });
    };

    this.deepgram.onUtteranceEnd = () => {
      // Ignore utterance boundaries from echo audio
      if (this.isSpeaking || this.isGenerating) {
        this.pendingTranscript = "";
        return;
      }

      const fullText = this.pendingTranscript.trim();
      this.pendingTranscript = "";

      if (!fullText) return;

      console.log(`[voice-handler] Utterance ended — full input: "${fullText}"`);
      this.sendJson({ type: "utterance_end" });

      this.conversationHistory.push({ role: "user", content: fullText });
      this.trimHistory();

      this.generateAndSpeakResponse().catch((err) => {
        console.error("[voice-handler] generateAndSpeakResponse error:", err);
      });
    };

    this.deepgram.onError = (err) => {
      console.error("[voice-handler] Deepgram STT error:", err);
      this.sendJson({ type: "error", source: "stt", message: err.message });
    };

    this.deepgram.onClose = () => {
      this.sttReady = false;
    };
  }

  private ensureSTTConnected(): void {
    if (!this.deepgramApiKey) {
      if (!this.sttReady) console.warn("[voice-handler] DEEPGRAM_API_KEY not set — STT disabled.");
      this.sttReady = true;
      return;
    }
    if (this.deepgram.isConnected || this.deepgram.isConnecting) {
      return;
    }
    console.log(`[voice-handler] ${this.sttReady ? "Reconnecting" : "Connecting"} Deepgram STT...`);
    this.deepgram.connect(this.deepgramApiKey);
    this.sttReady = true;
  }

  private speakingTimeout: ReturnType<typeof setTimeout> | null = null;

  private setupTTSCallbacks(): void {
    this.tts.onAudio = (chunk: Buffer) => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(chunk);
      }
    };

    this.tts.onFlushed = () => {
      console.log("[voice-handler] TTS flushed — speaking ended.");
      this.clearSpeakingState();
    };

    this.tts.onError = (err) => {
      console.error("[voice-handler] Deepgram TTS error:", err);
      this.clearSpeakingState();
      this.sendJson({ type: "error", source: "tts", message: err.message });
    };

    this.tts.onClose = () => {
      console.log("[voice-handler] TTS connection closed.");
      this.ttsReady = false;
      if (this.isSpeaking) {
        console.warn("[voice-handler] TTS closed while still speaking — force-resetting.");
        this.clearSpeakingState();
      }
    };
  }

  private clearSpeakingState(): void {
    this.isSpeaking = false;
    this.pendingTranscript = "";
    if (this.speakingTimeout) {
      clearTimeout(this.speakingTimeout);
      this.speakingTimeout = null;
    }
    this.sendJson({ type: "speaking_ended" });
  }

  private startSpeakingTimeout(): void {
    if (this.speakingTimeout) clearTimeout(this.speakingTimeout);
    this.speakingTimeout = setTimeout(() => {
      if (this.isSpeaking) {
        console.warn("[voice-handler] Speaking timeout (30s) — force-resetting.");
        this.clearSpeakingState();
      }
    }, 30_000);
  }

  private ensureTTSConnected(): void {
    if (!this.deepgramApiKey) {
      if (!this.ttsReady) console.warn("[voice-handler] DEEPGRAM_API_KEY not set — TTS disabled.");
      this.ttsReady = true;
      return;
    }
    if (this.tts.isConnected || this.tts.isConnecting) {
      return;
    }
    console.log(`[voice-handler] ${this.ttsReady ? "Reconnecting" : "Connecting"} Deepgram TTS...`);
    this.tts.connect(this.deepgramApiKey);
    this.ttsReady = true;
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
        this.handleInterrupt();
        break;

      case "start":
        this.handleStart(msg.problem, msg.phase);
        break;

      case "text_input":
        this.handleTextInput(msg.text);
        break;

      default:
        console.warn("[voice-handler] Unknown control message type:", (msg as { type: string }).type);
    }
  }

  private handleInterrupt(): void {
    console.log("[voice-handler] Interrupt received — flushing TTS.");
    this.isGenerating = false;
    this.tts.reset();
    this.clearSpeakingState();
  }

  private handleStart(problem: ProblemContext, phase: string): void {
    this.problem = problem;
    this.interviewState = phase;
    console.log(`[voice-handler] Interview started: "${problem.title}" phase=${phase}`);

    this.conversationHistory.push({ role: "user", content: "[The candidate has joined the interview. Begin your intro.]" });
    this.trimHistory();

    this.generateAndSpeakResponse().catch((err) => {
      console.error("[voice-handler] Start response error:", err);
    });
  }

  private handleTextInput(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    console.log(`[voice-handler] Text input: "${trimmed}"`);
    this.sendJson({ type: "transcript_final", text: trimmed });

    this.conversationHistory.push({ role: "user", content: trimmed });
    this.trimHistory();

    this.generateAndSpeakResponse().catch((err) => {
      console.error("[voice-handler] Text input response error:", err);
    });
  }

  // ---- Claude → Deepgram TTS pipeline -------------------------------------

  /**
   * Build system prompt as an array of text blocks with cache_control.
   *
   * Block 1 (CACHED): Persona + rules + problem context — identical across all turns.
   * Block 2 (uncached): Phase instruction, time, code — changes every turn.
   */
  private buildSystemBlocks(): Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }> {
    const staticBlock = this.buildStaticPrompt();
    const dynamicBlock = this.buildDynamicPrompt();

    return [
      {
        type: "text" as const,
        text: staticBlock,
        cache_control: { type: "ephemeral" as const },
      },
      {
        type: "text" as const,
        text: dynamicBlock,
      },
    ];
  }

  private buildStaticPrompt(): string {
    const parts: string[] = [
      `<role>`,
      `You are Tia, a senior software engineer conducting a live DSA coding interview. You have 8 years of experience at Google and Meta. You are the interviewer; the human is the candidate.`,
      `</role>`,
      ``,
      `<voice_rules>`,
      `This is a SPOKEN conversation delivered via text-to-speech. Every word you output will be read aloud.`,
      ``,
      `STRICT OUTPUT RULES:`,
      `- Maximum 3 sentences per response. During CODING phase, maximum 1 sentence.`,
      `- Use plain conversational English only. Write exactly as you would speak.`,
      `- NEVER output: markdown, bullet points, numbered lists, code blocks, backticks, asterisks, headers, or any formatting.`,
      `- NEVER say: "Great question!", "That's a great approach!", "Absolutely!", "Sure thing!", "Perfect!" — these are filler. Be direct.`,
      `- NEVER read code aloud character by character. Refer to code conceptually: "your loop" not "for i in range n".`,
      `- NEVER reveal the solution, write code for the candidate, or confirm their code is correct before they test it.`,
      `- Use contractions naturally: "you're", "let's", "what's", "that'll".`,
      `- If the candidate says something unclear, ask them to clarify rather than guessing.`,
      `</voice_rules>`,
      ``,
      `<interviewer_behavior>`,
      `Your approach to interviewing:`,
      `- Use Socratic questioning. Ask "what if..." and "how would..." instead of telling.`,
      `- When the candidate proposes a suboptimal approach, do NOT say "that works but can you do better". Instead, probe the weakness: "What happens to your solution when the input has a million elements?"`,
      `- When the candidate is stuck for more than one turn, give a nudge as a question: "What data structure gives you O(1) lookup?"`,
      `- When the candidate is on the right track, keep it brief: "Sounds good, go ahead and code that up."`,
      `- Match energy. If the candidate is nervous, be warmer. If they are confident, be more direct.`,
      `- Track what the candidate has already said. Do NOT ask them to repeat something they already explained.`,
      `</interviewer_behavior>`,
    ];

    if (this.problem) {
      parts.push(
        ``,
        `<problem>`,
        `Title: ${this.problem.title}`,
        ``,
        `Description:`,
        this.problem.description,
      );
      if (this.problem.constraints?.length) {
        parts.push(``, `Constraints: ${this.problem.constraints.join("; ")}`);
      }
      if (this.problem.solution_approach) {
        parts.push(
          ``,
          `CONFIDENTIAL — Optimal approach (guide toward this, NEVER state it):`,
          this.problem.solution_approach,
        );
      }
      parts.push(`</problem>`);
    }

    return parts.join("\n");
  }

  private buildDynamicPrompt(): string {
    const minutes = Math.floor(this.turnCount * 1.5);
    const parts: string[] = [
      `<current_state>`,
      `Phase: ${this.interviewState}`,
      `Time elapsed: ~${minutes} minutes`,
      `Turn: ${this.turnCount}`,
      `</current_state>`,
      ``,
      `<phase_instruction>`,
      this.getPhaseInstruction(),
      `</phase_instruction>`,
    ];

    if (this.currentCode.trim()) {
      parts.push(
        ``,
        `<candidate_code language="${this.currentLanguage}">`,
        this.currentCode,
        `</candidate_code>`,
      );
    }

    return parts.join("\n");
  }

  private getPhaseInstruction(): string {
    switch (this.interviewState) {
      case "INTRO":
        return [
          `Greet the candidate, quickly introduce yourself, and ask for a brief intro from them. Keep it casual and short.`,
          ``,
          `GOOD examples (pick a style, don't copy verbatim):`,
          `- "Hey, I'm Tia. Before we jump in, give me a quick intro, what's your name and what are you working on these days?"`,
          `- "Hi, I'm Tia. Tell me a little about yourself, just a quick one, and then we'll get into the problem."`,
          ``,
          `BAD — do NOT do any of these:`,
          `- Do NOT give a speech about expectations or how the interview works.`,
          `- Do NOT say "talk me through your thought process" or "I care about how you think".`,
          `- Do NOT say "welcome to your interview" or anything formal.`,
          `- Do NOT skip asking for their intro — it helps them settle in.`,
          ``,
          `Respond in exactly 2 sentences. Casual, brief, like a coworker.`,
        ].join("\n");

      case "PROBLEM_PRESENTED":
        return [
          `You just shared the problem on screen. The candidate can see it. Do NOT read the full problem description aloud — they can read it themselves.`,
          ``,
          `Say something like: "Alright, take a moment to read through the problem. Let me know when you're ready or if anything is unclear."`,
          ``,
          `Respond in exactly 1-2 sentences. Then wait.`,
        ].join("\n");

      case "CLARIFICATION":
        return [
          `The candidate is asking clarifying questions about the problem.`,
          ``,
          `DO: Answer accurately based on the problem constraints. Confirm edge cases honestly.`,
          `DO: If they haven't asked about important edge cases, prompt: "Anything else you want to confirm about the input?"`,
          `DO NOT: Give hints about the approach. Only clarify the problem statement.`,
          `DO NOT: Say "great question" or praise the question itself.`,
          ``,
          `Respond in 1-2 sentences per question.`,
        ].join("\n");

      case "APPROACH_DISCUSSION":
        return [
          `The candidate is explaining their approach before coding.`,
          ``,
          `IF they propose brute force: Acknowledge it, then probe: "What's the time complexity of that? Can you think of a way to bring it down?" Do NOT say "that works but...".`,
          `IF they propose the optimal approach: Ask them to walk through it with a small example to confirm understanding. Then say "Sounds solid, go ahead and code it."`,
          `IF they are vague: Ask them to be specific: "Can you walk me through exactly what happens step by step with the first example?"`,
          `IF they are stuck: Give one targeted question that points toward the key insight without revealing it.`,
          ``,
          `Respond in 2-3 sentences.`,
        ].join("\n");

      case "CODING":
        return [
          `The candidate is actively writing code. This is their focused time.`,
          ``,
          `DEFAULT: Say nothing. Let them code in silence.`,
          `ONLY speak if:`,
          `1. They directly ask you a question — answer in 1 sentence.`,
          `2. They talk through their logic — respond with "mhm" or "makes sense" (1-3 words).`,
          `3. You see a critical bug forming that will waste significant time — ask ONE question: "What value does that variable hold when the input is empty?"`,
          ``,
          `NEVER: Comment on their code style, suggest variable names, or narrate what they're typing.`,
          `NEVER: Say "looks good so far" or give premature validation.`,
          ``,
          `Maximum 1 sentence. Prefer silence.`,
        ].join("\n");

      case "TESTING":
        return [
          `The candidate should test their solution.`,
          ``,
          `Ask them to trace through the first example manually: "Can you walk me through what happens with the first example, step by step?"`,
          `After they trace one example, ask about an edge case relevant to this problem: empty input, single element, all duplicates, negative numbers, etc.`,
          `If their code has a bug, do NOT point it out. Ask: "What does your code return when the input is [specific failing case]?"`,
          `If all tests pass, say: "Nice. Let's talk about the complexity of your solution."`,
          ``,
          `Respond in 1-2 sentences.`,
        ].join("\n");

      case "COMPLEXITY_ANALYSIS":
        return [
          `Ask the candidate about time and space complexity.`,
          ``,
          `Ask: "What's the time and space complexity of your solution?"`,
          `IF correct: Confirm briefly, then ask a follow-up: "Could you do better on space?" or "What if the input were sorted, would that change anything?"`,
          `IF wrong: Do NOT correct them. Ask a probing question: "How many times does your inner loop run in the worst case?" or "What's the most expensive operation in there?"`,
          ``,
          `Respond in 1-2 sentences.`,
        ].join("\n");

      case "FOLLOW_UP":
        return [
          `Present a follow-up challenge if time permits. Make it a natural extension of the original problem.`,
          `Frame it casually: "Nice work. Let me throw a twist at you..." then state the variant.`,
          ``,
          `Respond in 2-3 sentences.`,
        ].join("\n");

      case "WRAP_UP":
        return [
          `End the interview. Thank the candidate. Give one specific thing they did well and one area to think about. Keep it genuine and brief.`,
          ``,
          `Example: "That's our time. You did a solid job breaking down the problem and your code was clean. One thing to practice is talking through your approach a bit more before jumping into code, it helps the interviewer follow along. Thanks for your time today, best of luck."`,
          ``,
          `Respond in 3-4 sentences. End with a farewell.`,
        ].join("\n");

      default:
        return `Respond naturally as an interviewer. Keep it to 1-2 sentences.`;
    }
  }

  private isGenerating = false;

  private async generateAndSpeakResponse(): Promise<void> {
    if (!this.anthropicApiKey) {
      console.warn("[voice-handler] ANTHROPIC_API_KEY not set — Claude response stubbed.");
      const stub = "I heard you — Claude integration is not yet configured.";
      this.sendJson({ type: "ai_text", text: stub });
      return;
    }

    if (this.isGenerating) {
      console.log("[voice-handler] Already generating — skipping.");
      return;
    }

    this.isGenerating = true;
    this.ensureTTSConnected();
    this.isSpeaking = true;
    this.startSpeakingTimeout();
    this.turnCount++;
    console.log("[voice-handler] Calling Claude...");
    this.sendJson({ type: "thinking_started" });

    const systemBlocks = this.buildSystemBlocks();
    let fullResponse = "";
    let firstSentence = true;

    try {
      await streamWithSentenceCallbacks(
        this.conversationHistory,
        systemBlocks,
        async (sentence) => {
          if (!this.isSpeaking) return; // interrupted

          if (firstSentence) {
            this.sendJson({ type: "speaking_started" });
            firstSentence = false;
          }

          fullResponse += (fullResponse ? " " : "") + sentence;
          this.sendJson({ type: "ai_text_partial", text: sentence });
          this.tts.synthesize(sentence);
        }
      );

      // Flush remaining audio after all sentences are sent
      if (this.isSpeaking) {
        this.tts.flush();
      }
    } catch (err) {
      console.error("[voice-handler] Claude streaming error:", err);
      this.isGenerating = false;
      this.clearSpeakingState();
      return;
    }

    if (fullResponse) {
      console.log(`[voice-handler] Claude response complete (${fullResponse.length} chars).`);
      this.conversationHistory.push({ role: "assistant", content: fullResponse });
      this.trimHistory();
      this.sendJson({ type: "ai_text_complete", text: fullResponse });
    } else {
      console.warn("[voice-handler] Claude returned empty response.");
      this.clearSpeakingState();
    }

    this.isGenerating = false;
  }

  // ---- Helpers --------------------------------------------------------------

  private trimHistory(): void {
    if (this.conversationHistory.length > MAX_HISTORY) {
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
    this.isGenerating = false;
    if (this.speakingTimeout) {
      clearTimeout(this.speakingTimeout);
      this.speakingTimeout = null;
    }
    this.deepgram.close();
    this.tts.close();
    console.log("[voice-handler] Cleaned up.");
  }
}
