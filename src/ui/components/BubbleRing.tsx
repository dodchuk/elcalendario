import { useEffect } from "react";
import { Pressable, Text, StyleSheet, View, Dimensions } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, useFrameCallback, type SharedValue } from "react-native-reanimated";
import { theme } from "../theme/colors";
import { getEmojiGlowColor } from "../theme/tagColors";

type Bubble = { id: string; emoji: string; active: boolean; time?: string };
const R = 21;
const GAP = 14;
const MIN_DIST = R * 2 + GAP;
const SW = Math.min(Dimensions.get("window").width, 393);
const SH = Math.min(Dimensions.get("window").height, 852);

function flowerPos(i: number, n: number, ringR: number, col: number, row: number, sp?: { x: number; y: number }) {
  const orbitR = Math.max(R * 2 + GAP, ringR * 0.55);

  // First column: half circle on right side only
  if (col === 0) {
    const angle = -Math.PI / 2 + (Math.PI * i) / Math.max(n - 1, 1);
    return { x: Math.cos(angle) * orbitR, y: Math.sin(angle) * orbitR };
  }

  // Last column: half circle on left side only
  if (col === 6) {
    const angle = Math.PI / 2 + (Math.PI * i) / Math.max(n - 1, 1);
    return { x: Math.cos(angle) * orbitR, y: Math.sin(angle) * orbitR };
  }

  // Other columns: full circle with space-aware flipping
  const left = sp ? sp.x - 20 - R * 2 : (col + 0.5) * (SW / 7) - 20;
  const right = sp ? SW - sp.x - 20 - R * 2 : SW - (col + 0.5) * (SW / 7) - 20;
  const top = sp ? sp.y - 80 - R * 2 : 100;
  const bottom = sp ? SH - sp.y - 20 - R * 2 : SH - 200;

  const angle = (2 * Math.PI * i) / n - Math.PI / 2;
  let x = Math.cos(angle) * orbitR;
  let y = Math.sin(angle) * orbitR;

  if (left < orbitR && x < 0) x = Math.abs(x);
  if (right < orbitR && x > 0) x = -Math.abs(x);
  if (top < orbitR && y < 0) y = Math.abs(y);
  if (bottom < orbitR && y > 0) y = -Math.abs(y);

  x = Math.max(-left, Math.min(right, x));
  y = Math.max(-top, Math.min(bottom, y));

  return { x, y };
}

function BubbleView({ index, tagIndex, xs, ys, bubble, isCenter, onToggle }: {
  index: number; tagIndex: number; xs: SharedValue<number[]>; ys: SharedValue<number[]>;
  bubble: Bubble; isCenter: boolean; onToggle: (id: string) => void;
}) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (xs.value[index] ?? 0) - R }, { translateY: (ys.value[index] ?? 0) - R }],
  }));

  if (isCenter) {
    return (
      <View style={st.centerWrap}>
        <View style={st.centerBub}><Text style={st.centerTxt}>{bubble.emoji}</Text></View>
      </View>
    );
  }

  const glowColor = getEmojiGlowColor(bubble.emoji, tagIndex);

  return (
    <Animated.View style={[st.bubWrap, animStyle]}>
      <Pressable
        style={[st.bub, bubble.active ? [st.bubActive, { backgroundColor: glowColor + "80", boxShadow: `0 0 14px ${glowColor}` } as any] : st.bubInactive]}
        onPress={() => onToggle(bubble.id)}
      >
        <Text style={st.bubTxt}>{bubble.emoji}</Text>
        {bubble.time && <View style={st.timeBadge}><Text style={st.timeTxt}>{bubble.time}</Text></View>}
      </Pressable>
    </Animated.View>
  );
}

export default function BubbleRing({ bubbles, ringR, onToggle, col = 3, row = 2, label, screenPos, visibleHeight }: {
  bubbles: Bubble[]; ringR: number; onToggle: (id: string) => void; col?: number; row?: number; label?: string;
  screenPos?: { x: number; y: number }; visibleHeight?: number;
}) {
  const centerBubble: Bubble = { id: "__center__", emoji: label ?? "", active: false };
  const all = label ? [centerBubble, ...bubbles] : bubbles;
  const n = bubbles.length;

  const makeHomes = (r: number) =>
    all.map((_, i) => i === 0 && label ? { x: 0, y: 0 } : flowerPos(label ? i - 1 : i, n, r, col, row, screenPos));

  const homes = makeHomes(ringR);

  // Walls: 20px from screen edges (absolute, not relative to calendar)
  const bL = screenPos ? screenPos.x - 20 : (col + 0.5) * (SW / 7) - 20;
  const bR = screenPos ? SW - screenPos.x - 20 : SW - (col + 0.5) * (SW / 7) - 20;
  const bT = screenPos ? screenPos.y - 80 : ringR * 1.2;
  const bB = screenPos ? (visibleHeight ?? SH) - screenPos.y - 20 : ringR * 1.2;

  // Clamp homes to stay within walls (bubble edge never touches wall)
  const safeHomes = homes.map(h => ({
    x: Math.max(-(bL - R), Math.min(bR - R, h.x)),
    y: Math.max(-(bT - R), Math.min(bB - R, h.y)),
  }));

  const xs = useSharedValue(all.map(() => 0));
  const ys = useSharedValue(all.map(() => 0));
  const vxs = useSharedValue(all.map(() => 0));
  const vys = useSharedValue(all.map(() => 0));
  const homeXs = useSharedValue(safeHomes.map(h => h.x));
  const homeYs = useSharedValue(safeHomes.map(h => h.y));
  const activeFlags = useSharedValue(all.map(b => b.active ? 1 : 0));
  const count = useSharedValue(all.length);
  const hasCenter = useSharedValue(label ? 1 : 0);
  const leftBound = useSharedValue(-bL);
  const rightBound = useSharedValue(bR);
  const topBound = useSharedValue(-bT);
  const bottomBound = useSharedValue(bB);

  useEffect(() => {
    const h = makeHomes(ringR);
    const safe = h.map(p => ({
      x: Math.max(-(bL - R), Math.min(bR - R, p.x)),
      y: Math.max(-(bT - R), Math.min(bB - R, p.y)),
    }));
    homeXs.value = safe.map(p => p.x);
    homeYs.value = safe.map(p => p.y);
    xs.value = all.map(() => 0);
    ys.value = all.map(() => 0);
    vxs.value = all.map(() => 0);
    vys.value = all.map(() => 0);
    count.value = all.length;
    hasCenter.value = label ? 1 : 0;
    leftBound.value = -bL;
    rightBound.value = bR;
    topBound.value = -bT;
    bottomBound.value = bB;
    activeFlags.value = all.map(b => b.active ? 1 : 0);
  }, [bubbles.length, ringR, col, label]);

  useEffect(() => {
    activeFlags.value = all.map(b => b.active ? 1 : 0);
  }, [bubbles.map(b => b.active).join(",")]);

  useFrameCallback(() => {
    "worklet";
    const nn = count.value;
    const ax = xs.value.slice();
    const ay = ys.value.slice();
    const avx = vxs.value.slice();
    const avy = vys.value.slice();
    const hx = homeXs.value;
    const hy = homeYs.value;
    const center = hasCenter.value;

    for (let i = 0; i < nn; i++) {
      if (i === 0 && center) {
        ax[i] = 0; ay[i] = 0; avx[i] = 0; avy[i] = 0;
        continue;
      }

      const dx = hx[i] - ax[i], dy = hy[i] - ay[i];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        const pull = 0.018 * dist;
        avx[i] += (dx / dist) * pull * 0.1;
        avy[i] += (dy / dist) * pull * 0.1;
      }

      avx[i] *= 0.88;
      avy[i] *= 0.88;
    }

    for (let i = 0; i < nn; i++) {
      for (let j = i + 1; j < nn; j++) {
        const dx = ax[j] - ax[i], dy = ay[j] - ay[i];
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        if (dist < MIN_DIST) {
          const nx = dx / dist, ny = dy / dist;
          const push = (MIN_DIST - dist) * 0.3;
          const iFixed = i === 0 && center;
          if (iFixed) {
            ax[j] += nx * push * 2; ay[j] += ny * push * 2;
          } else {
            ax[i] -= nx * push * 0.5; ay[i] -= ny * push * 0.5;
            ax[j] += nx * push * 0.5; ay[j] += ny * push * 0.5;
          }
        }
      }
    }

    for (let i = 0; i < nn; i++) {
      if (i === 0 && center) continue;
      ax[i] += avx[i];
      ay[i] += avy[i];
      // Wall bounce — 20px from screen edges
      if (ax[i] < leftBound.value + R) { ax[i] = leftBound.value + R; avx[i] = Math.abs(avx[i]) * 0.3; }
      if (ax[i] > rightBound.value - R) { ax[i] = rightBound.value - R; avx[i] = -Math.abs(avx[i]) * 0.3; }
      if (ay[i] < topBound.value + R) { ay[i] = topBound.value + R; avy[i] = Math.abs(avy[i]) * 0.3; }
      if (ay[i] > bottomBound.value - R) { ay[i] = bottomBound.value - R; avy[i] = -Math.abs(avy[i]) * 0.3; }
    }

    xs.value = ax;
    ys.value = ay;
    vxs.value = avx;
    vys.value = avy;
  });

  return (
    <View style={st.container} pointerEvents="box-none">
      {all.map((b, i) => (
        <BubbleView key={b.id} index={i} tagIndex={label ? i - 1 : i} xs={xs} ys={ys} bubble={b} isCenter={i === 0 && !!label} onToggle={onToggle} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  bubWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: R * 2,
    height: R * 2,
  },
  centerWrap: {
    position: "absolute",
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  centerBub: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#ff3b30", borderWidth: 1, borderColor: "#ff3b30",
  },
  centerTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
  bub: {
    width: R * 2, height: R * 2, borderRadius: R,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(230,235,245,0.2)",
    shadowColor: "#000", shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12,
  },
  bubActive: {},
  bubInactive: { opacity: 0.8 },
  bubTxt: { fontSize: 22 },
  timeBadge: {
    position: "absolute", bottom: 2, alignSelf: "center",
    backgroundColor: theme.surfaceHover, borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  timeTxt: { fontSize: 8, color: theme.fgMuted, fontWeight: "600" },
});
