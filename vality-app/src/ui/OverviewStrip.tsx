import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors } from "./theme";

interface Item {
  label: string;
  active: boolean;
}

function Chip({ label, active }: Item) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const dotOpacity = active ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) : 1;

  return (
    <View style={[styles.chip, active && styles.chipActive]}>
      <Animated.View style={[styles.dot, active ? styles.dotOn : styles.dotOff, { opacity: dotOpacity }]} />
      <Text style={[styles.label, active && styles.labelOn]}>{label}</Text>
    </View>
  );
}

// Kompakter Statusstreifen direkt unter dem Header - Sinn: mit sechs
// einklappbaren Karten darunter (Verbindung, Anwesenheit, Nachrichten,
// Anrufe, Kalender, Weckwort) soll man den Gesamtzustand auf einen Blick
// sehen, ohne jede Karte einzeln aufzuklappen. Aktive Punkte pulsieren
// dezent, wie der Rest des Systems (StatusPill, CoreGlyph).
export default function OverviewStrip({ items }: { items: Item[] }) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Chip key={item.label} label={item.label} active={item.active} />
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
  chipActive: { borderColor: colors.accentDim },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotOn: { backgroundColor: colors.ok },
  dotOff: { backgroundColor: colors.textFaint },
  label: { color: colors.textFaint, fontSize: 10.5, letterSpacing: 0.4 },
  labelOn: { color: colors.textDim },
});
