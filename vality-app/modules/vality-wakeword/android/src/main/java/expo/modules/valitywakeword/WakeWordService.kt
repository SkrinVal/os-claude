package expo.modules.valitywakeword

import ai.picovoice.porcupine.Porcupine
import ai.picovoice.porcupine.PorcupineException
import ai.picovoice.porcupine.PorcupineManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

private const val CHANNEL_ID = "vality_wakeword"
private const val NOTIFICATION_ID = 4201

/**
 * Foreground-Service, der dauerhaft auf das Weckwort "Jarvis" hoert (ueber
 * Porcupine, komplett offline, laeuft lokal auf dem Handy). Funktioniert bei
 * geschlossener App, solange das Handy an ist - laeuft eigenstaendig als
 * Android-Prozess, unabhaengig vom React-Native/JS-Kontext (der ist bei
 * geschlossener App nicht aktiv). Bei Erkennung: OverlayWindow.show().
 */
class WakeWordService : Service() {

  private var porcupineManager: PorcupineManager? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopSelf()
      return START_NOT_STICKY
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        NOTIFICATION_ID,
        buildNotification(),
        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
      )
    } else {
      startForeground(NOTIFICATION_ID, buildNotification())
    }

    startListening()
    isRunning = true
    return START_STICKY
  }

  override fun onDestroy() {
    stopListening()
    isRunning = false
    super.onDestroy()
  }

  private fun startListening() {
    if (porcupineManager != null) return

    val accessKey = ValityWakeWordSettings.accessKey(applicationContext)
    if (accessKey.isNullOrBlank()) {
      stopSelf()
      return
    }

    try {
      porcupineManager = PorcupineManager.Builder()
        .setAccessKey(accessKey)
        .setKeyword(Porcupine.BuiltInKeyword.JARVIS)
        .setSensitivity(0.6f)
        .build(applicationContext) { _ ->
          mainHandler.post { onWakeWordDetected() }
        }
      porcupineManager?.start()
    } catch (err: PorcupineException) {
      porcupineManager = null
      stopSelf()
    }
  }

  private fun stopListening() {
    try {
      porcupineManager?.stop()
    } catch (err: PorcupineException) {
      // Ignorieren - wird sowieso gleich gelöscht.
    }
    porcupineManager?.delete()
    porcupineManager = null
    OverlayWindow.hide(applicationContext)
  }

  private fun onWakeWordDetected() {
    OverlayWindow.show(applicationContext) {}
  }

  private fun buildNotification(): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val contentIntent = launchIntent?.let {
      PendingIntent.getActivity(
        this, 0, it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
    }

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Vality hört auf \"Hi Jarvis\"")
      .setContentText("Tippen, um Vality zu öffnen")
      .setSmallIcon(android.R.drawable.ic_btn_speak_now)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setContentIntent(contentIntent)
      .build()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java) ?: return
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(
      CHANNEL_ID, "Weckwort-Erkennung", NotificationManager.IMPORTANCE_LOW
    ).apply {
      description = "Laeuft im Hintergrund, um auf \"Hi Jarvis\" zu hoeren."
      setShowBadge(false)
    }
    manager.createNotificationChannel(channel)
  }

  companion object {
    private const val ACTION_STOP = "expo.modules.valitywakeword.STOP"

    @Volatile
    var isRunning: Boolean = false
      private set

    fun start(context: Context) {
      val intent = Intent(context, WakeWordService::class.java)
      ContextCompat.startForegroundService(context, intent)
    }

    fun stop(context: Context) {
      val intent = Intent(context, WakeWordService::class.java).apply { action = ACTION_STOP }
      context.startService(intent)
    }
  }
}
