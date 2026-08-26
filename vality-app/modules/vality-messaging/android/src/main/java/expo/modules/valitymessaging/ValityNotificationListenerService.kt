package expo.modules.valitymessaging

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

// Whatsapp und WhatsApp Business Package-Namen. Es gibt keine offizielle
// API von WhatsApp, um Nachrichten zu lesen - das hier liest nur die
// Vorschau, die WhatsApp selbst als System-Benachrichtigung anzeigt
// (Absender + Textausschnitt), sonst nichts. Siehe README fuer die
// Grenzen dieses Ansatzes.
private val WATCHED_PACKAGES = setOf("com.whatsapp", "com.whatsapp.w4b")

class ValityNotificationListenerService : NotificationListenerService() {

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    super.onNotificationPosted(sbn)

    if (sbn.packageName !in WATCHED_PACKAGES) return
    if (!ValityMessagingSettings.isWhatsappEnabled(applicationContext)) return

    // Gruppen-Sammelbenachrichtigungen ("3 neue Nachrichten") und leere
    // Vorschauen (z.B. bei aktivierten WhatsApp-Datenschutz-Vorschauen)
    // ueberspringen - nur echte Einzelnachrichten mit Text weiterreichen.
    if (sbn.notification.flags and Notification.FLAG_GROUP_SUMMARY != 0) return

    val extras = sbn.notification.extras
    val sender = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim()
    val body = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim()

    if (sender.isNullOrEmpty() || body.isNullOrEmpty()) return

    ValityServerClient.postMessage(applicationContext, "whatsapp", sender, body)
    ValityMessagingModule.notifyListeners("whatsapp", sender, body)
  }
}
