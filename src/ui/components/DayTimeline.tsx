import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, LayoutChangeEvent } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, useFrameCallback, type SharedValue } from "react-native-reanimated";
import { useStore } from "../../application/StoreContext";
import { theme } from "../theme/colors";
import { getEmojiGlowColor } from "../theme/tagColors";

const pad = (n: number) => n.toString().padStart(2, "0");
const SLOTS = Array.from({ length: 96 }, (_, i) => `${pad(Math.floor(i / 4))}:${pad((i % 4) * 15)}`);
const ROW_H = 36;
const R = 21;

type Props = { date: string; filter: string[] };

function FloatBubbleView({ index, xs, ys, emoji, assigned, selected, onPress, color }: {
  index: number; xs: SharedValue<number[]>; ys: SharedValue<number[]>;
  emoji: string; assigned: boolean; selected: boolean; onPress: () => void; color?: string;
}) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (xs.value[index] ?? 0) - R }, { translateY: (ys.value[index] ?? 0) - R }],
  }));

  return (
    <Animated.View style={[st.floatWrap, animStyle]}>
      <Pressable style={[st.floatBub, assigned && color ? { backgroundColor: color + "80", boxShadow: `0 0 14px ${color}` } as any : null, selected && st.floatSelected]} onPress={onPress}>
        <Text style={st.floatTxt}>{emoji}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function DayTimeline({ date, filter }: Props) {
  const { state, dispatch } = useStore();
  const tagMap = useMemo(() => Object.fromEntries(state.tags.map((t) => [t.id, t])), [state.tags]);
  const allActiveIds = useMemo(() => (state.entries[date] ?? []).filter((id) => tagMap[id]), [state.entries, date, tagMap]);
  const activeIds = useMemo(() => filter.length ? allActiveIds.filter((id) => filter.includes(id)) : allActiveIds, [allActiveIds, filter]);
  const timeSlots = (state.timeEntries?.[date] ?? []).filter((sl) => activeIds.includes(sl.tagId));
  const slotMap: Record<string, string> = {};
  for (const sl of timeSlots) slotMap[sl.time] = sl.tagId;
  const tagSlot: Record<string, string> = {};
  for (const sl of timeSlots) tagSlot[sl.tagId] = sl.time;

  const [selected, setSelected] = useState<string | null>(null);
  // Auto-select single unassigned emoji for assignment (but don't show as selected)
  const unassigned = activeIds.filter(id => !tagSlot[id]);
  const effectiveSelected = selected ?? (unassigned.length === 1 ? unassigned[0] : null);
  const visualSelected = selected; // Only show selection highlight for manual selection
  const [containerW, setContainerW] = useState(300);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const viewH = useSharedValue(320);
  const scrollOffset = useRef(48 * ROW_H);

  const n = activeIds.length;

  // Shared value arrays for centralized physics
  const xs = useSharedValue<number[]>([]);
  const ys = useSharedValue<number[]>([]);
  const vxs = useSharedValue<number[]>([]);
  const vys = useSharedValue<number[]>([]);
  const targetXs = useSharedValue<number[]>([]);
  const targetYs = useSharedValue<number[]>([]);
  const assignedFlags = useSharedValue<number[]>([]);
  const bubCount = useSharedValue(0);
  const cw = useSharedValue(containerW);

  // Init bodies when activeIds change — preserve existing, add new
  useEffect(() => {
    const w = containerW;
    const h = 200; // visible float area height
    if (n === 0) { bubCount.value = 0; return; }
    const prevN = bubCount.value;
    if (prevN === 0 || n < prevN) {
      xs.value = activeIds.map(() => 60 + Math.random() * Math.max(w - 120, 40));
      ys.value = activeIds.map((_, i) => 30 + (i % 4) * 45);
      vxs.value = activeIds.map(() => (Math.random() - 0.5) * 0.5);
      vys.value = activeIds.map(() => (Math.random() - 0.5) * 0.5);
    } else if (n > prevN) {
      const diff = n - prevN;
      const curXs = xs.value.slice();
      const curYs = ys.value.slice();
      const curVxs = vxs.value.slice();
      const curVys = vys.value.slice();
      for (let i = 0; i < diff; i++) {
        curXs.push(60 + Math.random() * Math.max(w - 120, 40));
        curYs.push(30 + ((prevN + i) % 4) * 45);
        curVxs.push((Math.random() - 0.5) * 0.5);
        curVys.push((Math.random() - 0.5) * 0.5);
      }
      xs.value = curXs;
      ys.value = curYs;
      vxs.value = curVxs;
      vys.value = curVys;
    }
    bubCount.value = n;
  }, [n, date]);

  // Update targets when assignments change — snap assigned bubbles to position
  useEffect(() => {
    cw.value = containerW;
    const tx: number[] = [], ty: number[] = [], af: number[] = [];
    const curXs = xs.value.slice();
    const curYs = ys.value.slice();
    activeIds.forEach((id, i) => {
      const time = tagSlot[id];
      if (time) {
        const targetY = SLOTS.indexOf(time) * ROW_H + ROW_H / 2;
        tx.push(80);
        ty.push(targetY);
        af.push(1);
        // Snap position immediately
        if (curXs[i] !== undefined) { curXs[i] = 80; curYs[i] = targetY; }
      } else {
        tx.push(0); ty.push(0); af.push(0);
      }
    });
    xs.value = curXs;
    ys.value = curYs;
    targetXs.value = tx;
    targetYs.value = ty;
    assignedFlags.value = af;
  }, [tagSlot, activeIds, containerW]);

  // Scroll to 12:00 on mount
  const onContentReady = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 48 * ROW_H, animated: false });
  }, []);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerW(e.nativeEvent.layout.width);
    viewH.value = e.nativeEvent.layout.height;
  }, []);

  // Centralized physics with collision detection
  useFrameCallback(() => {
    "worklet";
    const nn = bubCount.value;
    if (nn === 0) return;
    const ax = xs.value.slice();
    const ay = ys.value.slice();
    const avx = vxs.value.slice();
    const avy = vys.value.slice();
    const tx = targetXs.value;
    const ty = targetYs.value;
    const af = assignedFlags.value;
    const w = cw.value;

    for (let i = 0; i < nn; i++) {
      if (af[i]) {
        // Smooth linear slide to target
        ax[i] += (tx[i] - ax[i]) * 0.08;
        ay[i] += (ty[i] - ay[i]) * 0.08;
        avx[i] = 0; avy[i] = 0;
      } else {
        // Free float within container bounds
        avx[i] += (Math.random() - 0.5) * 0.04;
        avy[i] += (Math.random() - 0.5) * 0.04;
        avx[i] *= 0.99; avy[i] *= 0.99;
        if (ax[i] < R + 20) { ax[i] = R + 20; avx[i] *= -0.5; }
        if (ax[i] > w - R - 20) { ax[i] = w - R - 20; avx[i] *= -0.5; }
        if (ay[i] < R + 20) { ay[i] = R + 20; avy[i] *= -0.5; }
        if (ay[i] > viewH.value - R - 20) { ay[i] = viewH.value - R - 20; avy[i] *= -0.5; }
      }
    }

    // Collision detection — only displace unassigned bubbles
    for (let i = 0; i < nn; i++) {
      for (let j = i + 1; j < nn; j++) {
        const dx = ax[j] - ax[i], dy = ay[j] - ay[i];
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        if (dist < R * 2) {
          const nx = dx / dist, ny = dy / dist;
          const ov = (R * 2 - dist) / 2;
          if (!af[i]) { ax[i] -= nx * ov; ay[i] -= ny * ov; }
          if (!af[j]) { ax[j] += nx * ov; ay[j] += ny * ov; }
        }
      }
    }

    for (let i = 0; i < nn; i++) {
      ax[i] += avx[i];
      ay[i] += avy[i];
    }

    xs.value = ax;
    ys.value = ay;
    vxs.value = avx;
    vys.value = avy;
  });

  const assignToSlot = (time: string) => {
    const sel = effectiveSelected ?? (activeIds.length === 1 ? activeIds[0] : null);
    if (!sel) return;
    const cur = slotMap[time];
    if (cur === sel) {
      dispatch({ type: "DEL_TIME_SLOT", date, tagId: sel, time });
    } else {
      if (cur) dispatch({ type: "DEL_TIME_SLOT", date, tagId: cur, time });
      // Remove ALL existing time slots for this emoji
      const existing = timeSlots.filter(sl => sl.tagId === sel);
      for (const sl of existing) dispatch({ type: "DEL_TIME_SLOT", date, tagId: sel, time: sl.time });
      dispatch({ type: "SET_TIME_SLOT", date, tagId: sel, time });
    }
    setSelected(null);
  };

  const handleBubblePress = (id: string) => {
    const time = tagSlot[id];
    if (time) {
      dispatch({ type: "DEL_TIME_SLOT", date, tagId: id, time });
      setSelected(null);
    } else {
      setSelected(selected === id ? null : id);
    }
  };

  if (!activeIds.length) return null;

  return (
    <View style={st.wrap} onLayout={onLayout}>
      <Animated.ScrollView
        ref={scrollRef}
        style={st.scroll}
        onLayout={onContentReady}
        scrollEventThrottle={16}
        onScroll={(e: any) => { scrollOffset.current = e.nativeEvent.contentOffset.y; }}
      >
        {/* Assigned bubbles inside scroll — they sit at their time row */}
        <View style={st.bubLayer} pointerEvents="box-none">
          {activeIds.map((id, i) => tagSlot[id] ? (
            <FloatBubbleView
              key={id} index={i} xs={xs} ys={ys}
              emoji={tagMap[id].emoji}
              assigned={true}
              selected={visualSelected === id}
              color={getEmojiGlowColor(tagMap[id]?.emoji ?? "", state.tags.findIndex(t => t.id === id))}
              onPress={() => handleBubblePress(id)}
            />
          ) : null)}
        </View>

        {/* Time rows */}
        {SLOTS.map((time) => {
          const isHour = time.endsWith(":00");
          const assignedTagId = slotMap[time];
          const assignedIdx = assignedTagId ? state.tags.findIndex(t => t.id === assignedTagId) : -1;
          const assignedColor = assignedTagId ? getEmojiGlowColor(tagMap[assignedTagId]?.emoji ?? "", assignedIdx) : null;
          return (
            <Pressable key={time} style={[st.row, isHour && st.rowHour, assignedColor && { backgroundColor: assignedColor + "18" }]} onPress={() => assignToSlot(time)}>
              <Text style={[st.time, isHour && st.timeHour, assignedColor && { color: assignedColor, fontWeight: "700" }]}>{time}</Text>
            </Pressable>
          );
        })}
      </Animated.ScrollView>

      {/* Unassigned bubbles — overlay, independent of scroll */}
      <View style={st.bubLayer} pointerEvents="box-none">
        {activeIds.map((id, i) => !tagSlot[id] ? (
          <FloatBubbleView
            key={id} index={i} xs={xs} ys={ys}
            emoji={tagMap[id].emoji}
            assigned={false}
            selected={visualSelected === id}
            onPress={() => handleBubblePress(id)}
          />
        ) : null)}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1, borderColor: theme.border, borderRadius: 12,
    marginTop: 0, overflow: "hidden",
    flex: 1,
  },
  scroll: { flex: 1 },
  bubLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  floatWrap: {
    position: "absolute", width: R * 2, height: R * 2,
  },
  floatBub: {
    width: R * 2, height: R * 2, borderRadius: R,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  floatAssigned: {
    backgroundColor: "rgba(255,100,0,0.18)",
    shadowColor: "#ff6400", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10,
  },
  floatSelected: {
    backgroundColor: "rgba(255,255,255,0.3)",
    shadowColor: "#fff", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8,
  },
  floatTxt: { fontSize: 20 },
  row: {
    height: ROW_H, flexDirection: "row", alignItems: "center",
    paddingLeft: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border,
  },
  rowHour: { borderBottomColor: theme.borderMuted },
  rowAssigned: { backgroundColor: "rgba(255,140,0,0.08)" },
  time: { fontSize: 11, color: theme.fgMuted, width: 44, fontVariant: ["tabular-nums"] },
  timeHour: { fontWeight: "600", color: theme.fg },
  timeAssigned: { color: "#ff8c00", fontWeight: "700" },
});
