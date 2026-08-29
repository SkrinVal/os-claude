import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type * as Calendar from "expo-calendar";
import Panel from "../../ui/Panel";
import { colors } from "../../ui/theme";
import { saveSettings, type AppSettings } from "../../storage/settings";
import { getWritableCalendars, hasCalendarPermission, requestCalendarPermission } from "./write";

interface Props {
  settings: AppSettings;
  onSettingsChange: (next: AppSettings) => void;
}

// Android kennt keinen einzelnen "Standard"-Kalender wie iOS - hier kann
// der Nutzer selbst festlegen, in welchen seiner Kalender Vality Termine
// per Sprachbefehl einträgt. Ohne Auswahl wird automatisch der primäre
// Account-Kalender genutzt (siehe features/calendar/write.ts).
export default function CalendarSection({ settings, onSettingsChange }: Props) {
  const [calendars, setCalendars] = useState<Calendar.ExpoCalendar[] | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Zeigt den Kalender-Namen statt nur "Ausgewählt", wenn die Berechtigung
  // schon erteilt ist - fragt dafuer aber nicht extra danach, das soll
  // nicht schon beim Oeffnen der App ungefragt einen Dialog ausloesen.
  useEffect(() => {
    if (!settings.calendarId) return;
    let cancelled = false;
    hasCalendarPermission().then((granted) => {
      if (!granted || cancelled) return;
      getWritableCalendars().then((list) => {
        const match = list.find((c) => c.id === settings.calendarId);
        if (match && !cancelled) setSelectedTitle(match.title);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [settings.calendarId]);

  async function openPicker() {
    setBusy(true);
    try {
      let granted = await hasCalendarPermission();
      if (!granted) granted = await requestCalendarPermission();
      if (!granted) {
        Alert.alert("Berechtigung fehlt", "Ohne Kalender-Zugriff kann ich keine Kalender anzeigen.");
        return;
      }
      const list = await getWritableCalendars();
      if (list.length === 0) {
        Alert.alert(
          "Kein Kalender gefunden",
          "Auf dem Gerät ist kein beschreibbarer Kalender eingerichtet (z.B. kein Google-Konto hinzugefügt). Vality legt beim ersten Termin automatisch einen eigenen an."
        );
        return;
      }
      const current = list.find((c) => c.id === settings.calendarId);
      if (current) setSelectedTitle(current.title);
      setCalendars(list);
    } catch (err) {
      Alert.alert("Fehler", String(err));
    } finally {
      setBusy(false);
    }
  }

  async function pick(id: string | null, title: string | null) {
    const next = { ...settings, calendarId: id };
    onSettingsChange(next);
    await saveSettings(next);
    setSelectedTitle(title);
    setCalendars(null);
  }

  return (
    <Panel
      title="Kalender"
      status={{ label: settings.calendarId ? "GESETZT" : "AUTOMATISCH", tone: settings.calendarId ? "ok" : "neutral" }}
      collapsible
      defaultExpanded={false}
    >
      <Text style={styles.hint}>
        Termine, die du per Sprachbefehl anlegst ("Erinnere mich …"), landen
        in diesem Kalender.
      </Text>

      <View style={styles.current}>
        <Text style={styles.currentLabel}>Aktuell</Text>
        <Text style={styles.currentValue}>
          {settings.calendarId ? (selectedTitle ?? "Ausgewählt") : "Automatisch (bevorzugt dein Hauptkonto)"}
        </Text>
      </View>

      {calendars === null ? (
        <TouchableOpacity style={styles.button} onPress={openPicker} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? "Lade Kalender…" : "Kalender auswählen"}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.list}>
          <TouchableOpacity style={styles.option} onPress={() => pick(null, null)}>
            <View style={[styles.dot, !settings.calendarId && styles.dotActive]} />
            <Text style={styles.optionText}>Automatisch</Text>
          </TouchableOpacity>
          {calendars.map((c) => (
            <TouchableOpacity key={c.id} style={styles.option} onPress={() => pick(c.id, c.title)}>
              <View style={[styles.dot, settings.calendarId === c.id && styles.dotActive]} />
              <View style={styles.optionTextGroup}>
                <Text style={styles.optionText}>{c.title}</Text>
                {c.source?.name ? <Text style={styles.optionSub}>{c.source.name}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancel} onPress={() => setCalendars(null)}>
            <Text style={styles.cancelText}>Schließen</Text>
          </TouchableOpacity>
        </View>
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
  current: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  currentLabel: { color: colors.textFaint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  currentValue: { color: colors.text, fontSize: 13, fontWeight: "600" },
  button: {
    backgroundColor: colors.accentDim,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  list: { gap: 2 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optionTextGroup: { flex: 1 },
  optionText: { color: colors.text, fontSize: 14 },
  optionSub: { color: colors.textFaint, fontSize: 11, marginTop: 1 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.lineBright,
  },
  dotActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  cancel: { alignItems: "center", paddingVertical: 10 },
  cancelText: { color: colors.textDim, fontSize: 12 },
});
