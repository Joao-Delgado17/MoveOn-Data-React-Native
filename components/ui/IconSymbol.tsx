import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { StyleProp, TextStyle } from "react-native";

// mantém o teu mapping como já tens
const MAPPING: Record<string, any> = {
  // ... (o teu mapping)
};

type Props = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>; // ✅ era ViewStyle, agora TextStyle
};

// ✅ named export (para funcionar com: import { IconSymbol } from ...)
export function IconSymbol({ name, size = 24, color, style }: Props) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}

// ✅ opcional: manter também default export (não estraga)
export default IconSymbol;