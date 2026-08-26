import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import ConnectionSection from "../features/connection/ConnectionSection";
import PresenceSection from "../features/presence/PresenceSection";
import MessagingSection from "../features/messaging/MessagingSection";
import StatusPill from "../ui/StatusPill";
import { colors } from "../ui/theme";
import { DEFAULT_SETTINGS, loadSettings, type AppSettings } from "../storage/settings";

const REACHABILITY_INTERVAL_MS = 8000;

export default function DashboardScreen() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [connected, setConnected] = useState(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const url = settingsRef.current.serverUrl;
      if (!url) {
        if (!cancelled) setConnected(false);
        return;
      }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(new URL("/api/status", url).toString(), { signal: controller.signal });
        clearTimeout(timeout);
        if (!cancelled) setConnected(res.ok);
      } catch (err) {
        if (!cancelled) setConnected(false);
      }
    }

    check();
    const interval = setInterval(check, REACHABILITY_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [settings.serverUrl]);

  if (!loaded) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Lade Einstellungen…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brand}>VALITY · AI</Text>
        </View>
        <StatusPill label={connected ? "PC ERREICHBAR" : "PC NICHT ERREICHBAR"} tone={connected ? "ok" : "danger"} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ConnectionSection settings={settings} onSettingsChange={setSettings} connected={connected} />
        <PresenceSection settings={settings} onSettingsChange={setSettings} />
        <MessagingSection settings={settings} onSettingsChange={setSettings} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ground },
  loading: { color: colors.text, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.accent },
  brand: { color: colors.accent, fontWeight: "700", letterSpacing: 2, fontSize: 13 },
  scroll: { padding: 18, gap: 16 },
});
