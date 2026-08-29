// Kurzes deutsches Datum/Uhrzeit-Format fuer gesprochene und geloggte
// Erinnerungs-Bestaetigungen ("Ich erinnere dich am Mi., 27.08. um 09:00").
// Bewusst ohne feste Zeitzone - der Server laeuft auf der eigenen Maschine
// des Nutzers, toLocaleString() ohne timeZone-Option liefert automatisch
// dessen lokale Zeit (siehe hud/nlIntent.ts fuer denselben Ansatz).
export function formatGermanDateTime(date: Date): string {
  return date.toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
