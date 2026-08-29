import * as Calendar from "expo-calendar";
import { loadSettings } from "../../storage/settings";

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

// Fuer die Kalender-Auswahl in CalendarSection - nur beschreibbare
// Kalender, sonst koennte der Nutzer einen waehlen, in dem gar keine
// Termine angelegt werden koennen.
export async function getWritableCalendars(): Promise<Calendar.ExpoCalendar[]> {
  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  return calendars.filter((c) => c.allowsModifications);
}

// Android kennt (anders als iOS) keinen einzelnen "Standard"-Kalender -
// deshalb kann der Nutzer selbst einen auswaehlen (CalendarSection,
// gespeichert als settings.calendarId). Ohne Auswahl oder wenn der
// gespeicherte Kalender nicht mehr existiert/nicht mehr beschreibbar ist,
// automatisch den primaeren Account-Kalender nehmen (z.B. das verknuepfte
// Google-Konto). Gibt es gar keinen beschreibbaren Kalender (kein Konto
// auf dem Geraet hinterlegt), einen eigenen lokalen Kalender anlegen,
// damit Termine trotzdem funktionieren.
async function findWritableCalendar(preferredId: string | null): Promise<Calendar.ExpoCalendar> {
  const writable = await getWritableCalendars();

  if (preferredId) {
    const preferred = writable.find((c) => c.id === preferredId);
    if (preferred) return preferred;
  }

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
    const settings = await loadSettings();
    const calendar = await findWritableCalendar(settings.calendarId);
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
