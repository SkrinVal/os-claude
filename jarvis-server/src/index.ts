import express from "express";
import cors from "cors";
import http from "node:http";
import path from "node:path";
import { WebSocketServer } from "ws";
import { promises as fs } from "node:fs";
import { config } from "./config";
import { voiceRouter } from "./routes/voice";
import { statusRouter } from "./routes/status";
import { attachWebSocketServer } from "./ws/hub";

async function ensureDataDirs(): Promise<void> {
  await fs.mkdir(config.tmpDir, { recursive: true });
  await fs.mkdir(config.audioOutDir, { recursive: true });
}

async function main(): Promise<void> {
  await ensureDataDirs();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/api", statusRouter);
  app.use("/api", voiceRouter);
  app.use("/audio", express.static(config.audioOutDir));
  app.use("/", express.static(path.join(__dirname, "..", "public")));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });
  attachWebSocketServer(wss);

  server.listen(config.port, config.host, () => {
    console.log(`Jarvis-Server laeuft auf http://${config.host}:${config.port}`);
    console.log(`Dashboard: http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error("Jarvis-Server konnte nicht gestartet werden:", err);
  process.exit(1);
});
