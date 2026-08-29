// Der Server schickt jede Sprachinteraktion ueber ZWEI Wege gleichzeitig:
// als direkte HTTP-Antwort auf /api/voice (siehe useMicRecorder.ts) UND als
// WebSocket-Broadcast (siehe useVoiceSocket.ts, fuer andere offene Tabs und
// die Handy-App). Ohne dieses Gate wuerde dieselbe Interaktion doppelt im
// Logbuch stehen und die Antwort doppelt, leicht zeitversetzt abgespielt
// werden (klingt wie ein Echo/verzerrt). Wer zuerst claimInteraction(id)
// aufruft, behandelt sie - der andere Weg ueberspringt sie komplett.
const claimedIds = new Set<string>();

export function claimInteraction(id: string): boolean {
  if (claimedIds.has(id)) return false;
  claimedIds.add(id);
  if (claimedIds.size > 500) {
    const oldest = claimedIds.values().next().value;
    if (oldest !== undefined) claimedIds.delete(oldest);
  }
  return true;
}
