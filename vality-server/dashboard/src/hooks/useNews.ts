import { useEffect, useState } from "react";

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string | null;
  source: string;
}

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function useNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch("/api/news")
      .then(async (res) => {
        let data: { items?: NewsItem[]; error?: string };
        try {
          data = await res.json();
        } catch {
          // Antwort war kein JSON (z.B. eine Proxy-Fehlerseite) - lieber
          // eine verstaendliche Meldung als der rohe Parse-Fehler.
          throw new Error(`Server antwortet unerwartet (Status ${res.status}).`);
        }
        if (!res.ok) throw new Error(data.error ?? `Status ${res.status}`);
        return data.items ?? [];
      })
      .then((fetched) => {
        if (!cancelled) {
          setItems(fetched);
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

  return { items, loading, error, refresh: () => setTick((t) => t + 1) };
}
