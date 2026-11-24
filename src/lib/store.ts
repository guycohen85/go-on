// On-device storage (IndexedDB). Nothing here ever leaves the device.
import { get, set, del } from 'idb-keyval';

export type Answers = Record<string, string>;

/** If IndexedDB does not answer in time (blocked storage, some private modes), carry on without it. */
const TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), TIMEOUT_MS))]);
}

export async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    return (await withTimeout(get(key) as Promise<T | undefined>, undefined)) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function save<T>(key: string, value: T): Promise<boolean> {
  try {
    return await withTimeout(
      set(key, value).then(() => true),
      false,
    );
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
