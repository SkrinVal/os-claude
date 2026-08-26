import { deleteReminder, findReminderByText, getUpcomingReminders } from "./store";
import { formatGermanDateTime } from "./format";

export interface ReminderCommandResult {
  reply: string;
}

const WAKE = "(?:jarvis[,]?\\s*)?";
const LIST_RE = new RegExp(
  `^${WAKE}(?:bitte\\s+)?(?:was\\s+steht\\s+an|welche\\s+(?:termine|erinnerungen)\\s+habe\\s+ich|meine\\s+(?:termine|erinnerungen))[?.!]*$`,
  "i"
);
const CANCEL_RE = new RegExp(`^${WAKE}(?:bitte\\s+)?(?:l[öo]sch(?:e)?|storniere)\\s+die\\s+erinnerung\\s+(?:an\\s+)?(.+?)[.!]*$`, "i");

const MAX_LISTED = 5;

// Listen/Loeschen brauchen kein Sprachverstehen - beides sind einfache
// Nachschlage-/Loeschoperationen auf bereits vorhandenen Daten, deshalb
// per Regex und ohne Umweg ueber claude -p (schneller, wie hud/commands.ts
// und memory/commands.ts). Das ANLEGEN einer neuen Erinnerung braucht
// dagegen echtes Zeitverstehen ("morgen um neun") und laeuft daher ueber
// hud/nlIntent.ts.
export async function handleReminderCommand(transcript: string): Promise<ReminderCommandResult | null> {
  const text = transcript.trim();
  if (!text) return null;

  if (LIST_RE.test(text)) {
    const upcoming = getUpcomingReminders();
    if (upcoming.length === 0) {
      return { reply: "Du hast keine anstehenden Erinnerungen." };
    }
    const lines = upcoming.slice(0, MAX_LISTED).map((r) => `${formatGermanDateTime(new Date(r.dueAt))}: ${r.text}`);
    return { reply: `Anstehende Erinnerungen: ${lines.join("; ")}` };
  }

  const cancelMatch = text.match(CANCEL_RE);
  if (cancelMatch) {
    const query = cancelMatch[1].trim();
    const found = findReminderByText(query);
    if (!found) {
      return { reply: `Dazu habe ich keine Erinnerung gefunden, die zu "${query}" passt.` };
    }
    await deleteReminder(found.id);
    return { reply: `Erinnerung gelöscht: ${found.text}` };
  }

  return null;
}
