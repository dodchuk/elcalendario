import { useEffect } from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, useFrameCallback, type SharedValue } from "react-native-reanimated";
import { theme } from "../theme/colors";

type Bubble = { id: string; emoji: string; active: boolean; time?: string };
const R = 21;

function homePos(i: number, n: number, r: number, col: number) {
  const shift = col === 0 ? r * 0.35 : col === 6 ? -r * 0.35 : 0;
  const angle = (2 * Math.PI * i) / n - Math.PI / 2;
  const wave = r * (1.0 + 0.3 * Math.sin(i * 2.5));
  return { x: Math.cos(angle) * wave + shift, y: Math.sin(angle) * wave };
}

function BubbleView({ index, xs, ys, bubble, onToggle }: {
  index: number; xs: SharedValue<number[]>; ys: SharedValue<number[]>;
  bubble: Bubble; onToggle: (id: string) => void;
}) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (xs.value[index] ?? 0) - R }, { translateY: (ys.value[index] ?? 0) - R }],
  }));

  return (
    <Animated.View style={[st.bubWrap, animStyle]}>
      <Pressable style={[st.bub, bubble.active ? st.bubActive : st.bubInactive]} onPress={() => onToggle(bubble.id)}>
        <Text style={st.bubTxt}>{bubble.emoji}</Text>
        {bubble.time && <View style={st.timeBadge}><Text style={st.timeTxt}>{bubble.time}</Text></View>}
      </Pressable>
    </Animated.View>
  );
}

export default function BubbleRing({ bubbles, ringR, onToggle, col = 3 }: {
  bubbles: Bubble[]; ringR: number; onToggle: (id: string) => void; col?: number;
}) {
  const n = bubbles.length;
  const homes = bubbles.map((_, i) => homePos(i, n, ringR, col));

  const xs = useSharedValue(homes.map(h => h.x));
  const ys = useSharedValue(homes.map(h => h.y));
  const vxs = useSharedValue(homes.map(() => (Math.random() - 0.5) * 0.3));
  const vys = useSharedValue(homes.map(() => (Math.random() - 0.5) * 0.3));

  // Precompute homes as flat arrays for worklet access
  const homeXs = useSharedValue(homes.map(h => h.x));
  const homeYs = useSharedValue(homes.map(h => h.y));
  const count = useSharedValue(n);
  const bound = useSharedValue(ringR * 1.2);
  const leftBound = useSharedValue(-ringR * 1.2);
  const rightBound = useSharedValue(ringR * 1.2);

  useEffect(() => {
    const h = bubbles.map((_, i) => homePos(i, bubbles.length, ringR, col));
    homeXs.value = h.map(p => p.x);
    homeYs.value = h.map(p => p.y);
    count.value = bubbles.length;
    bound.value = ringR * 1.2;
    // Asymmetric X bounds for edge columns
    leftBound.value = col === 0 ? -ringR * 0.3 : -ringR * 1.2;
    rightBound.value = col === 6 ? ringR * 0.7 : ringR * 1.2;
  }, [bubbles.length, ringR, col]);

  useFrameCallback(() => {
    "worklet";
    const nn = count.value;
    const bnd = bound.value;
    const ax = xs.value.slice();
    const ay = ys.value.slice();
    const avx = vxs.value.slice();
    const avy = vys.value.slice();
    const hx = homeXs.value;
    const hy = homeYs.value;

    for (let i = 0; i < nn; i++) {
      const dx = hx[i] - ax[i], dy = hy[i] - ay[i];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 25) {
        const pull = 0.005 * (dist - 25);
        avx[i] += (dx / dist) * pull;
        avy[i] += (dy / dist) * pull;
      }
      avx[i] += (Math.random() - 0.5) * 0.06;
      avy[i] += (Math.random() - 0.5) * 0.06;
      avx[i] *= 0.98;
      avy[i] *= 0.98;
      // Center repulsion
      const cd = Math.sqrt(ax[i] * ax[i] + ay[i] * ay[i]) || 0.1;
      if (cd < 30) {
        const push = 0.15 * (30 - cd);
        avx[i] += (ax[i] / cd) * push;
        avy[i] += (ay[i] / cd) * push;
      }
      // Bounds
      if (ax[i] < leftBound.value) avx[i] += 0.1 * (leftBound.value - ax[i]);
      if (ax[i] > rightBound.value) avx[i] += 0.1 * (rightBound.value - ax[i]);
      if (ay[i] < -bnd) avy[i] += 0.1 * (-bnd - ay[i]);
      if (ay[i] > bnd) avy[i] += 0.1 * (bnd - ay[i]);
    }

    // Collision detection — pairwise overlap resolution + velocity exchange
    for (let i = 0; i < nn; i++) {
      for (let j = i + 1; j < nn; j++) {
        const dx = ax[j] - ax[i], dy = ay[j] - ay[i];
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        if (dist < R * 2) {
          const nx = dx / dist, ny = dy / dist;
          const overlap = (R * 2 - dist) / 2;
          ax[i] -= nx * overlap; ay[i] -= ny * overlap;
          ax[j] += nx * overlap; ay[j] += ny * overlap;
          const dot = (avx[i] - avx[j]) * nx + (avy[i] - avy[j]) * ny;
          if (dot > 0) {
            avx[i] -= 0.4 * dot * nx; avy[i] -= 0.4 * dot * ny;
            avx[j] += 0.4 * dot * nx; avy[j] += 0.4 * dot * ny;
          }
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

  return (
    <View style={st.container} pointerEvents="box-none">
      {bubbles.map((b, i) => (
        <BubbleView key={b.id} index={i} xs={xs} ys={ys} bubble={b} onToggle={onToggle} />
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
    width: R * 2,
    height: R * 2,
  },
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
  bubActive: {
    backgroundColor: "rgba(255,100,0,0.5)",
    shadowColor: "#ff6400",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
  },
  bubInactive: {
    opacity: 0.8,
  },
  bubTxt: { fontSize: 22 },
  timeBadge: {
    position: "absolute",
    bottom: -10,
    right: -14,
    backgroundColor: theme.surfaceHover,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  timeTxt: { fontSize: 8, color: theme.fgMuted, fontWeight: "600" },
});
