import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "./theme";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "solid" | "outline";
  /** compact = kleine Inline-Pille (z.B. "Anfragen" neben einem Status), default = volle Breite. */
  size?: "default" | "compact";
  style?: StyleProp<ViewStyle>;
}

// Einheitlicher Button statt der bisher pro Karte leicht unterschiedlichen
// Ad-hoc-Buttons (Presence, Kalender, Anrufe) - plus spuerbares Press-
// Feedback (kurzes Einsinken) statt eines Tastendrucks ohne jede Reaktion.
export default function PrimaryButton({ label, onPress, disabled, variant = "solid", size = "default", style }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, size === "compact" && styles.compactWrap]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        style={[
          styles.base,
          size === "compact" && styles.compact,
          variant === "solid" ? styles.solid : styles.outline,
          disabled && styles.disabled,
          style,
        ]}
      >
        <Text style={variant === "solid" ? styles.solidText : styles.outlineText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  compactWrap: { alignSelf: "flex-start" },
  compact: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  solid: { backgroundColor: colors.accentDim },
  outline: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentDim,
  },
  disabled: { opacity: 0.5 },
  solidText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  outlineText: { color: colors.accent, fontWeight: "600", fontSize: 12 },
});
