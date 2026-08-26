import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Panel from "../../ui/Panel";
import StatusPill from "../../ui/StatusPill";
import { colors } from "../../ui/theme";
import { hasContactsPermission, requestContactsPermission } from "../contacts/lookup";
import { hasCallPermission, requestCallPermission } from "./permissions";

export default function CallsSection() {
  const [contactsGranted, setContactsGranted] = useState<boolean | null>(null);
  const [callGranted, setCallGranted] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    setContactsGranted(await hasContactsPermission());
    setCallGranted(await hasCallPermission());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onRequestContacts() {
    const granted = await requestContactsPermission();
    setContactsGranted(granted);
    if (!granted) {
      Alert.alert(
        "Berechtigung fehlt",
        "Ohne Kontaktzugriff kann ich Namen wie \"Ruf Max an\" nicht in Telefonnummern übersetzen."
      );
    }
  }

  async function onRequestCall() {
    const granted = await requestCallPermission();
    setCallGranted(granted);
  }

  return (
    <Panel title="Anrufe & Kontakte">
      <Text style={styles.hint}>
        Damit "Ruf X an" oder "Schreib X, dass..." funktioniert, muss die
        App Namen in Telefonnummern übersetzen können.
      </Text>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>Kontaktzugriff</Text>
          <StatusPill
            label={contactsGranted === null ? "PRÜFE…" : contactsGranted ? "ERLAUBT" : "NICHT ERLAUBT"}
            tone={contactsGranted ? "ok" : "warn"}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={onRequestContacts}>
          <Text style={styles.buttonText}>Anfragen</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>Direkt anrufen (ohne Wähl-Bildschirm)</Text>
          <StatusPill
            label={callGranted === null ? "PRÜFE…" : callGranted ? "ERLAUBT" : "GESICHERT"}
            tone={callGranted ? "ok" : "neutral"}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={onRequestCall}>
          <Text style={styles.buttonText}>Anfragen</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        Ohne diese Berechtigung öffnet ein Anruf-Befehl nur die Wähl-App
        mit vorausgefüllter Nummer - du musst noch selbst auf "Anrufen"
        tippen. Das ist ein zusätzliches Sicherheitsnetz, kein Fehler:
        du kannst es so lassen und trotzdem alles nutzen.
      </Text>

      <TouchableOpacity style={styles.linkButton} onPress={refresh}>
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
  button: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentDim,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buttonText: { color: colors.accent, fontSize: 12, fontWeight: "600" },
  linkButton: { paddingVertical: 4 },
  linkButtonText: { color: colors.accent, fontSize: 12, textDecorationLine: "underline" },
});
