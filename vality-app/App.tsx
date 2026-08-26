import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
// Muss vor dem ersten Render importiert werden, damit TaskManager.defineTask
// fuer das Geofencing laeuft (siehe Kommentar in geofence.ts).
import { syncGeofencingWithSettings } from "./src/features/presence/geofence";
import PresenceScreen from "./src/features/presence/PresenceScreen";

export default function App() {
  useEffect(() => {
    syncGeofencingWithSettings().catch((err) =>
      console.warn("Geofencing-Sync beim Start fehlgeschlagen:", err)
    );
  }, []);

  return (
    <>
      <PresenceScreen />
      <StatusBar style="light" />
    </>
  );
}
