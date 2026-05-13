import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
      {/* Spotify-style hero gradient */}
      <LinearGradient
        colors={["rgba(251,191,36,0.6)", "rgba(251,191,36,0.2)", theme.bg, theme.bg]}
        locations={[0, 0.35, 0.6, 1]}
        style={st.heroGradient}
      />

      <ScrollView style={st.scroll} contentContainerStyle={st.content}>
        {/* Back button */}
        <Pressable onPress={onClose} style={st.backBtn}>
          <Text style={st.backTxt}>‹</Text>
        </Pressable>

        {/* Avatar hero section */}
        <View style={st.hero}>
          <View style={st.avatar}>
            <Text style={st.avatarTxt}>{nickname ? nickname[0].toUpperCase() : "?"}</Text>
          </View>
          <Text style={st.name}>{nickname || "User"}</Text>
          <Text style={st.meta}>{user?.email}</Text>
        </View>

        {/* Content section */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Edit Profile</Text>

          <Text style={st.label}>Nickname</Text>
          <View style={st.inputRow}>
            <Text style={st.at}>@</Text>
            <TextInput style={st.input} value={nickname} onChangeText={setNickname}
              placeholder="nickname" placeholderTextColor={theme.fgSubtle} autoCapitalize="none" />
          </View>

          <View style={st.actions}>
            <Pressable style={st.saveBtn} onPress={handleSave}>
              <Text style={st.saveTxt}>{saved ? "✓ Saved" : "Save"}</Text>
            </Pressable>
          </View>
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
  heroGradient: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 320,
  },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
    marginLeft: 16, marginTop: 12,
  },
  backTxt: { fontSize: 20, color: "#fff", marginTop: -2 },
  hero: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 32,
  },
  avatar: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: theme.accent,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  avatarTxt: { fontSize: 56, fontWeight: "800", color: "#000" },
  name: { fontSize: 28, fontWeight: "800", color: theme.fg, letterSpacing: -0.5 },
  meta: { fontSize: 14, color: theme.fgMuted, marginTop: 4 },
  section: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: "700", color: theme.fg,
    marginBottom: 20,
  },
  label: { fontSize: 12, fontWeight: "600", color: theme.fgMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 8,
    paddingHorizontal: 14, marginBottom: 20,
  },
  at: { fontSize: 16, color: theme.fgMuted, marginRight: 4 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: theme.fg },
  actions: { flexDirection: "row" },
  saveBtn: {
    backgroundColor: theme.accent, borderRadius: 24,
    paddingVertical: 14, paddingHorizontal: 40,
    alignItems: "center",
  },
  saveTxt: { fontSize: 15, fontWeight: "700", color: "#000" },
  signOutBtn: {
    marginTop: 40, marginHorizontal: 24,
    paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: theme.fgMuted, borderRadius: 24,
  },
  signOutTxt: { fontSize: 14, color: theme.fg, fontWeight: "600", letterSpacing: 0.3 },
});
