import { useEffect, useState } from 'preact/hooks';
import { load, updateList } from '../../lib/store';

const RATINGS = ['שימושי', 'לא ברור', 'חסר לי'] as const;
type Rating = (typeof RATINGS)[number];

interface Entry {
  id: string;
  page: string;
  rating: Rating;
  message: string;
  createdAt: string;
}

const QUEUE_KEY = 'feedbackQueue';
const QUEUE_MAX = 20;
const QUEUE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const ENDPOINT = 'https://api.web3forms.com/submit';
const ACCESS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY as string | undefined;

/** 'sent' on success, 'network' when offline or unreachable (worth retrying), 'rejected' otherwise. */
type PostResult = 'sent' | 'network' | 'rejected';

async function post(entry: Entry): Promise<PostResult> {
  if (!ACCESS_KEY) return 'rejected';
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
    return res.ok ? 'sent' : 'rejected';
  } catch {
    return 'network';
  }
}

const fresh = (e: Entry) => Date.now() - Date.parse(e.createdAt) < QUEUE_MAX_AGE_MS;

/** Send feedback saved while offline. Only one flush runs at a time. */
let flushing: Promise<void> | null = null;
function flushQueue(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    if (!navigator.onLine) return;
    const queue = (await load<Entry[]>(QUEUE_KEY, [])).filter(fresh);
    for (const entry of queue) {
      const result = await post(entry);
      if (result === 'network') break;
      // Sent or permanently rejected: drop it from the latest stored queue.
      await updateList<Entry>(QUEUE_KEY, (list) => list.filter((e) => e.id !== entry.id && fresh(e)));
    }
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

type Phase = 'choose' | 'write' | 'sent' | 'queued' | 'failed';

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
    const entry: Entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      page,
      rating,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };
    const result = await post(entry);
    if (result === 'sent') {
      setPhase('sent');
    } else if (result === 'network') {
      await updateList<Entry>(QUEUE_KEY, (list) => [...list.filter(fresh), entry].slice(-QUEUE_MAX));
      setPhase('queued');
    } else {
      setPhase('failed');
    }
    setSending(false);
  }

  // Without an access key feedback cannot be delivered: hide it in production builds.
  if (!ACCESS_KEY && !import.meta.env.DEV) return null;

  return (
    <section class="mt-10 rounded-card border-2 border-line p-4" aria-labelledby={`fb-${page}`}>
      <h2 id={`fb-${page}`} class="font-display text-card font-medium">
        העמוד הזה עזר לך?
      </h2>
      <div role="status" aria-live="polite">
        {phase === 'sent' && <p class="mt-2">תודה! המשוב נשלח.</p>}
        {phase === 'queued' && <p class="mt-2">תודה! המשוב יישלח כשיהיה חיבור לאינטרנט.</p>}
        {phase === 'failed' && <p class="mt-2">לא הצלחנו לשלוח את המשוב כרגע. אפשר לנסות שוב מאוחר יותר.</p>}
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
