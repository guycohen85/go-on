// The personal diary, encrypted on this device with a key derived from the user's personal code.
// AES-GCM 256 via Web Crypto; the key comes from PBKDF2-SHA-256 and never leaves memory.
// A forgotten code cannot be recovered: there is no copy of the key anywhere.
import { get } from 'idb-keyval';
import { save, remove } from './store';

export interface JournalEntry {
  id: string;
  at: string;
  mood: string;
  energy: string;
  text: string;
  tomorrow: string;
}

export interface Question {
  id: string;
  at: string;
  to: string;
  priority: string;
  text: string;
  answered: boolean;
}

export interface Symptom {
  id: string;
  at: string;
  kind: string;
  severity: number;
  temp: string;
  start: string;
  before: string;
  relief: string;
}

export interface CarePlan {
  contact: string;
  phone: string;
  fever: string;
  urgent: string;
}

export interface DiaryData {
  journal: JournalEntry[];
  questions: Question[];
  symptoms: Symptom[];
  plan: CarePlan;
}

/** What is stored under "diary": only ciphertext and the parameters needed to derive the key again. */
interface Sealed {
  v: 1;
  iter: number;
  salt: string;
  iv: string;
  data: string;
}

const KEY = 'diary';
const ITERATIONS = 600_000;
export const MIN_CODE = 4;

export function blankDiary(): DiaryData {
  return { journal: [], questions: [], symptoms: [], plan: { contact: '', phone: '', fever: '', urgent: '' } };
}

/** Web Crypto exists only in a secure context (https or localhost). */
export function supported(): boolean {
  return typeof crypto !== 'undefined' && !!crypto.subtle && typeof crypto.getRandomValues === 'function';
}

/**
 * Read the sealed diary with no timeout: unlike other data, a slow read must never look like
 * "no diary yet", or creating a new one would overwrite it. Throws if storage is unavailable.
 */
async function read(): Promise<Sealed | null> {
  return ((await get(KEY)) as Sealed | undefined) ?? null;
}

export async function exists(): Promise<boolean> {
  return (await read()) !== null;
}

/** Base64 in chunks: spreading a large array into fromCharCode overflows the call stack. */
function toB64(bytes: Uint8Array): string {
  let text = '';
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(text);
}
const fromB64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function derive(code: string, salt: Uint8Array, iter: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: iter, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** An unlocked diary: the derived key plus the salt it was derived with, kept only in memory. */
export interface Session {
  key: CryptoKey;
  salt: Uint8Array;
  iter: number;
}

async function seal(session: Session, data: DiaryData): Promise<boolean> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(data));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, session.key, plain));
  const sealed: Sealed = { v: 1, iter: session.iter, salt: toB64(session.salt), iv: toB64(iv), data: toB64(cipher) };
  return save(KEY, sealed);
}

/** Create a new, empty diary locked with `code`. */
export async function create(code: string): Promise<Session | null> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const session = { key: await derive(code, salt, ITERATIONS), salt, iter: ITERATIONS };
  return (await seal(session, blankDiary())) ? session : null;
}

/** Open the diary with `code`. Returns null when the code is wrong or the data cannot be read. */
export async function open(code: string): Promise<{ session: Session; data: DiaryData } | null> {
  try {
    const sealed = await read();
    if (!sealed) return null;
    const salt = fromB64(sealed.salt);
    const key = await derive(code, salt, sealed.iter);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(sealed.iv) as BufferSource }, key, fromB64(sealed.data) as BufferSource);
    const data = { ...blankDiary(), ...(JSON.parse(new TextDecoder().decode(plain)) as Partial<DiaryData>) };
    return { session: { key, salt, iter: sealed.iter }, data };
  } catch {
    return null;
  }
}

export function write(session: Session, data: DiaryData): Promise<boolean> {
  return seal(session, data);
}

/** Re-encrypt the diary under a new code (with a new salt). */
export async function changeCode(data: DiaryData, code: string): Promise<Session | null> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const session = { key: await derive(code, salt, ITERATIONS), salt, iter: ITERATIONS };
  return (await seal(session, data)) ? session : null;
}

export function destroy(): Promise<void> {
  return remove(KEY);
}

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
