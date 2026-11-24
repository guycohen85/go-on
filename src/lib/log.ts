// Append-only logs kept on the device (activity, brain training, ...). Shown later in tracking.
import { load, updateList } from './store';

export interface LogEntry {
  at: string;
  values: Record<string, string>;
}

const MAX = 365;

export function addEntry(id: string, values: Record<string, string>): Promise<boolean> {
  const entry: LogEntry = { at: new Date().toISOString(), values };
  return updateList<LogEntry>(`log:${id}`, (list) => [...list, entry].slice(-MAX));
}

export function entries(id: string): Promise<LogEntry[]> {
  return load<LogEntry[]>(`log:${id}`, []);
}
