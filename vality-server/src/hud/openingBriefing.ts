import { getNews } from "../news/fetchNews";

const MAX_HEADLINES = 4;

// Zeitgemaesse Begruessung statt eines immer gleichen "Hallo" - macht das
// Briefing spuerbar an den Moment angepasst. Server laeuft auf der Maschine
// des Nutzers (Europe/Berlin, siehe Grundregeln), Date() liefert also schon
// die richtige Ortszeit.
function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Noch spät unterwegs";
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

// Wird einmal aufgerufen, sobald das Dashboard im Browser geoeffnet wird
// (siehe routes/briefing.ts + dashboard/src/hooks/useBriefing.ts) - eine
// kurze gesprochene Begruessung mit den wichtigsten allgemeinen Nachrichten.
// Keine Wetterdaten hier: es gibt (noch) keinen konfigurierten Heimatort,
// und geraten wird hier nichts (siehe "Keine Erfindungen").
export async function buildOpeningBriefing(): Promise<string> {
  const greeting = timeGreeting();

  let headlines: string[] = [];
  try {
    const items = await getNews();
    headlines = items.slice(0, MAX_HEADLINES).map((it) => it.title);
  } catch {
    // Ohne Feed bleibt es bei der reinen Begruessung - keine Nachrichten
    // erfinden, nur weil der Abruf gerade fehlschlaegt.
  }

  if (headlines.length === 0) {
    return `${greeting}. Die Nachrichten sind gerade nicht erreichbar.`;
  }
  return `${greeting}. Die wichtigsten Nachrichten: ${headlines.join(". ")}.`;
}
