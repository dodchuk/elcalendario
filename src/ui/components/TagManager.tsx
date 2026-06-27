import { useMemo, useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions, LayoutChangeEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, useFrameCallback, type SharedValue } from "react-native-reanimated";
import { useStore } from "../../application/StoreContext";
import { getEmojiGlowColor } from "../theme/tagColors";
import { theme } from "../theme/colors";

const ALL_EMOJIS = [
  "🏋️","🧘","🏊","⚽","🏀","🎾","🥊","🏄","🏂","⛷️","🧗","🤸","💪","🤾","🏌️","🏇","🥋","🎳","🏓","⛸️",
  "🚴","🏍️","🏎️","🚕","🛵","🛴","🚌","✈️","⛵","🚶","🏃","🛶","🚃","🚁",
  "⛰️","🌲","🏖️","🌊","🌤️","🌅","🌄","🎣","🌿","🦋",
  "❤️‍🔥","👫","🥂","🍷","🎉","💌","🎊","🎂","🎁",
  "☕","🍳","🥗","🍕","🍔","🍰","🍺","🧋","🍽️","🥐","🥤",
  "💻","📚","✏️","💼","🎓","🧠","💡","⏰",
  "😴","💊","🧹","🛁","💆","🧖","💉","🦷","🧊",
  "🎮","🎨","🎸","🎤","🎧","🪴","🎹","🧶","✂️","🎭",
  "🏠","👕","🪥","🚿","🛏️","📦","🔑","🧽",
  "💰","🧾","📬",
  "⭐","🏆","💎",
  "🐕","🐟","🦜",
  "🕯️","🌙","🩸","💧",
];
const N = ALL_EMOJIS.length;
const R = 22;
const COLS = 6;
const SPACING = 64;

const PAD = 10;

// Grid positions filling the screen
function initPositions(w: number) {
  const cellW = w / COLS;
  return ALL_EMOJIS.map((_, i) => ({
    x: (i % COLS) * cellW + cellW / 2,
    y: Math.floor(i / COLS) * SPACING + SPACING / 2,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
  }));
}

let _id = 0;
function genId() { return `tag-${Date.now()}-${_id++}`; }

function Bubble({ index, xs, ys, emoji, active, globalIdx, onPress }: {
  index: number; xs: SharedValue<number[]>; ys: SharedValue<number[]>;
  emoji: string; active: boolean; globalIdx: number; onPress: () => void;
}) {
  const color = getEmojiGlowColor(emoji, globalIdx);
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (xs.value[index] ?? 0) - R },
      { translateY: (ys.value[index] ?? 0) - R },
    ],
  }));

  return (
    <Animated.View style={[st.bubWrap, animStyle]}>
      <Pressable
        onPress={onPress}
        style={[st.bub, active && { backgroundColor: color + "80", boxShadow: `0 0 12px ${color}` } as any]}
      >
        <Text style={st.bubTxt}>{emoji}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function TagManager() {
  const { state, dispatch } = useStore();
  const [containerW, setContainerW] = useState(Dimensions.get("window").width - 32);
  const [containerH, setContainerH] = useState(600);

  const activeSet = useMemo(() => new Set(state.tags.map(t => t.emoji)), [state.tags]);

  const contentH = Math.ceil(N / COLS) * SPACING + SPACING;

  // Physics shared values
  const xs = useSharedValue<number[]>([]);
  const ys = useSharedValue<number[]>([]);
  const vxs = useSharedValue<number[]>([]);
  const vys = useSharedValue<number[]>([]);
  const count = useSharedValue(0);
  const width = useSharedValue(containerW);
  const height = useSharedValue(containerH);

  // Init positions
  useMemo(() => {
    const pos = initPositions(containerW);
    xs.value = pos.map(p => p.x);
    ys.value = pos.map(p => p.y);
    vxs.value = pos.map(p => p.vx);
    vys.value = pos.map(p => p.vy);
    count.value = N;
    width.value = containerW;
    height.value = containerH;
  }, [containerW, containerH]);

  // Gentle drift with home pull
  useFrameCallback(() => {
    "worklet";
    const nn = count.value;
    if (nn === 0) return;
    const ax = xs.value.slice();
    const ay = ys.value.slice();
    const avx = vxs.value.slice();
    const avy = vys.value.slice();
    const w = width.value;
    const cellW = w / COLS;

    for (let i = 0; i < nn; i++) {
      const homeX = (i % COLS) * cellW + cellW / 2;
      const homeY = Math.floor(i / COLS) * SPACING + SPACING / 2;
      avx[i] += (homeX - ax[i]) * 0.003;
      avy[i] += (homeY - ay[i]) * 0.003;
      avx[i] += (Math.random() - 0.5) * 0.02;
      avy[i] += (Math.random() - 0.5) * 0.02;
      avx[i] *= 0.96;
      avy[i] *= 0.96;
      ax[i] += avx[i];
      ay[i] += avy[i];
      if (ax[i] < R + PAD) { ax[i] = R + PAD; avx[i] *= -0.5; }
      if (ax[i] > w - R - PAD) { ax[i] = w - R - PAD; avx[i] *= -0.5; }
    }

    xs.value = ax;
    ys.value = ay;
    vxs.value = avx;
    vys.value = avy;
  });

  const toggle = useCallback((emoji: string) => {
    if (activeSet.has(emoji)) {
      const tag = state.tags.find(t => t.emoji === emoji);
      if (tag) dispatch({ type: "DEL_TAG", id: tag.id });
    } else {
      dispatch({ type: "ADD_TAG", tag: { id: genId(), emoji } });
    }
  }, [activeSet, state.tags, dispatch]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerW(e.nativeEvent.layout.width);
    setContainerH(e.nativeEvent.layout.height);
  }, []);

  // Viewport culling
  const [scrollY, setScrollY] = useState(0);
  const visibleBubbles = useMemo(() => {
    const top = scrollY - R * 2;
    const bottom = scrollY + containerH + R * 2;
    return ALL_EMOJIS.map((emoji, i) => {
      const homeY = Math.floor(i / COLS) * SPACING + SPACING / 2;
      if (homeY < top || homeY > bottom) return null;
      return { emoji, index: i };
    }).filter(Boolean) as { emoji: string; index: number }[];
  }, [scrollY, containerH, containerW]);

  return (
    <View style={st.wrap} onLayout={onLayout}>
      <View style={st.header}>
        <Text style={st.title}>Emojis</Text>
        <View style={st.badge}>
          <Text style={st.badgeTxt}>{state.tags.length}</Text>
        </View>
      </View>
      <Animated.ScrollView
        style={st.scroll}
        contentContainerStyle={{ height: contentH }}
        scrollEventThrottle={16}
        onScroll={(e: any) => setScrollY(e.nativeEvent.contentOffset.y)}
      >
        <View style={st.field} pointerEvents="box-none">
          {visibleBubbles.map(({ emoji, index }) => (
            <Bubble
              key={emoji}
              index={index}
              xs={xs}
              ys={ys}
              emoji={emoji}
              active={activeSet.has(emoji)}
              globalIdx={index}
              onPress={() => toggle(emoji)}
            />
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#000", paddingBottom: 60 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8,
  },
  title: { fontSize: 18, fontWeight: "600", color: theme.fg },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)" },
  badgeTxt: { fontSize: 13, fontWeight: "500", color: theme.fgMuted },
  count: { fontSize: 13, color: theme.fgMuted },
  scroll: { flex: 1 },
  field: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bubWrap: { position: "absolute", width: R * 2, height: R * 2 },
  bub: {
    width: R * 2, height: R * 2, borderRadius: R,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  bubTxt: { fontSize: 20 },
});
