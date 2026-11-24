import { useEffect, useRef, useState } from 'preact/hooks';
import { addEntry } from '../../lib/log';
import { label, input, primary, secondary, note } from './ui';

interface Props {
  kinds: string[];
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Stopwatch for a walk or activity; the result can be saved to the activity log. */
export default function ActivityTimer({ kinds }: Props) {
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [kind, setKind] = useState('');
  const [msg, setMsg] = useState('');
  const started = useRef(0);
  const base = useRef(0);

  useEffect(() => {
    if (!running) return;
    started.current = Date.now();
    const t = window.setInterval(() => setSecs(base.current + Math.floor((Date.now() - started.current) / 1000)), 500);
    return () => window.clearInterval(t);
  }, [running]);

  function toggle() {
    if (running) base.current = secs;
    setRunning(!running);
    setMsg('');
  }
  function reset() {
    setRunning(false);
    base.current = 0;
    setSecs(0);
    setMsg('');
  }
  async function saveIt() {
    if (!secs) return;
    const ok = await addEntry('activity', { kind: kind || 'פעילות', minutes: String(Math.max(1, Math.round(secs / 60))) });
    setMsg(ok ? 'הפעילות נשמרה במעקב, בטלפון הזה.' : 'לא הצלחנו לשמור.');
  }
  return (
    <div class="mt-4 rounded-card bg-sky p-4">
      <p class="font-display text-display font-semibold tabular-nums" role="timer" aria-live="off"><bdi dir="ltr">{fmt(secs)}</bdi></p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" class={primary} onClick={toggle}>{running ? 'עצירה' : secs ? 'המשך' : 'התחלה'}</button>
        <button type="button" class={secondary} onClick={reset}>איפוס</button>
      </div>
      <label for="timer-kind" class={`${label} mt-4`}>מה עשיתי?</label>
      <select id="timer-kind" class={input} value={kind} onChange={(e) => setKind(e.currentTarget.value)}>
        <option value="">בחירה</option>
        {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
      <button type="button" class={`${secondary} mt-3`} onClick={saveIt} disabled={!secs || running}>שמירת הפעילות</button>
      <p class={note} role="status" aria-live="polite">{msg}</p>
    </div>
  );
}
