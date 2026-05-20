import { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useStore } from "../../application/StoreContext";
import { getEmojiGlowColor } from "../theme/tagColors";
import { theme } from "../theme/colors";

const pad = (n: number) => n.toString().padStart(2, "0");
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function dateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

export default function Dashboard() {
  const { state } = useStore();
  const tagMap = useMemo(() => Object.fromEntries(state.tags.map(t => [t.id, t])), [state.tags]);
  const today = todayStr();

  // HUD: today's count
  const todayCount = (state.entries[today] ?? []).length;

  // HUD: current streak (consecutive days with any activity, ending today or yesterday)
  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = dateStr(d);
      if ((state.entries[ds] ?? []).length > 0) count++;
      else if (i > 0) break; // allow today to be empty
      else break;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [state.entries]);

  // HUD: this week vs last week
  const weekComparison = useMemo(() => {
    const now = new Date();
    const dow = now.getDay();
    let thisWeek = 0, lastWeek = 0;
    for (let i = 0; i <= dow; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      thisWeek += (state.entries[dateStr(d)] ?? []).length;
    }
    for (let i = 0; i < 7; i++) {
      const d = new Date(now); d.setDate(d.getDate() - dow - 1 - i);
      lastWeek += (state.entries[dateStr(d)] ?? []).length;
    }
    const pct = lastWeek === 0 ? 100 : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    return { thisWeek, lastWeek, pct };
  }, [state.entries]);

  // Heatmap: last 12 weeks (84 days)
  const heatmap = useMemo(() => {
    const cells: { date: string; count: number }[] = [];
    const d = new Date();
    d.setDate(d.getDate() - 83);
    for (let i = 0; i < 84; i++) {
      cells.push({ date: dateStr(d), count: (state.entries[dateStr(d)] ?? []).length });
      d.setDate(d.getDate() + 1);
    }
    return cells;
  }, [state.entries]);

  const maxHeat = Math.max(1, ...heatmap.map(c => c.count));

  // Top 5 most used this month
  const top5 = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${pad(now.getMonth()+1)}`;
    const counts: Record<string, number> = {};
    for (const [date, ids] of Object.entries(state.entries)) {
      if (!date.startsWith(prefix)) continue;
      for (const id of ids) {
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, emoji: tagMap[id]?.emoji ?? "?", count }));
  }, [state.entries, tagMap]);

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
          <Text style={[st.hudNum, { color: weekComparison.pct >= 0 ? "#00ff88" : "#ff4466" }]}>
            {weekComparison.pct >= 0 ? "↑" : "↓"}{Math.abs(weekComparison.pct)}%
          </Text>
          <Text style={st.hudLabel}>vs last week</Text>
        </View>
      </View>

      {/* Heatmap */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>Last 12 weeks</Text>
        <View style={st.heatGrid}>
          {heatmap.map((cell, i) => (
            <View
              key={i}
              style={[st.heatCell, { opacity: cell.count === 0 ? 0.1 : 0.2 + (cell.count / maxHeat) * 0.8 }]}
            />
          ))}
        </View>
      </View>

      {/* Top 5 */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>Top this month</Text>
        {top5.length === 0 && <Text style={st.empty}>No data yet</Text>}
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
    </ScrollView>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  hudRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  hudCard: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12, paddingVertical: 16, alignItems: "center",
  },
  hudNum: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 4 },
  hudLabel: { fontSize: 11, color: theme.fgMuted },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: theme.fgMuted, marginBottom: 12 },
  heatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  heatCell: { width: 10, height: 10, borderRadius: 2, backgroundColor: "#00ff88" },
  empty: { color: theme.fgMuted, fontSize: 13 },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  barEmoji: { fontSize: 20, width: 32 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barCount: { fontSize: 12, color: theme.fgMuted, width: 28, textAlign: "right" },
});
