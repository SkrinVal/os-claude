import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "./theme";

interface PanelProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

// Eckenklammern-Panel, wie die Panels im PC-Dashboard - eine gemeinsame
// visuelle Sprache ueber PC und Handy hinweg. Dezenter Verlauf statt
// flacher Flaeche + weicher Schlagschatten geben den Karten etwas Tiefe,
// statt komplett flach auf dem Grund zu liegen.
export default function Panel({ title, children, style }: PanelProps) {
  return (
    <View style={[styles.shadowWrap, style]}>
      <LinearGradient colors={[colors.surfaceRaised, colors.surface]} style={styles.panel}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.body}>{children}</View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  panel: {
    position: "relative",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: colors.accent,
  },
  cornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
  title: {
    color: colors.textDim,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 14,
    textTransform: "uppercase",
  },
  body: { gap: 14 },
});
