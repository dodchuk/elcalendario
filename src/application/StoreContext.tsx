import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from "react";
import type { CalendarState, Action } from "../domain/vo/types";
import { calendarReducer, initialState } from "../domain/calendarReducer";
import { loadState } from "../infrastructure/calendarRepository";
import { loadStateFromDB, importState, saveTag, deleteTag, toggleEntry, setTimeSlot, deleteTimeSlot } from "../infrastructure/database";

const Ctx = createContext<{ state: CalendarState; dispatch: Dispatch<Action> }>({
  state: initialState,
  dispatch: () => {},
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calendarReducer, initialState);

  useEffect(() => {
    (async () => {
      // Try loading from SQLite first
      const dbState = await loadStateFromDB();
      if (dbState.tags.length || Object.keys(dbState.entries).length) {
        dispatch({ type: "LOAD", state: dbState });
        return;
      }
      // Migrate from AsyncStorage if exists
      const legacy = await loadState();
      if (legacy) {
        await importState(legacy);
        dispatch({ type: "LOAD", state: legacy });
      }
    })();
  }, []);

  // Persist actions to SQLite
  const dispatchWithPersist = (action: Action) => {
    dispatch(action);
    switch (action.type) {
      case "ADD_TAG": saveTag(action.tag); break;
      case "DEL_TAG": deleteTag(action.id); break;
      case "TOGGLE_EMOJI": toggleEntry(action.date, action.tagId); break;
      case "SET_TIME_SLOT": setTimeSlot(action.date, action.tagId, action.time); break;
      case "DEL_TIME_SLOT": deleteTimeSlot(action.date, action.tagId, action.time); break;
    }
  };

  return <Ctx.Provider value={{ state, dispatch: dispatchWithPersist }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
