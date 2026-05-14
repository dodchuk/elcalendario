import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, Dimensions } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../../application/StoreContext";
import { todayStr } from "../../domain/calendarReducer";
import BubbleRing from "./BubbleRing";
import DayTimeline from "./DayTimeline";
import { theme } from "../theme/colors";
import { getEmojiGlowColor } from "../theme/tagColors";

const SW = Dimensions.get("window").width;
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function daysIn(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function startOff(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function dateStr(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

// Generate months: 2 years back to current month
function generateMonths(startYear: number, startMonth: number) {
  const months: { year: number; month: number; key: string }[] = [];
  const now = new Date();
  let y = startYear - 2, m = startMonth;
  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth())) {
    months.push({ year: y, month: m, key: `${y}-${m}` });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return months;
}

type Props = { initialYear: number; initialMonth: number; onBack: (year: number) => void };

function MonthBlock({ year, month, openDate, onSelectDate }: {
  year: number; month: number; openDate: string | null; onSelectDate: (ds: string) => void;
}) {
  const { state, dispatch } = useStore();
  const today = todayStr();
  const total = daysIn(year, month);
  const offset = startOff(year, month);
  const tagMap = useMemo(() => Object.fromEntries(state.tags.map(t => [t.id, t])), [state.tags]);
  const [cellSize, setCellSize] = useState(44);

  return (
    <View style={st.monthSection}>
      <Text style={st.monthTitle}>{MONTHS[month]} {year}</Text>
      <View style={st.grid}>
        {Array.from({ length: offset }, (_, i) => <View key={`e${i}`} style={st.emptyCell} />)}
        {Array.from({ length: total }, (_, i) => {
          const d = i + 1;
          const ds = dateStr(year, month, d);
          const isToday = ds === today;
          const isFuture = ds > today;
          const isOpen = openDate === ds;
          const activeIds = (state.entries[ds] ?? []).filter(id => tagMap[id]);
          const col = (offset + d - 1) % 7;
          const row = Math.floor((offset + d - 1) / 7);

          return (
            <Pressable
              key={d}
              style={[st.cell, isToday && st.cellToday, isFuture && st.cellFuture, isOpen && st.cellOpen, openDate && !isOpen && st.cellSkeleton]}
              onPress={() => !isFuture && onSelectDate(isOpen ? "" : ds)}
              onLayout={e => { if (d === 1) setCellSize(e.nativeEvent.layout.width); }}
            >
              {!isOpen && (
                <View style={[st.dateNum, activeIds.length > 0 && st.dateNumHasEmoji, isToday && st.dateNumToday, activeIds.length > 0 && { boxShadow: `0 0 6px ${getEmojiGlowColor(tagMap[activeIds[0]]?.emoji ?? "", 0)}44` } as any]}>
                  <Text style={[st.dateNumTxt, isToday && st.dateNumTodayTxt]}>{d}</Text>
                </View>
              )}
              {!isFuture && isOpen && state.tags.length > 0 && (() => {
                const dayTimeSlots = state.timeEntries?.[ds] ?? [];
                const timeMap: Record<string, string> = {};
                for (const sl of dayTimeSlots) timeMap[sl.tagId] = sl.time;
                return (
                  <BubbleRing
                    key={ds}
                    bubbles={state.tags.map(t => ({ id: t.id, emoji: t.emoji, active: activeIds.includes(t.id), time: activeIds.includes(t.id) ? timeMap[t.id] : undefined }))}
                    ringR={Math.min(Math.max(cellSize * 0.3, state.tags.length * 12), cellSize * 3)}
                    col={col}
                    row={row}
                    label={String(d)}
                    onToggle={id => dispatch({ type: "TOGGLE_EMOJI", date: ds, tagId: id })}
                  />
                );
              })()}
              {!isFuture && !isOpen && activeIds.length > 0 && (
                <>
                  {activeIds.slice(0, 6).map((id, idx) => {
                    const angle = (2 * Math.PI * idx) / Math.min(activeIds.length, 6) - Math.PI / 2;
                    const r = 14;
                    const tagIdx = state.tags.findIndex(t => t.id === id);
                    const glowColor = getEmojiGlowColor(tagMap[id]?.emoji ?? "", tagIdx);
                    return (
                      <Text key={id} style={[st.ringEmoji, {
                        left: "50%",
                        top: "50%",
                        textShadowColor: glowColor,
                        textShadowRadius: 6,
                        transform: [{ translateX: Math.cos(angle) * r - 5 }, { translateY: Math.sin(angle) * r - 5 }],
                      }]}>{tagMap[id]?.emoji}</Text>
                    );
                  })}
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MonthView({ initialYear, initialMonth, onBack }: Props) {
  const months = useMemo(() => generateMonths(initialYear, initialMonth), [initialYear, initialMonth]);
  const initialIndex = months.findIndex(m => m.year === initialYear && m.month === initialMonth);
  const [visibleYear, setVisibleYear] = useState(initialYear);
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const { state } = useStore();
  const hasEmojis = openDate ? (state.entries[openDate] ?? []).length > 0 : false;

  const selectDate = useCallback((ds: string | null) => {
    if (ds) {
      setOpenDate(ds);
      setDisplayDate(ds);
      // Scroll up by timeline height to keep content visible
      const [y, m] = ds.split("-").map(Number);
      const idx = months.findIndex(item => item.year === y && item.month === m - 1);
      if (idx >= 0) {
        const offset = Math.max(0, (idx + 1) * 320 - 200);
        setTimeout(() => listRef.current?.scrollToOffset({ offset, animated: true }), 50);
      }
    } else {
      setOpenDate(null);
      setDisplayDate(null);
    }
  }, [months]);

  const calFlex = useSharedValue(1);
  const tlFlex = useSharedValue(0);

  useEffect(() => {
    const show = openDate && (state.entries[openDate] ?? []).length > 0;
    calFlex.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    tlFlex.value = withTiming(show ? 1 : 0, { duration: 300, easing: Easing.out(Easing.ease) });
  }, [openDate, state.entries]);

  const calendarStyle = useAnimatedStyle(() => ({ flex: calFlex.value }));
  const timelineStyle = useAnimatedStyle(() => ({ flex: tlFlex.value }));

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const item = viewableItems[Math.floor(viewableItems.length / 2)]?.item ?? viewableItems[0].item;
      setVisibleYear(item.year);
      setVisibleMonth(item.month);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  return (
    <View style={[st.container, openDate && { backgroundColor: "rgba(0,0,0,0.5)" }]}>
      {/* Fixed header */}
      <View style={st.header}>
        <Pressable onPress={() => onBack(visibleYear)} style={st.backBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.fg} />
          <Text style={st.backTxt}>{visibleYear}</Text>
        </Pressable>
        <Text style={st.headerTitle}>{MONTHS[visibleMonth]}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Day labels */}
      <View style={st.dayRow}>
        {DAYS.map(d => <Text key={d} style={st.dayLabel}>{d}</Text>)}
      </View>

      {/* Infinite scroll months */}
      <Animated.View style={[{ overflow: "hidden" }, calendarStyle]}>
        <FlatList
          ref={listRef}
          data={months}
          keyExtractor={item => item.key}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: 320, offset: 320 * index, index })}
          renderItem={({ item }) => (
            <MonthBlock year={item.year} month={item.month} openDate={openDate} onSelectDate={ds => selectDate(ds || null)} />
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!hasEmojis}
          snapToInterval={320}
          decelerationRate="fast"
          contentContainerStyle={{ paddingBottom: hasEmojis ? 320 : 40 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* DayTimeline */}
      <Animated.View style={[st.timelineWrap, timelineStyle]}>
        <Pressable style={st.timelineHandle} onPress={() => selectDate(null)}>
          <View style={st.handleBar} />
        </Pressable>
        {displayDate && <DayTimeline date={displayDate} filter={[]} />}
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backTxt: { fontSize: 16, color: theme.fg, fontWeight: "600" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: theme.fg },
  dayRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: theme.fgMuted,
    textTransform: "uppercase",
  },
  list: { flex: 1 },
  monthSection: { paddingHorizontal: 16, paddingTop: 16, minHeight: 320 },
  monthTitle: { fontSize: 14, fontWeight: "600", color: theme.fgMuted, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  emptyCell: { width: "13.5%", aspectRatio: 1 },
  cell: {
    width: "13.5%",
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  cellToday: { backgroundColor: "rgba(255,255,255,0.06)" },
  cellFuture: { opacity: 0.3 },
  cellOpen: { zIndex: 10, overflow: "visible" },
  cellSkeleton: { opacity: 0.3 },
  dateNum: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  dateNumToday: { backgroundColor: "#fff" },
  dateNumHasEmoji: { backgroundColor: "rgba(255,255,255,0.2)" },
  dateNumOpen: {},
  dateNumTxt: { fontSize: 13, color: theme.fg, fontWeight: "400" },
  dateNumTodayTxt: { color: "#000", fontWeight: "700" },
  ringEmoji: { position: "absolute", fontSize: 8 },
  timelineWrap: {
    overflow: "hidden",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.bg,
  },
  timelineHandle: {
    alignItems: "center",
    paddingVertical: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.fgMuted,
  },
});
