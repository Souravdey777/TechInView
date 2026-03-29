import { config } from "dotenv";
import { resolve } from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { VoiceHandler } from "./voice-handler.js";

config({ path: resolve(import.meta.dirname, "../../.env.local") });
config({ path: resolve(import.meta.dirname, "../../.env") });

const PORT = parseInt(process.env.PORT ?? "8080", 10);

// --- HTTP server (health check + WS upgrade) ---
const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// --- WebSocket server (voice pipeline) ---
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname !== "/voice") {
    console.log(`[ws] Rejected upgrade for unknown path: ${url.pathname}`);
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
  const remoteIp = req.socket.remoteAddress ?? "unknown";
  console.log(`[ws] Client connected: ${remoteIp}`);

  const handler = new VoiceHandler(ws);

  ws.on("close", (code, reason) => {
    console.log(
      `[ws] Client disconnected: ${remoteIp} — code=${code} reason=${reason.toString()}`
    );
    handler.cleanup();
  });

  ws.on("error", (err) => {
    console.error(`[ws] Socket error for ${remoteIp}:`, err.message);
    handler.cleanup();
  });
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`[server] TechInView voice server listening on port ${PORT}`);
  console.log(`[server] Health: http://localhost:${PORT}/health`);
  console.log(`[server] Voice WS: ws://localhost:${PORT}/voice`);
});

// --- Graceful shutdown ---
function shutdown(signal: string) {
  console.log(`[server] Received ${signal}, shutting down gracefully...`);
  wss.clients.forEach((ws) => ws.close(1001, "Server shutting down"));
  server.close(() => {
    console.log("[server] HTTP server closed.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("[server] Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
