import { randomUUID } from "node:crypto";
import { config } from "../config";
import { broadcast } from "../ws/hub";

export interface ContactMatch {
  name: string;
  phoneNumber: string;
}

interface PendingResolution {
  resolve: (matches: ContactMatch[]) => void;
}

const pendingResolutions = new Map<string, PendingResolution>();

// Schickt eine "resolve_contact"-Anfrage per WebSocket ans Handy und
// wartet auf die Antwort (POST /api/contacts/resolve) oder einen Timeout.
// Ohne verbundenes, WLAN-erreichbares Handy kommt hier immer eine leere
// Liste zurueck - der Aufrufer muss das als "nicht aufloesbar" behandeln,
// nicht als "kein Kontakt gefunden".
export function resolveContactViaPhone(name: string): Promise<ContactMatch[]> {
  const requestId = randomUUID();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingResolutions.delete(requestId);
      resolve([]);
    }, config.calls.contactResolveTimeoutMs);

    pendingResolutions.set(requestId, {
      resolve: (matches) => {
        clearTimeout(timer);
        resolve(matches);
      },
    });

    broadcast({ type: "resolve_contact", requestId, name });
  });
}

export function deliverContactResolution(requestId: string, matches: ContactMatch[]): boolean {
  const pending = pendingResolutions.get(requestId);
  if (!pending) return false;
  pendingResolutions.delete(requestId);
  pending.resolve(matches);
  return true;
}
