export type Streak = { tagId: string; start: string; end: string; length: number };

/** Find all consecutive-day streaks for each tag in a given month */
export function findStreaks(
  entries: Record<string, string[]>,
  tags: { id: string }[],
  year: number,
  month: number,
): Streak[] {
  const streaks: Streak[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const ds = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  for (const tag of tags) {
    let start = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const active = (entries[ds(d)] ?? []).includes(tag.id);
      if (active && !start) start = d;
      if ((!active || d === daysInMonth) && start) {
        const end = active ? d : d - 1;
        const len = end - start + 1;
        if (len >= 2) streaks.push({ tagId: tag.id, start: ds(start), end: ds(end), length: len });
        start = 0;
      }
    }
  }
  return streaks;
}

/** Get the longest streak per tag */
export function longestStreaks(streaks: Streak[]): Record<string, Streak> {
  const best: Record<string, Streak> = {};
  for (const s of streaks) {
    if (!best[s.tagId] || s.length > best[s.tagId].length) best[s.tagId] = s;
  }
  return best;
}

/** Get all streaks containing a specific date for a tag */
export function streaksForDate(streaks: Streak[], tagId: string, date: string): Streak | undefined {
  return streaks.find((s) => s.tagId === tagId && s.start <= date && s.end >= date);
}
