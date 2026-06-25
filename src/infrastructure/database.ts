import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CalendarState, Tag, TimeSlot } from "../domain/vo/types";

const AS_KEY = "emoji-cal";

// On web, use AsyncStorage as the backend. On native, use SQLite.
const isWeb = Platform.OS === "web";

let _state: CalendarState = { tags: [], entries: {}, timeEntries: {} };

// --- Web fallback (AsyncStorage-backed) ---

async function webLoad(): Promise<CalendarState> {
  const raw = await AsyncStorage.getItem(AS_KEY);
  if (raw) _state = JSON.parse(raw);
  return _state;
}

async function webSave() {
  await AsyncStorage.setItem(AS_KEY, JSON.stringify(_state));
}

// --- SQLite (native only) ---

let db: any;

async function getDB() {
  if (db) return db;
  const SQLite = await import("expo-sqlite");
  db = await SQLite.openDatabaseAsync("elcalendario.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, emoji TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS entries (date TEXT NOT NULL, tag_id TEXT NOT NULL, PRIMARY KEY (date, tag_id));
    CREATE TABLE IF NOT EXISTS time_entries (date TEXT NOT NULL, tag_id TEXT NOT NULL, time TEXT NOT NULL, PRIMARY KEY (date, tag_id, time));
    CREATE TABLE IF NOT EXISTS profile (key TEXT PRIMARY KEY, value TEXT);
  `);
  return db;
}

// --- Public API ---

export async function openDB() { if (!isWeb) await getDB(); }

export async function loadStateFromDB(): Promise<CalendarState> {
  if (isWeb) return webLoad();
  const d = await getDB();
  const tags = await d.getAllAsync("SELECT id, emoji FROM tags");
  const entryRows = await d.getAllAsync("SELECT date, tag_id FROM entries");
  const timeRows = await d.getAllAsync("SELECT date, tag_id, time FROM time_entries");

  const entries: Record<string, string[]> = {};
  for (const r of entryRows as any[]) (entries[r.date] ??= []).push(r.tag_id);

  const timeEntries: Record<string, TimeSlot[]> = {};
  for (const r of timeRows as any[]) (timeEntries[r.date] ??= []).push({ tagId: r.tag_id, time: r.time });

  return { tags: tags as Tag[], entries, timeEntries };
}

export async function saveTag(tag: Tag) {
  if (isWeb) { _state.tags = _state.tags.filter(t => t.id !== tag.id).concat(tag); await webSave(); return; }
  const d = await getDB();
  await d.runAsync("INSERT OR REPLACE INTO tags (id, emoji) VALUES (?, ?)", tag.id, tag.emoji);
}

export async function deleteTag(id: string) {
  if (isWeb) {
    _state.tags = _state.tags.filter(t => t.id !== id);
    for (const date of Object.keys(_state.entries)) _state.entries[date] = _state.entries[date].filter(i => i !== id);
    for (const date of Object.keys(_state.timeEntries ?? {})) _state.timeEntries[date] = (_state.timeEntries[date] ?? []).filter(s => s.tagId !== id);
    await webSave(); return;
  }
  const d = await getDB();
  await d.runAsync("DELETE FROM tags WHERE id = ?", id);
  await d.runAsync("DELETE FROM entries WHERE tag_id = ?", id);
  await d.runAsync("DELETE FROM time_entries WHERE tag_id = ?", id);
}

export async function toggleEntry(date: string, tagId: string) {
  if (isWeb) {
    const ids = _state.entries[date] ?? [];
    _state.entries[date] = ids.includes(tagId) ? ids.filter(i => i !== tagId) : [...ids, tagId];
    if (_state.entries[date].length === 0) delete _state.entries[date];
    await webSave(); return;
  }
  const d = await getDB();
  const existing = await d.getFirstAsync("SELECT tag_id FROM entries WHERE date = ? AND tag_id = ?", date, tagId);
  if (existing) {
    await d.runAsync("DELETE FROM entries WHERE date = ? AND tag_id = ?", date, tagId);
    await d.runAsync("DELETE FROM time_entries WHERE date = ? AND tag_id = ?", date, tagId);
  } else {
    await d.runAsync("INSERT INTO entries (date, tag_id) VALUES (?, ?)", date, tagId);
  }
}

export async function setTimeSlot(date: string, tagId: string, time: string) {
  if (isWeb) {
    (_state.timeEntries[date] ??= []).push({ tagId, time });
    await webSave(); return;
  }
  const d = await getDB();
  await d.runAsync("INSERT OR REPLACE INTO time_entries (date, tag_id, time) VALUES (?, ?, ?)", date, tagId, time);
}

export async function deleteTimeSlot(date: string, tagId: string, time: string) {
  if (isWeb) {
    _state.timeEntries[date] = (_state.timeEntries[date] ?? []).filter(s => !(s.tagId === tagId && s.time === time));
    await webSave(); return;
  }
  const d = await getDB();
  await d.runAsync("DELETE FROM time_entries WHERE date = ? AND tag_id = ? AND time = ?", date, tagId, time);
}

export async function saveProfile(key: string, value: string) {
  if (isWeb) { await AsyncStorage.setItem(`profile_${key}`, value); return; }
  const d = await getDB();
  await d.runAsync("INSERT OR REPLACE INTO profile (key, value) VALUES (?, ?)", key, value);
}

export async function getProfile(key: string): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(`profile_${key}`);
  const d = await getDB();
  const row = await d.getFirstAsync("SELECT value FROM profile WHERE key = ?", key) as any;
  return row?.value ?? null;
}

export async function importState(state: CalendarState) {
  if (isWeb) { _state = state; await webSave(); return; }
  const d = await getDB();
  await d.execAsync("DELETE FROM tags; DELETE FROM entries; DELETE FROM time_entries;");
  for (const tag of state.tags) await d.runAsync("INSERT INTO tags (id, emoji) VALUES (?, ?)", tag.id, tag.emoji);
  for (const [date, ids] of Object.entries(state.entries)) for (const id of ids) await d.runAsync("INSERT INTO entries (date, tag_id) VALUES (?, ?)", date, id);
  for (const [date, slots] of Object.entries(state.timeEntries ?? {})) for (const sl of slots) await d.runAsync("INSERT INTO time_entries (date, tag_id, time) VALUES (?, ?, ?)", date, sl.tagId, sl.time);
}
