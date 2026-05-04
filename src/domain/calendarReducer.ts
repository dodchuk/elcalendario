import type { CalendarState, Action } from "./vo/types";

export const initialState: CalendarState = { tags: [], entries: {}, timeEntries: {} };

export function calendarReducer(s: CalendarState, a: Action): CalendarState {
  switch (a.type) {
    case "ADD_TAG":
      return { ...s, tags: [...s.tags, a.tag] };
    case "DEL_TAG":
      return {
        ...s,
        tags: s.tags.filter((t) => t.id !== a.id),
        entries: Object.fromEntries(
          Object.entries(s.entries).map(([d, ids]) => [d, ids.filter((i) => i !== a.id)])
        ),
        timeEntries: Object.fromEntries(
          Object.entries(s.timeEntries ?? {}).map(([d, slots]) => [d, slots.filter((sl) => sl.tagId !== a.id)])
        ),
      };
    case "TOGGLE_EMOJI": {
      const prev = s.entries[a.date] ?? [];
      const ids = prev.includes(a.tagId) ? prev.filter((i) => i !== a.tagId) : [...prev, a.tagId];
      return { ...s, entries: { ...s.entries, [a.date]: ids } };
    }
    case "SET_TIME_SLOT": {
      const prev = s.timeEntries?.[a.date] ?? [];
      if (prev.some((sl) => sl.tagId === a.tagId && sl.time === a.time)) return s;
      return { ...s, timeEntries: { ...s.timeEntries, [a.date]: [...prev, { tagId: a.tagId, time: a.time }] } };
    }
    case "DEL_TIME_SLOT": {
      const prev = s.timeEntries?.[a.date] ?? [];
      return { ...s, timeEntries: { ...s.timeEntries, [a.date]: prev.filter((sl) => !(sl.tagId === a.tagId && sl.time === a.time)) } };
    }
    case "LOAD":
      return { ...a.state, timeEntries: a.state.timeEntries ?? {} };
  }
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
