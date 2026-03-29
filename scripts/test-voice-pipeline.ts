import WebSocket from "ws";

const VOICE_SERVER_URL = process.env.VOICE_SERVER_URL ?? "ws://localhost:8080/voice";

console.log("Voice Pipeline Test");
console.log("=".repeat(40));

console.log("\n1. Checking environment variables...");
console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "Set" : "Missing"}`);
console.log(`   DEEPGRAM_API_KEY:  ${process.env.DEEPGRAM_API_KEY ? "Set" : "Missing"}`);
console.log(`   DEEPGRAM_TTS_MODEL: ${process.env.DEEPGRAM_TTS_MODEL ?? "aura-2-asteria-en (default)"}`);

console.log("\n2. Connecting to voice server...");
console.log(`   URL: ${VOICE_SERVER_URL}`);

const ws = new WebSocket(VOICE_SERVER_URL);
let connected = false;

ws.on("open", () => {
  connected = true;
  console.log("   Connected to voice server.");

  console.log("\n3. Sending start message...");
  ws.send(
    JSON.stringify({
      type: "start",
      problem: {
        title: "Two Sum",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        solution_approach: "Use a hash map to store complement values.",
      },
      phase: "INTRO",
    })
  );
});

ws.on("message", (data: Buffer | string, isBinary: boolean) => {
  if (isBinary) {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    console.log(`   [audio] Received ${buf.length} bytes of TTS audio`);
    return;
  }

  try {
    const msg = JSON.parse(data.toString());
    const type = msg.type as string;

    switch (type) {
      case "thinking_started":
        console.log("   [event] AI is thinking...");
        break;
      case "speaking_started":
        console.log("   [event] AI started speaking");
        break;
      case "speaking_ended":
        console.log("   [event] AI finished speaking");
        break;
      case "ai_text_partial":
        console.log(`   [partial] "${msg.text}"`);
        break;
      case "ai_text_complete":
        console.log(`\n4. AI response: "${msg.text}"`);
        console.log("\n   Pipeline test complete!");
        setTimeout(() => {
          ws.close();
          process.exit(0);
        }, 2000);
        break;
      case "error":
        console.error(`   [error] ${msg.source}: ${msg.message}`);
        break;
      default:
        console.log(`   [${type}] ${JSON.stringify(msg)}`);
    }
  } catch {
    console.log(`   [raw] ${data.toString().slice(0, 100)}`);
  }
});

ws.on("error", (err: Error) => {
  console.error(`   Connection error: ${err.message}`);
  if (!connected) {
    console.error("\n   Make sure the voice server is running:");
    console.error("   cd voice-server && pnpm dev");
  }
  process.exit(1);
});

ws.on("close", () => {
  console.log("   Connection closed.");
});

setTimeout(() => {
  if (!connected) {
    console.error("\n   Timeout — could not connect to voice server.");
    process.exit(1);
  }
}, 5000);

setTimeout(() => {
  console.log("\n   Test timed out after 30s.");
  ws.close();
  process.exit(1);
}, 30000);
