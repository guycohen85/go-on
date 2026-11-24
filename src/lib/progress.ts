// Progress in "חוזרים לחיים": which stations the user marked as done. Stored on this device only.
import { update } from 'idb-keyval';
import { load } from './store';

/** Station number → ISO date it was marked done. */
export type Progress = Record<string, string>;

const KEY = 'progress';

export function loadProgress(onLate?: (p: Progress) => void): Promise<Progress> {
  return load<Progress>(KEY, {}, onLate);
}

/** Mark a station done (with today's date) or not done, in one read-modify-write. */
export async function setDone(station: number, done: boolean): Promise<boolean> {
  try {
    await update<Progress>(KEY, (old) => {
      const next = { ...(old ?? {}) };
      if (done) next[station] = new Date().toISOString();
      else delete next[station];
      return next;
    });
    return true;
  } catch {
    return false;
  }
}

/** The first station not yet done after `after` (wrapping around), or null when all are done. */
export function nextStation(progress: Progress, total: number, after = 0): number | null {
  for (let i = 1; i <= total; i++) {
    const n = ((after + i - 1) % total) + 1;
    if (!progress[n]) return n;
  }
  return null;
}

/** How many of stations 1..total are done. */
export function doneCount(progress: Progress, total: number): number {
  let count = 0;
  for (let n = 1; n <= total; n++) if (progress[n]) count++;
  return count;
}
