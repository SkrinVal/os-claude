import { randomUUID } from "node:crypto";

export interface IncomingMessage {
  id: string;
  source: "sms" | "whatsapp";
  sender: string;
  body: string;
  ts: string;
}

const MAX_ENTRIES = 50;
const messages: IncomingMessage[] = [];

// Nur im Speicher, nicht persistiert - ein Server-Neustart verliert den
// Verlauf. Fuer den aktuellen Umfang (letzte Nachricht fuer "Antworte..."
// finden, kurzer Dashboard-Feed) reicht das; siehe README fuer die Grenze.
export function addMessage(entry: Omit<IncomingMessage, "id">): IncomingMessage {
  const full: IncomingMessage = { id: randomUUID(), ...entry };
  messages.unshift(full);
  messages.length = Math.min(messages.length, MAX_ENTRIES);
  return full;
}

export function getMessages(): IncomingMessage[] {
  return messages;
}

export function getLastMessage(): IncomingMessage | null {
  return messages[0] ?? null;
}
