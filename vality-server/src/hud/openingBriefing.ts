import { getNews } from "../news/fetchNews";
import { getTodaysCalendarEvents } from "../calendar/bridge";

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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

// Wird einmal aufgerufen, sobald das Dashboard im Browser geoeffnet wird
// (siehe routes/briefing.ts + dashboard/src/hooks/useBriefing.ts) - eine
// kurze gesprochene Begruessung mit den heutigen Terminen (falls die
// Handy-App erreichbar ist und welche im Kalender stehen) und den
// wichtigsten allgemeinen Nachrichten. Keine Wetterdaten hier: es gibt
// (noch) keinen konfigurierten Heimatort, und geraten wird hier nichts
// (siehe "Keine Erfindungen").
export async function buildOpeningBriefing(): Promise<string> {
  const greeting = timeGreeting();

  const [todaysEvents, headlines] = await Promise.all([
    getTodaysCalendarEvents().catch(() => []),
    getNews()
      .then((items) => items.slice(0, MAX_HEADLINES).map((it) => it.title))
      .catch(() => [] as string[]),
  ]);

  const sentences = [`${greeting}.`];

  // Leere Liste heisst entweder "wirklich keine Termine heute" oder
  // "Handy-App gerade nicht erreichbar" - in beiden Faellen einfach
  // weglassen statt "heute nichts los" zu behaupten, das waeren im
  // zweiten Fall erfundene Fakten.
  if (todaysEvents.length > 0) {
    const list = todaysEvents.map((e) => `${formatTime(e.startAt)} ${e.title}`).join(", ");
    sentences.push(`Heute steht an: ${list}.`);
  }

  if (headlines.length > 0) {
    sentences.push(`Die wichtigsten Nachrichten: ${headlines.join(". ")}.`);
  } else if (todaysEvents.length === 0) {
    sentences.push("Die Nachrichten sind gerade nicht erreichbar.");
  }

  return sentences.join(" ");
}
