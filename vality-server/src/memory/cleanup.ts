import { config } from "../config";
import { getActiveFacts, markStale } from "./store";

// Markiert aktive Fakten als "stale", wenn sie laenger als
// config.memory.staleAfterMonths nicht mehr referenziert wurden. Loescht
// nichts - stale Fakten bleiben in facts.json stehen, fliessen aber nicht
// mehr in Prompt-Kontext oder "Was weisst du ueber X" ein.
export async function sweepStaleFacts(): Promise<number> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - config.memory.staleAfterMonths);

  const staleIds = getActiveFacts()
    .filter((f) => new Date(f.lastReferencedAt).getTime() < cutoff.getTime())
    .map((f) => f.id);

  await markStale(staleIds);
  return staleIds.length;
}
