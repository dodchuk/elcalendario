import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from "react";
import type { CalendarState, Action } from "../domain/vo/types";
import { calendarReducer, initialState } from "../domain/calendarReducer";
import { loadState, saveState } from "../infrastructure/calendarRepository";

const Ctx = createContext<{ state: CalendarState; dispatch: Dispatch<Action> }>({
  state: initialState,
  dispatch: () => {},
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calendarReducer, initialState);

  useEffect(() => {
    loadState().then((saved) => { if (saved) dispatch({ type: "LOAD", state: saved }); });
  }, []);

  useEffect(() => {
    if (state.tags.length || Object.keys(state.entries).length) saveState(state);
  }, [state]);

  // Prepare flat payload for server sync
  useEffect(() => {
    const payload: { id: string; emoji: string; date: string }[] = [];
    const tagMap = Object.fromEntries(state.tags.map((t) => [t.id, t]));

    for (const [date, ids] of Object.entries(state.entries)) {
      for (const id of ids) {
        const tag = tagMap[id];
        if (!tag) continue;
        const timeSlots = (state.timeEntries?.[date] ?? []).filter((sl) => sl.tagId === id);
        if (timeSlots.length) {
          for (const sl of timeSlots) {
            payload.push({ id, emoji: tag.emoji, date: new Date(`${date}T${sl.time}`).toISOString() });
          }
        } else {
          payload.push({ id, emoji: tag.emoji, date: new Date(`${date}T00:00`).toISOString() });
        }
      }
    }

    console.log("[sync] payload:", payload);
  }, [state]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
