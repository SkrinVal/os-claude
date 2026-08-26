import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
// Muss vor dem ersten Render importiert werden, damit TaskManager.defineTask
// fuer das Geofencing laeuft (siehe Kommentar in geofence.ts).
import { syncGeofencingWithSettings } from "./src/features/presence/geofence";
import { syncMessagingConfig } from "./src/features/messaging/setup";
import { startCommandListener, stopCommandListener } from "./src/net/wsClient";
import DashboardScreen from "./src/screens/DashboardScreen";

export default function App() {
  useEffect(() => {
    syncGeofencingWithSettings().catch((err) =>
      console.warn("Geofencing-Sync beim Start fehlgeschlagen:", err)
    );
    syncMessagingConfig().catch((err) =>
      console.warn("Messaging-Konfiguration beim Start fehlgeschlagen:", err)
    );
    startCommandListener();
    return () => stopCommandListener();
  }, []);

  return (
    <>
      <DashboardScreen />
      <StatusBar style="light" />
    </>
  );
}
