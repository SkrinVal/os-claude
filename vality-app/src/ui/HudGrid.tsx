import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";
import { colors } from "./theme";

const CELL = 28;

// Ganz dezentes technisches Gitter hinter dem Inhalt - passt zum
// Eckenklammern-/HUD-Look der Panels, ohne vom eigentlichen Inhalt
// abzulenken (sehr geringe Deckkraft).
export default function HudGrid() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="hudGrid" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
          <Line x1={0} y1={0} x2={CELL} y2={0} stroke={colors.lineBright} strokeWidth={0.6} />
          <Line x1={0} y1={0} x2={0} y2={CELL} stroke={colors.lineBright} strokeWidth={0.6} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#hudGrid)" opacity={0.06} />
    </Svg>
  );
}
