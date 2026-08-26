import { randomUUID } from "node:crypto";
import path from "node:path";
import { synthesizeSpeech } from "../tts/piper";
import { addInteraction } from "../util/history";
import { broadcast } from "../ws/hub";
import { getDueReminders, markFired } from "./store";
import type { Reminder } from "./types";

const CHECK_INTERVAL_MS = 20_000;

// Laeuft genau wie eine normale Sprachantwort ueber den bestehenden
// Broadcast-Weg (type "interaction", kind "reminder") - das Dashboard
// braucht dafuer keinen Sonderpfad: Log-Eintrag und Audiowiedergabe
// (inklusive Stummschaltung) laufen automatisch mit (siehe useVoiceSocket.ts).
async function fireReminder(reminder: Reminder): Promise<void> {
  await markFired(reminder.id);

  const reply = `Erinnerung: ${reminder.text}`;
  let audioUrl: string | null = null;
  try {
    const audioPath = await synthesizeSpeech(reply);
    audioUrl = `/audio/${path.basename(audioPath)}`;
  } catch (err) {
    // Ohne Ton bleibt die Erinnerung trotzdem im Logbuch sichtbar - besser
    // als sie ganz zu verschlucken, nur weil Piper gerade nicht laeuft.
    console.error("Erinnerung konnte nicht gesprochen werden:", err);
  }

  const id = randomUUID();
  const ts = new Date().toISOString();
  addInteraction({ id, transcript: "", reply, audioUrl, ts, kind: "reminder" });
  broadcast({ type: "interaction", id, transcript: "", reply, audioUrl, ts, kind: "reminder" });
}

export function startReminderScheduler(): void {
  setInterval(() => {
    const due = getDueReminders(new Date());
    for (const reminder of due) {
      fireReminder(reminder).catch((err) => console.error("Erinnerung fehlgeschlagen:", err));
    }
  }, CHECK_INTERVAL_MS);
}
