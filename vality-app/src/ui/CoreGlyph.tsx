import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { colors } from "./theme";

interface Props {
  size?: number;
}

// Kleines, lebendiges Pendant zum CoreRing im PC-Dashboard
// (vality-server/dashboard/src/components/core/CoreRing.tsx) und zum
// App-Icon (assets/icon.png) - derselbe leuchtende Ring-um-Kern, diesmal
// direkt im UI statt nur als Symbol. Drei Bewegungsebenen statt einer
// statischen Grafik: Puls (Kern), Rotation (aeusserer Strichring, wie ein
// Radar-Scan) und bei groesserer Darstellung ein auslaufender Echo-Ring -
// damit der Core wirkt, als hoert er wirklich aktiv zu.
export default function CoreGlyph({ size = 64 }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const echo = useRef(new Animated.Value(0)).current;
  const showEcho = size >= 72;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  useEffect(() => {
    if (!showEcho) return;
    const loop = Animated.loop(
      Animated.timing(echo, { toValue: 1, duration: 2400, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [echo, showEcho]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const echoScale = echo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const echoOpacity = echo.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {showEcho ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: size / 2,
              borderWidth: 1.5,
              borderColor: colors.accent,
              opacity: echoOpacity,
              transform: [{ scale: echoScale }],
            },
          ]}
        />
      ) : null}

      <Animated.View style={{ width: size, height: size, transform: [{ scale }], opacity }}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="34" fill="none" stroke={colors.accent} strokeWidth={1.6} strokeDasharray="1.4 4.4" opacity={0.4} />
          </Svg>
        </Animated.View>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="coreGlyphGrad" cx="50%" cy="40%" r="65%">
              <Stop offset="0%" stopColor="#eafffb" />
              <Stop offset="40%" stopColor="#5cf3e2" />
              <Stop offset="100%" stopColor={colors.accentDim} />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="27" fill="none" stroke={colors.accent} strokeWidth={3.2} opacity={0.95} />
          <Circle cx="50" cy="50" r="15" fill="url(#coreGlyphGrad)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
