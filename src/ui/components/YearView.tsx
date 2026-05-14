import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../../application/StoreContext";
import { theme } from "../theme/colors";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function daysIn(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function startOff(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function pad(n: number) { return n.toString().padStart(2, "0"); }

type Props = { onSelectMonth: (year: number, month: number) => void };

function MiniMonth({ year, month, onPress }: { year: number; month: number; onPress: () => void }) {
  const { state } = useStore();
  const total = daysIn(year, month);
  const offset = startOff(year, month);
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <Pressable style={st.monthBlock} onPress={onPress}>
      <Text style={[st.monthLabel, isCurrentMonth && st.monthLabelCurrent]}>{MONTHS[month]}</Text>
      <View style={st.miniGrid}>
        {Array.from({ length: offset }, (_, i) => <View key={`e${i}`} style={st.miniEmpty} />)}
        {Array.from({ length: total }, (_, i) => {
          const d = i + 1;
          const ds = `${year}-${pad(month + 1)}-${pad(d)}`;
          const hasEntry = (state.entries[ds] ?? []).length > 0;
          const isToday = isCurrentMonth && d === today.getDate();
          return (
            <View key={d} style={[st.miniDay, isToday && st.miniToday, hasEntry && st.miniHasEntry]}>
              <Text style={[st.miniDayTxt, isToday && st.miniTodayTxt]}>{d}</Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

export default function YearView({ onSelectMonth }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const now = new Date();

  return (
    <View style={st.container}>
      <View style={st.header}>
        <Pressable onPress={() => setYear(y => y - 1)} style={st.navBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.fgMuted} />
        </Pressable>
        <Text style={st.yearTitle}>{year}</Text>
        <Pressable
          onPress={() => setYear(y => y + 1)}
          style={[st.navBtn, year >= now.getFullYear() && st.navDisabled]}
          disabled={year >= now.getFullYear()}
        >
          <Ionicons name="chevron-forward" size={20} color={year >= now.getFullYear() ? theme.fgSubtle : theme.fgMuted} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={st.grid}>
        {Array.from({ length: 12 }, (_, m) => (
          <MiniMonth key={m} year={year} month={m} onPress={() => onSelectMonth(year, m)} />
        ))}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  yearTitle: { fontSize: 22, fontWeight: "800", color: theme.fg, letterSpacing: -0.5 },
  navBtn: { padding: 8 },
  navDisabled: { opacity: 0.3 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 8,
  },
  monthBlock: {
    width: "31%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 10,
  },
  monthLabel: { fontSize: 13, fontWeight: "700", color: theme.fgMuted, marginBottom: 6 },
  monthLabelCurrent: { color: "#ff3b30" },
  miniGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  miniEmpty: { width: "14.28%", aspectRatio: 1 },
  miniDay: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  miniToday: {
    backgroundColor: "#ff3b30",
    borderRadius: 10,
  },
  miniHasEntry: {
    backgroundColor: "rgba(255,100,0,0.2)",
    borderRadius: 10,
  },
  miniDayTxt: { fontSize: 7, color: theme.fgMuted },
  miniTodayTxt: { color: "#fff", fontWeight: "700" },
});
