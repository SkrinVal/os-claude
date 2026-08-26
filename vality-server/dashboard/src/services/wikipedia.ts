import type { Dispatch } from "react";
import type { Action } from "../state/store";
import type { ResearchResult } from "../state/types";
import { describeFetchError } from "./networkError";

interface WikiSummary {
  title: string;
  displaytitle?: string;
  description?: string;
  extract: string;
  pageid: number;
  content_urls?: { desktop?: { page?: string } };
  type?: string;
}

// Echte, kostenlose deutschsprachige Wikipedia-REST-API - kein API-Key,
// CORS-faehig. Absichtlich KEIN Bild/Thumbnail aus der Antwort verwendet:
// Steckbriefe zeigen nur einen abstrakt generierten Avatar, nie ein echtes
// Foto (siehe AbstractAvatar.tsx).
const SUMMARY_BASE = "https://de.wikipedia.org/api/rest_v1/page/summary/";
const OPENSEARCH_URL = "https://de.wikipedia.org/w/api.php";

async function fetchSummary(title: string): Promise<WikiSummary | null> {
  const res = await fetch(SUMMARY_BASE + encodeURIComponent(title));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Wikipedia antwortet mit Status ${res.status}`);
  return (await res.json()) as WikiSummary;
}

async function findClosestTitle(query: string): Promise<string | null> {
  const url = new URL(OPENSEARCH_URL);
  url.searchParams.set("action", "opensearch");
  url.searchParams.set("search", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("namespace", "0");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as [string, string[], string[], string[]];
  return data[1]?.[0] ?? null;
}

export async function fetchResearch(query: string): Promise<ResearchResult> {
  const trimmed = query.trim();
  if (!trimmed) throw new Error("Bitte einen Suchbegriff eingeben.");

  let summary = await fetchSummary(trimmed);
  if (!summary) {
    const closest = await findClosestTitle(trimmed);
    if (!closest) throw new Error(`Kein Wikipedia-Eintrag zu „${trimmed}" gefunden.`);
    summary = await fetchSummary(closest);
    if (!summary) throw new Error(`Kein Wikipedia-Eintrag zu „${trimmed}" gefunden.`);
  }

  if (summary.type === "disambiguation") {
    throw new Error(`„${summary.title}" ist mehrdeutig - bitte praeziser suchen (z.B. mit Beruf oder Jahr).`);
  }

  const facts: string[] = [];
  if (summary.description) facts.push(summary.description);
  facts.push(`Wikipedia-Seite: ${summary.title}`);

  return {
    id: String(summary.pageid),
    name: summary.displaytitle?.replace(/<[^>]+>/g, "") || summary.title,
    kind: summary.description ?? "Wikipedia-Eintrag",
    summary: summary.extract || "Keine Zusammenfassung verfuegbar.",
    facts,
    sourceUrl: summary.content_urls?.desktop?.page,
  };
}

// Gemeinsame Such-Pipeline (Start/Erfolg/Fehler-Dispatch) - genutzt sowohl
// vom manuellen Suchfeld im Recherche-Modus als auch vom kommenden
// Sprachbefehl-Ausloeser ("ui_mode"-Event, siehe useVoiceSocket.ts).
export async function runResearch(dispatch: Dispatch<Action>, query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;
  dispatch({ type: "RESEARCH_START", query: trimmed });
  try {
    const result = await fetchResearch(trimmed);
    dispatch({ type: "RESEARCH_SUCCESS", results: [result] });
  } catch (err) {
    dispatch({ type: "RESEARCH_ERROR", error: describeFetchError(err) });
  }
}
