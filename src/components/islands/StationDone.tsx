import { useEffect, useState } from 'preact/hooks';
import { loadProgress, setDone, nextStation, doneCount, type Progress } from '../../lib/progress';
import { url } from '../../lib/url';

interface Props {
  station: number;
  total: number;
}

const primary =
  'inline-flex min-h-11 items-center justify-center rounded-tile bg-go px-6 font-bold text-white transition-colors hover:bg-go-hover disabled:opacity-60';
const secondary =
  'inline-flex min-h-11 items-center justify-center rounded-tile border-2 border-line bg-paper px-4 font-semibold text-ink transition-colors hover:border-ink';

/** "סיימתי": marks the station done on this device. Nothing is locked; it only shows progress. */
export default function StationDone({ station, total }: Props) {
  const [progress, setProgress] = useState<Progress>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadProgress((late) => setProgress((cur) => ({ ...late, ...cur }))).then((p) => {
      setProgress((cur) => ({ ...p, ...cur }));
      setReady(true);
    });
  }, []);

  async function toggle(done: boolean) {
    setProgress((cur) => {
      const next = { ...cur };
      if (done) next[station] = new Date().toISOString();
      else delete next[station];
      return next;
    });
    setError(!(await setDone(station, done)));
  }

  const doneAt = progress[station];
  const next = nextStation(progress, total, station);
  const count = doneCount(progress, total);

  return (
    <section class="mt-10 rounded-card border-2 border-line p-4" aria-labelledby="done-h" aria-busy={!ready}>
      <h2 id="done-h" class="sr-only">
        סיום התחנה
      </h2>
      <div role="status" aria-live="polite">
        {doneAt ? (
          <div class="flex items-center gap-3">
            <span class="done-badge grid size-11 shrink-0 place-items-center rounded-pill bg-ink text-white">
              <svg viewBox="0 0 256 256" width="1em" height="1em" fill="currentColor" aria-hidden="true" class="text-icon">
                <path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z" />
              </svg>
            </span>
            <p>
              <span class="block font-display text-card font-medium">
                {next === null ? 'סיימת את כל 12 התחנות!' : 'סיימת את התחנה'}
              </span>
              <span class="block text-small text-ink-2">
                {count} מתוך {total} תחנות · {new Date(doneAt).toLocaleDateString('he-IL')}
              </span>
            </p>
          </div>
        ) : (
          <p class="text-ink-2">כשמרגישים שסיימת את התחנה, אפשר לסמן. הסימון נשמר רק בטלפון הזה.</p>
        )}
      </div>
      <div class="mt-4 flex flex-wrap gap-3">
        {!doneAt && (
          <button type="button" class={primary} disabled={!ready} onClick={() => toggle(true)}>
            סיימתי
          </button>
        )}
        {doneAt && next !== null && (
          <a href={url(`/back-to-life/station/${next}`)} class={`${primary} no-underline`}>
            לתחנה {next}
          </a>
        )}
        {doneAt && next === null && (
          <a href={url('/back-to-life/')} class={`${primary} no-underline`}>
            לעמוד חוזרים לחיים
          </a>
        )}
        {doneAt && (
          <button type="button" class={secondary} onClick={() => toggle(false)}>
            ביטול הסימון
          </button>
        )}
      </div>
      {error && <p class="mt-2 text-small">לא הצלחנו לשמור. ייתכן שהדפדפן חוסם שמירה (למשל בגלישה בסתר).</p>}
    </section>
  );
}
