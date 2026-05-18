import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, Easing, withDelay,
} from "react-native-reanimated";
import { theme } from "../theme/colors";

type Props = { onSignIn: () => void; onSignUp: () => void };

export default function WelcomeScreen({ onSignIn }: Props) {
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const barWidth = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    logoScale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.2)) });
    pulseOpacity.value = withDelay(600,
      withRepeat(withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ), -1, true)
    );
    // Loading bar fills then navigates
    barWidth.value = withDelay(200,
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
    );
    const timer = setTimeout(onSignIn, 1400);
    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%` as any,
    opacity: pulseOpacity.value,
  }));

  return (
    <LinearGradient colors={["#0a0a0a", "#1a1a1a", "#0a0a0a"]} style={st.container}>
      <Animated.View style={[st.logoWrap, logoStyle]}>
        <View style={st.logoSkeleton} />
      </Animated.View>

      <View style={st.barTrack}>
        <Animated.View style={[st.barFill, barStyle]} />
      </View>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 152,
    padding: 48,
  },
  logoWrap: { alignItems: "center", marginBottom: 80 },
  logoSkeleton: { width: 60, height: 60, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)" },
  barTrack: {
    position: "absolute",
    bottom: 120,
    width: 180,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.border,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: theme.accent,
  },
});
