import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "../theme/colors";

type Props = { onSignIn: () => void; onSignUp: () => void };

export default function WelcomeScreen({ onSignIn, onSignUp }: Props) {
  return (
    <View style={st.container}>
      <View style={st.hero}>
        <Text style={st.logo}>📅</Text>
        <Text style={st.title}>El Calendario</Text>
        <Text style={st.subtitle}>Track your days with emojis</Text>
      </View>
      <View style={st.actions}>
        <Pressable style={st.primaryBtn} onPress={onSignIn}>
          <Text style={st.primaryTxt}>Sign In</Text>
        </Pressable>
        <Pressable style={st.secondaryBtn} onPress={onSignUp}>
          <Text style={st.secondaryTxt}>Create Account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 32 },
  hero: { alignItems: "center", marginBottom: 60 },
  logo: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "700", color: theme.fg, marginBottom: 8 },
  subtitle: { fontSize: 16, color: theme.fgMuted },
  actions: { gap: 12 },
  primaryBtn: {
    backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 16, alignItems: "center",
  },
  primaryTxt: { fontSize: 16, fontWeight: "600", color: "#000" },
  secondaryBtn: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingVertical: 16, alignItems: "center",
  },
  secondaryTxt: { fontSize: 16, fontWeight: "600", color: theme.fg },
});
