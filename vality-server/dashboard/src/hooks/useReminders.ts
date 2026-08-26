import { useEffect, useState } from "react";

export interface Reminder {
  id: string;
  text: string;
  dueAt: string;
  createdAt: string;
}

const POLL_INTERVAL_MS = 30 * 1000;

// Poll statt Push - reicht fuer eine Liste, die sich nur aendert, wenn per
// Sprache/Dashboard etwas hinzukommt oder ausgeloest wird. Das eigentliche
// Ausloesen (Ton + Logbuch-Eintrag) laeuft serverseitig unabhaengig vom
// Dashboard (siehe reminders/scheduler.ts) - dieser Hook zeigt nur an, was
// noch aussteht.
export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch("/api/reminders")
      .then(async (res) => {
        let data: { reminders?: Reminder[]; error?: string };
        try {
          data = await res.json();
        } catch {
          throw new Error(`Server antwortet unerwartet (Status ${res.status}).`);
        }
        if (!res.ok) throw new Error(data.error ?? `Status ${res.status}`);
        return data.reminders ?? [];
      })
      .then((fetched) => {
        if (!cancelled) {
          setReminders(fetched);
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

  function remove(id: string): void {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    fetch(`/api/reminders/${id}`, { method: "DELETE" }).catch(() => {
      setTick((t) => t + 1);
    });
  }

  return { reminders, loading, error, remove };
}
