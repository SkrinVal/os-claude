package expo.modules.valitymessaging

import android.content.Context
import android.util.Log
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import org.json.JSONObject

/**
 * Schickt erfasste Nachrichten direkt vom nativen Code aus an den
 * Vality-Server - bewusst NICHT ueber die JS-Bruecke. NotificationListener-
 * Service und SMS-Receiver koennen vom Betriebssystem aufgerufen werden,
 * auch wenn der App-Prozess/JS gerade nicht laeuft; ein direkter,
 * unabhaengiger Netzwerk-Aufruf ist deshalb der einzige zuverlaessige Weg.
 * Kein zusaetzliches HTTP-Abhaengigkeits-Paket - HttpURLConnection reicht.
 */
object ValityServerClient {
  private const val TAG = "ValityMessaging"
  private val executor = Executors.newSingleThreadExecutor()

  fun postMessage(context: Context, source: String, sender: String, body: String) {
    val serverUrl = ValityMessagingSettings.serverUrl(context)
    if (serverUrl.isNullOrBlank()) {
      Log.w(TAG, "Keine Server-URL konfiguriert, verwerfe erfasste Nachricht.")
      return
    }
    val token = ValityMessagingSettings.token(context) ?: ""

    executor.execute {
      try {
        val url = URL(serverUrl.trimEnd('/') + "/api/messages")
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = "POST"
        connection.doOutput = true
        connection.connectTimeout = 8000
        connection.readTimeout = 8000
        connection.setRequestProperty("Content-Type", "application/json")
        if (token.isNotEmpty()) {
          connection.setRequestProperty("Authorization", "Bearer $token")
        }

        val payload = JSONObject()
          .put("source", source)
          .put("sender", sender)
          .put("body", body)

        OutputStreamWriter(connection.outputStream).use { it.write(payload.toString()) }

        val code = connection.responseCode
        if (code !in 200..299) {
          Log.w(TAG, "Server antwortete mit $code beim Melden einer $source-Nachricht.")
        }
        connection.disconnect()
      } catch (err: Exception) {
        // Bewusst nur loggen: PC evtl. aus, kein WLAN o.ae. - die App/der
        // Dienst soll dadurch nicht abstuerzen. Kein Retry/Queue (siehe README).
        Log.w(TAG, "Nachricht konnte nicht an den Server gemeldet werden: ${err.message}")
      }
    }
  }
}
