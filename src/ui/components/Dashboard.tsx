import { useMemo, useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "../../application/StoreContext";
import { getEmojiGlowColor } from "../theme/tagColors";
import { theme } from "../theme/colors";

const pad = (n: number) => n.toString().padStart(2, "0");
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function dateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function AuraCircle({ colors }: { colors: { color: string; weight: number }[] }) {
  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.06, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true);
    if (colors.length > 0) rotation.value = withRepeat(withTiming(360, { duration: 30000, easing: Easing.linear }), -1, false);
  }, [colors.length]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }, { rotate: `${rotation.value}deg` }],
  }));

  const sorted = [...colors].sort((a, b) => b.weight - a.weight);

  if (colors.length === 0) {
    return (
      <View style={st.auraWrap}>
        <Animated.View style={[{ width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }, pulseStyle]} />
      </View>
    );
  }

  return (
    <View style={st.auraWrap}>
      <Animated.View style={[{ width: 200, height: 200, borderRadius: 100, overflow: "hidden", alignItems: "center", justifyContent: "center", boxShadow: sorted.map((a, i) => `0 0 ${60 - i * 10}px ${15 - i * 2}px ${a.color}44`).join(", ") } as any, pulseStyle]}>
          {sorted.map((a, i) => {
            const angle = (i / sorted.length) * Math.PI * 2;
            const dist = 25;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            const spread = 20 + (a.weight / (sorted[0]?.weight || 1)) * 30;
            const size = 60 + (a.weight / (sorted[0]?.weight || 1)) * 40;
            return (
              <View key={i} style={{
                position: "absolute",
                width: size, height: size, borderRadius: size / 2,
                backgroundColor: a.color + "44",
                transform: [{ translateX: x }, { translateY: y }],
                boxShadow: `0 0 ${spread * 2}px ${spread}px ${a.color}aa, inset 0 0 ${spread}px ${spread * 0.5}px ${a.color}66`,
              } as any} />
            );
          })}
        </Animated.View>
    </View>
  );
}

export default function Dashboard({ year: initYear, month: initMonth, initViewMode, onChangeYear, onChangeMonth }: { year: number; month: number; initViewMode: "year" | "month"; onChangeYear: (y: number) => void; onChangeMonth: (m: number) => void }) {
  const { state } = useStore();
  const tagMap = useMemo(() => Object.fromEntries(state.tags.map(t => [t.id, t])), [state.tags]);
  const today = todayStr();
  const now = new Date();
  const [year, setYearLocal] = useState(initYear);
  const [viewMode, setViewMode] = useState<"all" | "year" | "month">(initViewMode);
  const [month, setMonthLocal] = useState(initMonth);

  useEffect(() => { setYearLocal(initYear); }, [initYear]);
  useEffect(() => { setMonthLocal(initMonth); }, [initMonth]);
  useEffect(() => { setViewMode(initViewMode); }, [initViewMode]);

  const setYear = (y: number | ((prev: number) => number)) => {
    const val = typeof y === "function" ? y(year) : y;
    setYearLocal(val);
    onChangeYear(val);
  };
  const setMonth = (m: number | ((prev: number) => number)) => {
    const val = typeof m === "function" ? m(month) : m;
    setMonthLocal(val);
    onChangeMonth(val);
  };

  // HUD: today's count
  const todayCount = (state.entries[today] ?? []).length;

  // HUD: current streak
  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = dateStr(d);
      if ((state.entries[ds] ?? []).length > 0) count++;
      else if (i > 0) break;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [state.entries]);

  // Best period
  const bestPeriod = useMemo(() => {
    if (viewMode === "all") {
      // Best month across all time
      const monthCounts: Record<string, number> = {};
      for (const [date, ids] of Object.entries(state.entries)) {
        if (ids.length > 0) { const ym = date.slice(0, 7); monthCounts[ym] = (monthCounts[ym] ?? 0) + ids.length; }
      }
      const best = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
      if (!best) return { label: "—", count: 0 };
      const [y, m] = best[0].split("-");
      const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      return { label: `${FULL_MONTHS[parseInt(m) - 1]} ${y}`, count: best[1] };
    } else if (viewMode === "year") {
      // Best month: most activities
      const months = Array(12).fill(0);
      for (const [date, ids] of Object.entries(state.entries)) {
        if (date.startsWith(`${year}-`) && ids.length > 0) months[parseInt(date.split("-")[1]) - 1] += ids.length;
      }
      const max = Math.max(...months);
      const mi = months.indexOf(max);
      const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      return max > 0 ? { label: FULL_MONTHS[mi], count: max } : { label: "—", count: 0 };
    }
    // Best day: single day with most activities
    const prefix = `${year}-${pad(month + 1)}`;
    let bestDate = "", bestCount = 0;
    for (const [date, ids] of Object.entries(state.entries)) {
      if (date.startsWith(prefix) && ids.length > bestCount) { bestCount = ids.length; bestDate = date; }
    }
    return bestCount > 0 ? { label: `${new Date(bestDate).getDate()} ${MONTHS[month]}`, count: bestCount } : { label: "—", count: 0 };
  }, [state.entries, viewMode, year, month]);
  const consistency = useMemo(() => {
    const prefix = `${year}-${pad(month+1)}`;
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const daysSoFar = (year === now.getFullYear() && month === now.getMonth()) ? now.getDate() : daysInMonth;
    let tracked = 0;
    for (let d = 1; d <= daysSoFar; d++) {
      const ds = `${prefix}-${pad(d)}`;
      if ((state.entries[ds] ?? []).length > 0) tracked++;
    }
    return { tracked, total: daysSoFar, daysInMonth };
  }, [state.entries, year, month]);

  const maxHeat = useMemo(() => {
    let max = 1;
    for (const ids of Object.values(state.entries)) {
      if (ids.length > max) max = ids.length;
    }
    return max;
  }, [state.entries]);

  // Top 5 most used this year
  const top5 = useMemo(() => {
    const prefix = viewMode === "all" ? "" : viewMode === "month" ? `${year}-${pad(month + 1)}` : `${year}-`;
    const counts: Record<string, number> = {};
    for (const [date, ids] of Object.entries(state.entries)) {
      if (prefix && !date.startsWith(prefix)) continue;
      for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, emoji: tagMap[id]?.emoji ?? "?", count }));
  }, [state.entries, tagMap, year, month, viewMode]);

  const maxBar = Math.max(1, ...top5.map(t => t.count));

  // Top streaks per emoji in selected period
  const topStreaks = useMemo(() => {
    const prefix = viewMode === "all" ? "" : viewMode === "month" ? `${year}-${pad(month + 1)}` : `${year}-`;
    const results: { id: string; emoji: string; streak: number }[] = [];
    for (const tag of state.tags) {
      const dates = Object.keys(state.entries)
        .filter(d => d.startsWith(prefix) && (state.entries[d] ?? []).includes(tag.id))
        .sort();
      let best = 0, cur = 1;
      for (let i = 1; i < dates.length; i++) {
        const diff = new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime();
        if (diff === 86400000) cur++;
        else { best = Math.max(best, cur); cur = 1; }
      }
      best = Math.max(best, cur);
      if (dates.length > 0 && best >= 2) results.push({ id: tag.id, emoji: tag.emoji, streak: best });
    }
    return results.sort((a, b) => b.streak - a.streak);
  }, [state.entries, state.tags, year, month, viewMode]);

  // New emojis this period (first appearance in selected month/year)
  const newEmojis = useMemo(() => {
    const prefix = viewMode === "all" ? "" : viewMode === "month" ? `${year}-${pad(month + 1)}` : `${year}-`;
    const inPeriod = new Set<string>();
    const beforePeriod = new Set<string>();
    for (const [date, ids] of Object.entries(state.entries)) {
      for (const id of ids) {
        if (date.startsWith(prefix)) inPeriod.add(id);
        else if (date < prefix) beforePeriod.add(id);
      }
    }
    return [...inPeriod].filter(id => !beforePeriod.has(id)).map(id => tagMap[id]?.emoji).filter(Boolean) as string[];
  }, [state.entries, tagMap, year, month, viewMode]);

  // Activity combos (emojis that appear together most often)
  const combos = useMemo(() => {
    const prefix = viewMode === "all" ? "" : viewMode === "month" ? `${year}-${pad(month + 1)}` : `${year}-`;
    const pairCount: Record<string, number> = {};
    for (const [date, ids] of Object.entries(state.entries)) {
      if (prefix && !date.startsWith(prefix) || ids.length < 2) continue;
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = [ids[i], ids[j]].sort().join("|");
          pairCount[key] = (pairCount[key] ?? 0) + 1;
        }
      }
    }
    return Object.entries(pairCount)
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => {
        const [a, b] = key.split("|");
        return { a: tagMap[a]?.emoji ?? "?", b: tagMap[b]?.emoji ?? "?", count };
      });
  }, [state.entries, tagMap, year, month, viewMode]);
  const droppedEmojis = useMemo(() => {
    const prefix = viewMode === "all" ? "" : viewMode === "month" ? `${year}-${pad(month + 1)}` : `${year}-`;
    const inPeriod = new Set<string>();
    const beforePeriod = new Set<string>();
    for (const [date, ids] of Object.entries(state.entries)) {
      for (const id of ids) {
        if (date.startsWith(prefix)) inPeriod.add(id);
        else if (date < prefix) beforePeriod.add(id);
      }
    }
    return [...beforePeriod].filter(id => !inPeriod.has(id)).map(id => tagMap[id]?.emoji).filter(Boolean) as string[];
  }, [state.entries, tagMap, year, month, viewMode]);

  // Replacement patterns (A dropped, B rose comparing to previous period)
  const replacements = useMemo(() => {
    const prefix = viewMode === "all" ? "" : viewMode === "month" ? `${year}-${pad(month + 1)}` : `${year}-`;
    let prevPrefix: string;
    if (viewMode === "all") {
      return [];
    } else if (viewMode === "month") {
      const pm = month === 0 ? 11 : month - 1;
      const py = month === 0 ? year - 1 : year;
      prevPrefix = `${py}-${pad(pm + 1)}`;
    } else {
      prevPrefix = `${year - 1}-`;
    }
    const curr: Record<string, number> = {};
    const prev: Record<string, number> = {};
    for (const [date, ids] of Object.entries(state.entries)) {
      for (const id of ids) {
        if (date.startsWith(prefix)) curr[id] = (curr[id] ?? 0) + 1;
        else if (date.startsWith(prevPrefix)) prev[id] = (prev[id] ?? 0) + 1;
      }
    }
    const dropped = Object.entries(prev).filter(([id, c]) => (curr[id] ?? 0) < c * 0.3).map(([id]) => id);
    const risen = Object.entries(curr).filter(([id, c]) => (prev[id] ?? 0) < c * 0.3 && c >= 3).map(([id]) => id);
    if (dropped.length === 0 || risen.length === 0) return [];
    return dropped.slice(0, 3).map((d, i) => ({
      from: tagMap[d]?.emoji ?? "?",
      to: tagMap[risen[i % risen.length]]?.emoji ?? "?",
    }));
  }, [state.entries, tagMap, year, month, viewMode]);

  // Routine score (how predictable — % of days that match your most common pattern)
  const routineScore = useMemo(() => {
    const prefix = viewMode === "all" ? "" : viewMode === "month" ? `${year}-${pad(month + 1)}` : `${year}-`;
    const patterns: Record<string, number> = {};
    let totalDays = 0;
    for (const [date, ids] of Object.entries(state.entries)) {
      if (prefix && !date.startsWith(prefix) || ids.length === 0) continue;
      const key = [...ids].sort().join(",");
      patterns[key] = (patterns[key] ?? 0) + 1;
      totalDays++;
    }
    if (totalDays < 3) return null;
    const mostCommon = Math.max(...Object.values(patterns));
    return Math.round((mostCommon / totalDays) * 100);
  }, [state.entries, year, month, viewMode]);

  // Weekend warrior (emojis that appear more on weekends)
  const weekendWarriors = useMemo(() => {
    const prefix = viewMode === "all" ? "" : viewMode === "month" ? `${year}-${pad(month + 1)}` : `${year}-`;
    const weekday: Record<string, number> = {};
    const weekend: Record<string, number> = {};
    for (const [date, ids] of Object.entries(state.entries)) {
      if (prefix && !date.startsWith(prefix)) continue;
      const dow = new Date(date).getDay();
      const isWeekend = dow === 0 || dow === 6;
      for (const id of ids) {
        if (isWeekend) weekend[id] = (weekend[id] ?? 0) + 1;
        else weekday[id] = (weekday[id] ?? 0) + 1;
      }
    }
    return Object.keys({ ...weekday, ...weekend })
      .map(id => {
        const we = weekend[id] ?? 0;
        const wd = weekday[id] ?? 0;
        const total = we + wd;
        if (total < 3) return null;
        const ratio = we / (total || 1);
        return { id, emoji: tagMap[id]?.emoji ?? "?", ratio, we, wd };
      })
      .filter(Boolean)
      .sort((a, b) => b!.ratio - a!.ratio)
      .slice(0, 3) as { id: string; emoji: string; ratio: number; we: number; wd: number }[];
  }, [state.entries, tagMap, year, month, viewMode]);

  // At this pace projections
  const projections = useMemo(() => {
    const prefix = `${year}-`;
    const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1;
    if (dayOfYear < 7) return [];
    const daysLeft = (new Date(year, 1, 29).getMonth() === 1 ? 366 : 365) - dayOfYear;
    const counts: Record<string, number> = {};
    for (const [date, ids] of Object.entries(state.entries)) {
      if (prefix && !date.startsWith(prefix)) continue;
      for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([id, count]) => {
        const rate = count / dayOfYear;
        const projected = Math.round(count + rate * daysLeft);
        return { id, emoji: tagMap[id]?.emoji ?? "?", current: count, projected };
      })
      .sort((a, b) => b.projected - a.projected)
      .slice(0, 3);
  }, [state.entries, tagMap, year]);

  // Aura colors (top emoji colors weighted by usage)
  const auraColors = useMemo(() => {
    const prefix = viewMode === "all" ? "" : viewMode === "month" ? `${year}-${pad(month + 1)}` : `${year}-`;
    const counts: Record<string, number> = {};
    for (const [date, ids] of Object.entries(state.entries)) {
      if (prefix && !date.startsWith(prefix)) continue;
      for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        color: getEmojiGlowColor(tagMap[id]?.emoji ?? "", state.tags.findIndex(t => t.id === id)),
        weight: count,
      }));
  }, [state.entries, tagMap, state.tags, year, month, viewMode]);


  // Week-over-week trends per emoji
  const trends = useMemo(() => {
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const thisWeek: Record<string, number> = {};
    const lastWeek: Record<string, number> = {};
    for (const [date, ids] of Object.entries(state.entries)) {
      const d = new Date(date);
      for (const id of ids) {
        if (d >= thisWeekStart) thisWeek[id] = (thisWeek[id] ?? 0) + 1;
        else if (d >= lastWeekStart && d < thisWeekStart) lastWeek[id] = (lastWeek[id] ?? 0) + 1;
      }
    }
    return Object.keys({ ...thisWeek, ...lastWeek })
      .map(id => {
        const tw = thisWeek[id] ?? 0;
        const lw = lastWeek[id] ?? 0;
        if (tw === 0 && lw === 0) return null;
        const dir = tw > lw ? "up" : tw < lw ? "down" : "same";
        return { id, emoji: tagMap[id]?.emoji ?? "?", tw, lw, dir };
      })
      .filter(Boolean)
      .sort((a, b) => (b!.tw + b!.lw) - (a!.tw + a!.lw))
      .slice(0, 8) as { id: string; emoji: string; tw: number; lw: number; dir: string }[];
  }, [state.entries, tagMap]);

  // Days since last use (for inactive emojis)
  const daysSinceLast = useMemo(() => {
    const todayMs = now.getTime();
    return state.tags
      .map(tag => {
        const dates = Object.keys(state.entries).filter(d => (state.entries[d] ?? []).includes(tag.id)).sort();
        if (dates.length === 0) return null;
        const last = dates[dates.length - 1];
        const days = Math.floor((todayMs - new Date(last).getTime()) / 86400000);
        if (days < 7) return null;
        return { id: tag.id, emoji: tag.emoji, days };
      })
      .filter(Boolean)
      .sort((a, b) => b!.days - a!.days)
      .slice(0, 5) as { id: string; emoji: string; days: number }[];
  }, [state.entries, state.tags]);

  // Habit formation (emojis approaching 21-day streak)
  const habitProgress = useMemo(() => {
    return state.tags
      .map(tag => {
        const dates = Object.keys(state.entries)
          .filter(d => (state.entries[d] ?? []).includes(tag.id))
          .sort();
        if (dates.length === 0) return null;
        // Find current streak from today backwards
        let streak = 0;
        const d = new Date(now);
        for (let i = 0; i < 66; i++) {
          const ds = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
          if ((state.entries[ds] ?? []).includes(tag.id)) streak++;
          else if (i > 0) break;
          else break;
          d.setDate(d.getDate() - 1);
        }
        if (streak < 3 || streak >= 21) return null;
        return { id: tag.id, emoji: tag.emoji, streak, progress: streak / 21 };
      })
      .filter(Boolean)
      .sort((a, b) => b!.progress - a!.progress)
      .slice(0, 4) as { id: string; emoji: string; streak: number; progress: number }[];
  }, [state.entries, state.tags]);


  // Habit strength (consistency % × longest streak)
  const habitStrength = useMemo(() => {
    const prefix = viewMode === "all" ? "" : viewMode === "month" ? `${year}-${pad(month + 1)}` : `${year}-`;
    const totalDays = viewMode === "all" ? Math.max(1, Math.floor((now.getTime() - new Date(Math.min(...Object.keys(state.entries).map(d => new Date(d).getTime()), now.getTime())).getTime()) / 86400000) + 1) : viewMode === "month" ? new Date(year, month + 1, 0).getDate() : (year === now.getFullYear() ? Math.floor((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1 : 365);
    return state.tags
      .map(tag => {
        const dates = Object.keys(state.entries)
          .filter(d => d.startsWith(prefix) && (state.entries[d] ?? []).includes(tag.id))
          .sort();
        if (dates.length < 3) return null;
        const consistency = dates.length / totalDays;
        let best = 1, cur = 1;
        for (let i = 1; i < dates.length; i++) {
          if (new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime() === 86400000) cur++;
          else { best = Math.max(best, cur); cur = 1; }
        }
        best = Math.max(best, cur);
        const score = Math.round(consistency * best * 100);
        return { id: tag.id, emoji: tag.emoji, score, consistency: Math.round(consistency * 100), best };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 5) as { id: string; emoji: string; score: number; consistency: number; best: number }[];
  }, [state.entries, state.tags, year, month, viewMode]);


  // Established habits (>70% consistency for 30+ days)
  const establishedHabits = useMemo(() => {
    return state.tags
      .map(tag => {
        const dates = Object.keys(state.entries)
          .filter(d => (state.entries[d] ?? []).includes(tag.id))
          .sort();
        if (dates.length < 21) return null;
        const first = new Date(dates[0]);
        const duration = Math.floor((now.getTime() - first.getTime()) / 86400000);
        if (duration < 30) return null;
        const consistency = Math.round((dates.length / duration) * 100);
        if (consistency < 70) return null;
        return { id: tag.id, emoji: tag.emoji, consistency, duration };
      })
      .filter(Boolean) as { id: string; emoji: string; consistency: number; duration: number }[];
  }, [state.entries, state.tags]);


  // Monthly trend chart data (last 6 months per top emoji)
  const trendChart = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
    }
    const topIds = top5.slice(0, 4).map(t => t.id);
    const data = topIds.map(id => ({
      id,
      emoji: tagMap[id]?.emoji ?? "?",
      values: months.map(m => {
        let count = 0;
        for (const [date, ids] of Object.entries(state.entries)) {
          if (date.startsWith(m) && ids.includes(id)) count++;
        }
        return count;
      }),
      trend: 0,
    }));
    // Calculate trend direction
    for (const d of data) {
      const recent = d.values[5] + d.values[4];
      const older = d.values[0] + d.values[1];
      d.trend = recent > older ? 1 : recent < older ? -1 : 0;
    }
    return { months: months.map(m => MONTHS[parseInt(m.split("-")[1]) - 1]), data };
  }, [state.entries, tagMap, top5]);



  return (
    <ScrollView style={st.wrap} contentContainerStyle={st.content}>
      {/* Weekly trends section with HUD */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>Weekly Trends</Text>
        {trends.length > 0 &&
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {trends.map(t => {
            const color = t.dir === "up" ? "#00ff88" : t.dir === "down" ? "#ff4466" : theme.fgMuted;
            const max = Math.max(t.tw, t.lw, 1);
            return (
              <View key={t.id} style={{ alignItems: "center", width: 38 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-end", height: 32, gap: 1, marginBottom: 3 }}>
                  <View style={{ width: 7, height: Math.max(3, (t.lw / max) * 32), backgroundColor: color + "33", borderRadius: 2 }} />
                  <View style={{ width: 7, height: Math.max(3, (t.tw / max) * 32), backgroundColor: color, borderRadius: 2, boxShadow: `0 0 4px ${color}66` } as any} />
                </View>
                <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
                <Text style={{ fontSize: 9, color }}>{t.lw}→{t.tw}</Text>
              </View>
            );
          })}
        </View>}
        {year === now.getFullYear() && month === now.getMonth() && (
        <View style={st.hudRow}>
          <View style={st.hudCard}>
            <Text style={st.hudNum}>{todayCount}</Text>
            <Text style={st.hudLabel}>Tracked Today</Text>
          </View>
          <View style={st.hudCard}>
            <Text style={st.hudNum}>{(() => {
              const weekStart = new Date(now);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              let count = 0;
              for (const [date, ids] of Object.entries(state.entries)) {
                if (new Date(date) >= weekStart) count += ids.length;
              }
              return count;
            })()}</Text>
            <Text style={st.hudLabel}>Tracked This Week</Text>
          </View>
          <View style={st.hudCard}>
            <Text style={st.hudNum}>{(() => {
              const weekStart = new Date(now);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              const counts: Record<string, number> = {};
              for (const [date, ids] of Object.entries(state.entries)) {
                if (new Date(date) >= weekStart) for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
              }
              const top = Object.entries(counts).sort((a, b) => b[1] - a[1]);
              if (top.length === 0) return "—";
              const maxCount = top[0][1];
              const tied = top.filter(([, c]) => c === maxCount);
              return `${tied.map(([id]) => tagMap[id]?.emoji ?? "").join("")} ${maxCount}`;
            })()}</Text>
            <Text style={st.hudLabel}>Top Emoji</Text>
          </View>
        </View>
        )}
      </View>

      {/* View toggle + navigation */}
      <View style={st.navRow}>
        <View style={st.toggleRow}>
          <Pressable onPress={() => setViewMode("month")} style={[st.toggleBtn, viewMode === "month" && st.toggleActive]}>
            <Text style={[st.toggleTxt, viewMode === "month" && st.toggleTxtActive]}>Month</Text>
          </Pressable>
          <Pressable onPress={() => setViewMode("year")} style={[st.toggleBtn, viewMode === "year" && st.toggleActive]}>
            <Text style={[st.toggleTxt, viewMode === "year" && st.toggleTxtActive]}>Year</Text>
          </Pressable>
          <Pressable onPress={() => setViewMode("all")} style={[st.toggleBtn, viewMode === "all" && st.toggleActive]}>
            <Text style={[st.toggleTxt, viewMode === "all" && st.toggleTxtActive]}>All Time</Text>
          </Pressable>
        </View>
        <View style={[st.yearRow, viewMode === "all" && { opacity: 0, pointerEvents: "none" }]}>
          <Pressable onPress={() => {
            if (viewMode === "month") {
              if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
            } else setYear(y => y - 1);
          }} style={st.navBtn}>
            <Ionicons name="chevron-back" size={14} color={theme.fg} />
          </Pressable>
          <Text style={st.yearTxt}>{viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}</Text>
          {(() => {
            const atEnd = viewMode === "month" ? (year === now.getFullYear() && month >= now.getMonth()) : year >= now.getFullYear();
            return (
              <Pressable onPress={() => {
                if (atEnd) return;
                if (viewMode === "month") {
                  if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
                } else setYear(y => y + 1);
              }} style={[st.navBtn, atEnd && { opacity: 0.3 }]}>
                <Ionicons name="chevron-forward" size={14} color={theme.fg} />
              </Pressable>
            );
          })()}
        </View>
      </View>

      {/* Energy ball with legend */}
      {(
      <View style={[st.section, { height: 300 }]}>
        <Text style={st.sectionTitle}>{viewMode === "all" ? "All Time" : viewMode === "month" ? (year === now.getFullYear() && month === now.getMonth() ? "This Month" : `${MONTHS[month]} ${year}`) : (year === now.getFullYear() ? "This Year" : `${year}`)}</Text>
        <View style={st.ringsRow}>
          <View style={st.ringsLeft}>
            {top5.slice(0, 3).map((item, i) => (
              <View key={item.id} style={st.ringLabel}>
                <View style={[st.ringDot, { backgroundColor: getEmojiGlowColor(item.emoji, i) }]} />
                <Text style={st.ringLabelTxt}>{item.emoji} {item.count}</Text>
              </View>
            ))}
          </View>
          <AuraCircle colors={auraColors.length > 0 ? auraColors : []} />
          <View style={st.ringsRight}>
            {top5.slice(3, 5).map((item, i) => (
              <View key={item.id} style={st.ringLabel}>
                <Text style={st.ringLabelTxt}>{item.count} {item.emoji}</Text>
                <View style={[st.ringDot, { backgroundColor: getEmojiGlowColor(item.emoji, i + 3) }]} />
              </View>
            ))}
          </View>
        </View>
      </View>
      )}

      {/* Heatmap */}
      {(viewMode === "all" ? [...new Set(Object.keys(state.entries).map(d => parseInt(d.slice(0, 4))))].sort((a, b) => b - a).concat(Object.keys(state.entries).length === 0 ? [now.getFullYear()] : []) : [year]).map(heatYear => (
      <View key={heatYear} style={[st.section, { paddingBottom: 12, marginBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)" }]}>
        <Text style={[st.sectionTitle, { paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)", marginBottom: 12 }]}>{heatYear}</Text>
        <View style={st.heatGrid}>
          {MONTHS.map((m, mi) => {
            const firstDay = new Date(heatYear, mi, 1).getDay();
            const daysInMonth = new Date(heatYear, mi + 1, 0).getDate();
            const cells: { count: number }[] = [];
            for (let i = 0; i < firstDay; i++) cells.push({ count: -1 });
            for (let d = 1; d <= daysInMonth; d++) {
              const ds = `${heatYear}-${pad(mi + 1)}-${pad(d)}`;
              if (viewMode === "month" && mi !== month) {
                cells.push({ count: -2 });
              } else {
                const isAfterToday = new Date(heatYear, mi, d) > now;
                cells.push({ count: isAfterToday ? -3 : (state.entries[ds] ?? []).length });
              }
            }
            while (cells.length < 42) cells.push({ count: -1 });
            return (
              <View key={mi} style={st.heatMonth}>
                <Text style={[st.heatMonthLabel, viewMode === "month" && mi !== month && { opacity: 0.3 }, viewMode === "month" && mi === month && { color: "#fff" }]}>{m}</Text>
                <View style={st.heatMonthCells}>
                  {cells.map((cell, i) => (
                      <View key={i} style={[
                        st.heatCell,
                        cell.count === -1 && { backgroundColor: "transparent" },
                        cell.count === -2 && { backgroundColor: "transparent", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)" },
                        cell.count === -3 && { backgroundColor: "rgba(255,255,255,0.03)" },
                        cell.count === 0 && { backgroundColor: "rgba(255,255,255,0.08)" },
                        cell.count > 0 && { backgroundColor: "#00ff88", opacity: 0.2 + (cell.count / maxHeat) * 0.8 },
                      ]} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
        {/* Legend */}
        <View style={st.legend}>
          <Text style={st.legendTxt}>Less</Text>
          {[0.1, 0.3, 0.5, 0.7, 1].map((o, i) => (
            <View key={i} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#00ff88", opacity: o, marginHorizontal: 2 }} />
          ))}
          <Text style={st.legendTxt}>More</Text>
        </View>
      </View>
      ))}

      {/* Rings - Apple Watch style (year view) */}
      {/* HUD Cards - after heatmap */}
      {bestPeriod.count >= 0 && (
      <View style={[st.hudRow, { paddingBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.08)", marginBottom: 20 }]}>
        <View style={st.hudCard}>
          <Text style={st.hudNum}>{viewMode === "all" ? (() => {
            const activeDays = Object.keys(state.entries).filter(d => state.entries[d].length > 0).length;
            return <View style={{ flexDirection: "row", alignItems: "baseline" }}><Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>{activeDays}</Text></View>;
          })() : viewMode === "year" ? (() => {
            const daysInYear = new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
            const activeDays = Object.keys(state.entries).filter(d => d.startsWith(`${year}-`) && state.entries[d].length > 0).length;
            return <View style={{ flexDirection: "row", alignItems: "baseline" }}><Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>{activeDays}</Text><Text style={{ fontSize: 11, color: theme.fgMuted, marginHorizontal: 6 }}>of</Text><Text style={{ fontSize: 22, fontWeight: "700", color: "rgba(255,255,255,0.5)" }}>{daysInYear}</Text></View>;
          })() : <View style={{ flexDirection: "row", alignItems: "baseline" }}><Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>{consistency.tracked}</Text><Text style={{ fontSize: 11, color: theme.fgMuted, marginHorizontal: 6 }}>of</Text><Text style={{ fontSize: 22, fontWeight: "700", color: "rgba(255,255,255,0.5)" }}>{consistency.daysInMonth}</Text></View>}</Text>
          <Text style={st.hudLabel}>Days tracked</Text>
        </View>
        <View style={[st.hudCard, { position: "relative" }]}>
          <View style={{ position: "absolute", top: 8, right: 10, backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ fontSize: 9, color: theme.fgMuted }}>{bestPeriod.count}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {viewMode === "month" && <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#ff3b30", alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 9, fontWeight: "700", color: "#fff" }}>{bestPeriod.label.split(" ")[0]}</Text></View>}
            <Text style={st.hudNum}>{viewMode === "month" ? bestPeriod.label.split(" ").slice(1).join(" ") : bestPeriod.label}</Text>
          </View>
          <Text style={st.hudLabel}>Peak {viewMode === "all" ? "month" : viewMode === "year" ? "month" : "day"}</Text>
        </View>
      </View>
      )}

      {/* === STREAKS & HABITS === */}

      {/* Streak cards */}
      {topStreaks.length > 0 && (
      <View style={st.section}>
        <View style={st.streakCards}>
          {topStreaks.slice(0, 6).map((s, i) => {
            const color = getEmojiGlowColor(s.emoji, i);
            return (
              <View key={s.id} style={[st.streakCard, { borderColor: color + "44" }]}>
                <Text style={st.streakEmoji}>{s.emoji}</Text>
                <Text style={[st.streakNum, { color }]}>{s.streak}</Text>
                <Text style={st.streakDays}>days</Text>
              </View>
            );
          })}
        </View>
      </View>
      )}

      {/* Habit formation */}
      {habitProgress.length > 0 && (
      <View style={st.section}>
        <Text style={st.sectionTitle}>Forming habits</Text>
        {habitProgress.map(h => (
          <View key={h.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 }}>
            <Text style={{ fontSize: 20 }}>{h.emoji}</Text>
            <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <View style={{ width: `${h.progress * 100}%`, height: "100%", borderRadius: 3, backgroundColor: "#00ff88" }} />
            </View>
            <Text style={{ fontSize: 11, color: theme.fgMuted }}>{h.streak}/21</Text>
          </View>
        ))}
      </View>
      )}

      {/* Established habits */}
      {establishedHabits.length > 0 && (
      <View style={st.section}>
        {establishedHabits.map(h => (
          <View key={h.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, backgroundColor: "rgba(0,255,136,0.06)", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 }}>
            <Text style={{ fontSize: 20 }}>{h.emoji}</Text>
            <Text style={{ fontSize: 12, color: "#00ff88" }}>is a habit</Text>
            <Text style={{ fontSize: 10, color: theme.fgMuted }}>({h.consistency}% for {h.duration}d)</Text>
          </View>
        ))}
      </View>
      )}

      {/* Routine score */}
      {routineScore !== null && (
      <View style={st.section}>
        <Text style={st.sectionTitle}>Routine score</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: routineScore > 60 ? "#00ff88" : routineScore > 30 ? "#ffcc00" : theme.fgMuted }}>{routineScore}%</Text>
          <Text style={{ fontSize: 12, color: theme.fgMuted, flex: 1 }}>{routineScore > 60 ? "Very predictable" : routineScore > 30 ? "Somewhat varied" : "Highly diverse"}</Text>
        </View>
      </View>
      )}

      {/* === PATTERNS === */}

      {/* Combos */}
      {combos.length > 0 && (
      <View style={st.section}>
        <Text style={st.sectionTitle}>Always together</Text>
        {combos.map((c, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
            <Text style={{ fontSize: 20 }}>{c.a}</Text>
            <Text style={{ fontSize: 12, color: theme.fgMuted }}>+</Text>
            <Text style={{ fontSize: 20 }}>{c.b}</Text>
            <Text style={{ fontSize: 12, color: theme.fgMuted, marginLeft: "auto" }}>{c.count}×</Text>
          </View>
        ))}
      </View>
      )}

      {/* Weekend warrior */}
      {weekendWarriors.length > 0 && (
      <View style={st.section}>
        <Text style={st.sectionTitle}>Weekend warrior</Text>
        {weekendWarriors.map((w, i) => (
          <View key={w.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
            <Text style={{ fontSize: 20 }}>{w.emoji}</Text>
            <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", flexDirection: "row", overflow: "hidden" }}>
              <View style={{ width: `${(1 - w.ratio) * 100}%`, backgroundColor: "rgba(255,255,255,0.2)" }} />
              <View style={{ width: `${w.ratio * 100}%`, backgroundColor: "#00ccff" }} />
            </View>
            <Text style={{ fontSize: 10, color: theme.fgMuted, width: 44 }}>{w.we}w/{w.wd}d</Text>
          </View>
        ))}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={{ fontSize: 9, color: theme.fgMuted }}>Weekday</Text>
          <Text style={{ fontSize: 9, color: "#00ccff" }}>Weekend</Text>
        </View>
      </View>
      )}

      {/* Replacements */}
      {replacements.length > 0 && (
      <View style={st.section}>
        <Text style={st.sectionTitle}>Replaced</Text>
        {replacements.map((r, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
            <Text style={{ fontSize: 20, opacity: 0.4 }}>{r.from}</Text>
            <Text style={{ fontSize: 12, color: theme.fgMuted }}>→</Text>
            <Text style={{ fontSize: 20 }}>{r.to}</Text>
          </View>
        ))}
      </View>
      )}

      {/* === CHANGES === */}

      {/* New this period */}
      {newEmojis.length > 0 && (
      <View style={st.section}>
        <Text style={st.sectionTitle}>New {viewMode === "all" ? "emojis" : viewMode === "month" ? `in ${MONTHS[month]}` : `in ${year}`}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {newEmojis.map((e, i) => {
            const color = getEmojiGlowColor(e, i);
            return (
              <View key={e} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color + "80", alignItems: "center", justifyContent: "center", boxShadow: `0 0 12px ${color}` } as any}>
                <Text style={{ fontSize: 20 }}>{e}</Text>
              </View>
            );
          })}
        </View>
      </View>
      )}

      {/* Dropped */}
      {droppedEmojis.length > 0 && (
      <View style={st.section}>
        <Text style={st.sectionTitle}>Dropped</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {droppedEmojis.map(e => (
            <View key={e} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
              <Text style={{ fontSize: 20 }}>{e}</Text>
            </View>
          ))}
        </View>
      </View>
      )}

      {/* Inactive */}
      {daysSinceLast.length > 0 && (
      <View style={st.section}>
        <Text style={st.sectionTitle}>Inactive</Text>
        {daysSinceLast.map(d => (
          <View key={d.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
            <Text style={{ fontSize: 20, opacity: 0.5 }}>{d.emoji}</Text>
            <Text style={{ fontSize: 13, color: d.days > 30 ? "#ff4466" : theme.fgMuted }}>{d.days}d ago</Text>
          </View>
        ))}
      </View>
      )}

      {/* === FUTURE === */}

      {/* By end of year */}
      {(viewMode === "year" || viewMode === "all") && projections.length > 0 && year === now.getFullYear() && (
      <View style={st.section}>
        <Text style={st.sectionTitle}>By end of year</Text>
        {projections.map((p, i) => {
          const weekAvg = Math.round(p.current / ((Math.floor((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1) / 7) * 10) / 10;
          const progress = Math.min(1, p.current / p.projected);
          const color = getEmojiGlowColor(p.emoji, i);
          return (
            <View key={p.id} style={{ marginBottom: 14, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 12, boxShadow: `inset 0 0 12px ${color}11` } as any}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>{p.emoji}</Text>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>~{p.projected}</Text>
                </View>
                <View style={{ backgroundColor: color + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color }}>{weekAvg} {weekAvg === 1 ? "time" : "times"} per week</Text>
                </View>
              </View>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <View style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: color, borderRadius: 2 }} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                <Text style={{ fontSize: 10, color: theme.fgMuted }}>{p.current} tracked</Text>
                <Text style={{ fontSize: 10, color: theme.fgMuted }}>{p.projected} projected</Text>
              </View>
            </View>
          );
        })}
      </View>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  hudRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  hudCard: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12, paddingVertical: 14, alignItems: "center",
  },
  hudNum: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 2 },
  hudLabel: { fontSize: 11, color: theme.fgMuted },
  yearRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  navBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingVertical: 12, height: 52, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.06)", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)" },
  toggleRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  toggleActive: { backgroundColor: "rgba(255,255,255,0.12)" },
  toggleTxt: { fontSize: 12, color: theme.fgMuted, fontWeight: "500" },
  toggleTxtActive: { color: "#fff" },
  yearTxt: { fontSize: 15, fontWeight: "600", color: theme.fg, minWidth: 80, textAlign: "center" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: theme.fgMuted, marginBottom: 12 },
  heatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  heatMonth: { width: "23%", marginBottom: 10 },
  heatMonthLabel: { fontSize: 9, color: theme.fgMuted, marginBottom: 3, fontWeight: "500" },
  heatMonthCells: { flexDirection: "row", flexWrap: "wrap", gap: 1 },
  heatCell: { width: "13%", aspectRatio: 1, borderRadius: 1.5 },
  legend: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 2 },
  legendTxt: { fontSize: 10, color: theme.fgMuted, marginHorizontal: 4 },
  empty: { color: theme.fgMuted, fontSize: 13 },
  auraWrap: { width: 200, height: 200, alignSelf: "center", alignItems: "center", justifyContent: "center", marginVertical: 16 },
  ringsWrap: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 },
  ringsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 24, height: 260 },
  ringsLeft: { gap: 8, flex: 1, justifyContent: "center" },
  ringsRight: { gap: 8, flex: 1, alignItems: "flex-end", justifyContent: "center" },
  ringsCenter: { width: 110, height: 110, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", alignItems: "center", justifyContent: "center" },
  ringFill: { position: "absolute" },
  ringsLegend: { marginLeft: 140, gap: 6 },
  ringLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  ringDot: { width: 8, height: 8, borderRadius: 4 },
  ringLabelTxt: { fontSize: 12, color: theme.fgMuted },
  streakCards: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  streakCard: { width: "47%", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center" },
  streakEmoji: { fontSize: 28, marginBottom: 4 },
  streakNum: { fontSize: 28, fontWeight: "800" },
  streakDays: { fontSize: 11, color: theme.fgMuted, marginBottom: 4 },
  streakTier: { fontSize: 10, color: theme.fgMuted },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  barEmoji: { fontSize: 20, width: 32 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barCount: { fontSize: 12, color: theme.fgMuted, width: 28, textAlign: "right" },
});
