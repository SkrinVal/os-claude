import { Router } from "express";
import { config } from "../config";
import { features } from "../config/features";
import { deliverContactResolution, type ContactMatch } from "../contacts/resolve";

export const contactsRouter = Router();

contactsRouter.post("/contacts/resolve", (req, res) => {
  if (!features.calls) {
    res.status(404).json({ error: "Anrufe-Feature ist deaktiviert (config/features.json)." });
    return;
  }

  if (config.presence.token) {
    const expected = `Bearer ${config.presence.token}`;
    if (req.headers.authorization !== expected) {
      res.status(401).json({ error: "Ungültiges oder fehlendes Token." });
      return;
    }
  }

  const { requestId, matches } = req.body ?? {};
  if (typeof requestId !== "string" || !Array.isArray(matches)) {
    res.status(400).json({ error: "Felder 'requestId' und 'matches' erforderlich." });
    return;
  }

  const validMatches: ContactMatch[] = matches.filter(
    (m): m is ContactMatch =>
      typeof m === "object" && m !== null && typeof m.name === "string" && typeof m.phoneNumber === "string"
  );

  const delivered = deliverContactResolution(requestId, validMatches);
  res.json({ ok: delivered });
});
