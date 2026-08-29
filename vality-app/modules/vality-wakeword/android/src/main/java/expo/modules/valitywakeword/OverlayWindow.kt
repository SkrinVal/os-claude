package expo.modules.valitywakeword

import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager

private const val AUTO_DISMISS_MS = 6000L

/**
 * Zeigt/versteckt das OverlayView unten links ueber allen anderen Apps.
 * Braucht SYSTEM_ALERT_WINDOW (Settings.canDrawOverlays) - ohne die
 * Berechtigung wird der Versuch still uebersprungen, das WakeWord loest
 * dann trotzdem aus (siehe WakeWordService), nur ohne sichtbares Overlay.
 */
object OverlayWindow {
  private var view: OverlayView? = null
  private val mainHandler = Handler(Looper.getMainLooper())
  private var dismissRunnable: Runnable? = null

  fun canDrawOverlays(context: Context): Boolean = Settings.canDrawOverlays(context)

  fun show(context: Context, onTap: () -> Unit) {
    if (!canDrawOverlays(context)) return
    mainHandler.post {
      hideInternal(context)

      val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
      val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
      } else {
        @Suppress("DEPRECATION")
        WindowManager.LayoutParams.TYPE_PHONE
      }
      val params = WindowManager.LayoutParams(
        WindowManager.LayoutParams.WRAP_CONTENT,
        WindowManager.LayoutParams.WRAP_CONTENT,
        overlayType,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
        PixelFormat.TRANSLUCENT
      )
      params.gravity = Gravity.BOTTOM or Gravity.START
      params.x = dpToPx(context, 16f)
      params.y = dpToPx(context, 28f)

      val overlayView = OverlayView(context) {
        hide(context)
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        launchIntent?.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        launchIntent?.let { context.startActivity(it) }
        onTap()
      }

      try {
        windowManager.addView(overlayView, params)
        overlayView.start()
        view = overlayView
      } catch (err: Exception) {
        // WindowManager kann in seltenen Faellen ablehnen (z.B. Berechtigung
        // gerade erst entzogen) - dann einfach kein Overlay, kein Crash.
      }

      val runnable = Runnable { hide(context) }
      dismissRunnable = runnable
      mainHandler.postDelayed(runnable, AUTO_DISMISS_MS)
    }
  }

  fun hide(context: Context) {
    mainHandler.post { hideInternal(context) }
  }

  private fun hideInternal(context: Context) {
    dismissRunnable?.let { mainHandler.removeCallbacks(it) }
    dismissRunnable = null
    val current = view ?: return
    view = null
    current.stop()
    try {
      val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
      windowManager.removeView(current)
    } catch (err: Exception) {
      // View war schon entfernt - ignorieren.
    }
  }

  private fun dpToPx(context: Context, dp: Float): Int =
    (dp * context.resources.displayMetrics.density).toInt()
}
