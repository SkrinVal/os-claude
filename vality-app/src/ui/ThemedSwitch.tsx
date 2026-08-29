import React from "react";
import { Switch, type SwitchProps } from "react-native";
import { colors } from "./theme";

// Reines Android-Standard-Switch (grelles System-Gruen) passte nicht zum
// Teal-Markenlook - einheitlich fuer Praesenz/Nachrichten/Weckwort-Schalter.
export default function ThemedSwitch(props: SwitchProps) {
  return (
    <Switch
      trackColor={{ false: colors.line, true: colors.accentDim }}
      thumbColor={props.value ? colors.accent : "#3a4c50"}
      ios_backgroundColor={colors.line}
      {...props}
    />
  );
}
