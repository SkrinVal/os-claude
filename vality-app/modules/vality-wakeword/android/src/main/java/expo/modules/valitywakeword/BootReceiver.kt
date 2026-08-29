package expo.modules.valitywakeword

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Startet den Weckwort-Dienst nach einem Geraete-Neustart neu, wenn er
 * vorher aktiviert war - sonst muesste man nach jedem Neustart die App
 * einmal oeffnen, damit "Hi Jarvis" wieder funktioniert.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
    if (!ValityWakeWordSettings.isEnabled(context)) return
    if (ValityWakeWordSettings.accessKey(context).isNullOrBlank()) return
    WakeWordService.start(context)
  }
}
