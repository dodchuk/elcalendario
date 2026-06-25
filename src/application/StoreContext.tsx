import { createContext, useContext, useReducer, useEffect, useCallback, useRef, type ReactNode, type Dispatch } from "react";
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
      const dbState = await loadStateFromDB();
      if (dbState.tags.length || Object.keys(dbState.entries).length) {
        dispatch({ type: "LOAD", state: dbState });
        didLoad.current = true;
        return;
      }
      const legacy = await loadState();
      if (legacy) {
        await importState(legacy);
        dispatch({ type: "LOAD", state: legacy });
      }
      didLoad.current = true;
    })();
  }, []);

  // Persist full state after every change
  const didLoad = useRef(false);
  useEffect(() => {
    if (!didLoad.current) return;
    importState(state);
  }, [state]);

  // Persist actions to SQLite (native) — on web importState handles it
  const dispatchWithPersist = useCallback((action: Action) => {
    dispatch(action);
  }, []);

  return <Ctx.Provider value={{ state, dispatch: dispatchWithPersist }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
