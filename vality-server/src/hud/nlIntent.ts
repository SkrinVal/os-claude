import { askClaude } from "../brain/claude";
import { broadcast } from "../ws/hub";
import { buildCityBriefing } from "./cityBriefing";
import { buildOpeningBriefing } from "./openingBriefing";
import { features } from "../config/features";
import { addFact, hasSimilarFact, replaceFact } from "../memory/store";
import { createCalendarEventViaPhone } from "../calendar/bridge";
import { formatGermanDateTime } from "../reminders/format";

const ALLOWED_ACTIONS = ["globe_city", "globe_open", "research", "idle", "remind", "briefing", "none"] as const;
type Action = (typeof ALLOWED_ACTIONS)[number];

// Feste, kleine Kategorien statt Freitext - macht die Gedaechtnis-Karte im
// Dashboard uebersichtlich gruppierbar statt einer losen Liste.
const LEARN_CATEGORIES = ["Vorlieben", "Familie & Beziehungen", "Beruf", "Termine & Pläne", "Sonstiges"] as const;

interface ClassifiedIntent {
  action: Action;
  target: string;
  reply: string;
  learn: string;
  category: string;
  supersedes: string;
  remindAt: string;
}

// hud/commands.ts erkennt nur eine feste Handvoll Formulierungen ("zeig mir
// X", "wetter in X", ...) per Regex - schnell und ohne CLI-Aufruf, aber
// stur: "Ich würde gern Paris sehen" faellt schon durch. Fuer alles, was
// dort nicht matcht, geht die Anfrage jetzt zusaetzlich durch die
// vorhandene Claude-CLI-Anbindung, die sonst nur fuer die normale Antwort
// genutzt wird - EIN Aufruf klassifiziert die Absicht UND liefert bei
// normalen Fragen gleich die fertige Antwort, statt einen zweiten Aufruf zu
// brauchen (kein zusaetzliches Latenz-Budget gegenueber vorher).
function buildClassifierPrompt(transcript: string, contextBlock: string): string {
  // Bewusst OHNE feste Zeitzonen-Angabe: der Server laeuft auf der eigenen
  // Maschine des Nutzers, toLocaleString() ohne timeZone-Option liefert
  // also automatisch dessen tatsaechliche lokale Zeit - unabhaengig davon,
  // wo das laeuft. "remindAt" unten wird bewusst genauso naiv (ohne
  // Zeitzone) zurueckerwartet und dann per new Date() ebenfalls als lokale
  // Serverzeit interpretiert (siehe classifyAndRespond) - beide Seiten
  // bleiben dadurch konsistent, ganz ohne TZ-Umrechnung.
  const now = new Date();
  const nowLabel = now.toLocaleString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const instructions = [
    "Du bist Vality, ein persönlicher Sprachassistent mit einem Dashboard.",
    `Aktuelles Datum/Uhrzeit (lokale Zeit des Nutzers): ${nowLabel}.`,
    "Analysiere die folgende gesprochene Anfrage und entscheide, ob sie einen der Navigationsbefehle des Dashboards auslösen soll:",
    "",
    '- "globe_city": Die Anfrage nennt eine Stadt oder ein Land und will sie auf dem Globus sehen, wissen wo sie liegt, das dortige Wetter, oder generell "zeig mir X" für einen Ort. "target" = Name der Stadt/des Landes.',
    '- "globe_open": Die Anfrage will einfach den Globus/die Weltkarte öffnen, ohne einen bestimmten Ort zu nennen.',
    '- "research": Die Anfrage will etwas über eine Person, ein Thema oder einen Begriff nachschlagen/erfahren (nicht über einen Ort). "target" = die Person oder das Thema.',
    '- "idle": Die Anfrage will zurück zur Übersicht/zum Startbildschirm.',
    '- "remind": Die Anfrage will einen Termin/eine Erinnerung im Kalender anlegen ("Erinnere mich ...", "Erinnere mich daran, dass ...", "Denk dran, dass ...", "Trag ein, dass ..."). "target" = der Titel des Termins, OHNE die Zeitangabe.',
    '- "briefing": Die Anfrage will eine allgemeine Zusammenfassung/einen Überblick hören - "was ist los", "was gibt\'s Neues", "was passiert gerade (in der Welt)", "gib mir ein Briefing", "was steht heute an". NICHT bei einer Frage zu einem bestimmten Ort/Thema/einer bestimmten Person (das ist "globe_city"/"research").',
    '- "none": Keine Navigation - eine normale Frage, Unterhaltung, Aussage oder ein anderer Befehl.',
    "",
    "Antworte AUSSCHLIESSLICH mit einem einzigen validen JSON-Objekt, keine Markdown-Codeblöcke, kein Text davor oder danach:",
    '{"action": "globe_city|globe_open|research|idle|remind|briefing|none", "target": "...", "reply": "...", "learn": "...", "category": "...", "supersedes": "...", "remindAt": "..."}',
    "",
    '"reply" ist deine kurze, natürliche gesprochene Antwort auf Deutsch.',
    'Bei "globe_city" und "research" reicht ein knapper Bestätigungssatz ("Ich zeige dir X." / "Ich suche X.") - die eigentlichen Fakten (Wetter, Nachrichten, Rechercheergebnisse) kommen separat aus echten Datenquellen. Erfinde dort KEINE Wetterdaten, Zahlen, Ereignisse oder sonstigen Fakten über den Ort/das Thema.',
    'Bei "remind" reicht ebenfalls ein knapper Bestätigungssatz - die genaue Zeitangabe im Bestätigungssatz kommt separat aus "remindAt", nicht von dir formuliert.',
    'Bei "briefing" bleibt "reply" leer - der eigentliche Inhalt (Termine, Nachrichten) kommt separat aus echten Datenquellen, nicht von dir erfunden.',
    'Bei "none" ist "reply" deine vollständige, hilfreiche Antwort auf die Anfrage - hier normal und ausführlich wie sonst auch antworten.',
    'Bei "globe_open", "idle" und "briefing" bleibt "target" leer.',
    "",
    `"remindAt": NUR bei "action": "remind" - der genannte Zeitpunkt als ISO-8601-Datum/Uhrzeit ohne Zeitzone (z.B. "2026-08-27T09:00:00"), berechnet aus der Zeitangabe im Gesagten ("morgen um 9", "in zwei Stunden", "Freitag um 15 Uhr") ausgehend vom oben genannten aktuellen Datum/Uhrzeit. Ist keine Zeitangabe erkennbar, bleibt "remindAt" leer. Sonst immer leerer String.`,
    "",
    '"learn": Falls der Nutzer in DIESER Anfrage klar und explizit einen neuen, dauerhaften, wiederverwendbaren Fakt über sich preisgibt (Name, Vorliebe, Beziehung, Beruf, wiederkehrender Termin o.ä.), ein kurzer, präziser Satz mit genau diesem Fakt, aus Nutzer-Perspektive formuliert ("Mag Kaffee ohne Zucker", "Schwester heißt Anna"). NUR wortwörtlich Gesagtes übernehmen, NICHTS interpretieren, vermuten oder ausschmücken. KEINE einmaligen/vergänglichen Aussagen ("ist gerade müde", "es regnet") - nur was auch in einem Monat noch stimmt und nützlich ist. Sonst leerer String "". Bei Navigationsbefehlen (nicht "none") immer leerer String.',
    `"category": Nur wenn "learn" nicht leer ist - die am besten passende Kategorie, GENAU eine dieser Optionen: ${LEARN_CATEGORIES.map((c) => `"${c}"`).join(", ")}. Sonst leerer String.`,
    '"supersedes": Nur wenn "learn" nicht leer ist UND einen der oben unter "Bekannte Fakten über den Nutzer" gelisteten Fakten ersetzt oder ihm widerspricht (z.B. eine geänderte Vorliebe) - dann den betroffenen Fakt-Text GENAU SO, WIE ER DORT STEHT, hier eintragen. Sonst leerer String.',
    "",
  ].join("\n");

  const body = contextBlock ? `${contextBlock}Aktuelle Anfrage: ${transcript}` : `Aktuelle Anfrage: ${transcript}`;
  return `${instructions}${body}`;
}

// Claude haelt sich trotz Anweisung manchmal nicht exakt ans reine JSON
// (z.B. ```json-Codeblock drumherum) - robust genug parsen, statt bei der
// ersten Abweichung wegzuwerfen.
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // s.u.
  }
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      // s.u.
    }
  }
  return null;
}

function isClassifiedIntent(value: unknown): value is ClassifiedIntent {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.action === "string" && (ALLOWED_ACTIONS as readonly string[]).includes(v.action);
}

// Beilaeufig gelernte Fakten laufen nur bei ganz normalen Gespraechen mit
// ("none") - bei einem Navigationsbefehl steht "learn" laut Prompt ohnehin
// leer, das ist hier nur die zweite Absicherung.
//
// Zwei Faelle: "supersedes" zeigt an, dass der neue Fakt einen bekannten
// ersetzt (z.B. eine geaenderte Vorliebe) - dann wird der alte ersetzt statt
// beide nebeneinander stehen zu lassen. Sonst verhindert hasSimilarFact,
// dass derselbe Fakt bei jeder beilaeufigen Erwaehnung erneut gespeichert
// wird (siehe memory/store.ts).
async function maybeLearn(learn: string, category: string, supersedes: string, action: Action): Promise<void> {
  if (!features.memory || action !== "none" || !learn) return;
  const cat = category || "Sonstiges";

  if (supersedes) {
    await replaceFact(supersedes, cat, learn, "learned");
    return;
  }
  if (hasSimilarFact(learn)) return;
  await addFact(cat, learn, "learned");
}

// Faellt Claude aus dem Format oder erkennt keine Navigation, ist "raw" die
// normale Gesprächsantwort - genau wie ein einfacher askClaude()-Aufruf
// vorher auch. Nichts geht dadurch verloren, es kommt nur die
// Absichtserkennung obendrauf.
export async function classifyAndRespond(transcript: string, contextBlock: string): Promise<string> {
  const prompt = buildClassifierPrompt(transcript, contextBlock);
  const raw = await askClaude(prompt);

  const parsed = extractJson(raw);
  if (!isClassifiedIntent(parsed)) {
    return raw.trim();
  }

  const target = typeof parsed.target === "string" ? parsed.target.trim() : "";
  const claudeReply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
  const learn = typeof parsed.learn === "string" ? parsed.learn.trim() : "";
  const category = typeof parsed.category === "string" ? parsed.category.trim() : "";
  const supersedes = typeof parsed.supersedes === "string" ? parsed.supersedes.trim() : "";
  const remindAt = typeof parsed.remindAt === "string" ? parsed.remindAt.trim() : "";
  const fallback = () => claudeReply || raw.trim();

  await maybeLearn(learn, category, supersedes, parsed.action);

  switch (parsed.action) {
    case "globe_open":
      broadcast({ type: "ui_mode", mode: "globe" });
      return "Globus wird geöffnet.";
    case "idle":
      broadcast({ type: "ui_mode", mode: "idle" });
      return "Zurück zur Übersicht.";
    case "research":
      if (!target) return fallback();
      broadcast({ type: "ui_mode", mode: "research", query: target });
      return `Ich suche „${target}".`;
    case "remind": {
      if (!target || !remindAt) return fallback();
      const startDate = new Date(remindAt);
      if (Number.isNaN(startDate.getTime()) || startDate.getTime() <= Date.now()) {
        return "Den Zeitpunkt für den Termin konnte ich nicht sicher verstehen - sag das nochmal etwas genauer.";
      }
      // Nur ein Zeitpunkt, keine Dauer aus der Sprache bekannt - 30 Minuten
      // als vernuenftiger Standard fuer einen Kalendereintrag.
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
      const result = await createCalendarEventViaPhone(target, startDate, endDate);
      if (!result.ok) {
        return `Ich konnte den Termin nicht in deinem Kalender anlegen: ${result.error ?? "unbekannter Fehler"}.`;
      }
      return `Termin angelegt: am ${formatGermanDateTime(startDate)} - ${target}. Steht in deinem Kalender.`;
    }
    case "globe_city":
      if (!target) return fallback();
      broadcast({ type: "ui_mode", mode: "globe", city: target });
      return await buildCityBriefing(target);
    case "briefing":
      return await buildOpeningBriefing();
    case "none":
    default:
      return fallback();
  }
}
