import { useEffect, useState } from "react";

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;
}

const POLL_INTERVAL_MS = 30 * 1000;

// Termine liegen jetzt im echten Kalender auf dem Handy, nicht mehr in
// Vality selbst (siehe calendar/bridge.ts serverseitig) - dieser Hook
// fragt bei jedem Poll live darueber ab, was die Handy-App im Kalender
// findet. Kein Loeschen von hier aus mehr moeglich, das passiert direkt
// in der Kalender-App.
export function useReminders() {
  const [reminders, setReminders] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch("/api/calendar/events")
      .then(async (res) => {
        let data: { events?: CalendarEvent[]; error?: string };
        try {
          data = await res.json();
        } catch {
          throw new Error(`Server antwortet unerwartet (Status ${res.status}).`);
        }
        if (!res.ok) throw new Error(data.error ?? `Status ${res.status}`);
        return data.events ?? [];
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

  return { reminders, loading, error };
}
