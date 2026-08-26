import React, { useState } from "react";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import Panel from "../../ui/Panel";
import Field from "../../ui/Field";
import { colors } from "../../ui/theme";
import { saveSettings, type AppSettings } from "../../storage/settings";
import { ensureLocationPermissions, startPresenceGeofencing, stopPresenceGeofencing } from "./geofence";

interface Props {
  settings: AppSettings;
  onSettingsChange: (next: AppSettings) => void;
}

export default function PresenceSection({ settings, onSettingsChange }: Props) {
  const [latText, setLatText] = useState(settings.home ? String(settings.home.latitude) : "");
  const [lngText, setLngText] = useState(settings.home ? String(settings.home.longitude) : "");
  const [radiusText, setRadiusText] = useState(settings.home ? String(settings.home.radiusMeters) : "150");
  const [busy, setBusy] = useState(false);

  async function updateSettings(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    onSettingsChange(next);
    await saveSettings(next);
    return next;
  }

  async function useCurrentLocationAsHome() {
    setBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Berechtigung fehlt", "Ohne Standortzugriff kann ich die aktuelle Position nicht auslesen.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLatText(String(pos.coords.latitude));
      setLngText(String(pos.coords.longitude));
    } catch (err) {
      Alert.alert("Fehler", String(err));
    } finally {
      setBusy(false);
    }
  }

  async function togglePresence(value: boolean) {
    const lat = Number(latText.replace(",", "."));
    const lng = Number(lngText.replace(",", "."));
    const radius = Number(radiusText.replace(",", "."));

    if (value) {
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius) || radius <= 0) {
        Alert.alert("Ungültige Werte", "Bitte gültige Koordinaten und einen Radius größer 0 eintragen.");
        return;
      }
      if (!settings.serverUrl) {
        Alert.alert("Server-URL fehlt", "Bitte oben zuerst die Server-Verbindung einrichten.");
        return;
      }

      setBusy(true);
      try {
        const permResult = await ensureLocationPermissions();
        if (!permResult.granted) {
          Alert.alert(
            "Berechtigung fehlt",
            permResult.reason === "foreground_denied"
              ? "Standortzugriff wurde abgelehnt."
              : "Hintergrund-Standort ('Immer erlauben') wurde abgelehnt. Ohne das funktioniert Geofencing nicht, wenn die App im Hintergrund ist."
          );
          return;
        }
        const home = { latitude: lat, longitude: lng, radiusMeters: radius };
        await startPresenceGeofencing(home);
        await updateSettings({ presenceEnabled: true, home });
      } catch (err) {
        Alert.alert("Fehler beim Starten", String(err));
      } finally {
        setBusy(false);
      }
    } else {
      setBusy(true);
      try {
        await stopPresenceGeofencing();
        await updateSettings({ presenceEnabled: false });
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <Panel title="Anwesenheit">
      <Text style={styles.hint}>
        Standort wird nur lokal ausgewertet. Es geht nur ein einzelnes
        Ereignis (angekommen/verlassen) an deinen PC, keine laufenden
        Koordinaten.
      </Text>

      <View style={styles.row}>
        <Field
          label="Breitengrad"
          style={styles.flex1}
          keyboardType="numbers-and-punctuation"
          value={latText}
          onChangeText={setLatText}
        />
        <Field
          label="Längengrad"
          style={styles.flex1}
          keyboardType="numbers-and-punctuation"
          value={lngText}
          onChangeText={setLngText}
        />
      </View>

      <Field label="Radius (Meter)" keyboardType="numeric" value={radiusText} onChangeText={setRadiusText} />

      <TouchableOpacity style={styles.button} onPress={useCurrentLocationAsHome} disabled={busy}>
        <Text style={styles.buttonText}>Aktuellen Standort als Zuhause übernehmen</Text>
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Anwesenheitserkennung aktiv</Text>
        <Switch value={settings.presenceEnabled} onValueChange={togglePresence} disabled={busy} />
      </View>

      <Text style={styles.hint}>
        Erster Start braucht "Standortzugriff immer erlauben" (Android) -
        das fragt Android separat von der normalen Freigabe ab, siehe README.
      </Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
  row: { flexDirection: "row", gap: 12 },
  flex1: { flex: 1 },
  label: { color: colors.text, fontSize: 14 },
  button: {
    backgroundColor: colors.accentDim,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
