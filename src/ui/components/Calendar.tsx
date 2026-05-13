import { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from "react-native";
import { useStore } from "../../application/StoreContext";
import { todayStr } from "../../domain/calendarReducer";
import BubbleRing from "./BubbleRing";
import { theme } from "../theme/colors";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function dateStr(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function daysIn(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function startOff(y: number, m: number) { return new Date(y, m, 1).getDay(); }

function ringPos(i: number, total: number, r: number) {
  const a = (2 * Math.PI * i) / total - Math.PI / 2;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

type Props = {
  year: number; month: number;
  onNav: (y: number, m: number) => void;
  filter: string[];
  streakRange: { start: string; end: string } | null;
  onSelectDate?: (date: string) => void;
};

export default function Calendar({ year, month, onNav, filter, streakRange, onSelectDate }: Props) {
  const { state, dispatch } = useStore();
  const today = todayStr();
  const tagMap = useMemo(() => Object.fromEntries(state.tags.map((t) => [t.id, t])), [state.tags]);
  const [openCell, setOpenCell] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number>(new Date().getDate());
  const [cellSize, setCellSize] = useState(44);

  const total = daysIn(year, month);

  useEffect(() => {
    setCursor((c) => {
      const clamped = Math.min(c, total);
      const ds = dateStr(year, month, clamped);
      if (ds > today) {
        const t = new Date();
        if (t.getFullYear() === year && t.getMonth() === month) return t.getDate();
        return total;
      }
      return clamped;
    });
  }, [year, month, total, today]);

  useEffect(() => {
    onSelectDate?.(dateStr(year, month, cursor));
  }, [cursor, year, month, onSelectDate]);

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const prev = () => onNav(...(month === 0 ? [year - 1, 11] : [year, month - 1]) as [number, number]);
  const next = () => { if (!isCurrentMonth) onNav(...(month === 11 ? [year + 1, 0] : [year, month + 1]) as [number, number]); };

  const offset = startOff(year, month);

  return (
    <View style={st.wrap}>
      {/* Header */}
      <View style={st.header}>
        <Pressable onPress={prev} style={st.navBtn}><Text style={st.navTxt}>‹</Text></Pressable>
        <Text style={st.monthTitle}>{MONTHS[month]} {year}</Text>
        <Pressable onPress={next} style={[st.navBtn, isCurrentMonth && st.navDisabled]} disabled={isCurrentMonth}>
          <Text style={[st.navTxt, isCurrentMonth && { opacity: 0.2 }]}>›</Text>
        </Pressable>
      </View>

      {/* Day labels */}
      <View style={st.row}>
        {DAYS.map((d) => <Text key={d} style={st.dayLabel}>{d}</Text>)}
      </View>

      {/* Grid */}
      <View style={st.grid}>
        {/* Empty offset cells */}
        {Array.from({ length: offset }, (_, i) => <View key={`e${i}`} style={st.emptyCell} />)}

        {/* Day cells */}
        {Array.from({ length: total }, (_, i) => {
          const d = i + 1;
          const ds = dateStr(year, month, d);
          const isToday = ds === today;
          const activeIds = (state.entries[ds] ?? []).filter((id) => tagMap[id]);
          const isOpen = openCell === ds;
          const isFuture = ds > today;
          const inStreak = streakRange && ds >= streakRange.start && ds <= streakRange.end;
          const hasFiltered = filter.length > 0 && activeIds.some(id => filter.includes(id));
          const hasTags = state.tags.length > 0;
          const r = Math.max(14, Math.min(22, 10 + state.tags.length * 2.5));

          const cell = (
            <Pressable
              key={d}
              style={[
                st.cell,
                isToday && st.today,
                cursor === d && st.cursor,
                isOpen && st.selected,
                isOpen && isToday && { borderColor: "rgba(255,255,255,0.9)" },
                isFuture && st.future,
                inStreak ? st.streakCell : null,
                hasFiltered ? st.filteredCell : null,
              ]}
              onPress={() => {
                if (isFuture) return;
                setCursor(d);
                setOpenCell(isOpen ? null : ds);
              }}
              onLayout={(e: LayoutChangeEvent) => { if (d === 1) setCellSize(e.nativeEvent.layout.width); }}
            >
              {!isOpen && <View style={[
                st.dateNum,
                cursor === d && !isToday && st.dateNumCursor,
                isToday && st.dateNumToday,
              ]}>
                <Text style={[
                  st.dateNumTxt,
                  cursor === d && !isToday && st.dateNumCursorTxt,
                  isToday && st.dateNumTodayTxt,
                ]}>{d}</Text>
              </View>}

              {/* Mini emoji ring (closed state) */}
              {!isFuture && !isOpen && hasTags && state.tags.map((t, idx) => {
                const p = ringPos(idx, state.tags.length, r);
                const active = activeIds.includes(t.id);
                const hidden = filter.length > 0 && !filter.includes(t.id);
                if (hidden || !active) return null;
                return (
                  <Text
                    key={t.id}
                    style={[
                      st.bub,
                      active ? st.bubActive : st.bubInactive,
                      {
                        left: "50%",
                        top: "50%",
                        transform: [{ translateX: p.x - 6 }, { translateY: p.y - 6 }],
                        fontSize: state.tags.length > 6 ? 8 : state.tags.length > 4 ? 10 : 13,
                      },
                    ]}
                  >{t.emoji}
                  </Text>
                );
              })}

              {/* BubbleRing (open state) */}
              {!isFuture && isOpen && hasTags && (() => {
                const dayTimeSlots = state.timeEntries?.[ds] ?? [];
                const timeMap: Record<string, string> = {};
                for (const sl of dayTimeSlots) timeMap[sl.tagId] = sl.time;
                return (
                  <BubbleRing
                    key={ds}
                    bubbles={state.tags.map((t) => ({ id: t.id, emoji: t.emoji, active: activeIds.includes(t.id), time: activeIds.includes(t.id) ? timeMap[t.id] : undefined }))}
                    ringR={Math.max(cellSize * 0.3, cellSize * 0.1 + state.tags.length * 2)}
                    col={(offset + d - 1) % 7}
                    label={String(d)}
                    onToggle={(id) => dispatch({ type: "TOGGLE_EMOJI", date: ds, tagId: id })}
                  />
                );
              })()}
            </Pressable>
          );

          if (cursor !== d) return cell;

          // Multi-ring glow
          const ringColor = isToday ? "rgba(255,255,255," : "rgba(234,179,8,";
          return (
            <View key={d} style={[st.ring4, { borderColor: ringColor + "0.2)" }]}>
              <View style={[st.ring3, { borderColor: ringColor + "0.4)" }]}>
                <View style={[st.ring2, { borderColor: ringColor + "0.55)" }]}>
                  <View style={[st.ring1, { borderColor: ringColor + "0.7)" }]}>
                    {cell}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.fg,
  },
  navBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  navDisabled: {
    opacity: 0.2,
  },
  navTxt: {
    fontSize: 18,
    color: theme.fgMuted,
  },
  row: {
    flexDirection: "row",
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: theme.fgMuted,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  emptyCell: {
    width: "13.5%",
    aspectRatio: 1,
  },
  cell: {
    width: "13.5%",
    aspectRatio: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surfaceInset,
    borderWidth: 1,
    borderColor: "transparent",
    overflow: "visible",
  },
  today: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.4)",
  },
  selected: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(234,179,8,0.9)",
    overflow: "visible",
    zIndex: 10,
  },
  ring1: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.7)",
    padding: 3,
    overflow: "visible",
  },
  ring2: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.55)",
    padding: 3,
    overflow: "visible",
  },
  ring3: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.4)",
    padding: 3,
    overflow: "visible",
  },
  ring4: {
    width: "13.5%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.2)",
    padding: 3,
    overflow: "visible",
    zIndex: 10,
  },
  cursor: {
    flex: 1,
    width: "100%",
    aspectRatio: undefined,
    borderWidth: 0,
  },
  future: {
    opacity: 0.3,
  },
  streakCell: {
    backgroundColor: "rgba(255,140,0,0.12)",
    borderColor: "rgba(255,140,0,0.4)",
    shadowColor: "rgba(255,140,0,1)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  filteredCell: {
    backgroundColor: "rgba(234,179,8,0.1)",
    borderColor: "rgba(234,179,8,0.3)",
  },
  dateNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surfaceHover,
    borderWidth: 1,
    borderColor: theme.border,
    zIndex: 20,
  },
  dateNumTxt: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.fgMuted,
  },
  dateNumToday: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  dateNumTodayTxt: {
    color: "#000",
    fontWeight: "700",
  },
  dateNumCursor: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  dateNumCursorTxt: {
    color: "#000",
  },
  dateNumOpen: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  dateNumOpenTxt: {
    color: theme.accentLight,
  },
  bub: {
    position: "absolute",
    lineHeight: 14,
  },
  bubActive: {
    opacity: 1,
  },
  bubInactive: {
    opacity: 0.8,
  },
});
