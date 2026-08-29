export type PendingAction =
  | { kind: "sms"; to: string; label: string; body: string }
  | { kind: "call"; to: string; label: string };

// Ein einzelner Platz fuer die ganze Anwendung, kein Verlauf: neu staged
// ersetzt immer eine evtl. noch offene vorherige Bestaetigung. Fuer ein
// Einzelnutzer-System ist das die einfachste korrekte Loesung - zwei
// gleichzeitig offene Bestaetigungen waeren ohnehin verwirrend.
let pending: PendingAction | null = null;

export function stagePendingAction(action: PendingAction): void {
  pending = action;
}

export function getPendingAction(): PendingAction | null {
  return pending;
}

export function clearPendingAction(): void {
  pending = null;
}
