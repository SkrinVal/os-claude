import { config } from "../config";
import { broadcast } from "../ws/hub";
import { stagePendingAction } from "../shared/pendingAction";
import { getLastMessage } from "./store";

export interface MessageCommandResult {
  reply: string;
}

const REPLY_RE =
  /^(?:jarvis[,]?\s*)?(?:bitte\s+)?antworte(?:\s+(?:ihr|ihm|ihnen))?[,]?\s*(?:dass\s+)?(.+?)[.!]*$/i;

// Bezieht sich immer auf die zuletzt empfangene Nachricht - kein
// Namens-Lookup hier, das uebernimmt "Schreib X, dass..." in calls/commands.ts.
export async function handleMessageCommand(transcript: string): Promise<MessageCommandResult | null> {
  const text = transcript.trim();
  const replyMatch = text.match(REPLY_RE);
  if (!replyMatch) return null;

  const body = replyMatch[1].trim().replace(/[.\s]+$/, "");
  if (!body) {
    return { reply: "Was genau soll ich antworten?" };
  }

  const last = getLastMessage();
  if (!last) {
    return { reply: "Es ist noch keine Nachricht angekommen, auf die ich antworten könnte." };
  }

  if (last.source === "whatsapp") {
    // Keine offizielle Sende-API fuer WhatsApp - nur Vorschlag vorlesen.
    return {
      reply: `WhatsApp kann ich nicht selbst senden. Vorschlag für ${last.sender}: "${body}" - bitte selbst senden.`,
    };
  }

  if (config.messages.confirmBeforeSend) {
    stagePendingAction({ kind: "sms", to: last.sender, label: last.sender, body });
    return { reply: `Soll ich an ${last.sender} senden: "${body}"? Sag "Ja, senden" oder "Abbrechen".` };
  }

  broadcast({ type: "send_sms", to: last.sender, body });
  return { reply: `Gesendet an ${last.sender}: ${body}` };
}
