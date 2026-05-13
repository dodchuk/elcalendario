import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../application/AuthContext";
import { theme } from "../theme/colors";

type Props = { onClose: () => void };

function ChangePasswordScreen({ onBack }: { onBack: () => void }) {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"" | "success" | "error">("");

  const handleChange = () => {
    if (!current || !newPw) return;
    if (newPw !== confirm) { setStatus("error"); return; }
    setStatus("success");
    setTimeout(() => { setStatus(""); onBack(); }, 1500);
  };

  return (
    <View style={st.container}>
      <View style={st.pwHeader}>
        <Pressable onPress={onBack} style={st.backBtn}><Text style={st.backTxt}>‹</Text></Pressable>
        <Text style={st.pwTitle}>Change Password</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={st.section}>
        <Text style={st.label}>Current Password</Text>
        <TextInput style={st.pwInput} value={current} onChangeText={setCurrent}
          secureTextEntry placeholder="••••••••" placeholderTextColor={theme.fgSubtle} />

        <Text style={st.label}>New Password</Text>
        <TextInput style={st.pwInput} value={newPw} onChangeText={setNewPw}
          secureTextEntry placeholder="••••••••" placeholderTextColor={theme.fgSubtle} />

        <Text style={st.label}>Confirm New Password</Text>
        <TextInput style={[st.pwInput, status === "error" && st.pwInputError]} value={confirm} onChangeText={setConfirm}
          secureTextEntry placeholder="••••••••" placeholderTextColor={theme.fgSubtle} />

        {status === "error" && <Text style={st.errorTxt}>Passwords don't match</Text>}

        <Pressable style={st.saveBtn} onPress={handleChange}>
          <Text style={st.saveTxt}>{status === "success" ? "✓ Changed" : "Update Password"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ProfileScreen({ onClose }: Props) {
  const { user, signOut } = useAuth();
  const [nickname, setNickname] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [showPwChange, setShowPwChange] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  if (showPwChange) return <ChangePasswordScreen onBack={() => setShowPwChange(false)} />;

  return (
    <View style={st.container}>
      <LinearGradient
        colors={["rgba(251,191,36,0.6)", "rgba(251,191,36,0.2)", theme.bg, theme.bg]}
        locations={[0, 0.35, 0.6, 1]}
        style={st.heroGradient}
      />

      <ScrollView style={st.scroll} contentContainerStyle={st.content}>
        <Pressable onPress={onClose} style={st.backBtn}><Text style={st.backTxt}>‹</Text></Pressable>

        <View style={st.hero}>
          <View style={st.avatar}>
            <Text style={st.avatarTxt}>{nickname ? nickname[0].toUpperCase() : "?"}</Text>
          </View>
          <Text style={st.name}>{nickname || "User"}</Text>
          <Text style={st.meta}>{user?.email}</Text>
        </View>

        <View style={st.section}>
          <Text style={st.sectionTitle}>Edit Profile</Text>
          <Text style={st.label}>Nickname</Text>
          <View style={st.inputRow}>
            <Text style={st.at}>@</Text>
            <TextInput style={st.input} value={nickname} onChangeText={setNickname}
              placeholder="nickname" placeholderTextColor={theme.fgSubtle} autoCapitalize="none" />
          </View>
          <Pressable style={st.saveBtn} onPress={handleSave}>
            <Text style={st.saveTxt}>{saved ? "✓ Saved" : "Save"}</Text>
          </Pressable>
        </View>

        <View style={st.section}>
          <Text style={st.sectionTitle}>Security</Text>
          <Pressable style={st.linkBtn} onPress={() => setShowPwChange(true)}>
            <Text style={st.linkTxt}>Change Password</Text>
            <Text style={st.linkArrow}>›</Text>
          </Pressable>
        </View>

        <Pressable style={st.signOutBtn} onPress={signOut}>
          <Text style={st.signOutTxt}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  heroGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 320 },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
    marginLeft: 16, marginTop: 12,
  },
  backTxt: { fontSize: 20, color: "#fff", marginTop: -2 },
  pwHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24,
  },
  pwTitle: { fontSize: 18, fontWeight: "700", color: theme.fg },
  hero: { alignItems: "center", paddingTop: 20, paddingBottom: 32 },
  avatar: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: theme.accent,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24,
  },
  avatarTxt: { fontSize: 56, fontWeight: "800", color: "#000" },
  name: { fontSize: 28, fontWeight: "800", color: theme.fg, letterSpacing: -0.5 },
  meta: { fontSize: 14, color: theme.fgMuted, marginTop: 4 },
  section: { paddingHorizontal: 24, paddingTop: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.fg, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "600", color: theme.fgMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 8,
    paddingHorizontal: 14, marginBottom: 20,
  },
  at: { fontSize: 16, color: theme.fgMuted, marginRight: 4 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: theme.fg },
  pwInput: {
    backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 16,
    color: theme.fg, marginBottom: 16,
  },
  pwInputError: { borderWidth: 1, borderColor: theme.danger },
  errorTxt: { fontSize: 12, color: theme.danger, marginBottom: 16 },
  saveBtn: {
    backgroundColor: theme.accent, borderRadius: 24,
    paddingVertical: 14, paddingHorizontal: 40, alignItems: "center",
  },
  saveTxt: { fontSize: 15, fontWeight: "700", color: "#000" },
  linkBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  linkTxt: { fontSize: 15, color: theme.fg, fontWeight: "500" },
  linkArrow: { fontSize: 18, color: theme.fgMuted },
  signOutBtn: {
    marginTop: 24, marginHorizontal: 24,
    paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: theme.fgMuted, borderRadius: 24,
  },
  signOutTxt: { fontSize: 14, color: theme.fg, fontWeight: "600", letterSpacing: 0.3 },
});
