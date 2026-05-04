import { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useStore } from "../../application/StoreContext";
import { findStreaks, longestStreaks } from "../../domain/streaks";
import { theme } from "../theme/colors";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type Props = {
  year: number; month: number;
  filter: string | null;
  onFilter: (id: string | null) => void;
  streakRange: { start: string; end: string } | null;
  onStreakRange: (range: { start: string; end: string } | null) => void;
};

export default function Dashboard({ year, month, filter, onFilter, streakRange, onStreakRange }: Props) {
  const { state } = useStore();
  const prefix = `${year}-${(month + 1).toString().padStart(2, "0")}`;
  const tagMap = useMemo(() => Object.fromEntries(state.tags.map((t) => [t.id, t])), [state.tags]);

  const stats = useMemo(() => {
    const c: Record<string, number> = {};
    for (const [date, ids] of Object.entries(state.entries)) {
      if (!date.startsWith(prefix)) continue;
      for (const id of ids) if (tagMap[id]) c[id] = (c[id] ?? 0) + 1;
    }
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [state.entries, prefix, tagMap]);

  const streaks = useMemo(() => findStreaks(state.entries, state.tags, year, month), [state.entries, state.tags, year, month]);
  const best = useMemo(() => longestStreaks(streaks), [streaks]);
  const topStreaks = useMemo(() =>
    Object.values(best).filter((s) => tagMap[s.tagId]).sort((a, b) => b.length - a.length).slice(0, 5),
  [best, tagMap]);

  if (!state.tags.length) return null;

  const handleClick = (id: string) => {
    if (filter === id) { onFilter(null); onStreakRange(null); }
    else { onFilter(id); const b = best[id]; onStreakRange(b ? { start: b.start, end: b.end } : null); }
  };

  const handleStreakClick = (streak: typeof topStreaks[0]) => {
    const active = filter === streak.tagId && streakRange?.start === streak.start;
    if (active) { onFilter(null); onStreakRange(null); }
    else { onFilter(streak.tagId); onStreakRange({ start: streak.start, end: streak.end }); }
  };

  return (
    <View style={st.wrap}>
      {stats.length === 0 ? (
        <Text style={st.empty}>No emojis this month.</Text>
      ) : (
        <>
          {stats.map(([id, count]) => {
            const tag = tagMap[id];
            if (!tag) return null;
            const active = filter === id;
            const streak = best[id];
            return (
              <Pressable key={id} style={[st.row, active && st.rowActive]} onPress={() => handleClick(id)}>
                <Text style={st.emoji}>{tag.emoji}</Text>
                <Text style={st.count}>{count}</Text>
                <Text style={st.unit}>day{count !== 1 ? "s" : ""}</Text>
                {streak && <Text style={st.streak}>🔥{streak.length}</Text>}
              </Pressable>
            );
          })}

          {topStreaks.length > 0 && (
            <View style={st.streakSection}>
              <Text style={st.streakTitle}>Longest Streaks</Text>
              {topStreaks.map((streak) => {
                const tag = tagMap[streak.tagId];
                const active = filter === streak.tagId && streakRange?.start === streak.start;
                const startDay = parseInt(streak.start.slice(-2));
                const endDay = parseInt(streak.end.slice(-2));
                return (
                  <Pressable
                    key={`${streak.tagId}-${streak.start}`}
                    style={[st.streakRow, active && st.streakRowActive]}
                    onPress={() => handleStreakClick(streak)}
                  >
                    <Text style={st.emoji}>{tag.emoji}</Text>
                    <Text style={st.streakDays}>{MONTHS_SHORT[month]} {startDay} – {endDay}</Text>
                    <Text style={st.streakBadge}>{streak.length}d</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}
      {filter && (
        <Pressable style={st.clearBtn} onPress={() => { onFilter(null); onStreakRange(null); }}>
          <Text style={st.clearTxt}>Clear filter</Text>
        </Pressable>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, marginTop: 12,
  },
  empty: { color: theme.fgMuted, fontSize: 13, textAlign: "center", padding: 16 },
  row: {
    flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 8,
    borderRadius: 8, marginBottom: 2,
  },
  rowActive: { backgroundColor: theme.accentSubtle },
  emoji: { fontSize: 20, marginRight: 8 },
  count: { fontSize: 16, fontWeight: "700", color: theme.fg, fontVariant: ["tabular-nums"] },
  unit: { fontSize: 12, color: theme.fgMuted, marginLeft: 4, flex: 1 },
  streak: { fontSize: 12, color: "#ff8c00" },
  streakSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border },
  streakTitle: { fontSize: 13, fontWeight: "600", color: theme.fgMuted, marginBottom: 8 },
  streakRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 8,
    borderRadius: 8, marginBottom: 2,
  },
  streakRowActive: { backgroundColor: "rgba(255,140,0,0.12)" },
  streakDays: { fontSize: 12, color: theme.fgMuted, flex: 1, marginLeft: 4 },
  streakBadge: { fontSize: 11, fontWeight: "700", color: "#ff8c00", backgroundColor: "rgba(255,140,0,0.15)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  clearBtn: { marginTop: 8, alignSelf: "center", paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: theme.surfaceHover },
  clearTxt: { color: theme.fgMuted, fontSize: 12 },
});
