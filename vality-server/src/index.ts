import express from "express";
import cors from "cors";
import http from "node:http";
import path from "node:path";
import { WebSocketServer } from "ws";
import { promises as fs } from "node:fs";
import { config } from "./config";
import { features } from "./config/features";
import { voiceRouter } from "./routes/voice";
import { statusRouter } from "./routes/status";
import { presenceRouter } from "./routes/presence";
import { messagesRouter } from "./routes/messages";
import { contactsRouter } from "./routes/contacts";
import { newsRouter } from "./routes/news";
import { memoryRouter } from "./routes/memory";
import { calendarRouter } from "./routes/calendar";
import { attachWebSocketServer } from "./ws/hub";
import { loadMemory } from "./memory/store";
import { sweepStaleFacts } from "./memory/cleanup";

async function ensureDataDirs(): Promise<void> {
  await fs.mkdir(config.tmpDir, { recursive: true });
  await fs.mkdir(config.audioOutDir, { recursive: true });
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function main(): Promise<void> {
  await ensureDataDirs();

  if (features.memory) {
    await loadMemory();
    const staleCount = await sweepStaleFacts();
    if (staleCount > 0) {
      console.log(`Gedaechtnis: ${staleCount} Fakt(en) als veraltet markiert (nicht geloescht).`);
    }
    setInterval(() => {
      sweepStaleFacts().catch((err) => console.error("Gedaechtnis-Sweep fehlgeschlagen:", err));
    }, ONE_DAY_MS);
  }

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/api", statusRouter);
  app.use("/api", voiceRouter);
  app.use("/api", presenceRouter);
  if (features.presence) {
    console.log("Anwesenheitserkennung: aktiv, wartet auf POST /api/presence von der Handy-App.");
  }
  app.use("/api", messagesRouter);
  if (features.messages) {
    console.log("Nachrichten: aktiv, wartet auf POST /api/messages von der Handy-App.");
  }
  app.use("/api", contactsRouter);
  if (features.calls) {
    console.log("Anrufe: aktiv, loest Kontaktnamen ueber die Handy-App auf.");
  }
  app.use("/api", newsRouter);
  if (features.news) {
    console.log("Nachrichten: aktiv, GET /api/news liefert den Tagesschau-Feed (5 Min. Cache).");
  }
  app.use("/api", memoryRouter);
  if (features.memory) {
    console.log("Gedaechtnis: aktiv, GET /api/memory/facts liefert gemerkte + gelernte Fakten fuers Dashboard.");
  }
  app.use("/api", calendarRouter);
  console.log("Kalender: aktiv, Termine per Sprachbefehl ('Erinnere mich ...') landen direkt im Kalender der Handy-App.");
  app.use("/audio", express.static(config.audioOutDir));
  app.use("/", express.static(path.join(__dirname, "..", "public")));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });
  attachWebSocketServer(wss);

  server.listen(config.port, config.host, () => {
    console.log(`Vality-Server laeuft auf http://${config.host}:${config.port}`);
    console.log(`Dashboard: http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error("Vality-Server konnte nicht gestartet werden:", err);
  process.exit(1);
});
