import { Router } from "express";
import { features } from "../config/features";
import { deleteFactById, getActiveFacts } from "../memory/store";

export const memoryRouter = Router();

// Macht sichtbar, was Vality ueber die Zeit gemerkt/gelernt hat - sowohl
// explizit diktierte ("merk dir, dass ...") als auch beilaeufig aus
// Gespraechen aufgeschnappte Fakten (siehe hud/nlIntent.ts). Ohne dieses
// Fenster waere "lernen" unsichtbares Hintergrundverhalten, das sich nicht
// pruefen oder korrigieren liesse.
memoryRouter.get("/memory/facts", (_req, res) => {
  if (!features.memory) {
    res.status(404).json({ error: "Gedächtnis-Funktion ist deaktiviert." });
    return;
  }
  const facts = getActiveFacts()
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((f) => ({ id: f.id, category: f.category, content: f.content, source: f.source, createdAt: f.createdAt }));
  res.json({ facts });
});

// Manuelles Loeschen direkt im Dashboard - bisher ging das nur per
// gesprochenem "Vergiss X". Gleiche Wirkung, nur per Klick statt Sprache.
memoryRouter.delete("/memory/facts/:id", async (req, res) => {
  if (!features.memory) {
    res.status(404).json({ error: "Gedächtnis-Funktion ist deaktiviert." });
    return;
  }
  const removed = await deleteFactById(req.params.id);
  if (!removed) {
    res.status(404).json({ error: "Fakt nicht gefunden." });
    return;
  }
  res.json({ ok: true });
});
