import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../../application/StoreContext";
import { getEmojiGlowColor } from "../theme/tagColors";
import { theme } from "../theme/colors";

const pad = (n: number) => n.toString().padStart(2, "0");
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function dateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Dashboard() {
  const { state } = useStore();
  const tagMap = useMemo(() => Object.fromEntries(state.tags.map(t => [t.id, t])), [state.tags]);
  const today = todayStr();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState<"year" | "month">("year");
  const [month, setMonth] = useState(now.getMonth());

  // HUD: today's count
  const todayCount = (state.entries[today] ?? []).length;

  // HUD: current streak
  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = dateStr(d);
      if ((state.entries[ds] ?? []).length > 0) count++;
      else if (i > 0) break;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [state.entries]);

  // HUD: consistency this month
  const consistency = useMemo(() => {
    const prefix = `${now.getFullYear()}-${pad(now.getMonth()+1)}`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    const daysSoFar = now.getDate();
    let tracked = 0;
    for (let d = 1; d <= daysSoFar; d++) {
      const ds = `${prefix}-${pad(d)}`;
      if ((state.entries[ds] ?? []).length > 0) tracked++;
    }
    return { tracked, total: daysSoFar, daysInMonth };
  }, [state.entries]);

  const maxHeat = useMemo(() => {
    let max = 1;
    for (const ids of Object.values(state.entries)) {
      if (ids.length > max) max = ids.length;
    }
    return max;
  }, [state.entries]);

  // Top 5 most used this year
  const top5 = useMemo(() => {
    const prefix = viewMode === "month" ? `${year}-${pad(month + 1)}` : `${year}-`;
    const counts: Record<string, number> = {};
    for (const [date, ids] of Object.entries(state.entries)) {
      if (!date.startsWith(prefix)) continue;
      for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, emoji: tagMap[id]?.emoji ?? "?", count }));
  }, [state.entries, tagMap, year, month, viewMode]);

  const maxBar = Math.max(1, ...top5.map(t => t.count));

  return (
    <ScrollView style={st.wrap} contentContainerStyle={st.content}>
      {/* HUD Cards */}
      <View style={st.hudRow}>
        <View style={st.hudCard}>
          <Text style={st.hudNum}>{todayCount}</Text>
          <Text style={st.hudLabel}>Today</Text>
        </View>
        <View style={st.hudCard}>
          <Text style={st.hudNum}>{streak}</Text>
          <Text style={st.hudLabel}>🔥 Streak</Text>
        </View>
        <View style={st.hudCard}>
          <Text style={st.hudNum}>{consistency.tracked}/{consistency.total}</Text>
          <Text style={st.hudLabel}>This month</Text>
        </View>
      </View>

      {/* View toggle + navigation */}
      <View style={st.navRow}>
        <View style={st.toggleRow}>
          <Pressable onPress={() => setViewMode("month")} style={[st.toggleBtn, viewMode === "month" && st.toggleActive]}>
            <Text style={[st.toggleTxt, viewMode === "month" && st.toggleTxtActive]}>Month</Text>
          </Pressable>
          <Pressable onPress={() => setViewMode("year")} style={[st.toggleBtn, viewMode === "year" && st.toggleActive]}>
            <Text style={[st.toggleTxt, viewMode === "year" && st.toggleTxtActive]}>Year</Text>
          </Pressable>
        </View>
        <View style={st.yearRow}>
          <Pressable onPress={() => {
            if (viewMode === "month") {
              if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
            } else setYear(y => y - 1);
          }} style={st.navBtn}>
            <Ionicons name="chevron-back" size={14} color={theme.fg} />
          </Pressable>
          <Text style={st.yearTxt}>{viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}</Text>
          <Pressable onPress={() => {
            if (viewMode === "month") {
              if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
            } else setYear(y => Math.min(y + 1, now.getFullYear()));
          }} style={st.navBtn}>
            <Ionicons name="chevron-forward" size={14} color={theme.fg} />
          </Pressable>
        </View>
      </View>

      {/* Heatmap */}
      <View style={st.section}>
        <View style={st.heatGrid}>
          {MONTHS.map((m, mi) => {
            const firstDay = new Date(year, mi, 1).getDay();
            const daysInMonth = new Date(year, mi + 1, 0).getDate();
            const cells: { count: number }[] = [];
            for (let i = 0; i < firstDay; i++) cells.push({ count: -1 });
            for (let d = 1; d <= daysInMonth; d++) {
              const ds = `${year}-${pad(mi + 1)}-${pad(d)}`;
              if (viewMode === "month" && mi !== month) {
                cells.push({ count: -2 });
              } else {
                const isAfterToday = new Date(year, mi, d) > now;
                cells.push({ count: isAfterToday ? -3 : (state.entries[ds] ?? []).length });
              }
            }
            while (cells.length < 42) cells.push({ count: -1 });
            return (
              <View key={mi} style={st.heatMonth}>
                <Text style={[st.heatMonthLabel, viewMode === "month" && mi !== month && { opacity: 0.3 }, viewMode === "month" && mi === month && { color: "#fff" }]}>{m}</Text>
                <View style={st.heatMonthCells}>
                  {cells.map((cell, i) => (
                    <View key={i} style={[
                      st.heatCell,
                      cell.count === -1 && { backgroundColor: "transparent" },
                      cell.count === -2 && { backgroundColor: "transparent", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)" },
                      cell.count === -3 && { backgroundColor: "rgba(255,255,255,0.03)" },
                      cell.count === 0 && { backgroundColor: "rgba(255,255,255,0.08)" },
                      cell.count > 0 && { backgroundColor: "#00ff88", opacity: 0.2 + (cell.count / maxHeat) * 0.8 },
                    ]} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
        {/* Legend */}
        <View style={st.legend}>
          <Text style={st.legendTxt}>Less</Text>
          {[0.1, 0.3, 0.5, 0.7, 1].map((o, i) => (
            <View key={i} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#00ff88", opacity: o, marginHorizontal: 2 }} />
          ))}
          <Text style={st.legendTxt}>More</Text>
        </View>
      </View>

      {/* Top 5 */}
      {top5.length > 0 && (
      <View style={st.section}>
        <Text style={st.sectionTitle}>Most tracked in {viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}</Text>
        {top5.map((item, i) => (
          <View key={item.id} style={st.barRow}>
            <Text style={st.barEmoji}>{item.emoji}</Text>
            <View style={st.barTrack}>
              <View style={[st.barFill, { width: `${(item.count / maxBar) * 100}%`, backgroundColor: getEmojiGlowColor(item.emoji, i) }]} />
            </View>
            <Text style={st.barCount}>{item.count}</Text>
          </View>
        ))}
      </View>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  hudRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  hudCard: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12, paddingVertical: 14, alignItems: "center",
  },
  hudNum: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 2 },
  hudLabel: { fontSize: 11, color: theme.fgMuted },
  yearRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  navBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  toggleRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  toggleActive: { backgroundColor: "rgba(255,255,255,0.12)" },
  toggleTxt: { fontSize: 12, color: theme.fgMuted, fontWeight: "500" },
  toggleTxtActive: { color: "#fff" },
  yearTxt: { fontSize: 15, fontWeight: "600", color: theme.fg },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: theme.fgMuted, marginBottom: 12 },
  heatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  heatMonth: { width: "23%", marginBottom: 10 },
  heatMonthLabel: { fontSize: 9, color: theme.fgMuted, marginBottom: 3, fontWeight: "500" },
  heatMonthCells: { flexDirection: "row", flexWrap: "wrap", gap: 1 },
  heatCell: { width: "13%", aspectRatio: 1, borderRadius: 1.5 },
  legend: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 2 },
  legendTxt: { fontSize: 10, color: theme.fgMuted, marginHorizontal: 4 },
  empty: { color: theme.fgMuted, fontSize: 13 },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  barEmoji: { fontSize: 20, width: 32 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barCount: { fontSize: 12, color: theme.fgMuted, width: 28, textAlign: "right" },
});
