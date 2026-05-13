import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../../application/AuthContext";
import { theme } from "../theme/colors";

type Props = { onBack: () => void; onFindAccount: () => void };

export default function SignInScreen({ onBack, onFindAccount }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogle = () => signIn("user@gmail.com");
  const handleSubmit = () => { if (email) signIn(email); };

  return (
    <View style={st.container}>
      <Pressable onPress={onBack}><Text style={st.back}>← Back</Text></Pressable>
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
        <Text style={st.link}>Forgot password? Find your account</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, padding: 32, justifyContent: "center" },
  back: { color: theme.fgMuted, fontSize: 16, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: theme.fg, marginBottom: 32 },
  googleBtn: {
    backgroundColor: "#fff", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 20,
  },
  googleTxt: { fontSize: 15, fontWeight: "600", color: "#000" },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: theme.border },
  or: { color: theme.fgMuted, paddingHorizontal: 12, fontSize: 13 },
  input: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: theme.fg, fontSize: 15, marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8, marginBottom: 16,
  },
  submitTxt: { fontSize: 16, fontWeight: "600", color: "#000" },
  link: { color: theme.accent, fontSize: 14, textAlign: "center" },
});
