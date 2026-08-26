import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import {
  ensureLocationPermissions,
  startPresenceGeofencing,
  stopPresenceGeofencing,
} from "./geofence";
import { loadSettings, saveSettings, type AppSettings } from "../../storage/settings";

export default function PresenceScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [latText, setLatText] = useState("");
  const [lngText, setLngText] = useState("");
  const [radiusText, setRadiusText] = useState("150");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      if (s.home) {
        setLatText(String(s.home.latitude));
        setLngText(String(s.home.longitude));
        setRadiusText(String(s.home.radiusMeters));
      }
    });
  }, []);

  if (!settings) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Lade Einstellungen…</Text>
      </SafeAreaView>
    );
  }

  async function updateSettings(patch: Partial<AppSettings>) {
    const next = { ...settings!, ...patch };
    setSettings(next);
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
      if (!settings!.serverUrl) {
        Alert.alert("Server-URL fehlt", "Bitte zuerst die Adresse des Vality-Servers eintragen.");
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Anwesenheitserkennung</Text>
        <Text style={styles.hint}>
          Standort wird nur lokal ausgewertet, um Ankunft/Verlassen des
          Zuhause-Radius zu erkennen. Es geht nur ein einzelnes
          Ereignis (angekommen/verlassen) an deinen eigenen PC-Server,
          keine laufenden Koordinaten.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Server-URL (PC im selben Netz)</Text>
          <TextInput
            style={styles.input}
            placeholder="http://192.168.1.20:4390"
            autoCapitalize="none"
            autoCorrect={false}
            value={settings.serverUrl}
            onChangeText={(v) => updateSettings({ serverUrl: v })}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Zugriffs-Token (muss zu PRESENCE_TOKEN auf dem Server passen)</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            value={settings.presenceToken}
            onChangeText={(v) => updateSettings({ presenceToken: v })}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Breitengrad</Text>
            <TextInput style={styles.input} keyboardType="numbers-and-punctuation" value={latText} onChangeText={setLatText} />
          </View>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Längengrad</Text>
            <TextInput style={styles.input} keyboardType="numbers-and-punctuation" value={lngText} onChangeText={setLngText} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Radius (Meter)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={radiusText} onChangeText={setRadiusText} />
        </View>

        <TouchableOpacity style={styles.button} onPress={useCurrentLocationAsHome} disabled={busy}>
          <Text style={styles.buttonText}>Aktuellen Standort als Zuhause übernehmen</Text>
        </TouchableOpacity>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Anwesenheitserkennung aktiv</Text>
          <Switch value={settings.presenceEnabled} onValueChange={togglePresence} disabled={busy} />
        </View>

        <Text style={styles.hint}>
          Erster Start braucht "Standortzugriff immer erlauben" (Android)
          bzw. "Immer" (iOS) - das fragt das System separat von der
          normalen Freigabe ab, siehe README.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f12" },
  scroll: { padding: 20, gap: 16 },
  title: { color: "#e6f7f6", fontSize: 22, fontWeight: "700" },
  text: { color: "#e6f7f6" },
  hint: { color: "#7fa3a8", fontSize: 13, lineHeight: 19 },
  field: { gap: 6 },
  row: { flexDirection: "row", gap: 12 },
  flex1: { flex: 1 },
  label: { color: "#a9cfd2", fontSize: 13 },
  input: {
    backgroundColor: "#101b1f",
    borderColor: "#244850",
    borderWidth: 1,
    borderRadius: 8,
    color: "#e6f7f6",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: "#12615c",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#e6f7f6", fontWeight: "600" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
});
