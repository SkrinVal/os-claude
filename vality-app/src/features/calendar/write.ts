import * as Calendar from "expo-calendar";

export interface CreateEventResult {
  ok: boolean;
  error?: string;
}

export interface CalendarEventSummary {
  id: string;
  title: string;
  startAt: string;
}

export async function hasCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.getCalendarPermissions();
  return status === "granted";
}

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissions();
  return status === "granted";
}

// Android kennt (anders als iOS) keinen einzelnen "Standard"-Kalender -
// stattdessen den ersten beschreibbaren Kalender nehmen, bevorzugt den
// primaeren Account-Kalender (also z.B. das verknuepfte Google-Konto,
// unabhaengig davon, welche Kalender-App der Nutzer tatsaechlich installiert
// hat - die liest denselben Android-Kalenderspeicher). Gibt es gar keinen
// (kein Konto auf dem Geraet hinterlegt), einen eigenen lokalen Kalender
// anlegen, damit Termine trotzdem funktionieren.
async function findWritableCalendar(): Promise<Calendar.ExpoCalendar> {
  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const writable = calendars.filter((c) => c.allowsModifications);
  const primary = writable.find((c) => c.isPrimary) ?? writable[0];
  if (primary) return primary;

  return Calendar.createCalendar({
    title: "Vality",
    color: "#22d3ee",
    entityType: Calendar.EntityTypes.EVENT,
    source: { isLocalAccount: true, name: "Vality", type: Calendar.SourceType.LOCAL },
    name: "vality-events",
    ownerAccount: "vality",
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

export async function createCalendarEvent(
  title: string,
  startAt: string,
  endAt: string,
  notes?: string
): Promise<CreateEventResult> {
  let granted = await hasCalendarPermission();
  if (!granted) {
    granted = await requestCalendarPermission();
  }
  if (!granted) {
    return { ok: false, error: "Kein Kalender-Zugriff erlaubt." };
  }

  try {
    const calendar = await findWritableCalendar();
    await calendar.createEvent({
      title,
      startDate: new Date(startAt),
      endDate: new Date(endAt),
      notes,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

const LIST_WINDOW_DAYS = 60;

export async function listUpcomingCalendarEvents(): Promise<CalendarEventSummary[]> {
  const granted = await hasCalendarPermission();
  if (!granted) return [];

  try {
    const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
    const now = new Date();
    const until = new Date(now.getTime() + LIST_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const events = await Calendar.listEvents(calendars, now, until);
    return events
      .map((e) => ({ id: e.id, title: e.title, startAt: new Date(e.startDate).toISOString() }))
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  } catch {
    return [];
  }
}
