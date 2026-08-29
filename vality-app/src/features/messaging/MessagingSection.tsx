import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import ValityMessaging from "../../../modules/vality-messaging/src/ValityMessagingModule";
import Panel from "../../ui/Panel";
import StatusPill from "../../ui/StatusPill";
import { colors } from "../../ui/theme";
import { saveSettings, type AppSettings } from "../../storage/settings";
import { hasSmsPermissions, requestSmsPermissions } from "./permissions";
import { syncMessagingConfig } from "./setup";

interface Props {
  settings: AppSettings;
  onSettingsChange: (next: AppSettings) => void;
}

export default function MessagingSection({ settings, onSettingsChange }: Props) {
  const [notificationAccess, setNotificationAccess] = useState<boolean | null>(null);
  const [smsGranted, setSmsGranted] = useState<boolean | null>(null);

  const refreshStatus = useCallback(async () => {
    setNotificationAccess(await ValityMessaging.isNotificationAccessGranted());
    setSmsGranted(await hasSmsPermissions());
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  async function updateSettings(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    onSettingsChange(next);
    await saveSettings(next);
    await syncMessagingConfig();
  }

  async function toggleWhatsapp(value: boolean) {
    if (value && notificationAccess === false) {
      Alert.alert(
        "Benachrichtigungszugriff fehlt",
        "Ohne 'Benachrichtigungszugriff' kann WhatsApp-Vorschau nicht mitgelesen werden. Jetzt in den Einstellungen freigeben?",
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Einstellungen öffnen", onPress: () => ValityMessaging.openNotificationAccessSettings() },
        ]
      );
      return;
    }
    await updateSettings({ whatsappEnabled: value });
  }

  async function toggleSms(value: boolean) {
    if (value && !smsGranted) {
      const result = await requestSmsPermissions();
      if (result !== "granted") {
        Alert.alert("Berechtigung fehlt", "Ohne SMS-Berechtigungen kann dieses Feature nicht aktiviert werden.");
        await refreshStatus();
        return;
      }
      setSmsGranted(true);
    }
    await updateSettings({ smsEnabled: value });
  }

  const active = settings.whatsappEnabled || settings.smsEnabled;

  return (
    <Panel
      title="Nachrichten"
      status={{ label: active ? "AKTIV" : "AUS", tone: active ? "ok" : "neutral" }}
      collapsible
      defaultExpanded={false}
    >
      <Text style={styles.hint}>
        WhatsApp-Vorschauen kommen ueber die Benachrichtigungs-Vorschau des
        Systems - kein offizieller WhatsApp-Zugriff, siehe README fuer die
        Grenzen. SMS wird direkt gelesen/gesendet.
      </Text>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>WhatsApp-Vorschau vorlesen</Text>
          <StatusPill
            label={
              notificationAccess === null
                ? "PRÜFE…"
                : notificationAccess
                  ? "ZUGRIFF ERTEILT"
                  : "ZUGRIFF FEHLT"
            }
            tone={notificationAccess ? "ok" : "warn"}
          />
        </View>
        <Switch value={settings.whatsappEnabled} onValueChange={toggleWhatsapp} />
      </View>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => ValityMessaging.openNotificationAccessSettings()}
      >
        <Text style={styles.linkButtonText}>Benachrichtigungszugriff in Android-Einstellungen öffnen</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>SMS lesen &amp; senden</Text>
          <StatusPill
            label={smsGranted === null ? "PRÜFE…" : smsGranted ? "ERLAUBT" : "NICHT ERLAUBT"}
            tone={smsGranted ? "ok" : "warn"}
          />
        </View>
        <Switch value={settings.smsEnabled} onValueChange={toggleSms} />
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
