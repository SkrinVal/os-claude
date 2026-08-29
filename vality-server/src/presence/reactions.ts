import { randomUUID } from "node:crypto";
import path from "node:path";
import { askClaude } from "../brain/claude";
import { synthesizeSpeech } from "../tts/piper";
import { features } from "../config/features";
import { buildPromptContext } from "../memory/context";
import { recordConversationTurn } from "../memory/store";
import { addInteraction } from "../util/history";
import { broadcast } from "../ws/hub";

export type PresenceEvent = "arrived" | "left";

const INSTRUCTIONS: Record<PresenceEvent, string> = {
  arrived:
    "Der Nutzer kommt gerade zuhause an. Begrüße ihn in einem kurzen Satz. " +
    "Falls unten bekannte Fakten stehen, die gerade relevant wirken, erwähne " +
    "sie knapp - sonst reicht die Begrüßung allein. Auf Deutsch, maximal " +
    "zwei Sätze. Es gibt noch keine Erinnerungs-/Nachrichten-Funktion, also " +
    "nichts dergleichen erfinden.",
  left:
    "Der Nutzer verlässt gerade zuhause. Verabschiede ihn in einem kurzen, " +
    "knappen Satz auf Deutsch.",
};

const LABELS: Record<PresenceEvent, string> = {
  arrived: "[Ankunft zuhause]",
  left: "[Verlassen zuhause]",
};

// Wird von der Presence-Route ausgeloest, nachdem sie dem Handy schon
// geantwortet hat - die Sprachgenerierung soll das Event nicht blockieren.
export async function handlePresenceEvent(event: PresenceEvent): Promise<void> {
  const instruction = INSTRUCTIONS[event];

  let reply: string;
  if (features.memory) {
    const contextBlock = await buildPromptContext();
    reply = await askClaude(contextBlock ? `${contextBlock}${instruction}` : instruction);
  } else {
    reply = await askClaude(instruction);
  }

  const audioPath = await synthesizeSpeech(reply);
  const audioUrl = `/audio/${path.basename(audioPath)}`;
  const id = randomUUID();
  const ts = new Date().toISOString();
  const transcript = LABELS[event];

  if (features.memory) {
    await recordConversationTurn(transcript, reply);
  }
  addInteraction({ id, transcript, reply, audioUrl, ts });
  broadcast({ type: "interaction", id, transcript, reply, audioUrl, ts });
}
