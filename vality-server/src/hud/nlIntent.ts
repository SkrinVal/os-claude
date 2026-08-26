import { askClaude } from "../brain/claude";
import { broadcast } from "../ws/hub";
import { buildCityBriefing } from "./cityBriefing";

const ALLOWED_ACTIONS = ["globe_city", "globe_open", "research", "idle", "none"] as const;
type Action = (typeof ALLOWED_ACTIONS)[number];

interface ClassifiedIntent {
  action: Action;
  target: string;
  reply: string;
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
  const instructions = [
    "Du bist Vality, ein persönlicher Sprachassistent mit einem Dashboard.",
    "Analysiere die folgende gesprochene Anfrage und entscheide, ob sie einen der Navigationsbefehle des Dashboards auslösen soll:",
    "",
    '- "globe_city": Die Anfrage nennt eine Stadt oder ein Land und will sie auf dem Globus sehen, wissen wo sie liegt, das dortige Wetter, oder generell "zeig mir X" für einen Ort. "target" = Name der Stadt/des Landes.',
    '- "globe_open": Die Anfrage will einfach den Globus/die Weltkarte öffnen, ohne einen bestimmten Ort zu nennen.',
    '- "research": Die Anfrage will etwas über eine Person, ein Thema oder einen Begriff nachschlagen/erfahren (nicht über einen Ort). "target" = die Person oder das Thema.',
    '- "idle": Die Anfrage will zurück zur Übersicht/zum Startbildschirm.',
    '- "none": Keine Navigation - eine normale Frage, Unterhaltung, Aussage oder ein anderer Befehl.',
    "",
    "Antworte AUSSCHLIESSLICH mit einem einzigen validen JSON-Objekt, keine Markdown-Codeblöcke, kein Text davor oder danach:",
    '{"action": "globe_city|globe_open|research|idle|none", "target": "...", "reply": "..."}',
    "",
    '"reply" ist deine kurze, natürliche gesprochene Antwort auf Deutsch.',
    'Bei "globe_city" und "research" reicht ein knapper Bestätigungssatz ("Ich zeige dir X." / "Ich suche X.") - die eigentlichen Fakten (Wetter, Nachrichten, Rechercheergebnisse) kommen separat aus echten Datenquellen. Erfinde dort KEINE Wetterdaten, Zahlen, Ereignisse oder sonstigen Fakten über den Ort/das Thema.',
    'Bei "none" ist "reply" deine vollständige, hilfreiche Antwort auf die Anfrage - hier normal und ausführlich wie sonst auch antworten.',
    'Bei "globe_open" und "idle" bleibt "target" leer.',
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
  const fallback = () => claudeReply || raw.trim();

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
    case "globe_city":
      if (!target) return fallback();
      broadcast({ type: "ui_mode", mode: "globe", city: target });
      return await buildCityBriefing(target);
    case "none":
    default:
      return fallback();
  }
}
