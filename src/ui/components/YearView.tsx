import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ChevronIcon from "./ChevronIcon";
import { useStore } from "../../application/StoreContext";
import { useSettings } from "../../application/SettingsContext";
import { theme } from "../theme/colors";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function daysIn(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function startOff(y: number, m: number, firstDay: number) { return (new Date(y, m, 1).getDay() - firstDay + 7) % 7; }
function pad(n: number) { return n.toString().padStart(2, "0"); }

type Props = { onSelectMonth: (year: number, month: number) => void; initialYear?: number; onYearChange?: (year: number) => void };

function MiniMonth({ year, month, onPress }: { year: number; month: number; onPress?: () => void }) {
  const { state } = useStore();
  const { settings } = useSettings();
  const total = daysIn(year, month);
  const offset = startOff(year, month, settings.firstDay);
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <Pressable style={[st.monthBlock, !onPress && { opacity: 0.3 }]} onPress={onPress} disabled={!onPress}>
      <Text style={[st.monthLabel, isCurrentMonth && st.monthLabelCurrent]}>{MONTHS[month]}</Text>
      <View style={st.miniGrid}>
        {Array.from({ length: offset }, (_, i) => <View key={`e${i}`} style={st.miniEmpty} />)}
        {Array.from({ length: total }, (_, i) => {
          const d = i + 1;
          const ds = `${year}-${pad(month + 1)}-${pad(d)}`;
          const hasEntry = (state.entries[ds] ?? []).length > 0;
          const isToday = isCurrentMonth && d === today.getDate();
          return (
            <View key={d} style={[st.miniDay, hasEntry && st.miniHasEntry, isToday && st.miniToday]}>
              <Text style={[st.miniDayTxt, isToday && st.miniTodayTxt]}>{d}</Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

export default function YearView({ onSelectMonth, initialYear, onYearChange }: Props) {
  const [year, setYearLocal] = useState(initialYear ?? new Date().getFullYear());
  const setYear = (fn: (y: number) => number) => {
    setYearLocal(prev => {
      const next = fn(prev);
      onYearChange?.(next);
      return next;
    });
  };
  const now = new Date();

  return (
    <View style={st.container}>
      <View style={st.header}>
        <Pressable onPress={() => setYear(y => y - 1)} style={[st.navBtn, { zIndex: 10 }]}>
          <ChevronIcon direction="left" />
          <Text style={[st.yearTitle, year - 1 === now.getFullYear() && { color: theme.danger }]}>{year - 1}</Text>
        </Pressable>
        <View style={{ position: "absolute", left: 0, right: 0, alignItems: "center" }} pointerEvents="none">
          <View style={[st.yearBadge, year === now.getFullYear() && st.yearBadgeCurrent]}>
            <Text style={[st.headerCenter, year === now.getFullYear() && { color: theme.danger }]}>{year}</Text>
          </View>
        </View>
        <Pressable
          onPress={() => setYear(y => y + 1)}
          style={[st.navBtn, year >= now.getFullYear() && st.navDisabled]}
          disabled={year >= now.getFullYear()}
        >
          <Text style={[st.yearTitle, year + 1 === now.getFullYear() && { color: theme.danger }]}>{year + 1}</Text>
          <ChevronIcon direction="right" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={st.grid}>
        {Array.from({ length: 12 }, (_, m) => (
          <MiniMonth key={m} year={year} month={m} onPress={year > now.getFullYear() || (year === now.getFullYear() && m > now.getMonth()) ? undefined : () => onSelectMonth(year, m)} />
        ))}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", paddingRight: 1 },
  yearTitle: { fontSize: 16, fontWeight: "600", color: theme.fg },
  yearBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: theme.accent },
  yearBadgeCurrent: { borderColor: theme.danger },
  headerCenter: { fontSize: 14, fontWeight: "600", color: theme.accent },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  navDisabled: { opacity: 0.3 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    paddingBottom: 60,
    gap: 8,
  },
  monthBlock: {
    width: "31%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 10,
  },
  monthLabel: { fontSize: 13, fontWeight: "700", color: theme.fgMuted, marginBottom: 6 },
  monthLabelCurrent: { color: theme.danger },
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
    backgroundColor: theme.danger,
    borderRadius: 10,
  },
  miniHasEntry: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
  },
  miniDayTxt: { fontSize: 7, color: theme.fgMuted },
  miniTodayTxt: { color: "#fff", fontWeight: "700" },
});
