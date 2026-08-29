import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "./theme";

interface Item {
  label: string;
  active: boolean;
}

// Kompakter Statusstreifen direkt unter dem Header - Sinn: mit sechs
// einklappbaren Karten darunter (Verbindung, Anwesenheit, Nachrichten,
// Anrufe, Kalender, Weckwort) soll man den Gesamtzustand auf einen Blick
// sehen, ohne jede Karte einzeln aufzuklappen.
export default function OverviewStrip({ items }: { items: Item[] }) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.label} style={styles.chip}>
          <View style={[styles.dot, item.active ? styles.dotOn : styles.dotOff]} />
          <Text style={[styles.label, item.active && styles.labelOn]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotOn: { backgroundColor: colors.ok },
  dotOff: { backgroundColor: colors.textFaint },
  label: { color: colors.textFaint, fontSize: 10.5, letterSpacing: 0.4 },
  labelOn: { color: colors.textDim },
});
