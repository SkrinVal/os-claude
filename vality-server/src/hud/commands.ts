import { broadcast } from "../ws/hub";
import { buildCityBriefing } from "./cityBriefing";

export interface HudCommandResult {
  reply: string;
}

// Optionaler Wortlaut vorneweg - Nutzer sagen oft noch "Jarvis" aus
// Gewohnheit, obwohl das Produkt "Vality" heisst (siehe andere commands.ts-
// Dateien, die aus demselben Grund ebenfalls "jarvis" als Wake-Praefix
// erkennen).
const WAKE = "(?:jarvis[,]?\\s*)?";

// Ohne Zielangabe - muss VOR den Varianten mit Zielangabe geprueft werden,
// sonst faengt z.B. "zeig mir den Globus" die Stadt-Regel mit "den Globus"
// als vermeintlichem Stadtnamen ab.
const GLOBE_OPEN_RE = new RegExp(
  `^${WAKE}(?:oeffne|öffne|zeig(?:e)?(?:\\s+mir)?)\\s+(?:den\\s+|die\\s+)?(?:globus|weltkarte|erdkarte)[?.!]*$`,
  "i"
);
const IDLE_RES: RegExp[] = [
  new RegExp(`^${WAKE}(?:geh\\s+)?zur(?:ück|uck)(?:\\s+zur\\s+(?:übersicht|uebersicht|startseite)|\\s+zum\\s+start)?[.!]*$`, "i"),
  new RegExp(`^${WAKE}schlie(?:ß|ss)e?\\s+(?:das|den\\s+globus|die\\s+recherche)[.!]*$`, "i"),
  new RegExp(`^${WAKE}(?:startbildschirm|übersicht|uebersicht)[.!]*$`, "i"),
];

// Ziel-Regeln: jede hat genau eine Fanggruppe fuer den Namen/Ort.
const RESEARCH_RES: RegExp[] = [
  new RegExp(`^${WAKE}(?:wer|was)\\s+ist\\s+(.+?)[?.!]*$`, "i"),
  new RegExp(`^${WAKE}erz[aä]hl\\s+mir\\s+(?:etwas\\s+)?(?:über|ueber|von)\\s+(.+?)[.!]*$`, "i"),
  new RegExp(`^${WAKE}(?:suche|recherchiere)\\s+(?:nach\\s+)?(.+?)[.!]*$`, "i"),
];
const GLOBE_CITY_RES: RegExp[] = [
  new RegExp(`^${WAKE}zeig(?:e)?\\s+mir\\s+(.+?)[.!]*$`, "i"),
  new RegExp(`^${WAKE}wo\\s+ist\\s+(.+?)[?.!]*$`, "i"),
  new RegExp(`^${WAKE}wie\\s+ist\\s+das\\s+wetter\\s+in\\s+(.+?)[?.!]*$`, "i"),
  new RegExp(`^${WAKE}wetter\\s+in\\s+(.+?)[?.!]*$`, "i"),
  new RegExp(`^${WAKE}flieg(?:e)?\\s+(?:nach|zu)\\s+(.+?)[.!]*$`, "i"),
  new RegExp(`^${WAKE}geh(?:e)?\\s+nach\\s+(.+?)[.!]*$`, "i"),
];

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return (m[1] ?? "").trim();
  }
  return null;
}

// Schaltet nur die Dashboard-Ansicht um (Recherche/Globus/Uebersicht) -
// reine Navigation, kein Datenzugriff, deshalb ohne Bestaetigungs-Umweg
// wie bei SMS/Anrufen. Laeuft in der Prioritaetskette in voice.ts VOR der
// allgemeinen Claude-Antwort, damit "wer ist X" das Recherche-Fenster
// oeffnet statt nur vorgelesen zu werden.
export async function handleHudCommand(transcript: string): Promise<HudCommandResult | null> {
  const text = transcript.trim();
  if (!text) return null;

  if (GLOBE_OPEN_RE.test(text)) {
    broadcast({ type: "ui_mode", mode: "globe" });
    return { reply: "Globus wird geöffnet." };
  }

  for (const re of IDLE_RES) {
    if (re.test(text)) {
      broadcast({ type: "ui_mode", mode: "idle" });
      return { reply: "Zurück zur Übersicht." };
    }
  }

  const person = firstMatch(text, RESEARCH_RES);
  if (person) {
    broadcast({ type: "ui_mode", mode: "research", query: person });
    return { reply: `Ich suche „${person}".` };
  }

  const city = firstMatch(text, GLOBE_CITY_RES);
  if (city) {
    broadcast({ type: "ui_mode", mode: "globe", city });
    const reply = await buildCityBriefing(city);
    return { reply };
  }

  return null;
}
