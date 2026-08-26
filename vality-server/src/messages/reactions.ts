import { randomUUID } from "node:crypto";
import path from "node:path";
import { config } from "../config";
import { features } from "../config/features";
import { synthesizeSpeech } from "../tts/piper";
import { addInteraction } from "../util/history";
import { broadcast } from "../ws/hub";
import { recordConversationTurn } from "../memory/store";
import type { IncomingMessage } from "./store";

// Liest bewusst woertlich vor statt ueber claude -p umzuformulieren - der
// Sinn ist, die tatsaechliche Nachricht zu hoeren, nicht eine Zusammen-
// fassung davon.
export async function announceIncomingMessage(message: IncomingMessage): Promise<void> {
  if (!config.messages.readAloud) return;

  const sourceLabel = message.source === "whatsapp" ? "WhatsApp" : "SMS";
  const reply = `Neue Nachricht von ${message.sender} über ${sourceLabel}: ${message.body}`;

  const audioPath = await synthesizeSpeech(reply);
  const audioUrl = `/audio/${path.basename(audioPath)}`;
  const id = randomUUID();
  const ts = new Date().toISOString();
  const transcript = `[${sourceLabel} von ${message.sender}]`;

  if (features.memory) {
    await recordConversationTurn(transcript, reply);
  }
  addInteraction({ id, transcript, reply, audioUrl, ts });
  broadcast({ type: "interaction", id, transcript, reply, audioUrl, ts });
}
