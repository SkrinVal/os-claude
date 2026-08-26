import { Router } from "express";
import { features } from "../config/features";
import { getNews, getNewsForLocation } from "../news/fetchNews";

export const newsRouter = Router();

newsRouter.get("/news", async (_req, res) => {
  if (!features.news) {
    res.status(404).json({ error: "News-Funktion ist deaktiviert." });
    return;
  }
  try {
    const items = await getNews();
    res.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: `Nachrichten-Feed nicht erreichbar: ${message}` });
  }
});

// Fuer den Globus-Modus: Nachrichten zu genau dem Ort/Land, das gerade per
// Sprachbefehl oder Suche fokussiert ist - "q" ist der Orts-/Laendername.
newsRouter.get("/news/search", async (req, res) => {
  if (!features.news) {
    res.status(404).json({ error: "News-Funktion ist deaktiviert." });
    return;
  }
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) {
    res.status(400).json({ error: "Kein Suchbegriff angegeben." });
    return;
  }
  try {
    const items = await getNewsForLocation(q);
    res.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: `Nachrichtensuche nicht erreichbar: ${message}` });
  }
});
