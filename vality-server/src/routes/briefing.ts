import { Router } from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { buildOpeningBriefing } from "../hud/openingBriefing";
import { synthesizeSpeech } from "../tts/piper";
import { addInteraction } from "../util/history";
import { broadcast } from "../ws/hub";

export const briefingRouter = Router();

// Wird einmal pro Tab beim Oeffnen der Webseite aufgerufen (siehe
// useBriefing.ts). Laeuft ueber denselben Broadcast-Weg wie eine normale
// Sprachantwort (type "interaction") - das Dashboard behandelt es dadurch
// automatisch genauso: Log-Eintrag, Audiowiedergabe inklusive
// Stummschaltung, kein separater Sonderpfad im Frontend noetig.
briefingRouter.post("/briefing", async (_req, res) => {
  try {
    const reply = await buildOpeningBriefing();
    const audioPath = await synthesizeSpeech(reply);
    const audioUrl = `/audio/${path.basename(audioPath)}`;
    const id = randomUUID();
    const ts = new Date().toISOString();

    addInteraction({ id, transcript: "", reply, audioUrl, ts });
    broadcast({ type: "interaction", id, transcript: "", reply, audioUrl, ts });

    res.json({ id, reply, audioUrl, ts });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    broadcast({ type: "error", message, ts: new Date().toISOString() });
    res.status(500).json({ error: message });
  }
});
