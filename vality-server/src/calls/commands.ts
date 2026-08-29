import { config } from "../config";
import { broadcast } from "../ws/hub";
import { stagePendingAction } from "../shared/pendingAction";
import { resolveContactViaPhone } from "../contacts/resolve";

export interface CallCommandResult {
  reply: string;
}

const CALL_RE = /^(?:jarvis[,]?\s*)?(?:bitte\s+)?ruf(?:e)?\s+(.+?)\s+an\s*[.!]*$/i;
const WRITE_RE = /^(?:jarvis[,]?\s*)?(?:bitte\s+)?schreib(?:e)?\s+([^,]+?)[,]?\s*dass\s+(.+?)[.!]*$/i;

type Resolved = { ok: true; to: string; label: string } | { ok: false; reply: string };

async function resolveNameOrReply(name: string): Promise<Resolved> {
  const matches = await resolveContactViaPhone(name);

  if (matches.length === 0) {
    return {
      ok: false,
      reply: `Ich habe niemanden namens "${name}" gefunden, oder das Handy ist gerade nicht erreichbar.`,
    };
  }
  if (matches.length > 1) {
    const names = [...new Set(matches.map((m) => m.name))].join(", ");
    return { ok: false, reply: `Es gibt mehrere Treffer für "${name}": ${names}. Sag bitte einen genaueren Namen.` };
  }
  return { ok: true, to: matches[0].phoneNumber, label: matches[0].name };
}

// Loest Kontaktnamen ueber das Handy auf (siehe contacts/resolve.ts) -
// diese Datei selbst kennt keine Kontakte, nur den Sprachbefehl drumherum.
export async function handleCallCommand(transcript: string): Promise<CallCommandResult | null> {
  const text = transcript.trim();

  const callMatch = text.match(CALL_RE);
  if (callMatch) {
    const resolved = await resolveNameOrReply(callMatch[1].trim());
    if (!resolved.ok) return { reply: resolved.reply };

    if (config.calls.confirmBeforeCall) {
      stagePendingAction({ kind: "call", to: resolved.to, label: resolved.label });
      return { reply: `Soll ich ${resolved.label} anrufen? Sag "Ja" oder "Abbrechen".` };
    }
    broadcast({ type: "place_call", to: resolved.to });
    return { reply: `Rufe ${resolved.label} an.` };
  }

  const writeMatch = text.match(WRITE_RE);
  if (writeMatch) {
    const name = writeMatch[1].trim();
    const body = writeMatch[2].trim().replace(/[.\s]+$/, "");
    if (!body) return { reply: "Was genau soll ich schreiben?" };

    const resolved = await resolveNameOrReply(name);
    if (!resolved.ok) return { reply: resolved.reply };

    if (config.messages.confirmBeforeSend) {
      stagePendingAction({ kind: "sms", to: resolved.to, label: resolved.label, body });
      return { reply: `Soll ich an ${resolved.label} senden: "${body}"? Sag "Ja, senden" oder "Abbrechen".` };
    }
    broadcast({ type: "send_sms", to: resolved.to, body });
    return { reply: `Gesendet an ${resolved.label}: ${body}` };
  }

  return null;
}
