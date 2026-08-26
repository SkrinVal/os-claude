import { Router } from "express";
import { features } from "../config/features";
import { getNews } from "../news/fetchNews";

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
