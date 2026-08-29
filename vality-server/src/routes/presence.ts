import { Router } from "express";
import { config } from "../config";
import { features } from "../config/features";
import { handlePresenceEvent, type PresenceEvent } from "../presence/reactions";

export const presenceRouter = Router();

presenceRouter.post("/presence", (req, res) => {
  if (!features.presence) {
    res.status(404).json({ error: "Anwesenheitserkennung ist deaktiviert (config/features.json)." });
    return;
  }

  if (config.presence.token) {
    const expected = `Bearer ${config.presence.token}`;
    if (req.headers.authorization !== expected) {
      res.status(401).json({ error: "Ungültiges oder fehlendes Token." });
      return;
    }
  }

  const event = req.body?.event;
  if (event !== "arrived" && event !== "left") {
    res.status(400).json({ error: "Feld 'event' muss 'arrived' oder 'left' sein." });
    return;
  }

  // Sofort antworten: die Sprachgenerierung (claude -p + Piper) laeuft im
  // Hintergrund weiter, das Handy soll darauf nicht warten muessen.
  res.status(202).json({ ok: true });

  handlePresenceEvent(event as PresenceEvent).catch((err) => {
    console.error("Anwesenheits-Reaktion fehlgeschlagen:", err);
  });
});
