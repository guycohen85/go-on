import { useEffect, useState } from 'preact/hooks';
import { load, save } from '../../lib/store';

const RATINGS = ['שימושי', 'לא ברור', 'חסר לי'] as const;
type Rating = (typeof RATINGS)[number];

interface Entry {
  page: string;
  rating: Rating;
  message: string;
  sentAt: string;
}

const QUEUE_KEY = 'feedbackQueue';
const ENDPOINT = 'https://api.web3forms.com/submit';
const ACCESS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY as string | undefined;

async function post(entry: Entry): Promise<boolean> {
  if (!ACCESS_KEY) return false;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: ACCESS_KEY,
        subject: `GO ON – משוב: ${entry.rating} (${entry.page})`,
        from_name: 'GO ON',
        page: entry.page,
        rating: entry.rating,
        message: entry.message || '(בלי טקסט)',
        app_version: import.meta.env.PUBLIC_APP_VERSION ?? 'dev',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Send any feedback that was saved while offline. */
async function flushQueue() {
  const queue = await load<Entry[]>(QUEUE_KEY, []);
  if (!queue.length || !navigator.onLine) return;
  const left: Entry[] = [];
  for (const entry of queue) if (!(await post(entry))) left.push(entry);
  await save(QUEUE_KEY, left);
}

type Phase = 'choose' | 'write' | 'sent' | 'queued';

interface Props {
  /** Stable id of the page, e.g. "needs/fertility". */
  page: string;
}

/** Anonymous feedback on a page: useful / unclear / missing, with optional text. */
export default function Feedback({ page }: Props) {
  const [phase, setPhase] = useState<Phase>('choose');
  const [rating, setRating] = useState<Rating | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void flushQueue();
    const onOnline = () => void flushQueue();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  async function send() {
    if (!rating) return;
    setSending(true);
    const entry: Entry = { page, rating, message: message.trim(), sentAt: new Date().toISOString() };
    if (await post(entry)) {
      setPhase('sent');
    } else {
      const queue = await load<Entry[]>(QUEUE_KEY, []);
      await save(QUEUE_KEY, [...queue, entry]);
      setPhase('queued');
    }
    setSending(false);
  }

  return (
    <section class="mt-10 rounded-card border-2 border-line p-4" aria-labelledby={`fb-${page}`}>
      <h2 id={`fb-${page}`} class="font-display text-card font-medium">
        העמוד הזה עזר לך?
      </h2>
      <div role="status" aria-live="polite">
        {phase === 'sent' && <p class="mt-2">תודה! המשוב נשלח.</p>}
        {phase === 'queued' && <p class="mt-2">תודה! המשוב יישלח כשיהיה חיבור לאינטרנט.</p>}
      </div>
      {(phase === 'choose' || phase === 'write') && (
        <>
          <div class="mt-3 flex flex-wrap gap-2" role="group" aria-label="דירוג העמוד">
            {RATINGS.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={rating === r}
                class={`min-h-11 rounded-pill border-2 px-4 font-semibold transition-colors ${
                  rating === r ? 'border-ink bg-ink text-white' : 'border-line bg-paper hover:border-ink'
                }`}
                onClick={() => {
                  setRating(r);
                  setPhase('write');
                }}
              >
                {r}
              </button>
            ))}
          </div>
          {phase === 'write' && (
            <div class="mt-4">
              <label for={`fb-text-${page}`} class="block font-semibold">
                רוצה להוסיף משהו? (לא חובה)
              </label>
              <p class="text-small text-ink-2">בלי שם ובלי פרטים אישיים או רפואיים. המשוב אנונימי.</p>
              <textarea
                id={`fb-text-${page}`}
                rows={3}
                maxLength={1000}
                class="mt-1.5 w-full rounded-tile border-2 border-line px-3 py-2.5 focus:border-ink focus:outline-none"
                value={message}
                onInput={(e) => setMessage(e.currentTarget.value)}
              />
              <button
                type="button"
                class="mt-3 inline-flex min-h-11 items-center rounded-tile bg-go px-6 font-bold text-white transition-colors hover:bg-go-hover disabled:opacity-60"
                disabled={sending}
                onClick={send}
              >
                {sending ? 'שולח…' : 'שליחת משוב'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
