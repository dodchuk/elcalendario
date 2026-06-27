import { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../application/AuthContext";
import { useSettings } from "../../application/SettingsContext";
import { theme } from "../theme/colors";

type Props = { onClose: () => void };

function ResetPasswordScreen({ onBack }: { onBack: () => void }) {
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"" | "success" | "error">("");

  const handleReset = () => {
    if (!newPw) return;
    if (newPw !== confirm) { setStatus("error"); return; }
    setStatus("success");
    setTimeout(() => { setStatus(""); onBack(); }, 1500);
  };

  return (
    <LinearGradient colors={["#0a0a0a", "#1a1a1a", "#0a0a0a"]} style={st.container}>
      <View style={st.pwHeader}>
        <Pressable onPress={onBack} style={[st.backBtn, { position: "absolute", left: 16 }]}><Ionicons name="chevron-back" size={14} color={theme.fg} /></Pressable>
        <Text style={st.pwTitle}>Reset Password</Text>
      </View>

      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)" }} />
      </View>

      <View style={st.section}>
        <Text style={[st.label, { fontSize: 13, textTransform: "none", marginBottom: 20 }]}>
          Enter your new password below.
        </Text>

        <Text style={st.label}>New Password</Text>
        <TextInput style={st.pwInput} value={newPw} onChangeText={setNewPw}
          secureTextEntry placeholder="••••••••" placeholderTextColor={theme.fgSubtle} />

        <Text style={st.label}>Confirm Password</Text>
        <TextInput style={[st.pwInput, status === "error" && st.pwInputError]} value={confirm} onChangeText={setConfirm}
          secureTextEntry placeholder="••••••••" placeholderTextColor={theme.fgSubtle} />

        {status === "error" && <Text style={st.errorTxt}>Passwords don't match</Text>}

        <Pressable style={st.saveBtn} onPress={handleReset}>
          <Text style={st.saveTxt}>{status === "success" ? "✓ Password Reset" : "Reset Password"}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

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
    <LinearGradient colors={["#0a0a0a", "#1a1a1a", "#0a0a0a"]} style={st.container}>
      <View style={st.pwHeader}>
        <Pressable onPress={onBack} style={[st.backBtn, { position: "absolute", left: 16 }]}><Ionicons name="chevron-back" size={14} color={theme.fg} /></Pressable>
        <Text style={st.pwTitle}>Change Password</Text>
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
    </LinearGradient>
  );
}

export default function ProfileScreen({ onClose }: Props) {
  const { user, signOut, setNickname: saveNick } = useAuth();
  const { settings, setFirstDay } = useSettings();
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.nickname) setNickname(user.nickname);
  }, []);
  const [showPwChange, setShowPwChange] = useState(false);
  const [showPwReset, setShowPwReset] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleNicknameChange = useCallback((v: string) => {
    setNickname(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveNick(v);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 600);
  }, []);



  if (showPwReset) return <ResetPasswordScreen onBack={() => setShowPwReset(false)} />;
  if (showPwChange) return <ChangePasswordScreen onBack={() => setShowPwChange(false)} />;

  return (
    <LinearGradient colors={["#0a0a0a", "#1a1a1a", "#0a0a0a"]} style={st.container}>
      <ScrollView style={st.scroll} contentContainerStyle={st.content}>
        <View style={st.pwHeader}>
          <Pressable onPress={onClose} style={[st.backBtn, { position: "absolute", left: 16 }]}><Ionicons name="chevron-back" size={14} color={theme.fg} /></Pressable>
          <Text style={st.pwTitle}>Profile</Text>
        </View>

        <View style={st.hero}>
          <View style={st.avatar}>
            <Text style={st.avatarTxt}>{nickname ? nickname[0].toUpperCase() : "?"}</Text>
          </View>
          <Text style={st.name}>{nickname || "User"}</Text>
          <Text style={st.meta}>{user?.deviceId?.slice(0, 8)}</Text>
        </View>

        <View style={st.section}>
          <Text style={st.sectionTitle}>Edit Profile</Text>
          <Text style={st.label}>Nickname</Text>
          <View style={st.inputRow}>
            <Text style={st.at}>@</Text>
            <TextInput style={st.input} value={nickname} onChangeText={handleNicknameChange}
              placeholder="nickname" placeholderTextColor={theme.fgSubtle} autoCapitalize="none" />
            {saved && <Text style={{ fontSize: 12, color: "#22c55e" }}>✓</Text>}
          </View>
        </View>

        <View style={st.section}>
          <Text style={st.sectionTitle}>Preferences</Text>
          <Text style={st.label}>First day of week</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => (
              <Pressable key={d} style={[st.dayBtn, settings.firstDay === i && st.dayBtnActive]} onPress={() => setFirstDay(i)}>
                <Text style={[st.dayBtnTxt, settings.firstDay === i && st.dayBtnTxtActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={st.section}>
          <Text style={st.sectionTitle}>Subscription</Text>
          <View style={st.linkBtn}>
            <View>
              <Text style={st.linkTxt}>Free Plan</Text>
              <Text style={{ fontSize: 12, color: theme.fgMuted, marginTop: 2 }}>Upgrade to unlock all features</Text>
            </View>
            <View style={{ backgroundColor: "#0a84ff", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>PRO</Text>
            </View>
          </View>
        </View>

        <View style={st.section}>
          <Text style={st.sectionTitle}>Account authorization</Text>
          <Text style={{ fontSize: 13, color: theme.fgMuted, marginBottom: 12 }}>Connect to log in with your Google account</Text>
          <View style={st.linkBtn}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 20 }}>G</Text>
              <View>
                <Text style={st.linkTxt}>Google</Text>
                <Text style={{ fontSize: 12, color: theme.fgMuted }}>{user?.deviceId?.slice(0, 8)}</Text>
              </View>
            </View>
            <Pressable style={{ backgroundColor: "rgba(255,59,48,0.1)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#ff3b30" }}>Disconnect</Text>
            </Pressable>
          </View>
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
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  heroGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 320 },
  scroll: { flex: 1 },
  content: { paddingBottom: 100 },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  backTxt: { fontSize: 20, color: "#fff", marginTop: -2 },
  pwHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24,
    position: "relative",
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  pwTitle: { fontSize: 18, fontWeight: "700", color: theme.fg },
  hero: { alignItems: "center", paddingTop: 12, paddingBottom: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: theme.accent,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarTxt: { fontSize: 28, fontWeight: "800", color: "#000" },
  name: { fontSize: 20, fontWeight: "700", color: theme.fg },
  meta: { fontSize: 13, color: theme.fgMuted, marginTop: 2 },
  section: { paddingHorizontal: 24, paddingVertical: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.08)" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.fg, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", color: theme.fgMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14, marginBottom: 0,
  },
  at: { fontSize: 16, color: theme.fgMuted, marginRight: 4 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: theme.fg, outlineStyle: "none" } as any,
  pwInput: {
    backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 16,
    color: theme.fg, marginBottom: 16,
  },
  pwInputError: { borderWidth: 1, borderColor: theme.danger },
  errorTxt: { fontSize: 12, color: theme.danger, marginBottom: 16 },
  saveBtn: {
    backgroundColor: "#0a84ff", borderRadius: 12,
    paddingVertical: 16, alignItems: "center",
  },
  saveTxt: { fontSize: 16, fontWeight: "600", color: "#fff" },
  dayBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  dayBtnActive: { backgroundColor: "#0a84ff", borderColor: "#0a84ff" },
  dayBtnTxt: { fontSize: 13, color: theme.fgMuted, fontWeight: "500" },
  dayBtnTxtActive: { color: "#fff" },
  linkBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  linkTxt: { fontSize: 15, color: theme.fg, fontWeight: "500" },
  linkArrow: { fontSize: 18, color: theme.fgMuted },
  signOutBtn: {
    marginTop: 24, marginHorizontal: 24,
    paddingVertical: 14, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12,
  },
  signOutTxt: { fontSize: 16, color: theme.fg, fontWeight: "600" },
});
