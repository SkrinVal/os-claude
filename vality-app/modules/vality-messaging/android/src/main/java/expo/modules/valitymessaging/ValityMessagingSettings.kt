package expo.modules.valitymessaging

import android.content.Context
import android.content.SharedPreferences

/**
 * Kleine SharedPreferences-Huelle. NotificationListenerService und der
 * SMS-BroadcastReceiver werden vom Betriebssystem gestartet, nicht von
 * unserem eigenen App-Prozess - sie koennen also nicht einfach auf
 * AsyncStorage (React-Native-seitig) zugreifen. Die JS-Seite schreibt ihre
 * Einstellungen deshalb per configure() explizit hierher, und Service/
 * Receiver lesen von hier, unabhaengig davon, ob JS gerade laeuft.
 */
object ValityMessagingSettings {
  private const val PREFS_NAME = "vality_messaging"

  private const val KEY_SERVER_URL = "serverUrl"
  private const val KEY_TOKEN = "token"
  private const val KEY_WHATSAPP_ENABLED = "whatsappEnabled"
  private const val KEY_SMS_ENABLED = "smsEnabled"

  private fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun configure(
    context: Context,
    serverUrl: String,
    token: String,
    whatsappEnabled: Boolean,
    smsEnabled: Boolean
  ) {
    prefs(context).edit()
      .putString(KEY_SERVER_URL, serverUrl)
      .putString(KEY_TOKEN, token)
      .putBoolean(KEY_WHATSAPP_ENABLED, whatsappEnabled)
      .putBoolean(KEY_SMS_ENABLED, smsEnabled)
      .apply()
  }

  fun serverUrl(context: Context): String? = prefs(context).getString(KEY_SERVER_URL, null)
  fun token(context: Context): String? = prefs(context).getString(KEY_TOKEN, null)
  fun isWhatsappEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_WHATSAPP_ENABLED, false)
  fun isSmsEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_SMS_ENABLED, false)
}
