import { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StoreProvider } from "./src/application/StoreContext";
import TagManager from "./src/ui/components/TagManager";
import Calendar from "./src/ui/components/Calendar";
import Dashboard from "./src/ui/components/Dashboard";
import DayTimeline from "./src/ui/components/DayTimeline";
import { theme } from "./src/ui/theme/colors";

function pad(n: number) { return n.toString().padStart(2, "0"); }

type Tab = "emojis" | "calendar" | "dashboard";

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: "emojis", icon: "😀", label: "Emojis" },
  { key: "calendar", icon: "📅", label: "Calendar" },
  { key: "dashboard", icon: "🏆", label: "Dashboard" },
];

function Main() {
  const [tab, setTab] = useState<Tab>("calendar");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [filter, setFilter] = useState<string | null>(null);
  const [streakRange, setStreakRange] = useState<{ start: string; end: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const onNav = useCallback((y: number, m: number) => { setYear(y); setMonth(m); }, []);

  return (
    <View style={st.main}>
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
            <Calendar
              year={year} month={month} onNav={onNav}
              filter={filter} streakRange={streakRange} onSelectDate={setSelectedDate}
            />
            <Dashboard
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
              <Text style={st.tabIcon}>{t.icon}</Text>
              <Text style={[st.tabLabel, active && st.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={st.root}>
      <SafeAreaProvider>
        <StoreProvider>
          <SafeAreaView style={st.container} edges={["top"]}>
            <Main />
            <StatusBar style="light" />
          </SafeAreaView>
        </StoreProvider>
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
    paddingVertical: 4,
  },
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 10, color: theme.fgMuted, marginTop: 2 },
  tabLabelActive: { color: theme.accent, fontWeight: "600" },
});
