import { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { useStore } from "../../application/StoreContext";
import BubbleRing from "./BubbleRing";
import { theme } from "../theme/colors";

const SW = Math.min(Dimensions.get("window").width, 393);

type Props = {
  day: number;
  col: number;
  row: number;
  totalDays: number;
  offset: number;
  date: string;
  blockHeight?: number;
  onBack?: () => void;
};

export default function DayFocusBlock({ day, col, row, totalDays, offset, date, blockHeight = 300, onBack }: Props) {
  const { state, dispatch } = useStore();
  const tagMap = useMemo(() => Object.fromEntries(state.tags.map(t => [t.id, t])), [state.tags]);
  const activeIds = (state.entries[date] ?? []).filter(id => tagMap[id]);
  const dayTimeSlots = state.timeEntries?.[date] ?? [];
  const timeMap: Record<string, string> = {};
  for (const sl of dayTimeSlots) timeMap[sl.tagId] = sl.time;

  // Block dimensions for boundaries
  const blockW = SW - 32; // padding 16 each side
  const cellW = blockW / 7;
  // Cell center position within this block
  const cellX = 16 + (col + 0.5) * cellW;
  const cellY = 8 + (row + 0.5) * cellW;

  // Boundaries: distance from cell center to block edges
  // BubbleRing uses these to keep emojis inside this block
  const screenPos = {
    x: cellX,
    y: cellY,
  };
  // Override visibleHeight to block height so bubbles stay within
  const visibleH = blockHeight;

  const cells = Array.from({ length: totalDays + offset }, (_, i) => {
    const isOffset = i < offset;
    const d = i - offset + 1;
    const isSelected = d === day;

    if (isOffset) return <View key={`e${i}`} style={st.cell} />;

    if (isSelected) {
      return (
        <View key={d} style={[st.cell, st.selectedCell]}>
          <BubbleRing
            key={date}
            bubbles={state.tags.map(t => ({ id: t.id, emoji: t.emoji, active: activeIds.includes(t.id), time: activeIds.includes(t.id) ? timeMap[t.id] : undefined }))}
            ringR={Math.min(Math.max(cellW * 0.3, state.tags.length * 12), cellW * 3)}
            col={col}
            row={row}
            label={String(d)}
            screenPos={screenPos}
            visibleHeight={visibleH}
            onToggle={id => dispatch({ type: "TOGGLE_EMOJI", date, tagId: id })}
          />
          {onBack && (
            <Pressable onPress={onBack} style={st.centerTap} />
          )}
        </View>
      );
    }

    return (
      <View key={d} style={st.cell}>
        <View style={st.skeleton} />
      </View>
    );
  });

  return <View style={st.container}>{cells}</View>;
}

const st = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 8,
    overflow: "visible",
  },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCell: {
    overflow: "visible",
    zIndex: 10,
  },
  centerTap: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    zIndex: 20,
  },
  skeleton: {
    width: 20,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
