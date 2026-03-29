type ContextMessage = {
  role: string;
  content: string;
};

type BuildInterviewContextParams = {
  messages: ContextMessage[];
  currentCode: string;
  turnCount: number;
};

export function buildInterviewContext(params: BuildInterviewContextParams): string {
  const { messages, currentCode, turnCount } = params;

  // Take last 10 messages to manage context window
  const recentMessages = messages.slice(-10);

  let context = "## Recent Conversation\n";

  for (const msg of recentMessages) {
    const speaker =
      msg.role === "interviewer"
        ? "Tia"
        : msg.role === "candidate"
          ? "Candidate"
          : "System";
    context += `${speaker}: ${msg.content}\n`;
  }

  // Include code snapshot every 3 turns — avoids sending large code on every turn
  if (turnCount % 3 === 0 && currentCode.trim()) {
    context += `\n## Current Code\n\`\`\`\n${currentCode}\n\`\`\`\n`;
  }

  return context;
}
