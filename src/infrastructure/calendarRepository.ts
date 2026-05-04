import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CalendarState } from "../domain/vo/types";

const KEY = "emoji-cal";

export async function loadState(): Promise<CalendarState | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveState(state: CalendarState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}
