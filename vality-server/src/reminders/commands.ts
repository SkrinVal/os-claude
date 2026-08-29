import { listCalendarEventsViaPhone } from "../calendar/bridge";
import { formatGermanDateTime } from "./format";

export interface ReminderCommandResult {
  reply: string;
}

const WAKE = "(?:jarvis[,]?\\s*)?";
const LIST_RE = new RegExp(
  `^${WAKE}(?:bitte\\s+)?(?:was\\s+steht\\s+an|welche\\s+(?:termine|erinnerungen)\\s+habe\\s+ich|meine\\s+(?:termine|erinnerungen))[?.!]*$`,
  "i"
);

const MAX_LISTED = 5;

// Termine liegen jetzt im echten Kalender auf dem Handy, nicht mehr in
// einer eigenen Datei hier (siehe calendar/bridge.ts) - "was steht an"
// fragt live bei der Handy-App nach statt eine lokale Liste zu lesen.
// Loeschen per Sprache gibt es bewusst nicht mehr: der Termin gehoert jetzt
// dem echten Kalender, bearbeitet/geloescht wird er direkt dort.
export async function handleReminderCommand(transcript: string): Promise<ReminderCommandResult | null> {
  const text = transcript.trim();
  if (!text) return null;

  if (LIST_RE.test(text)) {
    const upcoming = await listCalendarEventsViaPhone();
    if (upcoming.length === 0) {
      return { reply: "Ich finde gerade keine anstehenden Termine - oder die Handy-App ist nicht erreichbar." };
    }
    const lines = upcoming.slice(0, MAX_LISTED).map((e) => `${formatGermanDateTime(new Date(e.startAt))}: ${e.title}`);
    return { reply: `Anstehende Termine: ${lines.join("; ")}` };
  }

  return null;
}
