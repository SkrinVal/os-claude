import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import CoreGlyph from "./CoreGlyph";
import { colors } from "./theme";

// Ersetzt das schlichte "Lade Einstellungen..." beim Start - kurzer,
// bewusster Moment statt eines nackten Textes, waehrend AsyncStorage liest.
export default function BootScreen() {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fade,
          transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          alignItems: "center",
        }}
      >
        <CoreGlyph size={88} />
        <Text style={styles.brand}>VALITY · AI</Text>
        <Text style={styles.sub}>wird geladen…</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ground, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.accent, fontWeight: "700", letterSpacing: 3, fontSize: 15, marginTop: 20 },
  sub: { color: colors.textFaint, fontSize: 11, letterSpacing: 1, marginTop: 6 },
});
