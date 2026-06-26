import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/colors";

type Props = { direction: "left" | "right" };

export default function ChevronIcon({ direction }: Props) {
  return (
    <View style={st.circle}>
      <Ionicons name={direction === "left" ? "chevron-back" : "chevron-forward"} size={14} color={theme.fg} />
    </View>
  );
}

const st = StyleSheet.create({
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
