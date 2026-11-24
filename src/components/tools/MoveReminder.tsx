import { useEffect, useRef, useState } from 'preact/hooks';
import { label, input, primary, secondary, note } from './ui';

/** In-page reminder to move. Works while the app is open (no background notifications in v1). */
export default function MoveReminder() {
  const [minutes, setMinutes] = useState('30');
  const [due, setDue] = useState<number | null>(null);
  const [fired, setFired] = useState(false);
  const t = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(t.current), []);

  function start(e: Event) {
    e.preventDefault();
    const m = Number(minutes);
    if (!(m > 0 && m <= 240)) return;
    window.clearTimeout(t.current);
    setFired(false);
    setDue(Date.now() + m * 60_000);
    t.current = window.setTimeout(() => {
      setFired(true);
      setDue(null);
      navigator.vibrate?.(300);
    }, m * 60_000);
  }
  function cancel() {
    window.clearTimeout(t.current);
    setDue(null);
  }
  return (
    <form class="mt-4 rounded-card bg-sky p-4" onSubmit={start}>
      <label for="move-min" class={label}>להזכיר לי בעוד כמה דקות?</label>
      <input id="move-min" type="number" inputMode="numeric" min={1} max={240} class={input} value={minutes} onInput={(e) => setMinutes(e.currentTarget.value)} />
      <div class="mt-3 flex flex-wrap gap-2">
        <button type="submit" class={primary}>הפעלת תזכורת</button>
        {due && <button type="button" class={secondary} onClick={cancel}>ביטול</button>}
      </div>
      <div aria-live="assertive">
        {due && <p class={note}>נקבעה תזכורת לעוד {minutes} דקות ✓</p>}
        {fired && <p class="mt-3 rounded-tile bg-paper p-3 font-semibold" role="alert">זמן קטן לתנועה: הליכה, מתיחה או כמה דקות פעילות. ממשיכים קדימה.</p>}
      </div>
      <p class={note}>התזכורת עובדת כל עוד האפליקציה פתוחה.</p>
    </form>
  );
}
