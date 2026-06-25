import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../application/AuthContext";
import { theme } from "../theme/colors";

type Props = { onBack: () => void; onFindAccount: () => void };

export default function SignInScreen({ onBack, onFindAccount }: Props) {
  const { setNickname } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogle = () => setNickname("User");
  const handleSubmit = () => { if (email) setNickname(email.split("@")[0]); };

  return (
    <LinearGradient colors={["#0a0a0a", "#1a1a1a", "#0a0a0a"]} style={st.container}>
      <View style={st.logoWrap}>
        <View style={st.logoSkeleton} />
      </View>
      <Text style={st.title}>Sign In</Text>

      <Pressable style={st.googleBtn} onPress={handleGoogle}>
        <Text style={st.googleTxt}>Continue with Google</Text>
      </Pressable>

      <View style={st.divider}><View style={st.line} /><Text style={st.or}>or</Text><View style={st.line} /></View>

      <TextInput style={st.input} placeholder="Email" placeholderTextColor={theme.fgMuted}
        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={st.input} placeholder="Password" placeholderTextColor={theme.fgMuted}
        value={password} onChangeText={setPassword} secureTextEntry />

      <Pressable style={st.submitBtn} onPress={handleSubmit}>
        <Text style={st.submitTxt}>Sign In</Text>
      </Pressable>

      <Pressable onPress={onFindAccount}>
        <Text style={st.link}>Forgot password?</Text>
      </Pressable>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, padding: 32, paddingTop: 152, backgroundColor: "#000" },
  logoWrap: { alignItems: "center", marginBottom: 32 },
  logoSkeleton: { width: 60, height: 60, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)" },
  title: { fontSize: 24, fontWeight: "700", color: theme.fg, marginBottom: 32 },
  googleBtn: {
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 20,
  },
  googleTxt: { fontSize: 15, fontWeight: "600", color: theme.fg },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: theme.border },
  or: { color: theme.fgMuted, paddingHorizontal: 12, fontSize: 13 },
  input: {
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: theme.fg, fontSize: 15, marginBottom: 12, backgroundColor: "rgba(255,255,255,0.05)",
  },
  submitBtn: {
    backgroundColor: "#0a84ff", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8, marginBottom: 16,
  },
  submitTxt: { fontSize: 16, fontWeight: "600", color: "#fff" },
  link: { color: theme.fgMuted, fontSize: 12, textAlign: "center" },
});
