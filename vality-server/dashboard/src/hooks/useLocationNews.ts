import { useEffect, useState } from "react";
import type { NewsItem } from "./useNews";

// Nachrichten zu einem konkreten Ort - fuer den Globus-Modus. Anders als
// useNews (fester Feed, pollt) wird hier neu geladen, sobald sich der
// Suchbegriff aendert (z.B. name -> "name, Land" nach der Geokodierung),
// kein Dauer-Polling noetig.
export function useLocationNews(query: string | null) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/news/search?q=${encodeURIComponent(query)}`)
      .then(async (res) => {
        let data: { items?: NewsItem[]; error?: string };
        try {
          data = await res.json();
        } catch {
          throw new Error(`Server antwortet unerwartet (Status ${res.status}).`);
        }
        if (!res.ok) throw new Error(data.error ?? `Status ${res.status}`);
        return data.items ?? [];
      })
      .then((fetched) => {
        if (!cancelled) setItems(fetched);
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
  }, [query]);

  return { items, loading, error };
}
