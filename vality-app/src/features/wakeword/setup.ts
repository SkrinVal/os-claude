import ValityWakeWord from "../../../modules/vality-wakeword/src/ValityWakeWordModule";
import { loadSettings } from "../../storage/settings";

// Schreibt AccessKey + Ein/Aus-Zustand ins native Modul, das startet/stoppt
// darueber den Foreground-Service. Nach jeder Aenderung an Key/Toggle rufen.
export async function syncWakeWordConfig(): Promise<void> {
  const settings = await loadSettings();
  await ValityWakeWord.configure(settings.picovoiceAccessKey, settings.wakeWordEnabled);
}
