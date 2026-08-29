package expo.modules.valitymessaging

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

class ValitySmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

    val appContext = context.applicationContext
    if (!ValityMessagingSettings.isSmsEnabled(appContext)) return

    val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
    if (messages.isNullOrEmpty()) return

    // Eine lange SMS kann in mehreren Teilen ankommen (alle vom selben
    // Absender) - Texte zusammensetzen statt nur den ersten Teil zu melden.
    val sender = messages[0].originatingAddress ?: "Unbekannt"
    val body = messages.joinToString(separator = "") { it.messageBody ?: "" }
    if (body.isBlank()) return

    ValityServerClient.postMessage(appContext, "sms", sender, body)
    ValityMessagingModule.notifyListeners("sms", sender, body)
  }
}
