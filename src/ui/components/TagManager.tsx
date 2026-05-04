import { useState } from "react";
import { View, Text, Pressable, FlatList, Modal, StyleSheet, Alert } from "react-native";
import { useStore } from "../../application/StoreContext";
import { theme } from "../theme/colors";

const EMOJIS = [...new Set([
  "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖",
  "👋","🤚","🖐️","✋","🖖","🫱","🫲","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟",
  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🪸","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔",
  "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠","🫘","🥐","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮","🌯","🫔","🥗","🥘","🫕","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🥛","🍼","🫖","☕","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊",
  "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🏑","🥍","🏏","🥅","⛳","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂","🏋️","🤸","🤼","🤽","🤾","🤺","⛹️","🧘","🏄","🏇","🚴","🚵","🏆","🥇","🥈","🥉","🏅","🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🎻","🎲","♟️","🎯","🎳","🎮","🕹️","🎰",
  "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🛵","🏍️","🚲","🛴","🚨","🚔","🚍","🚘","🚖","✈️","🛫","🛬","🚀","🛸","🚁","🛶","⛵","🚤","🛳️","🚢","🗼","🏰","🏯","🏟️","🎡","🎢","🎠","⛲","🏖️","🏝️","🏜️","🌋","⛰️","🏔️","🗻","🏕️","🏠","🏡","🏗️","🏭","🏢","🏬","🏥","🏦","🏨","🏪","🏫","💒","🏛️","⛪","🕌","🕍","⛩️","🌅","🌄","🌠","🎇","🎆","🌇","🌆","🏙️","🌃","🌌","🌉","🌁",
  "⌚","📱","💻","⌨️","🖥️","📷","📸","📹","🎥","📺","📻","🎙️","⏰","🔋","🔌","💡","🔦","💸","💵","💰","💳","💎","🧰","🔧","🔨","⚙️","🔪","🔮","💊","💉","🧬","🌡️","🧹","🚽","🚿","🛁","🧼","🔑","🚪","🛋️","🛏️","🧸","🛍️","🛒","🎁","🎈","🎀","🎊","🎉","🏮","✉️","📦","📊","📈","📉","📅","📋","📁","📚","📖","🔖","📎","✂️","📝","✏️","🔍","🔒","🔓",
  "✅","❌","❓","❗","💯","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","⭐","🌟","✨","⚡","🔥","💥","☄️","🌈","☀️","⛅","☁️","❄️","☃️","💨","💧","💦","🌊","☔","♻️",
])];

let _id = 0;
function genId() { return `tag-${Date.now()}-${_id++}`; }

export default function TagManager() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);

  const add = (emoji: string) => {
    if (state.tags.some((t) => t.emoji === emoji)) return;
    dispatch({ type: "ADD_TAG", tag: { id: genId(), emoji } });
    setOpen(false);
  };

  const confirmDelete = (id: string, emoji: string) => {
    Alert.alert("Delete " + emoji + "?", "History will be cleared.", [
      { text: "Keep", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => dispatch({ type: "DEL_TAG", id }) },
    ]);
  };

  return (
    <View style={st.wrap}>
      <View style={st.tags}>
        {state.tags.map((t) => (
          <Pressable key={t.id} style={st.pill} onLongPress={() => confirmDelete(t.id, t.emoji)}>
            <Text style={st.pillEmoji}>{t.emoji}</Text>
          </Pressable>
        ))}
        <Pressable style={st.addBtn} onPress={() => setOpen(true)}>
          <Text style={st.addTxt}>+</Text>
        </Pressable>
      </View>

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
  wrap: { marginBottom: 12 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  pill: {
    backgroundColor: theme.surfaceHover,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pillEmoji: { fontSize: 20 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.accentSubtle,
    borderWidth: 1, borderColor: theme.accent,
    alignItems: "center", justifyContent: "center",
  },
  addTxt: { fontSize: 20, color: theme.accent, fontWeight: "700" },
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
