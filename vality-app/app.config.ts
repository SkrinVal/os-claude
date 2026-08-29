import type { ExpoConfig } from "expo/config";

// app.config.ts statt app.json, damit spaeter Umgebungsvariablen (z.B.
// EAS-Build-Profile) den Servernamen o.ae. steuern koennen. Fuer Feature 2
// wichtig: Berechtigungstexte + Hintergrund-Standort-Modus + Android-13/14-
// Foreground-Service-Typ fuer Geofencing.
const config: ExpoConfig = {
  name: "vality-app",
  slug: "vality-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "vality-app",

  ios: {
    supportsTablet: true,
  },

  android: {
    package: "ai.vality.app",
    adaptiveIcon: {
      backgroundColor: "#0a0f12",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    // Nicht auflisten: ACCESS_*_LOCATION / FOREGROUND_SERVICE* kommen ueber
    // die Flags im expo-location-Plugin unten, sonst doppelt gepflegt.
    permissions: ["POST_NOTIFICATIONS"],
  },

  web: {
    favicon: "./assets/favicon.png",
  },

  plugins: [
    "expo-dev-client",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Vality AI nutzt deinen Standort im Hintergrund, um Ankunft/Verlassen des Zuhause-Bereichs zu erkennen, auch wenn die App geschlossen ist.",
        locationWhenInUsePermission:
          "Vality AI nutzt deinen Standort, um zu erkennen, wenn du zuhause ankommst oder gehst.",
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    "expo-task-manager",
    "expo-notifications",
    [
      "expo-contacts",
      {
        contactsPermission:
          "Vality AI nutzt deine Kontakte, um Namen wie \"Ruf Max an\" in Telefonnummern zu übersetzen.",
      },
    ],
    [
      "expo-calendar",
      {
        calendarPermission:
          "Vality AI legt Termine, die du per Sprachbefehl nennst (\"Erinnere mich...\"), direkt in deinem Kalender an.",
      },
    ],
  ],
};

export default config;
