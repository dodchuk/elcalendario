export type Tag = { id: string; emoji: string };

export type TimeSlot = { tagId: string; time: string }; // time = "HH:MM"

export type CalendarState = {
  tags: Tag[];
  entries: Record<string, string[]>; // date "YYYY-MM-DD" -> tagId[]
  timeEntries: Record<string, TimeSlot[]>; // date "YYYY-MM-DD" -> time slots
};

export type Action =
  | { type: "ADD_TAG"; tag: Tag }
  | { type: "DEL_TAG"; id: string }
  | { type: "TOGGLE_EMOJI"; date: string; tagId: string }
  | { type: "SET_TIME_SLOT"; date: string; tagId: string; time: string }
  | { type: "DEL_TIME_SLOT"; date: string; tagId: string; time: string }
  | { type: "LOAD"; state: CalendarState };
