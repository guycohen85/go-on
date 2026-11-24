import { useEffect, useState } from 'preact/hooks';
import { load, save } from '../../lib/store';
import { label, input, secondary, note, today } from './ui';

interface State { steps: number; goal: string }

/** Manual step counter for today, saved on this device. */
export default function Steps() {
  const key = `steps:${today()}`;
  const [s, setS] = useState<State>({ steps: 0, goal: '' });
  const [manual, setManual] = useState('');
  useEffect(() => {
    void Promise.all([load<State | null>(key, null), load<string>('steps:goal', '')]).then(([day, goal]) =>
      setS({ steps: day?.steps ?? 0, goal: day?.goal || goal }),
    );
  }, [key]);
  function update(next: State) {
    setS(next);
    void save(key, next);
    if (next.goal) void save('steps:goal', next.goal);
  }
  const goal = Number(s.goal);
  const pct = goal > 0 ? Math.min(100, Math.round((s.steps / goal) * 100)) : null;
  return (
    <div class="mt-4 rounded-card bg-sky p-4">
      <p class="font-display text-display font-semibold" aria-live="polite">{s.steps.toLocaleString('he-IL')}</p>
      <p class="text-ink-2">{pct === null ? 'בחר/י יעד אישי שמתאים לך' : `${pct}% מהיעד האישי`}</p>
      {pct !== null && (
        <div class="mt-2 h-3 overflow-hidden rounded-pill bg-paper" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="התקדמות ליעד">
          <div class="h-full bg-go" style={{ width: `${pct}%` }} />
        </div>
      )}
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" class={secondary} onClick={() => update({ ...s, steps: s.steps + 100 })}>+100</button>
        <button type="button" class={secondary} onClick={() => update({ ...s, steps: s.steps + 500 })}>+500</button>
        <button type="button" class={secondary} onClick={() => update({ ...s, steps: 0 })}>איפוס</button>
      </div>
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label for="steps-goal" class={label}>יעד אישי להיום</label>
          <input id="steps-goal" type="number" inputMode="numeric" min={0} class={input} value={s.goal} onInput={(e) => update({ ...s, goal: e.currentTarget.value })} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); const n = Number(manual); if (n >= 0) { update({ ...s, steps: Math.round(n) }); setManual(''); } }}>
          <label for="steps-manual" class={label}>או הזנת צעדים מהטלפון או מהשעון</label>
          <div class="flex gap-2">
            <input id="steps-manual" type="number" inputMode="numeric" min={0} placeholder="מספר צעדים" class={input} value={manual} onInput={(e) => setManual(e.currentTarget.value)} />
            <button type="submit" class={`${secondary} mt-1.5`}>עדכון</button>
          </div>
        </form>
      </div>
      <p class={note}>הספירה ידנית: מוסיפים צעדים בלחיצה או מקלידים את המספר מהטלפון או מהשעון. נשמר רק בטלפון הזה.</p>
    </div>
  );
}
