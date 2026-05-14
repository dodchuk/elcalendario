import { useEffect } from "react";
import { Pressable, Text, StyleSheet, View, Dimensions } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, useFrameCallback, type SharedValue } from "react-native-reanimated";
import { theme } from "../theme/colors";
import { getEmojiGlowColor } from "../theme/tagColors";

type Bubble = { id: string; emoji: string; active: boolean; time?: string };
const R = 21;
const GAP = 14;
const MIN_DIST = R * 2 + GAP;
const SW = Dimensions.get("window").width;
const SH = Dimensions.get("window").height;

function flowerPos(i: number, n: number, ringR: number, col: number, row: number) {
  // For 5 or fewer: simple circle, shifted for edge rows
  if (n <= 5) {
    const orbitR = Math.max(R * 3, ringR * 0.7);
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    let x = Math.cos(angle) * orbitR;
    let y = Math.sin(angle) * orbitR;
    // Edge columns: flip and keep full distance
    if (col === 0 && x < 0) x = Math.abs(x);
    if (col === 6 && x > 0) x = -Math.abs(x);
    if (row === 0 && y < 0) y = Math.abs(y) * 0.6;
    if (row >= 4 && y > 0) y = -Math.abs(y) * 0.6;
    return { x, y };
  }

  const extraSpace = (col === 0 || col === 6) ? 1.4 : 1;
  const orbitR = Math.max(R * 2 + GAP, ringR * 0.55) * extraSpace;
  const angle = (2 * Math.PI * i) / n - Math.PI / 2;
  let x = Math.cos(angle) * orbitR;
  let y = Math.sin(angle) * orbitR;

  // Left columns: flip bubbles that go left to the right side
  if (col <= 1) {
    const limit = col === 0 ? 0 : -orbitR * 0.3;
    if (x < limit) x = Math.abs(x);
  }
  // Right columns: flip bubbles that go right to the left side
  if (col >= 5) {
    const limit = col === 6 ? 0 : orbitR * 0.3;
    if (x > limit) x = -Math.abs(x);
  }

  // Top row: flip bubbles that go up to below
  if (row === 0) {
    if (y < 0) y = Math.abs(y);
  }
  // Bottom rows (3+): flip bubbles that go down to above
  if (row >= 3) {
    if (y > 0) y = -Math.abs(y);
  }

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
        <View style={st.centerBub}>
          <Text style={st.centerTxt}>{bubble.emoji}</Text>
        </View>
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

export default function BubbleRing({ bubbles, ringR, onToggle, col = 3, row = 2, label }: {
  bubbles: Bubble[]; ringR: number; onToggle: (id: string) => void; col?: number; row?: number; label?: string;
}) {
  const centerBubble: Bubble = { id: "__center__", emoji: label ?? "", active: false };
  const all = label ? [centerBubble, ...bubbles] : bubbles;
  const n = bubbles.length;

  const makeHomes = (r: number) =>
    all.map((_, i) => i === 0 && label ? { x: 0, y: 0 } : flowerPos(label ? i - 1 : i, n, r, col, row));

  const homes = makeHomes(ringR);

  const xs = useSharedValue(homes.map(h => h.x));
  const ys = useSharedValue(homes.map(h => h.y));
  const vxs = useSharedValue(all.map(() => 0));
  const vys = useSharedValue(all.map(() => 0));
  const homeXs = useSharedValue(homes.map(h => h.x));
  const homeYs = useSharedValue(homes.map(h => h.y));
  const activeFlags = useSharedValue(all.map(b => b.active ? 1 : 0));
  const count = useSharedValue(all.length);
  const hasCenter = useSharedValue(label ? 1 : 0);
  const bound = useSharedValue(ringR * 1.5);
  const topBound = useSharedValue(-ringR * 1.5);
  const bottomBound = useSharedValue(ringR * 1.5);
  const leftBound = useSharedValue(-ringR * 1.5);
  const rightBound = useSharedValue(ringR * 1.5);
  const tick = useSharedValue(0);

  useEffect(() => {
    const h = makeHomes(ringR);
    homeXs.value = h.map(p => p.x);
    homeYs.value = h.map(p => p.y);
    xs.value = h.map(p => p.x);
    ys.value = h.map(p => p.y);
    vxs.value = all.map(() => 0);
    vys.value = all.map(() => 0);
    count.value = all.length;
    hasCenter.value = label ? 1 : 0;
    if (n > 5) {
      bound.value = ringR * 1.2;
      topBound.value = (row === 0 ? -ringR * 0.2 : row >= 3 ? -(SH * 0.4) : -ringR) + 20;
      bottomBound.value = (row >= 4 ? ringR * 0.2 : row === 3 ? ringR * 0.4 : row === 0 ? SH * 0.4 : ringR) - 20;
      leftBound.value = (col === 0 ? -ringR * 0.2 : col === 1 ? -ringR * 0.4 : col === 5 ? -(SW - 80) : col === 6 ? -(SW - 40) : -ringR) + 20;
      rightBound.value = (col === 6 ? ringR * 0.2 : col === 5 ? ringR * 0.4 : col === 1 ? SW - 80 : col === 0 ? SW - 40 : ringR) - 20;
    } else {
      bound.value = ringR * 1.5;
      topBound.value = -ringR * 1.5;
      bottomBound.value = ringR * 1.5;
      leftBound.value = -ringR * 1.5;
      rightBound.value = ringR * 1.5;
    }
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
    const flags = activeFlags.value;
    const t = tick.value + 1;
    tick.value = t;

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

      avx[i] *= 0.82;
      avy[i] *= 0.82;

      if (ax[i] < leftBound.value) avx[i] += 0.1 * (leftBound.value - ax[i]);
      if (ax[i] > rightBound.value) avx[i] += 0.1 * (rightBound.value - ax[i]);
      if (ay[i] < topBound.value) avy[i] += 0.1 * (topBound.value - ay[i]);
      if (ay[i] > bottomBound.value) avy[i] += 0.1 * (bottomBound.value - ay[i]);
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
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff3b30",
    borderWidth: 1,
    borderColor: "#ff3b30",
  },
  centerTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
  bub: {
    width: R * 2,
    height: R * 2,
    borderRadius: R,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(230,235,245,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  bubActive: {},
  bubInactive: { opacity: 0.8 },
  bubTxt: { fontSize: 22 },
  timeBadge: {
    position: "absolute",
    bottom: 2,
    alignSelf: "center",
    backgroundColor: theme.surfaceHover,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  timeTxt: { fontSize: 8, color: theme.fgMuted, fontWeight: "600" },
});
