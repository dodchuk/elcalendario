import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { theme } from "../theme/colors";

export default function ScreenProgressBar({ active }: { active: boolean }) {
  const width = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      width.value = 0;
      opacity.value = withTiming(1, { duration: 100 });
      width.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      width.value = 0;
    }
  }, [active]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as any,
    opacity: opacity.value,
  }));

  return (
    <View style={st.track}>
      <Animated.View style={[st.fill, barStyle]} />
    </View>
  );
}

const st = StyleSheet.create({
  track: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "transparent",
    zIndex: 100,
  },
  fill: {
    height: "100%",
    backgroundColor: theme.accent,
    borderRadius: 1,
  },
});
