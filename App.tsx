import { useState, useCallback, useEffect, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Text, Pressable, Platform } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, useFrameCallback, withRepeat, withTiming, Easing, type SharedValue } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { StoreProvider, useStore } from "./src/application/StoreContext";
import { SettingsProvider, useSettings } from "./src/application/SettingsContext";
import { AuthProvider, useAuth } from "./src/application/AuthContext";
import TagManager from "./src/ui/components/TagManager";
import Dashboard from "./src/ui/components/Dashboard";
import Calendar from "./src/ui/components/Calendar";
import YearView from "./src/ui/components/YearView";
import MonthView from "./src/ui/components/MonthView";
import DayTimeline from "./src/ui/components/DayTimeline";
import WelcomeScreen from "./src/ui/screens/WelcomeScreen";
import SignInScreen from "./src/ui/screens/SignInScreen";
import SignUpScreen from "./src/ui/screens/SignUpScreen";
import FindAccountScreen from "./src/ui/screens/FindAccountScreen";
import ProfileScreen from "./src/ui/screens/ProfileScreen";
import ScreenProgressBar from "./src/ui/components/ScreenProgressBar";
import { theme } from "./src/ui/theme/colors";

function pad(n: number) { return n.toString().padStart(2, "0"); }

type Tab = "emojis" | "calendar" | "dashboard" | "profile";

function Main() {
  const [tab, setTab] = useState<Tab>("calendar");
  const [prevTab, setPrevTab] = useState<Tab>("calendar");
  const [loading, setLoading] = useState(false);
  const { state } = useStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [calMonth, setCalMonth] = useState<number | null>(null);
  const [filter, setFilter] = useState<string[]>([]);
  const [streakRange, setStreakRange] = useState<{ start: string; end: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const onNav = useCallback((y: number, m: number) => { setYear(y); setMonth(m); }, []);

  return (
    <View style={st.main}>
      {tab === "calendar" && <LavaBg />}
      <ScreenProgressBar active={loading} />
      {/* Header */}
      {tab !== "profile" && (
      <View style={[st.appHeader, tab === "emojis" && { backgroundColor: "#000" }]}>
        <View style={st.logoSkeleton} />
        <Pressable onPress={() => { setPrevTab(tab); setTab("profile"); }} style={st.profileBtn}>
          <Ionicons name="person-outline" size={18} color={theme.fg} />
        </Pressable>
      </View>
      )}

      {tab === "profile" ? (
        <ProfileScreen onClose={() => setTab(prevTab)} />
      ) : (
      <View style={st.body}>
        {tab === "emojis" && (
          <TagManager />
        )}
        {tab === "calendar" && (
          calMonth !== null ? (
            <MonthView
              initialYear={year}
              initialMonth={calMonth}
              onBack={(y) => { setYear(y); setCalMonth(null); }}
              onMonthChange={(y, m) => { setYear(y); setMonth(m); setCalMonth(m); }}
            />
          ) : (
            <YearView initialYear={year} onSelectMonth={(y, m) => { setYear(y); setCalMonth(m); }} onYearChange={setYear} />
          )
        )}
        {tab === "dashboard" && (
          <Dashboard year={year} month={calMonth ?? month} initViewMode={calMonth !== null ? "month" : "year"} onChangeYear={setYear} onChangeMonth={(m) => { setMonth(m); setCalMonth(m); }} />
        )}
      </View>
      )}

      {/* Bottom tab bar */}
      <View style={st.tabBar}>
        <Pressable style={st.tab} onPress={() => { setTab("emojis"); }}>
          <View style={{ position: "relative" }}>
            <View style={[st.tabBubble, tab === "emojis" && st.tabBubbleActive]}>
              <Ionicons name={tab === "emojis" ? "happy" : "happy-outline"} size={22} color={tab === "emojis" ? "#fff" : theme.fgMuted} />
            </View>
            <View style={st.tabCountBadge}><Text style={st.tabCountTxt}>{state.tags.length}</Text></View>
          </View>
          <Text style={[st.tabLabel, tab === "emojis" && st.tabLabelActive]}>Emojis</Text>
        </Pressable>
        <Pressable style={st.tabCenter} onPress={() => { setTab("calendar"); }}>
          <View style={[st.tabCenterCircle, tab === "calendar" && st.tabCenterActive]}>
            <Ionicons name={tab === "calendar" ? "calendar" : "calendar-outline"} size={28} color={tab === "calendar" ? "#fff" : theme.fgMuted} />
          </View>
        </Pressable>
        <Pressable style={st.tab} onPress={() => { setTab("dashboard"); }}>
          <View style={[st.tabBubble, tab === "dashboard" && st.tabBubbleActive]}>
            <Ionicons name={tab === "dashboard" ? "stats-chart" : "stats-chart-outline"} size={22} color={tab === "dashboard" ? "#fff" : theme.fgMuted} />
          </View>
          <Text style={[st.tabLabel, tab === "dashboard" && st.tabLabelActive]}>Dashboard</Text>
        </Pressable>
      </View>
    </View>
  );
}

type AuthScreen = "welcome" | "signin" | "signup" | "find";

function AuthFlow() {
  const [screen, setScreen] = useState<AuthScreen>("signin");
  const [transitioning, setTransitioning] = useState(false);

  const navigate = (to: AuthScreen) => {
    setTransitioning(true);
    setTimeout(() => { setScreen(to); setTransitioning(false); }, 350);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenProgressBar active={transitioning} />
      {screen === "welcome" && <WelcomeScreen onSignIn={() => navigate("signin")} onSignUp={() => navigate("signup")} />}
      {screen === "signin" && <SignInScreen onBack={() => navigate("welcome")} onFindAccount={() => navigate("find")} />}
      {screen === "signup" && <SignUpScreen onBack={() => navigate("welcome")} />}
      {screen === "find" && <FindAccountScreen onBack={() => navigate("signin")} />}
    </View>
  );
}

function Root() {
  const { user } = useAuth();
  return user ? <Main /> : <AuthFlow />;
}



const BLOB_COUNT = 12;
function getDayPhase() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 0; // morning
  if (h >= 12 && h < 18) return 1; // daytime
  if (h >= 18 && h < 22) return 2; // evening
  return 3; // night
}

const BLOB_COLOR_SETS = [
  // Morning - soft warm pastels
  ["#ffaa4420", "#ffcc6618", "#ff884418", "#ffdd8815", "#ffbb5518", "#ffcc7715", "#ff995520", "#ffee9915", "#ffaa6618", "#ffbb7720", "#ffcc8818", "#ffdd9920"],
  // Daytime - bright energetic
  ["#ff004433", "#aa00ff30", "#ff660028", "#00ffaa25", "#ff00aa28", "#4400ff28", "#ff220030", "#cc00ff25", "#ff880025", "#00ddaa25", "#ff00cc25", "#6600ff28"],
  // Evening - deep warm
  ["#ff220030", "#cc004428", "#ff440025", "#aa003325", "#ff330028", "#dd005525", "#ff110030", "#bb004425", "#ff550025", "#cc003328", "#ff440028", "#dd004430"],
  // Night - cool deep blues/purples
  ["#1100ff25", "#2200aa22", "#0033cc20", "#1100dd22", "#0022bb20", "#2200cc18", "#0011aa25", "#1100bb18", "#0033aa20", "#2200bb22", "#0022cc20", "#1100aa22"],
];

const BLOB_COLORS = BLOB_COLOR_SETS[getDayPhase()];
const BLOB_SIZES = [100, 120, 110, 140, 90, 130, 105, 115, 95, 135, 100, 125];

function LavaBlob({ index, xs, ys, glow }: { index: number; xs: SharedValue<number[]>; ys: SharedValue<number[]>; glow: SharedValue<number[]> }) {
  const size = BLOB_SIZES[index];
  const baseColor = BLOB_COLORS[index];
  const style = useAnimatedStyle(() => {
    const g = glow.value[index] ?? 0;
    const opacity = 0.25 + g * 0.2;
    return {
      position: "absolute" as const,
      left: `${xs.value[index] ?? 50}%` as any,
      top: `${ys.value[index] ?? 50}%` as any,
      width: size + g * 40,
      height: size + g * 40,
      borderRadius: (size + g * 40) / 2,
      backgroundColor: baseColor,
      opacity,
      transform: [{ translateX: -(size + g * 40) / 2 }, { translateY: -(size + g * 40) / 2 }],
    };
  });
  return <Animated.View style={style} />;
}

const PHASE_BG = ["#1a1008", "#0a0a14", "#140808", "#060810"];

function LavaBg() {
  const xs = useSharedValue(Array.from({ length: BLOB_COUNT }, () => 20 + Math.random() * 60));
  const ys = useSharedValue(Array.from({ length: BLOB_COUNT }, () => 20 + Math.random() * 60));
  const vxs = useSharedValue(Array.from({ length: BLOB_COUNT }, () => (Math.random() - 0.5) * 0.04));
  const vys = useSharedValue(Array.from({ length: BLOB_COUNT }, () => 0.02 + Math.random() * 0.03));
  const heat = useSharedValue(Array.from({ length: BLOB_COUNT }, () => Math.random()));
  const glow = useSharedValue(Array.from({ length: BLOB_COUNT }, () => 0));
  const glowTimer = useSharedValue(0);

  useFrameCallback(() => {
    "worklet";
    const ax = xs.value.slice();
    const ay = ys.value.slice();
    const avx = vxs.value.slice();
    const avy = vys.value.slice();
    const ah = heat.value.slice();

    for (let i = 0; i < BLOB_COUNT; i++) {
      if (ay[i] > 75) ah[i] = Math.min(1, ah[i] + 0.003);
      if (ay[i] < 25) ah[i] = Math.max(0, ah[i] - 0.002);
      ah[i] += (Math.random() - 0.5) * 0.001;
      const buoyancy = (ah[i] - 0.5) * 0.06;
      avy[i] += buoyancy * 0.01;
      avy[i] *= 0.995;
      avx[i] += (Math.random() - 0.5) * 0.001;
      avx[i] *= 0.99;
      ax[i] += avx[i];
      ay[i] -= avy[i];
      if (ax[i] < 15) avx[i] += 0.005;
      if (ax[i] > 85) avx[i] -= 0.005;
      if (ay[i] < 5) { avy[i] *= 0.9; ah[i] = Math.max(0, ah[i] - 0.01); }
      if (ay[i] > 95) { avy[i] *= 0.9; ah[i] = Math.min(1, ah[i] + 0.01); }
      ax[i] = Math.max(5, Math.min(95, ax[i]));
      ay[i] = Math.max(2, Math.min(98, ay[i]));
    }
    xs.value = ax;
    ys.value = ay;
    vxs.value = avx;
    vys.value = avy;
    heat.value = ah;

    // Random glow pulse — gentle and slow
    const ag = glow.value.slice();
    glowTimer.value += 1;
    if (glowTimer.value > 300) {
      glowTimer.value = 0;
      const target = Math.floor(Math.random() * BLOB_COUNT);
      for (let i = 0; i < BLOB_COUNT; i++) ag[i] = i === target ? 1 : ag[i];
    }
    for (let i = 0; i < BLOB_COUNT; i++) {
      if (ag[i] > 0) ag[i] = Math.max(0, ag[i] - 0.003);
    }
    glow.value = ag;
  });

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: PHASE_BG[getDayPhase()] }]} />
      {Array.from({ length: BLOB_COUNT }, (_, i) => (
        <LavaBlob key={i} index={i} xs={xs} ys={ys} glow={glow} />
      ))}
    </View>
  );
}

export default function App() {
  const inner = (
    <GestureHandlerRootView style={st.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <StoreProvider>
            <SettingsProvider>
            <SafeAreaView style={st.container} edges={["top"]}>
              <Root />
              <StatusBar style="light" />
            </SafeAreaView>
            </SettingsProvider>
          </StoreProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  if (Platform.OS === "web") {
    return <View style={st.webFrame}>{inner}</View>;
  }
  return inner;
}

const st = StyleSheet.create({
  webFrame: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  root: { flex: 1, width: 393, maxWidth: 393, height: 852, maxHeight: 852, overflow: "hidden", borderRadius: 20 },
  container: { flex: 1, backgroundColor: "#000" },
  main: { flex: 1 },
  body: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24, gap: 16 },
  contentFull: { paddingVertical: 16, gap: 8 },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#000",
  },
  logoSkeleton: {
    width: 80,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.surfaceGlass,
  },
  profileBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.surfaceGlass,
    borderWidth: 0.5,
    borderColor: theme.glassBorder,
    alignItems: "center", justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 24,
    backgroundColor: "#000",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    minWidth: 60,
  },
  tabBubble: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(230,235,245,0.2)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tabBubbleActive: {
    backgroundColor: "rgba(255,100,0,0.5)",
    shadowColor: "#ff6400",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
  },
  tabIcon: { fontSize: 18, color: theme.fgMuted },
  tabIconActive: { color: theme.fg },
  tabCenter: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
  },
  tabCenterCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "rgba(230,235,245,0.2)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tabCenterActive: {
    backgroundColor: "rgba(255,100,0,0.5)",
    shadowColor: "#ff6400",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
  },
  tabLabel: { fontSize: 10, color: theme.fgMuted, fontWeight: "500" },
  tabLabelActive: { color: theme.fg, fontWeight: "700" },
  tabCountBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ff3b30",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabCountTxt: { fontSize: 10, color: "#fff", fontWeight: "700" },
});
