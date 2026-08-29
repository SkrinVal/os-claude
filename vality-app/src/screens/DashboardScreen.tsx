import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ConnectionSection from "../features/connection/ConnectionSection";
import PresenceSection from "../features/presence/PresenceSection";
import MessagingSection from "../features/messaging/MessagingSection";
import CallsSection from "../features/calls/CallsSection";
import CalendarSection from "../features/calendar/CalendarSection";
import WakeWordSection from "../features/wakeword/WakeWordSection";
import StatusPill from "../ui/StatusPill";
import CoreGlyph from "../ui/CoreGlyph";
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
      <LinearGradient colors={[colors.surfaceRaised, colors.ground]} style={styles.header}>
        <View style={styles.brandRow}>
          <CoreGlyph size={40} />
          <View>
            <Text style={styles.brand}>VALITY · AI</Text>
            <Text style={styles.brandSub}>Handy-Begleiter</Text>
          </View>
        </View>
        <StatusPill label={connected ? "PC ERREICHBAR" : "PC NICHT ERREICHBAR"} tone={connected ? "ok" : "danger"} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ConnectionSection settings={settings} onSettingsChange={setSettings} connected={connected} />
        <PresenceSection settings={settings} onSettingsChange={setSettings} />
        <MessagingSection settings={settings} onSettingsChange={setSettings} />
        <CallsSection />
        <CalendarSection settings={settings} onSettingsChange={setSettings} />
        <WakeWordSection settings={settings} onSettingsChange={setSettings} />
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
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  brand: { color: colors.accent, fontWeight: "700", letterSpacing: 2, fontSize: 14 },
  brandSub: { color: colors.textFaint, fontSize: 10.5, letterSpacing: 1, marginTop: 2 },
  scroll: { padding: 18, gap: 16 },
});
