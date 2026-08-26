import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors } from "./theme";

interface PanelProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

// Eckenklammern-Panel, wie die Panels im PC-Dashboard - eine gemeinsame
// visuelle Sprache ueber PC und Handy hinweg.
export default function Panel({ title, children, style }: PanelProps) {
  return (
    <View style={[styles.panel, style]}>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "relative",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
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
