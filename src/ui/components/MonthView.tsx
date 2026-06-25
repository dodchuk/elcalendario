import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, Dimensions } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../../application/StoreContext";
import { useSettings } from "../../application/SettingsContext";
import { todayStr } from "../../domain/calendarReducer";
import BubbleRing from "./BubbleRing";
import DayFocusBlock from "./DayFocusBlock";
import DayTimeline from "./DayTimeline";
import { theme } from "../theme/colors";
import { getEmojiGlowColor } from "../theme/tagColors";

const SW = Math.min(Dimensions.get("window").width, 393);
const SH = Math.min(Dimensions.get("window").height, 852);
const ALL_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function daysIn(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function startOff(y: number, m: number, firstDay: number) { return (new Date(y, m, 1).getDay() - firstDay + 7) % 7; }
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
  months.reverse();
  return months;
}

type Props = { initialYear: number; initialMonth: number; onBack: (year: number) => void; onMonthChange?: (year: number, month: number) => void };

function MonthBlock({ year, month, openDate, onSelectDate, timelineOpen, isActive }: {
  year: number; month: number; openDate: string | null; onSelectDate: (ds: string) => void; timelineOpen: boolean; isActive: boolean;
}) {
  const { state, dispatch } = useStore();
  const { settings } = useSettings();
  const today = todayStr();
  const total = daysIn(year, month);
  const offset = startOff(year, month, settings.firstDay);
  const tagMap = useMemo(() => Object.fromEntries(state.tags.map(t => [t.id, t])), [state.tags]);
  const [cellSize, setCellSize] = useState(44);

  return (
    <View style={st.monthSection}>
      {!timelineOpen && (
        <View style={[st.monthBadge, isActive && st.monthBadgeActive]}>
          <Text style={[st.monthTitle, isActive && st.monthTitleActive]}>{MONTHS[month]} {year}</Text>
        </View>
      )}
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
              style={[st.cell, isToday && st.cellToday, isFuture && st.cellFuture, isOpen && st.cellOpen]}
              onPress={() => {
                if (isFuture) return;
                if (isOpen) {
                  // Second click on open day → close
                  onSelectDate("");
                } else if (activeIds.length > 0) {
                  // Day has emojis → go to daypage
                  onSelectDate("__timeline__:" + ds);
                } else {
                  // No emojis → open bubble ring
                  onSelectDate(ds);
                }
              }}
              onLayout={e => { if (d === 1) setCellSize(e.nativeEvent.layout.width); }}
            >
              {!isOpen && (
                (() => {
                  const thisMonthHasOpen = openDate && openDate.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`);
                  if (thisMonthHasOpen) {
                    return <View style={st.skeletonDay} />;
                  }
                  return (
                    <View style={[st.dateNum, activeIds.length > 0 && st.dateNumHasEmoji, isToday && st.dateNumToday, activeIds.length > 0 && { boxShadow: `0 0 6px ${getEmojiGlowColor(tagMap[activeIds[0]]?.emoji ?? "", 0)}44` } as any]}>
                      <Text style={[st.dateNumTxt, isToday && st.dateNumTodayTxt]}>{d}</Text>
                    </View>
                  );
                })()
              )}
              {!isFuture && isOpen && state.tags.length > 0 && (() => {
                const dayTimeSlots = state.timeEntries?.[ds] ?? [];
                const timeMap: Record<string, string> = {};
                for (const sl of dayTimeSlots) timeMap[sl.tagId] = sl.time;
                // Approximate screen position of cell center
                const gridWidth = SW - 32; // 16px padding each side
                const cellW = gridWidth * 0.135;
                const cellX = 16 + col * (cellW + 2) + cellW / 2;
                // Estimate screen Y: header ~80px, row position within visible area
                const cellY = 80 + (row + 0.5) * (cellSize + 2);
                const screenY = openDate ? Math.min(cellY, SH * 0.4) : cellY;
                return (
                  <BubbleRing
                    key={ds}
                    bubbles={state.tags.map(t => ({ id: t.id, emoji: t.emoji, active: activeIds.includes(t.id), time: activeIds.includes(t.id) ? timeMap[t.id] : undefined }))}
                    ringR={Math.min(Math.max(cellSize * 0.3, state.tags.length * 12), cellSize * 3)}
                    col={col}
                    row={row}
                    label={String(d)}
                    screenPos={{ x: cellX, y: screenY }}
                    visibleHeight={timelineOpen ? SH * 0.5 : SH}
                    onToggle={id => dispatch({ type: "TOGGLE_EMOJI", date: ds, tagId: id })}
                  />
                );
              })()}
              {!isFuture && !isOpen && !openDate?.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`) && activeIds.length > 0 && (
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
        {Array.from({ length: 42 - offset - total }, (_, i) => <View key={`t${i}`} style={st.emptyCell} />)}
      </View>
    </View>
  );
}

export default function MonthView({ initialYear, initialMonth, onBack, onMonthChange }: Props) {
  const { settings } = useSettings();
  const DAYS = [...ALL_DAYS.slice(settings.firstDay), ...ALL_DAYS.slice(0, settings.firstDay)];
  const months = useMemo(() => generateMonths(initialYear, initialMonth), [initialYear, initialMonth]);
  const initialIndex = months.findIndex(m => m.year === initialYear && m.month === initialMonth);
  const [scrollIdx, setScrollIdx] = useState(initialIndex);
  const [visibleYear, setVisibleYear] = useState(initialYear);
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const onMonthChangeRef = useRef(onMonthChange);
  onMonthChangeRef.current = onMonthChange;

  const { state } = useStore();
  const hasEmojis = openDate ? (state.entries[openDate] ?? []).length > 0 : false;
  // Track if this is a reopen (had emojis before closing)
  const [showTimeline, setShowTimeline] = useState(false);

  const selectDate = useCallback((ds: string | null) => {
    if (ds && ds.startsWith("__timeline__:")) {
      const date = ds.replace("__timeline__:", "");
      setOpenDate(date);
      setDisplayDate(date);
      setShowTimeline(true);
      return;
    }
    if (ds) {
      setOpenDate(ds);
      setDisplayDate(ds);
      setShowTimeline(false);
      // Snap month to top
      const [y, m] = ds.split("-").map(Number);
      const idx = months.findIndex(item => item.year === y && item.month === m - 1);
    } else {
      setOpenDate(null);
      setDisplayDate(null);
      setShowTimeline(false);
    }
  }, [months]);

  const closeDayPage = useCallback(() => {
    tlHeight.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) });
    const dd = displayDate;
    setOpenDate(null);
    if (dd) {
      const [y, m] = dd.split("-").map(Number);
      const idx = months.findIndex(item => item.year === y && item.month === m - 1);
      if (idx >= 0) {
        listRef.current?.scrollToIndex({ index: idx, animated: false, viewOffset: 0, viewPosition: 0 });
      }
    }
    setTimeout(() => {
      setShowTimeline(false);
      setDisplayDate(null);
    }, 250);
  }, [displayDate, months]);

  const calFlex = useSharedValue(1);
  const tlHeight = useSharedValue(0);

  useEffect(() => {
    tlHeight.value = withTiming(showTimeline ? 1 : 0, { duration: 300, easing: Easing.out(Easing.ease) });
  }, [showTimeline]);

  const calendarStyle = useAnimatedStyle(() => ({ flex: calFlex.value }));
  const timelineStyle = useAnimatedStyle(() => ({ height: tlHeight.value, overflow: "hidden" as const }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: tlHeight.value,
  }));

  const timelineAnimStyle = useAnimatedStyle(() => ({
    opacity: tlHeight.value,
    transform: [{ translateY: (1 - tlHeight.value) * 40 }],
  }));

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const item = viewableItems[0].item;
      setVisibleYear(item.year);
      setVisibleMonth(item.month);
      onMonthChangeRef.current?.(item.year, item.month);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  return (
    <View style={st.container}>
      {/* Fixed header */}
      <View style={st.header}>
        <Pressable onPress={() => onBack(visibleYear)} style={[st.backBtn, { zIndex: 10 }]}>
          <View style={st.iconCircle}><Ionicons name="chevron-back" size={14} color={theme.fg} /></View>
          <Text style={st.backTxt}>{showTimeline && displayDate ? displayDate.split("-")[0] : visibleYear}</Text>
        </Pressable>
        <View style={{ position: "absolute", left: 0, right: 0, alignItems: "center" }} pointerEvents="box-none">
          <Pressable onPress={showTimeline ? () => {
            const [y, m] = (displayDate ?? "").split("-").map(Number);
            const idx = months.findIndex(item => item.year === y && item.month === m - 1);
            if (idx >= 0) listRef.current?.scrollToOffset({ offset: idx * 360, animated: false });
            closeDayPage();
          } : undefined} disabled={!showTimeline} style={{ flexDirection: "row", alignItems: "center" }}>
            {showTimeline && <View style={[st.iconCircle, { position: "absolute", left: -28 }]}><Ionicons name="chevron-back" size={14} color={theme.fg} /></View>}
            <Text style={st.headerTitle}>{MONTHS[showTimeline && displayDate ? Number(displayDate.split("-")[1]) - 1 : visibleMonth]}</Text>
          </Pressable>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          {showTimeline && (
            <Pressable onPress={closeDayPage} style={st.closeBtn}>
              <Ionicons name="close" size={14} color="rgba(255,255,255,0.5)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Day labels */}
      <View style={st.dayRow}>
        {DAYS.map(d => <Text key={d} style={st.dayLabel}>{d}</Text>)}
      </View>

      {/* DayTimeline + selected month overlay (swipable up to dismiss) */}
      {/* Day page overlay - slides over calendar */}
      {displayDate && showTimeline && (() => {
        const [oy, om] = displayDate.split("-").map(Number);
        return (
        <Animated.View style={[st.overlay, overlayStyle]}>
          <View style={{ overflow: "visible", zIndex: 10 }}>
            <DayFocusBlock
              day={Number(displayDate.split("-")[2])}
              col={((new Date(oy, om - 1, 1).getDay() - settings.firstDay + 7) % 7 + Number(displayDate.split("-")[2]) - 1) % 7}
              row={Math.floor(((new Date(oy, om - 1, 1).getDay() - settings.firstDay + 7) % 7 + Number(displayDate.split("-")[2]) - 1) / 7)}
              totalDays={new Date(oy, om, 0).getDate()}
              offset={(new Date(oy, om - 1, 1).getDay() - settings.firstDay + 7) % 7}
              date={displayDate}
              onBack={closeDayPage}
              onSelectDate={(ds) => { setOpenDate(ds); setDisplayDate(ds); }}
            />
          </View>
          <Animated.View style={[{ flex: 1, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.08)" }, timelineAnimStyle]}>
            <DayTimeline date={displayDate} filter={[]} />
          </Animated.View>
        </Animated.View>
        );
      })()}

      {/* Infinite scroll months (hidden when overlay is showing) */}
      <View style={st.list}>
        <FlatList
          ref={listRef}
          data={months}
          keyExtractor={item => item.key}
          initialScrollIndex={scrollIdx}
          getItemLayout={(_, index) => ({ length: 360, offset: 360 * index, index })}
          renderItem={({ item }) => (
            <MonthBlock year={item.year} month={item.month} openDate={openDate} onSelectDate={ds => selectDate(ds || null)} timelineOpen={false} isActive={item.year === visibleYear && item.month === visibleMonth} />
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          snapToOffsets={months.map((_, i) => i * 360)}
          decelerationRate="fast"
          contentContainerStyle={{ paddingBottom: 40 }}
          style={{ flex: 1, scrollSnapType: "y mandatory" } as any}
        />
      </View>
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
    paddingBottom: 14,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", paddingRight: 1 },
  backTxt: { fontSize: 16, color: theme.fg, fontWeight: "600" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: theme.fg },
  dayRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.12)",
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
  overlay: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 5,
  },
  closeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  monthSection: { paddingHorizontal: 16, paddingTop: 16, height: 360, backgroundColor: "#000", borderTopWidth: 0.5, borderTopColor: "rgba(255,255,255,0.08)", scrollSnapAlign: "start" } as any,
  monthTitle: { fontSize: 14, fontWeight: "600", color: theme.fgMuted },
  monthBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8, backgroundColor: "rgba(255,255,255,0.05)" },
  monthBadgeActive: { backgroundColor: "#ff3b30" },
  monthTitleActive: { color: "#fff" },
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
  skeletonDay: { width: 20, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)" },
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
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#000",
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
