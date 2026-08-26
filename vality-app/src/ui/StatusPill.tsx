import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "./theme";

type Tone = "ok" | "warn" | "danger" | "neutral";

const TONE_COLOR: Record<Tone, string> = {
  ok: colors.ok,
  warn: colors.amber,
  danger: colors.danger,
  neutral: colors.textFaint,
};

export default function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  const color = TONE_COLOR[tone];
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, letterSpacing: 0.5 },
});
