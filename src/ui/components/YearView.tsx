import { useMemo, useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
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
  const now = new Date();
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) arr.push(y);
    return arr;
  }, []);
  const [visibleYear, setVisibleYear] = useState(initialYear ?? now.getFullYear());

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const y = viewableItems[0].item;
      setVisibleYear(y);
      onYearChange?.(y);
    }
  }, []);

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 50 }), []);

  return (
    <View style={st.container}>
      <View style={st.header}>
        <View style={[st.yearBadge, visibleYear === now.getFullYear() && st.yearBadgeCurrent]}>
          <Text style={[st.headerCenter, visibleYear === now.getFullYear() && { color: theme.danger }]}>{visibleYear}</Text>
        </View>
      </View>
      <FlatList
        data={years}
        keyExtractor={item => String(item)}
        getItemLayout={(_, index) => ({ length: 520, offset: 520 * index, index })}
        renderItem={({ item: y }) => (
          <View style={st.yearSection}>
            <View style={st.grid}>
              {Array.from({ length: 12 }, (_, m) => (
                <MiniMonth key={m} year={y} month={m} onPress={y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth()) ? undefined : () => onSelectMonth(y, m)} />
              ))}
            </View>
          </View>
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        showsVerticalScrollIndicator={false}
        snapToInterval={520}
        decelerationRate="fast"
        style={{ flex: 1, scrollSnapType: "y mandatory" } as any}
      />
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 29,
  },
  yearTitle: { fontSize: 17, fontWeight: "700", color: theme.fg },
  yearBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  yearBadgeCurrent: {},
  headerCenter: { fontSize: 17, fontWeight: "700", color: theme.accent },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 8,
  },
  yearSection: {
    height: 520,
    paddingTop: 16,
    paddingHorizontal: 8,
    scrollSnapAlign: "start",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.08)",
  } as any,
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
