import { useEffect } from "react";
import { useHudDispatch } from "../state/store";

const POLL_INTERVAL_MS = 5000;

export function useSystemStatus() {
  const dispatch = useHudDispatch();

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/status");
        if (!res.ok) return;
        const status = await res.json();
        if (!cancelled) dispatch({ type: "SET_SYSTEM", status });
      } catch {
        // Naechster Poll versucht es erneut - kein Fehler-State fuer einen
        // einzelnen verpassten Tick.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [dispatch]);
}

export function useInitialHistory() {
  const dispatch = useHudDispatch();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/history")
      .then((res) => res.json())
      .then((entries) => {
        if (!cancelled) dispatch({ type: "SET_LOG", entries });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
}
