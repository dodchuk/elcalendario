import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../../application/AuthContext";
import { theme } from "../theme/colors";

type Props = { onClose: () => void };

export default function ProfileScreen({ onClose }: Props) {
  const { user, signOut } = useAuth();
  const [nickname, setNickname] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  return (
    <View style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Profile</Text>
        <Pressable onPress={onClose}><Text style={st.close}>✕</Text></Pressable>
      </View>

      <View style={st.avatarWrap}>
        <View style={st.avatar}>
          <Text style={st.avatarTxt}>{nickname ? nickname[0].toUpperCase() : "?"}</Text>
        </View>
        <Text style={st.email}>{user?.email}</Text>
      </View>

      <Text style={st.label}>Nickname</Text>
      <View style={st.inputRow}>
        <Text style={st.at}>@</Text>
        <TextInput style={st.input} value={nickname} onChangeText={setNickname}
          placeholder="nickname" placeholderTextColor={theme.fgMuted} autoCapitalize="none" />
      </View>

      <View style={st.actions}>
        <Pressable style={st.cancelBtn} onPress={onClose}>
          <Text style={st.cancelTxt}>Cancel</Text>
        </Pressable>
        <Pressable style={st.saveBtn} onPress={handleSave}>
          <Text style={st.saveTxt}>{saved ? "✓ Saved" : "Save"}</Text>
        </Pressable>
      </View>

      <Pressable style={st.signOutBtn} onPress={signOut}>
        <Text style={st.signOutTxt}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  title: { fontSize: 20, fontWeight: "700", color: theme.fg },
  close: { fontSize: 18, color: theme.fgMuted },
  avatarWrap: { alignItems: "center", marginBottom: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: theme.accent,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarTxt: { fontSize: 32, fontWeight: "700", color: "#000" },
  email: { fontSize: 14, color: theme.fgMuted },
  label: { fontSize: 13, fontWeight: "600", color: theme.fgMuted, marginBottom: 8 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: theme.border, borderRadius: 12,
    paddingHorizontal: 14, marginBottom: 24,
  },
  at: { fontSize: 16, color: theme.fgMuted, marginRight: 4 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: theme.fg },
  actions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  cancelTxt: { fontSize: 15, fontWeight: "600", color: theme.fg },
  saveBtn: { flex: 1, backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  saveTxt: { fontSize: 15, fontWeight: "600", color: "#000" },
  signOutBtn: { marginTop: 40, alignItems: "center", paddingVertical: 14 },
  signOutTxt: { fontSize: 15, color: theme.danger, fontWeight: "500" },
});
