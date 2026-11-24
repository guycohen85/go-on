import { useRef, useState } from 'preact/hooks';
import { label, input, primary, secondary, result } from './ui';

const make = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');

/** Working memory: watch a digit sequence, then type it. Length grows on success. */
export default function DigitSequence() {
  const [len, setLen] = useState(4);
  const [seq, setSeq] = useState('');
  const [visible, setVisible] = useState(false);
  const [answer, setAnswer] = useState('');
  const [out, setOut] = useState('');
  const [checked, setChecked] = useState(false);
  const t = useRef(0);

  function start(n = len) {
    window.clearTimeout(t.current);
    const s = make(n);
    setSeq(s);
    setAnswer('');
    setOut('');
    setChecked(false);
    setVisible(true);
    t.current = window.setTimeout(() => setVisible(false), 1000 + n * 600);
  }
  function check(e: Event) {
    e.preventDefault();
    if (!seq || visible || checked) return;
    setChecked(true);
    if (answer.replace(/\s/g, '') === seq) {
      setOut('נכון ✓');
      setLen((l) => Math.min(l + 1, 10));
    } else {
      setOut(`כמעט. הרצף היה ${seq}. נסו רצף חדש.`);
      setLen((l) => Math.max(l - 1, 3));
    }
  }
  return (
    <form class="mt-4 rounded-card bg-sky p-4" onSubmit={check}>
      <p class="font-display text-display font-semibold tracking-widest" aria-live="polite"><bdi dir="ltr">{visible ? seq : seq ? '• • •' : '—'}</bdi></p>
      <button type="button" class={secondary} onClick={() => start()}>רצף חדש ({len} ספרות)</button>
      <label for="seq-answer" class={`${label} mt-4`}>מה זכרת?</label>
      <input id="seq-answer" type="text" inputMode="numeric" dir="ltr" autoComplete="off" class={`${input} text-start`} value={answer} onInput={(e) => setAnswer(e.currentTarget.value)} disabled={!seq || visible || checked} />
      <button type="submit" class={`${primary} mt-3`} disabled={!seq || visible || checked}>בדיקה</button>
      <p class={result} role="status" aria-live="polite">{out}</p>
    </form>
  );
}
