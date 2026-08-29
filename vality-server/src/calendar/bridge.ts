import { randomUUID } from "node:crypto";
import { broadcast } from "../ws/hub";

export interface CalendarEventSummary {
  id: string;
  title: string;
  startAt: string;
}

export interface CreateEventResult {
  ok: boolean;
  error?: string;
}

const CREATE_TIMEOUT_MS = 8000;
const LIST_TIMEOUT_MS = 8000;

interface PendingCreate {
  resolve: (result: CreateEventResult) => void;
}
interface PendingList {
  resolve: (events: CalendarEventSummary[]) => void;
}

const pendingCreates = new Map<string, PendingCreate>();
const pendingLists = new Map<string, PendingList>();

// Gleiches Anfrage/Antwort-Muster wie contacts/resolve.ts: Server
// broadcastet per WebSocket an die Handy-App, die legt den Termin echt im
// Android-Kalender an (expo-calendar) und antwortet per REST
// (routes/calendar.ts). Ohne verbundene, erreichbare Handy-App laeuft das
// nach CREATE_TIMEOUT_MS in einen Fehler statt endlos zu haengen.
export function createCalendarEventViaPhone(
  title: string,
  startAt: Date,
  endAt: Date,
  notes?: string
): Promise<CreateEventResult> {
  const requestId = randomUUID();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingCreates.delete(requestId);
      resolve({ ok: false, error: "Handy-App nicht erreichbar - läuft sie gerade?" });
    }, CREATE_TIMEOUT_MS);

    pendingCreates.set(requestId, {
      resolve: (result) => {
        clearTimeout(timer);
        resolve(result);
      },
    });

    broadcast({
      type: "create_calendar_event",
      requestId,
      title,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      notes,
    });
  });
}

export function deliverCalendarEventResult(requestId: string, ok: boolean, error?: string): boolean {
  const pending = pendingCreates.get(requestId);
  if (!pending) return false;
  pendingCreates.delete(requestId);
  pending.resolve({ ok, error });
  return true;
}

export function listCalendarEventsViaPhone(): Promise<CalendarEventSummary[]> {
  const requestId = randomUUID();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingLists.delete(requestId);
      resolve([]);
    }, LIST_TIMEOUT_MS);

    pendingLists.set(requestId, {
      resolve: (events) => {
        clearTimeout(timer);
        resolve(events);
      },
    });

    broadcast({ type: "list_calendar_events", requestId });
  });
}

export function deliverCalendarEventsList(requestId: string, events: CalendarEventSummary[]): boolean {
  const pending = pendingLists.get(requestId);
  if (!pending) return false;
  pendingLists.delete(requestId);
  pending.resolve(events);
  return true;
}

// Fuers Oeffnungs-Briefing (hud/openingBriefing.ts): nur die Termine des
// heutigen Kalendertags, chronologisch. Liefert bewusst ein leeres Array
// sowohl bei "keine Termine heute" als auch bei "Handy-App nicht
// erreichbar" - der Aufrufer darf daraus NICHT "heute nichts los" sprechen,
// nur den Kalender-Satz weglassen (siehe listCalendarEventsViaPhone-Timeout).
export async function getTodaysCalendarEvents(): Promise<CalendarEventSummary[]> {
  const events = await listCalendarEventsViaPhone();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
  return events
    .filter((e) => {
      const t = new Date(e.startAt).getTime();
      return t >= startOfDay && t < endOfDay;
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}
