import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import * as diary from '../../lib/diary';
import type { DiaryData, Session, Symptom } from '../../lib/diary';
import { label, input, primary, secondary, note } from './ui';

interface Props {
  moods: string[];
  recipients: string[];
  priorities: string[];
  symptoms: string[];
  quick: { label: string; kind: string }[];
  summaryDays: number[];
  symptomsNote: string;
  emergencyTitle: string;
  emergency: string;
  /** `breathKind`: the symptom name that triggers the `breath` note from severity 7. */
  safety: { breathKind: string; breath: string; high: string; fever: string };
  planNote: string;
  /** Titles, field labels and button names, from the content file. */
  labels: Labels;
}

export const LABEL_KEYS = [
  'tabJournal',
  'tabQuestions',
  'tabSymptoms',
  'tabSummary',
  'tabSettings',
  'createTitle',
  'lockTitle',
  'createText',
  'lockText',
  'code',
  'codeAgain',
  'openButton',
  'lockButton',
  'journalTitle',
  'mood',
  'energy',
  'journalText',
  'tomorrow',
  'journalSave',
  'journalList',
  'journalEmpty',
  'questionsTitle',
  'questionTo',
  'questionPriority',
  'questionText',
  'questionAdd',
  'questionsList',
  'questionsEmpty',
  'symptomsTitle',
  'symptomKind',
  'symptomSeverity',
  'symptomTemp',
  'symptomStart',
  'symptomBefore',
  'symptomRelief',
  'symptomSave',
  'symptomsList',
  'symptomsEmpty',
  'summaryTitle',
  'summaryDays',
  'summaryCreate',
  'summaryHint',
  'planTitle',
  'planContact',
  'planPhone',
  'planFever',
  'planFeverPlaceholder',
  'planUrgent',
  'planSave',
] as const;
export type Labels = Record<(typeof LABEL_KEYS)[number], string>;

type Phase = 'loading' | 'unsupported' | 'error' | 'new' | 'locked' | 'open';
type Tab = 'journal' | 'questions' | 'symptoms' | 'summary' | 'settings';

const TABS: { id: Tab; key: keyof Labels }[] = [
  { id: 'journal', key: 'tabJournal' },
  { id: 'questions', key: 'tabQuestions' },
  { id: 'symptoms', key: 'tabSymptoms' },
  { id: 'summary', key: 'tabSummary' },
  { id: 'settings', key: 'tabSettings' },
];

const LOCK_AFTER_MS = 5 * 60 * 1000;
const PAGE = 30;

const fmt = (iso: string) =>
  iso ? new Date(iso).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }) : '';

/** The encrypted personal diary: create or unlock with a personal code, then five tabs. */
export default function Diary(props: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [data, setData] = useState<DiaryData | null>(null);
  const [tab, setTab] = useState<Tab>('journal');
  const [lockMsg, setLockMsg] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const session = useRef<Session | null>(null);
  const latest = useRef<DiaryData | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const lastActive = useRef(Date.now());
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!diary.supported()) {
      setPhase('unsupported');
      return;
    }
    diary
      .exists()
      .then((yes) => setPhase(yes ? 'locked' : 'new'))
      .catch(() => setPhase('error'));
  }, []);

  function lock(message = '') {
    session.current = null;
    latest.current = null;
    setData(null);
    setTab('journal');
    setSaveMsg('');
    setLockMsg(message);
    setPhase('locked');
  }

  // Auto-lock after 5 minutes without activity in the diary. Timers sleep in a background tab,
  // so also check the clock when the page becomes visible again.
  useEffect(() => {
    if (phase !== 'open') return;
    lastActive.current = Date.now();
    const touch = () => (lastActive.current = Date.now());
    const check = () => {
      if (Date.now() - lastActive.current >= LOCK_AFTER_MS) lock('היומן ננעל אחרי 5 דקות בלי פעילות.');
    };
    const el = box.current;
    const events = ['pointerdown', 'keydown', 'input'] as const;
    events.forEach((e) => el?.addEventListener(e, touch));
    const timer = setInterval(check, 10_000);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    // Leaving the page locks it, so Back (restored from the back-forward cache) never shows it open.
    const onHide = () => lock();
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      events.forEach((e) => el?.removeEventListener(e, touch));
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [phase]);

  function opened(s: Session, d: DiaryData) {
    session.current = s;
    latest.current = d;
    setData(d);
    setLockMsg('');
    setPhase('open');
  }

  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.current.then(task);
    queue.current = run.catch(() => undefined);
    return run;
  }

  /** Re-encrypt under a new code, after any pending save. */
  function rekey(code: string): Promise<boolean> {
    return enqueue(async () => {
      if (!latest.current) return false;
      const s = await diary.changeCode(latest.current, code);
      if (s) session.current = s;
      return !!s;
    }).catch(() => false);
  }

  /** Delete the diary after any pending save, so no late write brings it back. */
  async function remove() {
    await enqueue(() => diary.destroy());
    session.current = null;
    latest.current = null;
    setData(null);
    setLockMsg('היומן נמחק מהמכשיר.');
    setPhase('new');
  }

  /** Apply a change and save the whole diary, encrypted. Writes run one after another, newest last. */
  function change(update: (d: DiaryData) => DiaryData, done = 'נשמר ביומן המוצפן, בטלפון הזה.') {
    if (!latest.current || !session.current) return Promise.resolve(false);
    const next = update(latest.current);
    latest.current = next;
    setData(next);
    const captured = session.current;
    // Read the session when the write runs: a code change queued earlier may have replaced it.
    const run = enqueue(() => diary.write(session.current ?? captured, latest.current ?? next));
    return run.then(
      (ok) => {
        setSaveMsg(ok ? done : 'לא הצלחנו לשמור. ייתכן שהדפדפן חוסם שמירה (למשל בגלישה בסתר).');
        return ok;
      },
      () => {
        setSaveMsg('לא הצלחנו לשמור.');
        return false;
      },
    );
  }

  if (phase === 'loading') return <div class="mt-4 rounded-card bg-sky p-4" aria-busy="true">טוענים את היומן…</div>;
  if (phase === 'unsupported')
    return (
      <div class="mt-4 rounded-card bg-sky p-4">
        <h2 class="font-display text-card font-medium">הצפנת היומן אינה זמינה בדפדפן הזה</h2>
        <p class="mt-2">פתח/י את האפליקציה בדפדפן מודרני ובחיבור מאובטח כדי להשתמש ביומן הפרטי.</p>
      </div>
    );
  if (phase === 'error')
    return (
      <div class="mt-4 rounded-card bg-sky p-4">
        <h2 class="font-display text-card font-medium">אין גישה לשמירה בטלפון</h2>
        <p class="mt-2">הדפדפן חוסם שמירה (למשל בגלישה בסתר), ולכן אי אפשר לפתוח את היומן כאן.</p>
      </div>
    );
  if (phase === 'new' || phase === 'locked')
    return (
      <LockScreen
        key={phase}
        isNew={phase === 'new'}
        message={lockMsg}
        labels={props.labels}
        run={enqueue}
        onOpen={opened}
        onExisting={(message) => {
          setLockMsg(message);
          setPhase('locked');
        }}
      />
    );

  const d = data!;
  return (
    <div ref={box} class="mt-4">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-card bg-sky p-4">
        <div>
          <p class="font-semibold">היומן פתוח</p>
          <p class="text-small text-ink-2">ננעל אוטומטית לאחר 5 דקות ללא פעילות ביומן.</p>
        </div>
        <button type="button" class={secondary} onClick={() => lock('היומן נעול.')}>
          {props.labels.lockButton}
        </button>
      </div>

      <Tabs tab={tab} onTab={setTab} labels={props.labels} />

      <div role="tabpanel" id={`diary-panel-${tab}`} aria-labelledby={`diary-tab-${tab}`} class="mt-4">
        {tab === 'journal' && <Journal {...props} data={d} change={change} />}
        {tab === 'questions' && <Questions {...props} data={d} change={change} />}
        {tab === 'symptoms' && <Symptoms {...props} data={d} change={change} />}
        {tab === 'summary' && <Summary {...props} data={d} />}
        {tab === 'settings' && (
          <Settings
            {...props}
            data={d}
            change={change}
            rekey={rekey}
            remove={remove}
          />
        )}
      </div>
      <p class={note} role="status" aria-live="polite">
        {saveMsg}
      </p>
    </div>
  );
}

type Change = (update: (d: DiaryData) => DiaryData, done?: string) => Promise<boolean>;

function LockScreen({
  isNew,
  message,
  labels,
  run,
  onOpen,
  onExisting,
}: {
  isNew: boolean;
  message: string;
  labels: Labels;
  /** The diary's save queue: open and create wait for any save still running (e.g. right after locking). */
  run: <T>(task: () => Promise<T>) => Promise<T>;
  onOpen: (s: Session, d: DiaryData) => void;
  onExisting: (message: string) => void;
}) {
  const [code, setCode] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(message);

  async function submit(e: Event) {
    e.preventDefault();
    if (busy) return;
    if (isNew) {
      if (code.length < diary.MIN_CODE) return setMsg('בחר/י קוד של לפחות 4 תווים.');
      if (code !== again) return setMsg('הקודים אינם זהים.');
    }
    setBusy(true);
    setMsg(isNew ? 'יוצרים את היומן…' : 'פותחים…');
    try {
      if (isNew) {
        // Another tab may have created a diary meanwhile: never overwrite one.
        const s = await run(async () => ((await diary.exists()) ? 'exists' : diary.create(code)));
        if (s === 'exists') {
          onExisting('כבר יש יומן בטלפון הזה. הזינו את הקוד שלו כדי לפתוח.');
          return;
        }
        if (!s) return setMsg('לא הצלחנו לשמור. ייתכן שהדפדפן חוסם שמירה (למשל בגלישה בסתר).');
        onOpen(s, diary.blankDiary());
      } else {
        const r = await run(() => diary.open(code));
        if (!r) {
          setMsg('הקוד אינו נכון או שהנתונים אינם ניתנים לפתיחה.');
          return;
        }
        onOpen(r.session, r.data);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form class="mt-4 rounded-card bg-sky p-4" onSubmit={submit}>
      <h2 class="font-display text-card font-medium">{isNew ? labels.createTitle : labels.lockTitle}</h2>
      <p class="mt-1">
        {isNew ? labels.createText : labels.lockText}
      </p>
      {isNew && <p class={note}>חשוב לזכור את הקוד: אם הוא נשכח, אין דרך לפתוח את היומן.</p>}
      <div class="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <label for="diary-code" class={label}>
            {labels.code}
          </label>
          <input
            id="diary-code"
            type="password"
            class={input}
            value={code}
            minLength={isNew ? diary.MIN_CODE : undefined}
            autoComplete={isNew ? 'new-password' : 'current-password'}
            placeholder={isNew ? 'לפחות 4 תווים' : undefined}
            onInput={(e) => setCode(e.currentTarget.value)}
          />
        </div>
        {isNew && (
          <div>
            <label for="diary-code-again" class={label}>
              {labels.codeAgain}
            </label>
            <input
              id="diary-code-again"
              type="password"
              class={input}
              value={again}
              autoComplete="new-password"
              onInput={(e) => setAgain(e.currentTarget.value)}
            />
          </div>
        )}
      </div>
      <button type="submit" class={`${primary} mt-4`} disabled={busy}>
        {isNew ? labels.createTitle : labels.openButton}
      </button>
      <p class={note} role="status" aria-live="polite">
        {msg}
      </p>
    </form>
  );
}

/** Tabs with arrow-key navigation. In RTL, ArrowLeft moves forward. */
function Tabs({ tab, onTab, labels }: { tab: Tab; onTab: (t: Tab) => void; labels: Labels }) {
  const list = useRef<HTMLDivElement>(null);
  function key(e: KeyboardEvent) {
    const i = TABS.findIndex((t) => t.id === tab);
    let next = -1;
    if (e.key === 'ArrowLeft') next = (i + 1) % TABS.length;
    else if (e.key === 'ArrowRight') next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onTab(TABS[next]!.id);
    list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }
  return (
    <div ref={list} role="tablist" aria-label="חלקי היומן" class="mt-4 flex flex-wrap gap-2" onKeyDown={key}>
      {TABS.map((t) => {
        const selected = t.id === tab;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`diary-tab-${t.id}`}
            aria-selected={selected}
            aria-controls={selected ? `diary-panel-${t.id}` : undefined}
            tabIndex={selected ? 0 : -1}
            class={`min-h-11 rounded-pill border-2 px-4 font-semibold transition-colors ${
              selected ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-ink hover:border-ink'
            }`}
            onClick={() => onTab(t.id)}
          >
            {labels[t.key]}
          </button>
        );
      })}
    </div>
  );
}

/** A delete button that asks once, in place (no browser dialog). */
function DeleteButton({ onConfirm, what = 'את הרשומה' }: { onConfirm: () => void; what?: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <button type="button" class="min-h-11 font-semibold text-ink-2 underline hover:text-ink" onClick={() => setAsking(true)}>
        מחיקה
      </button>
    );
  return (
    <span class="flex flex-wrap items-center gap-2" role="group" aria-label="אישור מחיקה">
      <span class="font-semibold">למחוק {what}?</span>
      <button type="button" class={secondary} onClick={onConfirm}>
        כן, למחוק
      </button>
      <button type="button" class={secondary} onClick={() => setAsking(false)}>
        ביטול
      </button>
    </span>
  );
}

function Card({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <section class="rounded-card bg-sky p-4">
      <h2 class="font-display text-card font-medium">{title}</h2>
      {children}
    </section>
  );
}

function Select({ id, text, options, value, onChange }: { id: string; text: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label for={id} class={label}>
        {text}
      </label>
      <select id={id} class={input} value={value} onChange={(e) => onChange(e.currentTarget.value)}>
        <option value="">בחירה</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Field({
  id,
  text,
  value,
  onInput,
  type = 'text',
  placeholder,
}: {
  id: string;
  text: string;
  value: string;
  onInput: (v: string) => void;
  type?: 'text' | 'textarea' | 'score' | 'datetime-local';
  placeholder?: string;
}) {
  return (
    <div class={type === 'textarea' ? 'md:col-span-2' : ''}>
      <label for={id} class={label}>
        {text}
      </label>
      {type === 'textarea' ? (
        <textarea id={id} rows={3} class={input} value={value} placeholder={placeholder} onInput={(e) => onInput(e.currentTarget.value)} />
      ) : type === 'score' ? (
        <input id={id} type="number" inputMode="numeric" min={0} max={10} class={input} value={value} onInput={(e) => onInput(e.currentTarget.value)} />
      ) : type === 'datetime-local' ? (
        <input id={id} type="datetime-local" class={input} value={value} onInput={(e) => onInput(e.currentTarget.value)} />
      ) : (
        <input id={id} type="text" class={input} value={value} placeholder={placeholder} onInput={(e) => onInput(e.currentTarget.value)} />
      )}
    </div>
  );
}

/** Keep a 0 to 10 score inside its range; empty stays empty. */
const score = (v: string) => (v === '' ? '' : String(Math.min(10, Math.max(0, Math.round(Number(v)) || 0))));

function More({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  if (shown >= total) return null;
  return (
    <button type="button" class={`${secondary} mt-3`} onClick={onMore}>
      הצגת עוד ({total - shown})
    </button>
  );
}

function Journal({ labels, moods, data, change }: Props & { data: DiaryData; change: Change }) {
  const [v, setV] = useState({ mood: '', energy: '', text: '', tomorrow: '' });
  const [shown, setShown] = useState(PAGE);
  const set = (k: keyof typeof v) => (x: string) => setV((c) => ({ ...c, [k]: k === 'energy' ? score(x) : x }));

  async function submit(e: Event) {
    e.preventDefault();
    if (!v.mood && !v.text.trim() && !v.tomorrow.trim() && v.energy === '') return;
    const entry = { id: diary.newId(), at: new Date().toISOString(), ...v };
    if (await change((d) => ({ ...d, journal: [entry, ...d.journal] }), 'הרשומה נשמרה ביומן המוצפן.'))
      setV({ mood: '', energy: '', text: '', tomorrow: '' });
  }

  return (
    <div class="grid gap-6">
      <Card title={labels.journalTitle}>
        <form onSubmit={submit}>
          <div class="mt-3 grid gap-4 md:grid-cols-2">
            <Select id="j-mood" text={labels.mood} options={moods} value={v.mood} onChange={set('mood')} />
            <Field id="j-energy" text={labels.energy} type="score" value={v.energy} onInput={set('energy')} />
            <Field id="j-text" text={labels.journalText} type="textarea" value={v.text} onInput={set('text')} />
            <Field id="j-tomorrow" text={labels.tomorrow} value={v.tomorrow} onInput={set('tomorrow')} />
          </div>
          <button type="submit" class={`${primary} mt-4`}>
            {labels.journalSave}
          </button>
        </form>
      </Card>
      <section>
        <h2 class="font-display text-card font-medium">{labels.journalList}</h2>
        {data.journal.length === 0 ? (
          <p class="mt-2 text-ink-2">{labels.journalEmpty}</p>
        ) : (
          <ul class="mt-2">
            {data.journal.slice(0, shown).map((x) => (
              <li key={x.id} class="border-b border-line py-3">
                <p class="flex flex-wrap justify-between gap-x-3">
                  <b>
                    {[x.mood, x.energy !== '' && `אנרגיה ${x.energy}/10`].filter(Boolean).join(' · ') || 'רשומה'}
                  </b>
                  <span class="text-small text-ink-2">{fmt(x.at)}</span>
                </p>
                {x.text && <p class="mt-1 whitespace-pre-line">{x.text}</p>}
                {x.tomorrow && (
                  <p class="mt-1 text-small">
                    <b>למחר:</b> {x.tomorrow}
                  </p>
                )}
                <DeleteButton onConfirm={() => change((d) => ({ ...d, journal: d.journal.filter((y) => y.id !== x.id) }), 'הרשומה נמחקה.')} />
              </li>
            ))}
          </ul>
        )}
        <More shown={shown} total={data.journal.length} onMore={() => setShown((n) => n + PAGE)} />
      </section>
    </div>
  );
}

function Questions({ labels, recipients, priorities, data, change }: Props & { data: DiaryData; change: Change }) {
  const [v, setV] = useState({ to: '', priority: '', text: '' });
  const set = (k: keyof typeof v) => (x: string) => setV((c) => ({ ...c, [k]: x }));

  async function submit(e: Event) {
    e.preventDefault();
    if (!v.text.trim()) return;
    const q = { id: diary.newId(), at: new Date().toISOString(), ...v, answered: false };
    if (await change((d) => ({ ...d, questions: [q, ...d.questions] }), 'השאלה נשמרה ביומן המוצפן.')) setV({ to: '', priority: '', text: '' });
  }
  const toggle = (id: string) =>
    change((d) => ({ ...d, questions: d.questions.map((q) => (q.id === id ? { ...q, answered: !q.answered } : q)) }));

  return (
    <div class="grid gap-6">
      <Card title={labels.questionsTitle}>
        <form onSubmit={submit}>
          <div class="mt-3 grid gap-4 md:grid-cols-2">
            <Select id="q-to" text={labels.questionTo} options={recipients} value={v.to} onChange={set('to')} />
            <Select id="q-priority" text={labels.questionPriority} options={priorities} value={v.priority} onChange={set('priority')} />
            <Field id="q-text" text={labels.questionText} type="textarea" value={v.text} onInput={set('text')} />
          </div>
          <button type="submit" class={`${primary} mt-4`}>
            {labels.questionAdd}
          </button>
        </form>
      </Card>
      <section>
        <h2 class="font-display text-card font-medium">{labels.questionsList}</h2>
        {data.questions.length === 0 ? (
          <p class="mt-2 text-ink-2">{labels.questionsEmpty}</p>
        ) : (
          <ul class="mt-2">
            {data.questions.map((q) => (
              <li key={q.id} class="border-b border-line py-3">
                <p class="flex flex-wrap justify-between gap-x-3">
                  <b>{[q.to, q.priority].filter(Boolean).join(' · ') || 'שאלה'}</b>
                  <span class="text-small text-ink-2">{fmt(q.at)}</span>
                </p>
                <p class={`mt-1 whitespace-pre-line ${q.answered ? 'text-ink-2 line-through' : ''}`}>{q.text}</p>
                {q.answered && <p class="text-small text-ink-2">נענתה</p>}
                <div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button type="button" class={secondary} aria-pressed={q.answered} onClick={() => toggle(q.id)}>
                    {q.answered ? 'סימון כפתוחה' : 'סימון כנענתה ✓'}
                  </button>
                  <DeleteButton what="את השאלה" onConfirm={() => change((d) => ({ ...d, questions: d.questions.filter((y) => y.id !== q.id) }), 'השאלה נמחקה.')} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function safetyFor(s: Symptom, safety: Props['safety']): string {
  if (s.kind === safety.breathKind && s.severity >= 7) return safety.breath;
  if (s.severity >= 9) return safety.high;
  if (s.temp.trim()) return safety.fever;
  return '';
}

function Symptoms({ labels, symptoms, quick, symptomsNote, emergencyTitle, emergency, safety, data, change }: Props & { data: DiaryData; change: Change }) {
  const blank = { kind: '', severity: '', temp: '', start: '', before: '', relief: '' };
  const [v, setV] = useState(blank);
  const [msg, setMsg] = useState('');
  const [alert, setAlert] = useState('');
  const [shown, setShown] = useState(PAGE);
  const set = (k: keyof typeof v) => (x: string) => setV((c) => ({ ...c, [k]: k === 'severity' ? score(x) : x }));

  function pick(kind: string) {
    setV((c) => ({ ...c, kind }));
    document.getElementById('s-severity')?.focus();
  }

  async function submit(e: Event) {
    e.preventDefault();
    if (!v.kind || v.severity === '') {
      setMsg('בחרו תופעה ועוצמה.');
      return;
    }
    const item: Symptom = { id: diary.newId(), at: new Date().toISOString(), ...v, severity: Number(v.severity) };
    setMsg('');
    if (await change((d) => ({ ...d, symptoms: [item, ...d.symptoms] }), 'התופעה נשמרה ביומן המוצפן.')) {
      setAlert(safetyFor(item, safety));
      setV(blank);
    }
  }

  return (
    <div class="grid gap-6">
      <Card title={labels.symptomsTitle}>
        <p class="mt-1">{symptomsNote}</p>
        <div class="mt-3 flex flex-wrap gap-2" role="group" aria-label="בחירה מהירה של תופעה">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              aria-pressed={v.kind === q.kind}
              class={`min-h-11 rounded-pill border-2 px-4 font-semibold transition-colors ${
                v.kind === q.kind ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-ink hover:border-ink'
              }`}
              onClick={() => pick(q.kind)}
            >
              {q.label}
            </button>
          ))}
        </div>
        <form onSubmit={submit}>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <Select id="s-kind" text={labels.symptomKind} options={symptoms} value={v.kind} onChange={set('kind')} />
            <div>
              <label for="s-severity" class={label}>
                {labels.symptomSeverity}
              </label>
              <input
                id="s-severity"
                type="number"
                inputMode="numeric"
                min={0}
                max={10}
                class={input}
                value={v.severity}
                onInput={(e) => set('severity')(e.currentTarget.value)}
              />
            </div>
            <Field id="s-temp" text={labels.symptomTemp} placeholder="°C" value={v.temp} onInput={set('temp')} />
            <Field id="s-start" text={labels.symptomStart} type="datetime-local" value={v.start} onInput={set('start')} />
            <Field id="s-before" text={labels.symptomBefore} type="textarea" value={v.before} onInput={set('before')} />
            <Field id="s-relief" text={labels.symptomRelief} type="textarea" value={v.relief} onInput={set('relief')} />
          </div>
          <button type="submit" class={`${primary} mt-4`}>
            {labels.symptomSave}
          </button>
          <p class={note} role="status" aria-live="polite">
            {msg}
          </p>
        </form>
        {alert && (
          <p class="mt-3 rounded-tile border-2 border-ink bg-paper p-3 font-semibold" role="alert">
            {alert}
          </p>
        )}
      </Card>
      <p class="rounded-card bg-t-pink p-4">
        <b>{emergencyTitle}</b> {emergency}
      </p>
      <section>
        <h2 class="font-display text-card font-medium">{labels.symptomsList}</h2>
        {data.symptoms.length === 0 ? (
          <p class="mt-2 text-ink-2">{labels.symptomsEmpty}</p>
        ) : (
          <ul class="mt-2">
            {data.symptoms.slice(0, shown).map((x) => (
              <li key={x.id} class="border-b border-line py-3">
                <p class="flex flex-wrap justify-between gap-x-3">
                  <b>{x.kind}</b>
                  <span class="font-semibold">{x.severity}/10</span>
                </p>
                <p class="text-small text-ink-2">
                  {[fmt(x.start || x.at), x.temp && `${x.temp}°C`].filter(Boolean).join(' · ')}
                </p>
                {x.before && (
                  <p class="mt-1">
                    <b>הקשר:</b> {x.before}
                  </p>
                )}
                {x.relief && (
                  <p class="mt-1">
                    <b>מה עזר:</b> {x.relief}
                  </p>
                )}
                <DeleteButton onConfirm={() => change((d) => ({ ...d, symptoms: d.symptoms.filter((y) => y.id !== x.id) }), 'הרישום נמחק.')} />
              </li>
            ))}
          </ul>
        )}
        <More shown={shown} total={data.symptoms.length} onMore={() => setShown((n) => n + PAGE)} />
      </section>
    </div>
  );
}

/** Plain-text summary for a medical visit, built from the last `days` days. */
function buildSummary(data: DiaryData, days: number): string {
  const cut = Date.now() - days * 86_400_000;
  const when = (x: { at: string; start?: string }) => new Date(x.start || x.at).getTime();
  const sx = data.symptoms.filter((x) => when(x) >= cut);
  const js = data.journal.filter((x) => new Date(x.at).getTime() >= cut);
  const qs = data.questions.filter((x) => !x.answered);
  const byKind = new Map<string, number[]>();
  sx.forEach((x) => byKind.set(x.kind, [...(byKind.get(x.kind) ?? []), x.severity]));

  let t = `סיכום אישי לביקור – ${days} הימים האחרונים\nנוצר: ${new Date().toLocaleString('he-IL')}\n\n`;
  t += 'תופעות שנרשמו:\n';
  if (!sx.length) t += '- לא נרשמו תופעות בתקופה זו\n';
  byKind.forEach((list, kind) => {
    const avg = (list.reduce((s, n) => s + n, 0) / list.length).toFixed(1);
    t += `- ${kind}: ${list.length} רישומים, ממוצע ${avg}/10, שיא ${Math.max(...list)}/10\n`;
  });
  t += '\nשאלות פתוחות לצוות:\n';
  t += qs.length ? qs.map((q) => `- ${q.to ? `[${q.to}] ` : ''}${q.text}`).join('\n') : '- אין שאלות פתוחות';
  const energies = js.filter((x) => x.energy !== '').map((x) => Number(x.energy));
  if (js.length) {
    t += `\n\nיומן: ${js.length} רשומות`;
    if (energies.length) t += `, אנרגיה ממוצעת ${(energies.reduce((s, n) => s + n, 0) / energies.length).toFixed(1)}/10`;
  }
  if (data.plan.fever.trim()) t += `\n\nהנחיית חום אישית שנשמרה: ${data.plan.fever.trim()}`;
  return t;
}

function Summary({ labels, summaryDays, data }: Props & { data: DiaryData }) {
  const [days, setDays] = useState(String(summaryDays[1] ?? summaryDays[0] ?? 14));
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const area = useRef<HTMLTextAreaElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setMsg('הסיכום הועתק');
    } catch {
      area.current?.select();
      setMsg('לא ניתן להעתיק אוטומטית בדפדפן הזה. הטקסט מסומן, ואפשר להעתיק אותו ידנית.');
    }
  }

  return (
    <Card title={labels.summaryTitle}>
      <div class="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label for="v-days" class={label}>
            {labels.summaryDays}
          </label>
          <select id="v-days" class={input} value={days} onChange={(e) => setDays(e.currentTarget.value)}>
            {summaryDays.map((n) => (
              <option key={n} value={String(n)}>
                {n} ימים
              </option>
            ))}
          </select>
        </div>
        <button type="button" class={primary} onClick={() => (setText(buildSummary(data, Number(days))), setMsg(''))}>
          {labels.summaryCreate}
        </button>
      </div>
      {text ? (
        <>
          <label for="v-text" class={`${label} mt-4`}>
            הסיכום
          </label>
          <textarea id="v-text" ref={area} readOnly rows={12} class={input} value={text} />
          <button type="button" class={`${secondary} mt-3`} onClick={copy}>
            העתקה
          </button>
        </>
      ) : (
        <p class="mt-3 text-ink-2">{labels.summaryHint}</p>
      )}
      <p class={note} role="status" aria-live="polite">
        {msg}
      </p>
    </Card>
  );
}

function Settings({
  labels,
  planNote,
  data,
  change,
  rekey,
  remove,
}: Props & { data: DiaryData; change: Change; rekey: (code: string) => Promise<boolean>; remove: () => Promise<void> }) {
  const [plan, setPlan] = useState(data.plan);
  const set = (k: keyof typeof plan) => (x: string) => setPlan((c) => ({ ...c, [k]: x }));
  const [codes, setCodes] = useState({ current: '', next: '', again: '' });
  const [codeMsg, setCodeMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  async function changeCode(e: Event) {
    e.preventDefault();
    if (busy) return;
    if (codes.next.length < diary.MIN_CODE) return setCodeMsg('הקוד קצר מדי');
    if (codes.next !== codes.again) return setCodeMsg('הקודים אינם זהים.');
    setBusy(true);
    setCodeMsg('בודקים…');
    try {
      if (!(await diary.open(codes.current))) return setCodeMsg('הקוד הנוכחי אינו נכון');
      if (!(await rekey(codes.next))) return setCodeMsg('לא הצלחנו לשמור.');
      setCodes({ current: '', next: '', again: '' });
      setCodeMsg('הקוד שונה בהצלחה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="grid gap-6">
      <Card title={labels.planTitle}>
        <p class="mt-1">{planNote}</p>
        <form onSubmit={(e) => (e.preventDefault(), change((d) => ({ ...d, plan }), 'ההנחיות נשמרו ביומן המוצפן'))}>
          <div class="mt-3 grid gap-4 md:grid-cols-2">
            <Field id="p-contact" text={labels.planContact} value={plan.contact} onInput={set('contact')} />
            <Field id="p-phone" text={labels.planPhone} value={plan.phone} onInput={set('phone')} />
            <Field id="p-fever" text={labels.planFever} placeholder={labels.planFeverPlaceholder} value={plan.fever} onInput={set('fever')} />
            <Field id="p-urgent" text={labels.planUrgent} type="textarea" value={plan.urgent} onInput={set('urgent')} />
          </div>
          <button type="submit" class={`${primary} mt-4`}>
            {labels.planSave}
          </button>
        </form>
      </Card>

      <Card title="שינוי קוד אישי">
        <form onSubmit={changeCode}>
          <div class="mt-3 grid gap-4 md:grid-cols-3">
            {(
              [
                ['current', 'הקוד הנוכחי', 'current-password'],
                ['next', 'קוד חדש – לפחות 4 תווים', 'new-password'],
                ['again', 'אימות הקוד החדש', 'new-password'],
              ] as const
            ).map(([k, text, auto]) => (
              <div key={k}>
                <label for={`c-${k}`} class={label}>
                  {text}
                </label>
                <input
                  id={`c-${k}`}
                  type="password"
                  autoComplete={auto}
                  class={input}
                  value={codes[k]}
                  onInput={(e) => {
                    const value = e.currentTarget.value;
                    setCodes((c) => ({ ...c, [k]: value }));
                  }}
                />
              </div>
            ))}
          </div>
          <button type="submit" class={`${secondary} mt-4`} disabled={busy}>
            שינוי קוד אישי
          </button>
          <p class={note} role="status" aria-live="polite">
            {codeMsg}
          </p>
        </form>
      </Card>

      <Card title="מחיקת היומן">
        <p class="mt-1">מוחק מהמכשיר את כל היומן, השאלות והתופעות. שאר המידע באפליקציה נשאר.</p>
        {asking ? (
          <div class="mt-3 rounded-tile border-2 border-ink bg-paper p-3" role="group" aria-label="אישור מחיקת היומן">
            <p class="font-semibold">למחוק לצמיתות את כל היומן, השאלות והתופעות מהמכשיר? לא ניתן לשחזר לאחר המחיקה.</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" class={secondary} onClick={() => void remove()}>
                כן, למחוק את היומן
              </button>
              <button type="button" class={secondary} onClick={() => setAsking(false)}>
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <button type="button" class={`${secondary} mt-3`} onClick={() => setAsking(true)}>
            מחיקת כל היומן מהמכשיר
          </button>
        )}
      </Card>
    </div>
  );
}
