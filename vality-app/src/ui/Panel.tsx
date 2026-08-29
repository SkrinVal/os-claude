import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "./theme";

type Tone = "ok" | "warn" | "danger" | "neutral";

const TONE_COLOR: Record<Tone, string> = {
  ok: colors.ok,
  warn: colors.amber,
  danger: colors.danger,
  neutral: colors.textFaint,
};

interface PanelProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
  /** Kurzer Status-Chip neben dem Titel, sichtbar auch wenn eingeklappt. */
  status?: { label: string; tone: Tone };
  /** Wenn gesetzt: Titelzeile ist antippbar und klappt den Inhalt ein/aus. */
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// Eckenklammern-Panel, wie die Panels im PC-Dashboard - eine gemeinsame
// visuelle Sprache ueber PC und Handy hinweg. Dezenter Verlauf statt
// flacher Flaeche + weicher Schlagschatten geben den Karten etwas Tiefe.
// Einklappbar, weil mit wachsender Feature-Zahl (Verbindung, Anwesenheit,
// Nachrichten, Anrufe, Kalender, Weckwort) eine lange Liste offener Karten
// schnell unuebersichtlich wird - der Status-Chip im Kopf bleibt aber auch
// eingeklappt sichtbar, damit nichts vom Zustand verloren geht.
export default function Panel({ title, children, style, status, collapsible, defaultExpanded = true }: PanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const enter = useRef(new Animated.Value(0)).current;
  const chevron = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    Animated.timing(chevron, {
      toValue: next ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  const rotate = chevron.interpolate({ inputRange: [0, 1], outputRange: ["-90deg", "0deg"] });
  const showBody = !collapsible || expanded;

  return (
    <Animated.View
      style={[
        styles.shadowWrap,
        style,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      <LinearGradient colors={[colors.surfaceRaised, colors.surface]} style={styles.panel}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        <TouchableOpacity
          style={styles.header}
          onPress={collapsible ? toggle : undefined}
          activeOpacity={collapsible ? 0.7 : 1}
          disabled={!collapsible}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
            {status ? (
              <View style={[styles.statusChip, { borderColor: TONE_COLOR[status.tone] }]}>
                <View style={[styles.statusDot, { backgroundColor: TONE_COLOR[status.tone] }]} />
                <Text style={[styles.statusText, { color: TONE_COLOR[status.tone] }]}>{status.label}</Text>
              </View>
            ) : null}
          </View>
          {collapsible ? (
            <Animated.Text style={[styles.chevron, { transform: [{ rotate }] }]}>{"▾"}</Animated.Text>
          ) : null}
        </TouchableOpacity>

        {showBody ? <View style={styles.body}>{children}</View> : null}
      </LinearGradient>
    </Animated.View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  title: {
    color: colors.textDim,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 10, letterSpacing: 0.5 },
  chevron: { color: colors.textFaint, fontSize: 13 },
  body: { gap: 14, marginTop: 14 },
});
