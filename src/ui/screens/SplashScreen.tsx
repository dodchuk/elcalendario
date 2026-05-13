import { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, withSequence, Easing } from "react-native-reanimated";
import { theme } from "../theme/colors";

const { width, height } = Dimensions.get("window");
const BUBBLES = ["📅", "🔥", "⭐", "✨", "💛", "🎯", "🏆", "💪", "🌟", "❤️", "🎉", "☀️"];

function Bubble({ emoji, index }: { emoji: string; index: number }) {
  const angle = (2 * Math.PI * index) / BUBBLES.length;
  const r = 120;
  const cx = Math.cos(angle) * r;
  const cy = Math.sin(angle) * r;

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 400 }));
    scale.value = withDelay(index * 80, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.5)) }));
    translateY.value = withDelay(index * 80 + 500,
      withRepeat(withSequence(
        withTiming(-6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ), -1, true)
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: cx }, { translateY: cy + translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[st.bubble, animStyle]}>
      <Text style={st.bubbleText}>{emoji}</Text>
    </Animated.View>
  );
}

export default function SplashScreen() {
  return (
    <View style={st.container}>
      <View style={st.center}>
        {BUBBLES.map((e, i) => <Bubble key={i} emoji={e} index={i} />)}
        <Text style={st.logo}>📅</Text>
        <Text style={st.title}>El Calendario</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", justifyContent: "center" },
  logo: { fontSize: 56 },
  title: { fontSize: 20, fontWeight: "700", color: theme.fg, marginTop: 12 },
  bubble: { position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(230,235,245,0.15)", alignItems: "center", justifyContent: "center" },
  bubbleText: { fontSize: 22 },
});
