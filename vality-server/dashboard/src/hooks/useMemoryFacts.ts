import { useEffect, useState } from "react";

export interface MemoryFact {
  id: string;
  category: string;
  content: string;
  source: "explicit" | "learned";
  createdAt: string;
}

const POLL_INTERVAL_MS = 60 * 1000;

// Fakten aendern sich selten im Vergleich zu Nachrichten - ein Poll pro
// Minute reicht, damit ein frisch waehrend eines Gespraechs gelernter Fakt
// zeitnah im Dashboard auftaucht, ohne dauernd zu pollen.
export function useMemoryFacts() {
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch("/api/memory/facts")
      .then(async (res) => {
        let data: { facts?: MemoryFact[]; error?: string };
        try {
          data = await res.json();
        } catch {
          throw new Error(`Server antwortet unerwartet (Status ${res.status}).`);
        }
        if (!res.ok) throw new Error(data.error ?? `Status ${res.status}`);
        return data.facts ?? [];
      })
      .then((fetched) => {
        if (!cancelled) {
          setFacts(fetched);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Optimistisch aus der Liste nehmen, statt auf den naechsten Poll zu
  // warten - fuehlt sich beim Klicken sofort reaktionsschnell an. Schlaegt
  // der Server-Aufruf fehl, kommt der Fakt beim naechsten Poll einfach
  // zurueck (kein Sonderfall noetig).
  function remove(id: string): void {
    setFacts((prev) => prev.filter((f) => f.id !== id));
    fetch(`/api/memory/facts/${id}`, { method: "DELETE" }).catch(() => {
      setTick((t) => t + 1);
    });
  }

  return { facts, loading, error, remove };
}
