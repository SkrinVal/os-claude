import { config } from "../config";
import { broadcast } from "../ws/hub";
import { getLastMessage } from "./store";

export interface MessageCommandResult {
  reply: string;
}

interface PendingReply {
  to: string;
  sender: string;
  body: string;
}

// Einzelner Platz, kein Verlauf - Feature 3 antwortet bewusst nur auf die
// zuletzt empfangene Nachricht, kein Namens-Lookup (das kommt mit den
// Kontakten aus Feature 4).
let pendingReply: PendingReply | null = null;

const REPLY_RE =
  /^(?:jarvis[,]?\s*)?(?:bitte\s+)?antworte(?:\s+(?:ihr|ihm|ihnen))?[,]?\s*(?:dass\s+)?(.+?)[.!]*$/i;
const CONFIRM_RE = /^(?:jarvis[,]?\s*)?(?:ja[,]?\s*senden|ja\b|best[aä]tige(?:n)?|abschicken)\s*[.!]*$/i;
const CANCEL_RE = /^(?:jarvis[,]?\s*)?(?:abbrechen|nicht\s+senden|nein)\s*[.!]*$/i;

export async function handleMessageCommand(transcript: string): Promise<MessageCommandResult | null> {
  const text = transcript.trim();

  const confirmMatch = text.match(CONFIRM_RE);
  if (confirmMatch && pendingReply) {
    const { to, sender, body } = pendingReply;
    pendingReply = null;
    broadcast({ type: "send_sms", to, body });
    return { reply: `Gesendet an ${sender}: ${body}` };
  }

  const cancelMatch = text.match(CANCEL_RE);
  if (cancelMatch && pendingReply) {
    pendingReply = null;
    return { reply: "Abgebrochen, nichts gesendet." };
  }

  const replyMatch = text.match(REPLY_RE);
  if (replyMatch) {
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
      pendingReply = { to: last.sender, sender: last.sender, body };
      return { reply: `Soll ich an ${last.sender} senden: "${body}"? Sag "Ja, senden" oder "Abbrechen".` };
    }

    broadcast({ type: "send_sms", to: last.sender, body });
    return { reply: `Gesendet an ${last.sender}: ${body}` };
  }

  return null;
}
