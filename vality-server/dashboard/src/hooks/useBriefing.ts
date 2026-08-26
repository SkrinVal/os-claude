import { useEffect, useRef } from "react";

const BRIEFED_KEY = "vality-briefed";

// Feuert einmal pro Tab, sobald die Boot-Sequenz fertig ist ("enabled") -
// eine kurze gesprochene Begruessung mit den wichtigsten Nachrichten. Die
// Antwort kommt ganz normal ueber den bestehenden WebSocket-Broadcast
// zurueck (wie jede andere Sprachantwort, siehe useVoiceSocket.ts, Fall
// "interaction") - Log-Eintrag und Audiowiedergabe (inklusive
// Stummschaltung) laufen dadurch automatisch mit, kein Extra-Code hier
// noetig. sessionStorage sorgt dafuer, dass ein neuer Tab wieder briefed
// wird, ein Reload derselben Sitzung aber nicht (gleiches Muster wie
// BootSequence).
export function useBriefing(enabled: boolean) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled || firedRef.current) return;

    let already = false;
    try {
      already = sessionStorage.getItem(BRIEFED_KEY) === "true";
    } catch {
      // Speicher blockiert - dann lieber einmal zu oft briefen als nie.
    }
    if (already) return;

    firedRef.current = true;
    try {
      sessionStorage.setItem(BRIEFED_KEY, "true");
    } catch {
      // s.o.
    }

    fetch("/api/briefing", { method: "POST" }).catch(() => {
      // Ein Fehlschlag kommt sonst schon per WS "error"-Event an - hier
      // reicht stilles Ignorieren, kein doppelter Fehlerkanal noetig.
    });
  }, [enabled]);
}
