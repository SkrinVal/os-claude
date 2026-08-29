import { Router, type Request } from "express";
import { config } from "../config";
import {
  deliverCalendarEventResult,
  deliverCalendarEventsList,
  listCalendarEventsViaPhone,
  type CalendarEventSummary,
} from "../calendar/bridge";

export const calendarRouter = Router();

function checkToken(req: Request): boolean {
  if (!config.presence.token) return true;
  return req.headers.authorization === `Bearer ${config.presence.token}`;
}

// Antwort der Handy-App auf "create_calendar_event" (siehe calendar/bridge.ts).
calendarRouter.post("/calendar/event-result", (req, res) => {
  if (!checkToken(req)) {
    res.status(401).json({ error: "Ungültiges oder fehlendes Token." });
    return;
  }
  const { requestId, ok, error } = req.body ?? {};
  if (typeof requestId !== "string" || typeof ok !== "boolean") {
    res.status(400).json({ error: "Felder 'requestId' und 'ok' erforderlich." });
    return;
  }
  const delivered = deliverCalendarEventResult(requestId, ok, typeof error === "string" ? error : undefined);
  res.json({ ok: delivered });
});

// Antwort der Handy-App auf "list_calendar_events".
calendarRouter.post("/calendar/events-result", (req, res) => {
  if (!checkToken(req)) {
    res.status(401).json({ error: "Ungültiges oder fehlendes Token." });
    return;
  }
  const { requestId, events } = req.body ?? {};
  if (typeof requestId !== "string" || !Array.isArray(events)) {
    res.status(400).json({ error: "Felder 'requestId' und 'events' erforderlich." });
    return;
  }
  const valid: CalendarEventSummary[] = events.filter(
    (e): e is CalendarEventSummary =>
      typeof e === "object" && e !== null && typeof e.id === "string" && typeof e.title === "string" && typeof e.startAt === "string"
  );
  const delivered = deliverCalendarEventsList(requestId, valid);
  res.json({ ok: delivered });
});

// Fuers Dashboard: fragt live bei der Handy-App nach den naechsten
// Terminen - Vality speichert selbst nichts mehr, der echte Kalender ist
// die einzige Quelle.
calendarRouter.get("/calendar/events", async (_req, res) => {
  const events = await listCalendarEventsViaPhone();
  res.json({ events });
});
