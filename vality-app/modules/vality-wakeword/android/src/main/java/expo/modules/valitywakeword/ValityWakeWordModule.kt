package expo.modules.valitywakeword

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ValityWakeWordModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("ValityWakeWord")

    // Schreibt Zugriffsschluessel + Ein/Aus-Zustand nach SharedPreferences
    // und startet/stoppt den Foreground-Service entsprechend. Der Service
    // laeuft danach unabhaengig davon weiter, ob die App/JS gerade offen ist.
    AsyncFunction("configure") { accessKey: String, enabled: Boolean ->
      val context = requireContext()
      ValityWakeWordSettings.configure(context, accessKey, enabled)
      if (enabled && accessKey.isNotBlank()) {
        WakeWordService.start(context)
      } else {
        WakeWordService.stop(context)
      }
    }

    AsyncFunction("isRunning") {
      WakeWordService.isRunning
    }

    AsyncFunction("isOverlayPermissionGranted") {
      OverlayWindow.canDrawOverlays(requireContext())
    }

    Function("openOverlayPermissionSettings") {
      val context = requireContext()
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:${context.packageName}")
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }
  }

  private fun requireContext(): Context =
    appContext.reactContext ?: throw Exceptions.ReactContextLost()
}
