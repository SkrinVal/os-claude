package expo.modules.valitymessaging

import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.telephony.SmsManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.lang.ref.WeakReference

class ValityMessagingModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("ValityMessaging")

    Events("onMessageReceived")

    OnCreate {
      activeModule = WeakReference(this@ValityMessagingModule)
    }

    OnDestroy {
      if (activeModule?.get() === this@ValityMessagingModule) {
        activeModule = null
      }
    }

    // Wird von der JS-Seite bei jeder Aenderung der Nachrichten-Einstellungen
    // aufgerufen. Schreibt in SharedPreferences, die auch der Notification-
    // Listener-Service und der SMS-Receiver lesen (siehe ValityMessagingSettings).
    AsyncFunction("configure") { serverUrl: String, token: String, whatsappEnabled: Boolean, smsEnabled: Boolean ->
      ValityMessagingSettings.configure(requireContext(), serverUrl, token, whatsappEnabled, smsEnabled)
    }

    AsyncFunction("isNotificationAccessGranted") {
      isNotificationAccessGranted(requireContext())
    }

    Function("openNotificationAccessSettings") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      requireContext().startActivity(intent)
    }

    // Erwartet, dass RECEIVE_SMS/READ_SMS/SEND_SMS bereits ueber die
    // normalen Android-Laufzeit-Berechtigungen (PermissionsAndroid in JS)
    // erteilt wurden - das ist hier bewusst nicht nochmal geprueft, der
    // Aufruf schlaegt sonst mit einer SecurityException fehl, die auf der
    // JS-Seite als Promise-Rejection ankommt.
    AsyncFunction("sendSms") { phoneNumber: String, message: String ->
      val manager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        requireContext().getSystemService(SmsManager::class.java)
      } else {
        legacySmsManager()
      }
      val parts = manager.divideMessage(message)
      manager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
      true
    }
  }

  private fun requireContext(): Context =
    appContext.reactContext ?: throw Exceptions.ReactContextLost()

  @Suppress("DEPRECATION")
  private fun legacySmsManager(): SmsManager = SmsManager.getDefault()

  companion object {
    // Best-effort Live-Event an JS, nur wenn die App gerade laeuft. Der
    // eigentliche Transport zum PC-Server laeuft unabhaengig davon immer
    // direkt aus dem Service/Receiver (siehe ValityServerClient) - dieses
    // Event ist nur fuer sofortiges UI-Feedback, wenn die App offen ist.
    private var activeModule: WeakReference<ValityMessagingModule>? = null

    fun notifyListeners(source: String, sender: String, body: String) {
      val module = activeModule?.get() ?: return
      module.sendEvent(
        "onMessageReceived",
        mapOf("source" to source, "sender" to sender, "body" to body)
      )
    }

    private fun isNotificationAccessGranted(context: Context): Boolean {
      val pkgName = context.packageName
      val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
        ?: return false
      return flat.split(":").any { it.contains(pkgName) }
    }
  }
}
