// On-device storage (IndexedDB). Nothing here ever leaves the device.
import { get, set, del, update } from 'idb-keyval';

export type Answers = Record<string, string>;

/** If IndexedDB does not answer in time (blocked storage, some private modes), carry on without it. */
const TIMEOUT_MS = 2000;
const TIMED_OUT = Symbol('timed-out');

/**
 * Read a value. If storage is slow, resolve with `fallback` after a timeout so the UI can open,
 * and call `onLate` if the real value arrives afterwards (so it can be merged, not lost).
 */
export async function load<T>(key: string, fallback: T, onLate?: (value: T) => void): Promise<T> {
  const read = (get(key) as Promise<T | undefined>).catch(() => undefined);
  const first = await Promise.race([
    read,
    new Promise<typeof TIMED_OUT>((resolve) => setTimeout(() => resolve(TIMED_OUT), TIMEOUT_MS)),
  ]);
  if (first === TIMED_OUT) {
    void read.then((late) => {
      if (late !== undefined) onLate?.(late);
    });
    return fallback;
  }
  return first ?? fallback;
}

let asked = false;
/** After the first successful write, ask the browser not to evict our data under storage pressure. */
function persist() {
  if (asked) return;
  asked = true;
  void navigator.storage?.persist?.().catch(() => undefined);
}

export async function save<T>(key: string, value: T): Promise<boolean> {
  try {
    await set(key, value);
    persist();
    return true;
  } catch {
    return false;
  }
}

/**
 * Merge a partial object into the stored one in a single read-modify-write,
 * so a write never drops fields that were saved earlier.
 */
export async function merge<T extends Record<string, unknown>>(key: string, patch: Partial<T>): Promise<boolean> {
  try {
    await update<T>(key, (old) => ({ ...(old ?? ({} as T)), ...patch }));
    persist();
    return true;
  } catch {
    return false;
  }
}

/** Atomically change a stored array. */
export async function updateList<T>(key: string, change: (list: T[]) => T[]): Promise<boolean> {
  try {
    await update<T[]>(key, (old) => change(old ?? []));
    persist();
    return true;
  } catch {
    return false;
  }
}

export async function remove(key: string): Promise<void> {
  try {
    await del(key);
  } catch {
    /* storage unavailable: nothing to remove */
  }
}
