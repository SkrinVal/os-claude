import React, { useCallback, useEffect, useState } from "react";
import { Alert, Linking, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import ValityWakeWord from "../../../modules/vality-wakeword/src/ValityWakeWordModule";
import Field from "../../ui/Field";
import Panel from "../../ui/Panel";
import StatusPill from "../../ui/StatusPill";
import { colors } from "../../ui/theme";
import { saveSettings, type AppSettings } from "../../storage/settings";
import { hasMicrophonePermission, requestMicrophonePermission } from "./permissions";
import { syncWakeWordConfig } from "./setup";

const PICOVOICE_CONSOLE_URL = "https://console.picovoice.ai";

interface Props {
  settings: AppSettings;
  onSettingsChange: (next: AppSettings) => void;
}

export default function WakeWordSection({ settings, onSettingsChange }: Props) {
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const [overlayGranted, setOverlayGranted] = useState<boolean | null>(null);

  const refreshStatus = useCallback(async () => {
    setMicGranted(await hasMicrophonePermission());
    setOverlayGranted(await ValityWakeWord.isOverlayPermissionGranted());
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  async function updateSettings(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    onSettingsChange(next);
    await saveSettings(next);
    await syncWakeWordConfig();
  }

  async function toggleWakeWord(value: boolean) {
    if (!value) {
      await updateSettings({ wakeWordEnabled: false });
      return;
    }

    if (!settings.picovoiceAccessKey.trim()) {
      Alert.alert(
        "AccessKey fehlt",
        "Ohne kostenlosen Picovoice-AccessKey kann das Weckwort nicht aktiviert werden. Key unten eintragen."
      );
      return;
    }

    if (!(await hasMicrophonePermission())) {
      const granted = await requestMicrophonePermission();
      setMicGranted(granted);
      if (!granted) {
        Alert.alert("Mikrofon-Berechtigung fehlt", "Ohne Mikrofonzugriff kann das Weckwort nicht hören.");
        return;
      }
    }

    if (!(await ValityWakeWord.isOverlayPermissionGranted())) {
      Alert.alert(
        "Anzeige über anderen Apps fehlt",
        "Ohne diese Berechtigung erkennt Vality das Weckwort trotzdem, zeigt aber keine Einblendung. Jetzt erlauben?",
        [
          { text: "Später", style: "cancel", onPress: () => updateSettings({ wakeWordEnabled: true }) },
          {
            text: "Einstellungen öffnen",
            onPress: () => ValityWakeWord.openOverlayPermissionSettings(),
          },
        ]
      );
      return;
    }

    await updateSettings({ wakeWordEnabled: true });
  }

  return (
    <Panel
      title="Weckwort · „Hi Jarvis“"
      status={{ label: settings.wakeWordEnabled ? "AKTIV" : "AUS", tone: settings.wakeWordEnabled ? "ok" : "neutral" }}
      collapsible
      defaultExpanded={false}
    >
      <Text style={styles.hint}>
        Hört offline im Hintergrund mit, auch wenn die App geschlossen ist -
        solange das Handy eingeschaltet ist. Braucht einen kostenlosen
        AccessKey von Picovoice.
      </Text>

      <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(PICOVOICE_CONSOLE_URL)}>
        <Text style={styles.linkButtonText}>Kostenlosen AccessKey auf console.picovoice.ai holen</Text>
      </TouchableOpacity>

      <Field
        label="Picovoice AccessKey"
        value={settings.picovoiceAccessKey}
        onChangeText={(text) => updateSettings({ picovoiceAccessKey: text })}
        placeholder="z.B. AbCdEf123..."
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>Mikrofon</Text>
          <StatusPill
            label={micGranted === null ? "PRÜFE…" : micGranted ? "ERLAUBT" : "NICHT ERLAUBT"}
            tone={micGranted ? "ok" : "warn"}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>Anzeige über anderen Apps</Text>
          <StatusPill
            label={overlayGranted === null ? "PRÜFE…" : overlayGranted ? "ERLAUBT" : "NICHT ERLAUBT"}
            tone={overlayGranted ? "ok" : "warn"}
          />
        </View>
        <TouchableOpacity onPress={() => ValityWakeWord.openOverlayPermissionSettings()}>
          <Text style={styles.linkButtonText}>Öffnen</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>Weckwort aktiv</Text>
        </View>
        <Switch value={settings.wakeWordEnabled} onValueChange={toggleWakeWord} />
      </View>

      <TouchableOpacity style={styles.linkButton} onPress={refreshStatus}>
        <Text style={styles.linkButtonText}>Status neu prüfen</Text>
      </TouchableOpacity>
    </Panel>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rowLabel: { flex: 1, gap: 6 },
  label: { color: colors.text, fontSize: 14 },
  linkButton: { paddingVertical: 4 },
  linkButtonText: { color: colors.accent, fontSize: 12, textDecorationLine: "underline" },
});
