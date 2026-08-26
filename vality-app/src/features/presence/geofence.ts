import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { postToServer } from "../../api/client";
import { loadSettings, type HomeLocation } from "../../storage/settings";

export const GEOFENCE_TASK_NAME = "vality-presence-geofence";

// Muss auf Modul-Ebene stehen (nicht in einer Funktion), damit die Task
// auch dann registriert ist, wenn das Betriebssystem die App im
// Hintergrund per Headless-Callback neu anstoesst, ohne dass ein Screen
// gerendert wurde.
TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn("Geofencing-Task-Fehler:", error.message);
    return;
  }
  const { eventType } = data as { eventType: Location.GeofencingEventType };

  const event = eventType === Location.GeofencingEventType.Enter ? "arrived" : "left";
  try {
    await postToServer("/api/presence", { event, ts: new Date().toISOString() });
  } catch (err) {
    // Bewusst nur loggen: Wenn der PC gerade aus ist oder das WLAN fehlt,
    // soll die App nicht abstuerzen oder den Nutzer mit einem Fehler stoeren.
    console.warn("Anwesenheits-Event konnte nicht gesendet werden:", err);
  }
});

export type PermissionResult =
  | { granted: true }
  | { granted: false; reason: "foreground_denied" | "background_denied" };

// Fragt Standort-Berechtigungen in der von Android/iOS geforderten
// Reihenfolge an: erst "waehrend der Nutzung", danach "immer". Beide
// Systeme lehnen eine direkte Anfrage nach Hintergrund-Standort ohne
// vorherige Vordergrund-Freigabe ab.
export async function ensureLocationPermissions(): Promise<PermissionResult> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") {
    return { granted: false, reason: "foreground_denied" };
  }
  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== "granted") {
    return { granted: false, reason: "background_denied" };
  }
  return { granted: true };
}

export async function startPresenceGeofencing(home: HomeLocation): Promise<void> {
  await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, [
    {
      identifier: "home",
      latitude: home.latitude,
      longitude: home.longitude,
      radius: home.radiusMeters,
      notifyOnEnter: true,
      notifyOnExit: true,
    },
  ]);
}

export async function stopPresenceGeofencing(): Promise<void> {
  const started = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
  if (started) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
  }
}

// Beim App-Start aufrufen: stellt sicher, dass laufendes Geofencing zum
// aktuell gespeicherten Zuhause-Standort passt (z.B. nach einem Neustart
// des Handys, bei dem iOS/Android die Task-Registrierung uebernimmt, aber
// die Regionen sollen trotzdem mit den Einstellungen uebereinstimmen).
export async function syncGeofencingWithSettings(): Promise<void> {
  const settings = await loadSettings();
  if (settings.presenceEnabled && settings.home) {
    await startPresenceGeofencing(settings.home);
  } else {
    await stopPresenceGeofencing();
  }
}
