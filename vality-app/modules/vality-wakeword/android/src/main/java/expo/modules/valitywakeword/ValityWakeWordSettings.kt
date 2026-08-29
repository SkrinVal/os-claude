package expo.modules.valitywakeword

import android.content.Context
import android.content.SharedPreferences

/**
 * SharedPreferences-Huelle, gleiches Muster wie ValityMessagingSettings.
 * WakeWordService und BootReceiver werden vom System gestartet, nicht vom
 * App-Prozess - sie lesen von hier, unabhaengig davon, ob JS gerade laeuft.
 */
object ValityWakeWordSettings {
  private const val PREFS_NAME = "vality_wakeword"

  private const val KEY_ACCESS_KEY = "accessKey"
  private const val KEY_ENABLED = "enabled"

  private fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun configure(context: Context, accessKey: String, enabled: Boolean) {
    prefs(context).edit()
      .putString(KEY_ACCESS_KEY, accessKey)
      .putBoolean(KEY_ENABLED, enabled)
      .apply()
  }

  fun accessKey(context: Context): String? = prefs(context).getString(KEY_ACCESS_KEY, null)
  fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, false)
}
