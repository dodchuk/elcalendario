import { useState, useCallback, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StoreProvider } from "./src/application/StoreContext";
import { AuthProvider, useAuth } from "./src/application/AuthContext";
import TagManager from "./src/ui/components/TagManager";
import Calendar from "./src/ui/components/Calendar";
import Dashboard, { TagFilters, StreakPanel } from "./src/ui/components/Dashboard";
import DayTimeline from "./src/ui/components/DayTimeline";
import WelcomeScreen from "./src/ui/screens/WelcomeScreen";
import SignInScreen from "./src/ui/screens/SignInScreen";
import SignUpScreen from "./src/ui/screens/SignUpScreen";
import FindAccountScreen from "./src/ui/screens/FindAccountScreen";
import SplashScreen from "./src/ui/screens/SplashScreen";
import ProfileScreen from "./src/ui/screens/ProfileScreen";
import { theme } from "./src/ui/theme/colors";

function pad(n: number) { return n.toString().padStart(2, "0"); }

type Tab = "emojis" | "calendar" | "dashboard";

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: "emojis", icon: "✎", label: "Emojis" },
  { key: "calendar", icon: "◻️", label: "Calendar" },
  { key: "dashboard", icon: "◆", label: "Dashboard" },
];

function Main() {
  const [tab, setTab] = useState<Tab>("calendar");
  const [showProfile, setShowProfile] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [filter, setFilter] = useState<string[]>([]);
  const [streakRange, setStreakRange] = useState<{ start: string; end: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const onNav = useCallback((y: number, m: number) => { setYear(y); setMonth(m); }, []);

  return (
    <View style={st.main}>
      {showProfile ? (
        <ProfileScreen onClose={() => setShowProfile(false)} />
      ) : (
        <>
      <View style={st.body}>
        {tab === "emojis" && (
          <ScrollView style={st.scroll} contentContainerStyle={st.content}>
            <TagManager />
          </ScrollView>
        )}
        {tab === "calendar" && (
          <ScrollView style={st.scroll} contentContainerStyle={st.content}>
            <Calendar
              year={year} month={month} onNav={onNav}
              filter={filter} streakRange={streakRange} onSelectDate={setSelectedDate}
            />
            <DayTimeline date={selectedDate} filter={filter} />
          </ScrollView>
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

      {/* Bottom tab bar */}
      <View style={st.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} style={st.tab} onPress={() => setTab(t.key)}>
              <Text style={[st.tabLabel, active && st.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
        <Pressable style={st.tab} onPress={() => setShowProfile(true)}>
          <Text style={st.tabLabel}>Profile</Text>
        </Pressable>
      </View>
      </>
      )}
    </View>
  );
}

type AuthScreen = "welcome" | "signin" | "signup" | "find";

function AuthFlow() {
  const [screen, setScreen] = useState<AuthScreen>("welcome");

  switch (screen) {
    case "welcome": return <WelcomeScreen onSignIn={() => setScreen("signin")} onSignUp={() => setScreen("signup")} />;
    case "signin": return <SignInScreen onBack={() => setScreen("welcome")} onFindAccount={() => setScreen("find")} />;
    case "signup": return <SignUpScreen onBack={() => setScreen("welcome")} />;
    case "find": return <FindAccountScreen onBack={() => setScreen("signin")} />;
  }
}

function Root() {
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen />;
  return user ? <Main /> : <AuthFlow />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={st.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <StoreProvider>
            <SafeAreaView style={st.container} edges={["top"]}>
              <Root />
              <StatusBar style="light" />
            </SafeAreaView>
          </StoreProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.bg },
  main: { flex: 1 },
  body: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
    paddingBottom: 20, // safe area bottom
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  tabLabel: { fontSize: 14, color: theme.fgMuted, fontWeight: "500" },
  tabLabelActive: { color: theme.accent, fontWeight: "700" },
});
