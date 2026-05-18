import { useState, useRef } from "react";
import { View, Text, Pressable, FlatList, Modal, StyleSheet, Platform, Alert } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useStore } from "../../application/StoreContext";
import { theme } from "../theme/colors";

const EMOJIS = [
  // Transport & Riding
  "🚴","🏍️","🚗","🚕","🛵","🚲","🛴","🚌","✈️","🚀","⛵","🚶","🏃",
  // Fitness & Sport
  "🏋️","🧘","🏊","⚽","🏀","🎾","🥊","🏄","🏂","⛷️","🧗","🤸","💪",
  // Nature & Outdoors
  "⛰️","🏕️","🌲","🏖️","🌊","☀️","🌅","🚵","🎣","🏞️",
  // Social & Love
  "❤️","💑","👫","🥂","🍷","🎉","🤝","👨‍👩‍👧","👥","💬",
  // Food & Drink
  "☕","🍳","🥗","🍕","🍔","🍣","🍰","🍺","🧋","🍽️",
  // Work & Study
  "💻","📚","✏️","📝","💼","🎓","📊","🧠","💡","📱",
  // Health & Wellness
  "😴","💊","🧘","🏥","🩺","🧹","🛁","💆","🧖","💤",
  // Hobbies & Fun
  "🎮","🎬","🎨","🎸","📷","🎤","🎧","📖","🪴","🐕",
  // Mood & Milestones
  "🔥","⭐","🏆","✅","🎯","💎","🌟","🚀","💪","🙏",
];

let _id = 0;
function genId() { return `tag-${Date.now()}-${_id++}`; }

function TagRow({ tag, onDelete }: { tag: { id: string; emoji: string }; onDelete: () => void }) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRight = () => (
    <Pressable style={st.deleteBtn} onPress={() => {
      swipeRef.current?.close();
      if (Platform.OS === "web") {
        if (confirm("Delete " + tag.emoji + "? History will be cleared.")) onDelete();
      } else {
        Alert.alert("Delete " + tag.emoji + "?", "History will be cleared.", [
          { text: "Keep", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: onDelete },
        ]);
      }
    }}>
      <Text style={st.deleteTxt}>Delete</Text>
    </Pressable>
  );

  return (
    <View style={{ marginBottom: 8 }}>
    <Swipeable ref={swipeRef} renderRightActions={renderRight} overshootRight={false}>
      <View style={st.tagRow}>
        <Text style={st.tagEmoji}>{tag.emoji}</Text>
        <Text style={st.tagLabel}>Swipe to remove</Text>
      </View>
    </Swipeable>
    </View>
  );
}

export default function TagManager() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);

  const add = (emoji: string) => {
    if (state.tags.some((t) => t.emoji === emoji)) return;
    dispatch({ type: "ADD_TAG", tag: { id: genId(), emoji } });
    setOpen(false);
  };

  return (
    <View style={st.wrap}>
      <View style={st.header}>
        <Text style={st.title}>Your Emojis</Text>
        <Pressable style={st.addBtn} onPress={() => setOpen(true)}>
          <Text style={st.addTxt}>+</Text>
        </Pressable>
      </View>

      {state.tags.length === 0 && (
        <Text style={st.empty}>Tap + to add your first emoji</Text>
      )}

      {state.tags.map((t) => (
        <TagRow key={t.id} tag={t} onDelete={() => dispatch({ type: "DEL_TAG", id: t.id })} />
      ))}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={st.modalBg}>
          <View style={st.picker}>
            <View style={st.pickerHeader}>
              <Text style={st.pickerTitle}>Pick Emoji</Text>
              <Pressable onPress={() => setOpen(false)}><Text style={st.closeTxt}>✕</Text></Pressable>
            </View>
            <FlatList
              data={EMOJIS}
              numColumns={8}
              keyExtractor={(e) => e}
              renderItem={({ item }) => {
                const used = state.tags.some((t) => t.emoji === item);
                return (
                  <Pressable style={[st.emojiCell, used && st.emojiUsed]} onPress={() => !used && add(item)} disabled={used}>
                    <Text style={st.emojiTxt}>{item}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: "600", color: theme.fg, letterSpacing: -0.3 },
  empty: { color: theme.fgMuted, fontSize: 14, textAlign: "center", paddingVertical: 40, letterSpacing: 0.2 },
  tagRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 16, paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
  },
  tagEmoji: { fontSize: 24, marginRight: 14 },
  tagLabel: { fontSize: 13, color: theme.fgMuted, letterSpacing: 0.3 },
  deleteBtn: {
    backgroundColor: "#ff3b30",
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 20,
    borderRadius: 12,
    marginLeft: 8,
  },
  deleteTxt: { color: "#fff", fontSize: 14, fontWeight: "600" },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  addTxt: { fontSize: 18, color: "#fff", fontWeight: "400", marginTop: -1 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  picker: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    maxHeight: "70%", padding: 16,
    borderWidth: 1, borderColor: theme.border,
  },
  pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  pickerTitle: { color: theme.fg, fontSize: 16, fontWeight: "600" },
  closeTxt: { color: theme.fgMuted, fontSize: 18 },
  emojiCell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", maxWidth: "12.5%" },
  emojiUsed: { opacity: 0.2 },
  emojiTxt: { fontSize: 24 },
});
