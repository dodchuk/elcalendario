import { useState, useCallback, useEffect, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Text, Pressable, Platform } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { StoreProvider, useStore } from "./src/application/StoreContext";
import { AuthProvider, useAuth } from "./src/application/AuthContext";
import TagManager from "./src/ui/components/TagManager";
import Calendar from "./src/ui/components/Calendar";
import YearView from "./src/ui/components/YearView";
import MonthView from "./src/ui/components/MonthView";
import Dashboard, { TagFilters, StreakPanel } from "./src/ui/components/Dashboard";
import DayTimeline from "./src/ui/components/DayTimeline";
import WelcomeScreen from "./src/ui/screens/WelcomeScreen";
import SignInScreen from "./src/ui/screens/SignInScreen";
import SignUpScreen from "./src/ui/screens/SignUpScreen";
import FindAccountScreen from "./src/ui/screens/FindAccountScreen";
import ProfileScreen from "./src/ui/screens/ProfileScreen";
import ScreenProgressBar from "./src/ui/components/ScreenProgressBar";
import { theme } from "./src/ui/theme/colors";

function pad(n: number) { return n.toString().padStart(2, "0"); }

type Tab = "emojis" | "calendar" | "dashboard";

function Main() {
  const [tab, setTab] = useState<Tab>("calendar");
  const [showProfile, setShowProfile] = useState(false);
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
      {/* Header */}
      <View style={st.appHeader}>
        <View style={st.logoSkeleton} />
        <Pressable onPress={() => { setShowProfile(true); }} style={st.profileBtn}>
          <Ionicons name="person-outline" size={18} color={theme.fg} />
        </Pressable>
      </View>

      {showProfile ? (
        <ProfileScreen onClose={() => setShowProfile(false)} />
      ) : (
      <View style={st.body}>
        {tab === "emojis" && (
          <ScrollView style={st.scroll} contentContainerStyle={st.content}>
            <TagManager />
          </ScrollView>
        )}
        {tab === "calendar" && (
          calMonth !== null ? (
            <MonthView
              initialYear={year}
              initialMonth={calMonth}
              onBack={(y) => { setYear(y); setCalMonth(null); }}
            />
          ) : (
            <YearView onSelectMonth={(y, m) => { setYear(y); setCalMonth(m); }} />
          )
        )}
        {tab === "dashboard" && (
          <ScrollView style={st.scroll} contentContainerStyle={st.content}>
            <TagFilters
              year={year} month={month} filter={filter} onFilter={setFilter}
              streakRange={streakRange} onStreakRange={setStreakRange}
            />
            <Calendar
              year={year} month={month} onNav={onNav}
              filter={filter} streakRange={streakRange} onSelectDate={setSelectedDate}
            />
            <StreakPanel
              year={year} month={month} filter={filter} onFilter={setFilter}
              streakRange={streakRange} onStreakRange={setStreakRange}
            />
          </ScrollView>
        )}
      </View>
      )}

      {/* Bottom tab bar */}
      <View style={st.tabBar}>
        <Pressable style={st.tab} onPress={() => { setTab("emojis"); setShowProfile(false); }}>
          <View style={[st.tabBubble, tab === "emojis" && st.tabBubbleActive]}>
            <Ionicons name={tab === "emojis" ? "happy" : "happy-outline"} size={22} color={tab === "emojis" ? "#fff" : theme.fgMuted} />
          </View>
          <Text style={[st.tabLabel, tab === "emojis" && st.tabLabelActive]}>Emojis</Text>
          <View style={st.tabCountBadge}><Text style={st.tabCountTxt}>{state.tags.length}</Text></View>
        </Pressable>
        <Pressable style={st.tabCenter} onPress={() => { setTab("calendar"); setShowProfile(false); }}>
          <View style={[st.tabCenterCircle, tab === "calendar" && st.tabCenterActive]}>
            <Ionicons name={tab === "calendar" ? "calendar" : "calendar-outline"} size={28} color={tab === "calendar" ? "#fff" : theme.fgMuted} />
          </View>
        </Pressable>
        <Pressable style={st.tab} onPress={() => { setTab("dashboard"); setShowProfile(false); }}>
          <View style={[st.tabBubble, tab === "dashboard" && st.tabBubbleActive]}>
            <Ionicons name={tab === "dashboard" ? "stats-chart" : "stats-chart-outline"} size={22} color={tab === "dashboard" ? "#fff" : theme.fgMuted} />
          </View>
          <Text style={[st.tabLabel, tab === "dashboard" && st.tabLabelActive]}>Stats</Text>
        </Pressable>
      </View>
    </View>
  );
}

type AuthScreen = "welcome" | "signin" | "signup" | "find";

function AuthFlow() {
  const [screen, setScreen] = useState<AuthScreen>("welcome");
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

function getDayPhaseColors(): [string, string, string, string] {
  const h = new Date().getHours();
  if (h >= 5 && h < 8) return ["#1a0a2e", "#2d1b4e", "#4a2060", "#1a0a2e"]; // dawn
  if (h >= 8 && h < 12) return ["#f8f4e8", "#fff8e1", "#fef3cd", "#f8f4e8"]; // morning
  if (h >= 12 && h < 17) return ["#e8f4fd", "#ffffff", "#f0f7ff", "#e8f4fd"]; // day
  if (h >= 17 && h < 20) return ["#1a1020", "#2a1530", "#3d1f3e", "#1a1020"]; // sunset
  return ["#0a0a14", "#0d1020", "#0a0f1a", "#0a0a14"]; // night
}

function WaveBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={getDayPhaseColors()}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={st.gridLines}>
        {Array.from({ length: 8 }, (_, i) => (
          <View key={`h${i}`} style={[st.gridLineH, { top: `${(i + 1) * 12}%` as any }]} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <View key={`v${i}`} style={[st.gridLineV, { left: `${(i + 1) * 20}%` as any }]} />
        ))}
      </View>
    </View>
  );
}

export default function App() {
  const inner = (
    <GestureHandlerRootView style={st.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <StoreProvider>
            <SafeAreaView style={st.container} edges={["top"]}>
              <WaveBg />
              <Root />
              <StatusBar style="light" />
            </SafeAreaView>
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
  gridLines: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  logoSkeleton: {
    width: 80,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  profileBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 24,
    backgroundColor: "#0a0a0a",
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
