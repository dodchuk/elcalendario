import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { theme } from "../theme/colors";

type Props = { onBack: () => void };

export default function FindAccountScreen({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => { if (email) setSent(true); };

  return (
    <View style={st.container}>
      <Pressable onPress={onBack}><Text style={st.back}>← Back</Text></Pressable>
      <Text style={st.title}>Reset Your Password</Text>
      <Text style={st.desc}>Enter an email address or phone number you may have used and we will try and find it.</Text>

      {sent ? (
        <View style={st.sentBox}>
          <Text style={st.sentTxt}>✓ Reset link sent to {email}</Text>
        </View>
      ) : (
        <>
          <TextInput style={st.input} placeholder="Email or phone number" placeholderTextColor={theme.fgMuted}
            value={email} onChangeText={setEmail} autoCapitalize="none" />
          <Pressable style={st.submitBtn} onPress={handleSubmit}>
            <Text style={st.submitTxt}>Find Account</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, padding: 32, justifyContent: "center" },
  back: { color: theme.fgMuted, fontSize: 16, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: theme.fg, marginBottom: 12 },
  desc: { fontSize: 14, color: theme.fgMuted, marginBottom: 24, lineHeight: 20 },
  input: {
    borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: theme.fg, fontSize: 15, marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  submitTxt: { fontSize: 16, fontWeight: "600", color: "#000" },
  sentBox: { backgroundColor: "rgba(34,197,94,0.1)", borderRadius: 12, padding: 16 },
  sentTxt: { color: "#22c55e", fontSize: 14, fontWeight: "500" },
});
