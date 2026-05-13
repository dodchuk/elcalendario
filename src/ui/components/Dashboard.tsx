import { useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useStore } from "../../application/StoreContext";
import { findStreaks, longestStreaks } from "../../domain/streaks";
import { theme } from "../theme/colors";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type Props = {
  year: number; month: number;
  filter: string[];
  onFilter: (ids: string[]) => void;
  streakRange: { start: string; end: string } | null;
  onStreakRange: (range: { start: string; end: string } | null) => void;
};

function useDashboardData(year: number, month: number) {
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

  return { state, tagMap, stats, best, topStreaks };
}

export function TagFilters({ year, month, filter, onFilter, streakRange, onStreakRange }: Props) {
  const { state, tagMap, stats, best } = useDashboardData(year, month);

  if (!state.tags.length) return null;

  const handleClick = (id: string) => {
    if (filter.includes(id)) {
      const next = filter.filter((f) => f !== id);
      onFilter(next);
      if (next.length === 0) onStreakRange(null);
    } else {
      onFilter([...filter, id]);
      const b = best[id];
      if (b) onStreakRange({ start: b.start, end: b.end });
    }
  };

  return (
    <View style={st.filterWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filterRow}>
        {filter.length > 0 && (
          <Pressable style={st.clearPill} onPress={() => { onFilter([]); onStreakRange(null); }}>
            <Text style={st.clearTxt}>✕</Text>
          </Pressable>
        )}
        {stats.map(([id, count]) => {
          const tag = tagMap[id];
          if (!tag) return null;
          const active = filter.includes(id);
          const streak = best[id];
          return (
            <Pressable key={id} style={[st.pill, active && st.pillActive]} onPress={() => handleClick(id)}>
              <Text style={st.pillEmoji}>{tag.emoji}</Text>
              <Text style={[st.pillCount, active && st.pillCountActive]}>{count}d</Text>
              {streak && <Text style={st.pillStreak}>🔥{streak.length}</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function StreakPanel({ year, month, filter, onFilter, streakRange, onStreakRange }: Props) {
  const { tagMap, best, topStreaks } = useDashboardData(year, month);

  const visibleStreaks = topStreaks;

  if (!visibleStreaks.length) return null;

  const handleStreakClick = (streak: typeof topStreaks[0]) => {
    const active = streakRange?.start === streak.start && streakRange?.end === streak.end;
    if (active) { onStreakRange(null); onFilter([]); }
    else { onStreakRange({ start: streak.start, end: streak.end }); onFilter([streak.tagId]); }
  };

  return (
    <View style={st.streakWrap}>
      <Text style={st.streakTitle}>Longest Streaks</Text>
      {visibleStreaks.map((streak) => {
        const tag = tagMap[streak.tagId];
        const active = filter.includes(streak.tagId) && streakRange?.start === streak.start && streakRange?.end === streak.end;
        const startDay = parseInt(streak.start.slice(-2));
        const endDay = parseInt(streak.end.slice(-2));
        return (
          <Pressable
            key={`${streak.tagId}-${streak.start}`}
            style={[st.streakRow, active && st.streakRowActive]}
            onPress={() => handleStreakClick(streak)}
          >
            <Text style={st.streakEmoji}>{tag.emoji}</Text>
            <Text style={st.streakDays}>{MONTHS_SHORT[month]} {startDay} – {endDay}</Text>
            <Text style={st.streakBadge}>{streak.length}d</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Keep default export for backward compat
export default function Dashboard(props: Props) {
  return (
    <>
      <TagFilters {...props} />
      <StreakPanel {...props} />
    </>
  );
}

const st = StyleSheet.create({
  filterWrap: { marginBottom: 12 },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 4, alignItems: "center" },
  pill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: theme.surfaceHover,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: theme.border,
  },
  pillActive: {
    backgroundColor: theme.accentSubtle,
    borderColor: theme.accent,
  },
  pillEmoji: { fontSize: 18, marginRight: 4 },
  pillCount: { fontSize: 12, color: theme.fgMuted, fontWeight: "600" },
  pillCountActive: { color: theme.accent },
  pillStreak: { fontSize: 10, color: "#ff8c00", marginLeft: 3 },
  clearPill: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: theme.surfaceHover, borderWidth: 1, borderColor: theme.border,
    alignItems: "center", justifyContent: "center",
  },
  clearTxt: { fontSize: 14, color: theme.fgMuted },
  streakWrap: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border,
  },
  streakTitle: { fontSize: 13, fontWeight: "600", color: theme.fgMuted, marginBottom: 8 },
  streakRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 8,
    borderRadius: 8, marginBottom: 2,
  },
  streakRowActive: { backgroundColor: "rgba(255,140,0,0.12)" },
  streakEmoji: { fontSize: 20, marginRight: 8 },
  streakDays: { fontSize: 12, color: theme.fgMuted, flex: 1 },
  streakBadge: { fontSize: 11, fontWeight: "700", color: "#ff8c00", backgroundColor: "rgba(255,140,0,0.15)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
});
