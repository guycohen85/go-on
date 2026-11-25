import { useEffect, useState } from 'preact/hooks';
import { update } from 'idb-keyval';
import { load } from '../../lib/store';
import { url } from '../../lib/url';
import { note } from './ui';

type Ratings = Record<string, number>;

/** Stored under "baseline": the first rating, and the re-rating from station 11. Keyed by domain text. */
interface Stored {
  start?: Ratings;
  again?: Ratings;
}

interface Props {
  domains: string[];
  scale: string;
  /** Draft label for the scale text, until the client approves it. */
  scaleDraft?: string;
  /**
   * "start": the baseline page. "again": re-rate next to the first rating (station 11).
   * "auto" (tracking page): "start" until a first rating exists, then "again". Decided once, on load.
   */
  mode?: 'start' | 'again' | 'auto';
}

const KEY = 'baseline';

/** 0 to 10 ratings for each life domain, saved to this device only. */
export default function Baseline({ domains, scale, scaleDraft, mode = 'start' }: Props) {
  const [stored, setStored] = useState<Stored>({});
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [round, setRound] = useState<'start' | 'again'>(mode === 'start' ? 'start' : 'again');

  useEffect(() => {
    // Ratings made before storage answered win over the late stored ones.
    const mergeIn = (s: Stored) =>
      setStored((cur) => ({
        start: { ...s.start, ...cur.start },
        again: { ...s.again, ...cur.again },
      }));
    load<Stored>(KEY, {}, mergeIn).then((s) => {
      mergeIn(s);
      if (mode === 'auto') setRound(Object.keys(s.start ?? {}).length > 0 ? 'again' : 'start');
      setReady(true);
    });
  }, [mode]);

  async function rate(domain: string, value: number) {
    setStored((cur) => ({ ...cur, [round]: { ...cur[round], [domain]: value } }));
    try {
      await update<Stored>(KEY, (old) => ({ ...old, [round]: { ...old?.[round], [domain]: value } }));
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  const start = stored.start ?? {};
  const current = stored[round] ?? {};
  const hasStart = Object.keys(start).length > 0;
  const again = round === 'again';

  return (
    <form class="mt-4 rounded-card bg-sky p-4" onSubmit={(e) => e.preventDefault()} aria-busy={!ready}>
      {scaleDraft && <p class="draft">{scaleDraft}</p>}
      <p class="text-small text-ink-2">{scale}</p>
      {mode === 'again' && ready && !hasStart && (
        <p class="mt-2">
          עוד לא מילאת את מד הפתיחה, אז אין דירוג קודם להשוואה.{' '}
          <a href={url('/back-to-life/baseline')} class="font-semibold underline">
            למד הפתיחה
          </a>
        </p>
      )}
      <div class="mt-3 grid gap-5">
        {domains.map((domain, i) => {
          const id = `baseline-${round}-${i}`;
          const value = current[domain];
          const before = start[domain];
          const diff = again && value !== undefined && before !== undefined ? value - before : null;
          return (
            <div key={domain}>
              <label for={id} class="block font-semibold">
                {domain}
              </label>
              <div class="mt-1 flex items-center gap-3">
                <input
                  id={id}
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={value ?? 5}
                  aria-valuetext={value === undefined ? 'לא דורג' : String(value)}
                  disabled={!ready}
                  class="h-11 min-w-0 flex-1 cursor-pointer accent-ink"
                  onInput={(e) => rate(domain, Number(e.currentTarget.value))}
                />
                <output for={id} class="w-16 shrink-0 text-center font-display text-card font-medium">
                  {value ?? '–'}
                </output>
              </div>
              {again && before !== undefined && (
                <p class="text-small text-ink-2">
                  בפתיחה: {before}
                  {diff !== null && diff > 0 && ` · עלה ב‑${diff}`}
                  {diff !== null && diff < 0 && ` · ירד ב‑${-diff}`}
                  {diff === 0 && ' · בלי שינוי'}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p class={note} role="status" aria-live="polite">
        {status === 'saved' && 'נשמר בטלפון הזה.'}
        {status === 'error' && 'לא הצלחנו לשמור. ייתכן שהדפדפן חוסם שמירה (למשל בגלישה בסתר).'}
        {status === 'idle' && 'הדירוג נשמר אוטומטית, רק בטלפון הזה.'}
      </p>
    </form>
  );
}
