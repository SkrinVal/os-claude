// Browser werfen fuer fehlgeschlagene fetch()-Aufrufe (kein Netz, DNS,
// CORS-Block) einen generischen TypeError ohne brauchbare Meldung
// ("Failed to fetch"). Hier auf einen verstaendlichen deutschen Satz
// abbilden, echte Fehlermeldungen (z.B. "Kein Wikipedia-Eintrag zu ...")
// unveraendert durchreichen.
export function describeFetchError(err: unknown): string {
  if (err instanceof TypeError) {
    return "Keine Verbindung - Internetzugriff pruefen.";
  }
  return err instanceof Error ? err.message : String(err);
}
