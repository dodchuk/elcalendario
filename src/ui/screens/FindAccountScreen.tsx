import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/colors";

type Props = { onBack: () => void };

export default function FindAccountScreen({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => { if (email) setSent(true); };

  return (
    <LinearGradient colors={["#0a0a0a", "#1a1a1a", "#0a0a0a"]} style={st.container}>
      <Pressable onPress={onBack} style={st.backBtn}>
        <Ionicons name="chevron-back" size={14} color={theme.fg} />
      </Pressable>

      <View style={st.logoWrap}>
        <View style={st.logoSkeleton} />
      </View>

      <Text style={st.title}>Forgot Password?</Text>
      <Text style={st.desc}>Enter your email and we'll send you a reset link.</Text>

      {sent ? (
        <View style={st.sentBox}>
          <Text style={st.sentTxt}>✓ Reset link sent to {email}</Text>
        </View>
      ) : (
        <>
          <TextInput style={st.input} placeholder="Email" placeholderTextColor={theme.fgMuted}
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Pressable style={st.submitBtn} onPress={handleSubmit}>
            <Text style={st.submitTxt}>Send Reset Link</Text>
          </Pressable>
        </>
      )}
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, padding: 32, paddingTop: 152 },
  backBtn: {
    position: "absolute", top: 60, left: 32,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  logoWrap: { alignItems: "center", marginBottom: 32 },
  logoSkeleton: { width: 60, height: 60, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)" },
  title: { fontSize: 24, fontWeight: "700", color: theme.fg, marginBottom: 12 },
  desc: { fontSize: 14, color: theme.fgMuted, marginBottom: 24, lineHeight: 20 },
  input: {
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: theme.fg, fontSize: 15, marginBottom: 12, backgroundColor: "rgba(255,255,255,0.05)",
  },
  submitBtn: {
    backgroundColor: "#0a84ff", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  submitTxt: { fontSize: 16, fontWeight: "600", color: "#fff" },
  sentBox: { backgroundColor: "rgba(34,197,94,0.1)", borderRadius: 12, padding: 16 },
  sentTxt: { color: "#22c55e", fontSize: 14, fontWeight: "500" },
});
