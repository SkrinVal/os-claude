import ValityMessaging from "../../../modules/vality-messaging/src/ValityMessagingModule";
import { loadSettings } from "../../storage/settings";

// Schreibt die aktuellen Einstellungen ins native Modul (SharedPreferences),
// damit NotificationListenerService/SMS-Receiver unabhaengig von JS darauf
// zugreifen koennen. Nach jeder Aenderung an Server-URL/Token/Toggles
// aufrufen.
export async function syncMessagingConfig(): Promise<void> {
  const settings = await loadSettings();
  await ValityMessaging.configure(
    settings.serverUrl,
    settings.presenceToken,
    settings.whatsappEnabled,
    settings.smsEnabled
  );
}
