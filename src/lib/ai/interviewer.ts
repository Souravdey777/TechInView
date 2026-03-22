import Anthropic from "@anthropic-ai/sdk";
import { getInterviewerSystemPrompt } from "./prompts";

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 300;
const ROLLING_WINDOW = 10; // keep last N turns in context

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type ProblemContext = {
  title: string;
  description: string;
  solution_approach: string;
  constraints: string[];
  examples: { input: string; output: string; explanation: string }[];
};

type GetNextResponseParams = {
  userMessage: string;
  currentCode: string;
  problem: ProblemContext;
};

export class InterviewerEngine {
  private client: Anthropic;
  private conversationHistory: ConversationMessage[];
  private currentPhase: string;
  private hintsGiven: number;
  private startedAt: number;

  constructor() {
    this.client = new Anthropic();
    this.conversationHistory = [];
    this.currentPhase = "intro";
    this.hintsGiven = 0;
    this.startedAt = Date.now();
  }

  setPhase(phase: string): void {
    this.currentPhase = phase;
  }

  incrementHintsGiven(): void {
    this.hintsGiven += 1;
  }

  getElapsedSeconds(): number {
    return Math.floor((Date.now() - this.startedAt) / 1000);
  }

  async *getNextResponse(params: GetNextResponseParams): AsyncGenerator<string> {
    const { userMessage, currentCode, problem } = params;

    // Add user message to history
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    // Build system prompt with current state
    const systemPrompt = getInterviewerSystemPrompt({
      problemTitle: problem.title,
      problemDescription: problem.description,
      solutionApproach: problem.solution_approach,
      constraints: problem.constraints,
      examples: problem.examples,
      currentPhase: this.currentPhase,
      elapsedSeconds: this.getElapsedSeconds(),
      hintsGiven: this.hintsGiven,
      currentCode,
    });

    // Keep only the last ROLLING_WINDOW turns to manage context length
    const recentHistory = this.conversationHistory.slice(-ROLLING_WINDOW);

    // Stream response from Claude
    let fullResponse = "";

    const stream = this.client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: recentHistory,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        const token = event.delta.text;
        fullResponse += token;
        yield token;
      }
    }

    // Add complete response to history
    if (fullResponse.trim()) {
      this.conversationHistory.push({
        role: "assistant",
        content: fullResponse,
      });
    }

    // Trim history to rolling window (keep pairs: user + assistant)
    if (this.conversationHistory.length > ROLLING_WINDOW) {
      this.conversationHistory = this.conversationHistory.slice(-ROLLING_WINDOW);
    }
  }

  getConversationHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  reset(): void {
    this.conversationHistory = [];
    this.currentPhase = "intro";
    this.hintsGiven = 0;
    this.startedAt = Date.now();
  }
}
