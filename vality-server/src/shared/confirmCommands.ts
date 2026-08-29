import { broadcast } from "../ws/hub";
import { clearPendingAction, getPendingAction } from "./pendingAction";

export interface ConfirmCommandResult {
  reply: string;
}

const CONFIRM_RE = /^(?:jarvis[,]?\s*)?(?:ja[,]?\s*(?:senden|anrufen)?|best[aä]tige(?:n)?|abschicken)\s*[.!]*$/i;
const CANCEL_RE = /^(?:jarvis[,]?\s*)?(?:abbrechen|nicht\s+(?:senden|anrufen)|nein)\s*[.!]*$/i;

// Bestaetigt oder verwirft eine wartende Aktion (SMS-Versand oder Anruf,
// siehe pendingAction.ts). Gibt null zurueck, wenn gerade nichts wartet -
// ein blosses "Nein" oder "Ja" soll dann ganz normal an claude -p gehen,
// statt eine verwirrende "Abgebrochen"-Antwort auf eine unrelated Aeusserung
// zu geben.
export async function handleConfirmCommand(transcript: string): Promise<ConfirmCommandResult | null> {
  const pending = getPendingAction();
  if (!pending) return null;

  const text = transcript.trim();

  if (CONFIRM_RE.test(text)) {
    clearPendingAction();
    if (pending.kind === "sms") {
      broadcast({ type: "send_sms", to: pending.to, body: pending.body });
      return { reply: `Gesendet an ${pending.label}: ${pending.body}` };
    }
    broadcast({ type: "place_call", to: pending.to });
    return { reply: `Rufe ${pending.label} an.` };
  }

  if (CANCEL_RE.test(text)) {
    clearPendingAction();
    return { reply: pending.kind === "sms" ? "Abgebrochen, nichts gesendet." : "Abgebrochen, kein Anruf." };
  }

  return null;
}
