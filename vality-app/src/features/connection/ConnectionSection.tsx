import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Panel from "../../ui/Panel";
import Field from "../../ui/Field";
import { colors } from "../../ui/theme";
import { saveSettings, type AppSettings } from "../../storage/settings";

interface Props {
  settings: AppSettings;
  onSettingsChange: (next: AppSettings) => void;
  connected: boolean;
}

export default function ConnectionSection({ settings, onSettingsChange, connected }: Props) {
  async function updateSettings(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    onSettingsChange(next);
    await saveSettings(next);
  }

  return (
    <Panel
      title="Server-Verbindung"
      status={{ label: connected ? "VERBUNDEN" : "GETRENNT", tone: connected ? "ok" : "danger" }}
    >
      <Field
        label="Server-URL (PC im selben Netz)"
        placeholder="http://192.168.1.20:4390"
        autoCapitalize="none"
        autoCorrect={false}
        value={settings.serverUrl}
        onChangeText={(v) => updateSettings({ serverUrl: v })}
      />

      <Field
        label="Geräte-Token (muss zu PRESENCE_TOKEN auf dem Server passen)"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        value={settings.presenceToken}
        onChangeText={(v) => updateSettings({ presenceToken: v })}
      />

      <Text style={styles.hint}>
        Ein Token für alle Features (Anwesenheit, Nachrichten). Auf dem
        Server in `.env` als `PRESENCE_TOKEN` gesetzt.
      </Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textFaint, fontSize: 11, lineHeight: 16 },
});
