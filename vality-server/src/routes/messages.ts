import { Router } from "express";
import { config } from "../config";
import { features } from "../config/features";
import { addMessage } from "../messages/store";
import { announceIncomingMessage } from "../messages/reactions";

export const messagesRouter = Router();

messagesRouter.post("/messages", (req, res) => {
  if (!features.messages) {
    res.status(404).json({ error: "Nachrichten-Feature ist deaktiviert (config/features.json)." });
    return;
  }

  if (config.presence.token) {
    const expected = `Bearer ${config.presence.token}`;
    if (req.headers.authorization !== expected) {
      res.status(401).json({ error: "Ungültiges oder fehlendes Token." });
      return;
    }
  }

  const { source, sender, body } = req.body ?? {};
  if ((source !== "sms" && source !== "whatsapp") || typeof sender !== "string" || typeof body !== "string") {
    res.status(400).json({ error: "Felder 'source' ('sms'|'whatsapp'), 'sender' und 'body' erforderlich." });
    return;
  }
  if (!sender.trim() || !body.trim()) {
    res.status(400).json({ error: "'sender' und 'body' duerfen nicht leer sein." });
    return;
  }

  const message = addMessage({ source, sender: sender.trim(), body: body.trim(), ts: new Date().toISOString() });

  // Sofort antworten - Vorlesen (claude/piper-frei, aber trotzdem I/O)
  // soll das Handy/den nativen Aufrufer nicht blockieren.
  res.status(202).json({ ok: true });

  announceIncomingMessage(message).catch((err) => {
    console.error("Nachricht konnte nicht vorgelesen werden:", err);
  });
});
