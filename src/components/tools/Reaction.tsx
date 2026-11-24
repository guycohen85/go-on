import { useRef, useState } from 'preact/hooks';
import { note } from './ui';

type Phase = 'idle' | 'wait' | 'go' | 'early' | 'done';

/** Reaction time: tap only when the button says "now". Compare only with yourself. */
export default function Reaction({ note: noteText }: { note: string }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [ms, setMs] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const t = useRef(0);
  const shownAt = useRef(0);

  function press() {
    if (phase === 'idle' || phase === 'done' || phase === 'early') {
      setPhase('wait');
      t.current = window.setTimeout(() => {
        shownAt.current = performance.now();
        setPhase('go');
      }, 1500 + Math.random() * 2500);
    } else if (phase === 'wait') {
      window.clearTimeout(t.current);
      setPhase('early');
    } else if (phase === 'go') {
      const r = Math.round(performance.now() - shownAt.current);
      setMs(r);
      setBest((b) => (b === null ? r : Math.min(b, r)));
      setPhase('done');
    }
  }
  const text = { idle: 'התחלה', wait: 'חכו…', go: 'עכשיו!', early: 'מוקדם מדי. שוב', done: 'שוב' }[phase];
  return (
    <div class="mt-4 rounded-card bg-sky p-4">
      <button type="button" onClick={press}
        class={`grid min-h-32 w-full place-items-center rounded-card font-display text-h2 font-semibold transition-colors ${phase === 'go' ? 'bg-go text-white' : 'bg-paper text-ink'}`}>
        {text}
      </button>
      <p class="mt-3 font-semibold" aria-live="polite">
        {phase === 'early' && 'נסו שוב בלי לנחש.'}
        {phase === 'done' && ms !== null && `${ms} אלפיות שנייה${best !== null ? ` (הכי מהיר היום: ${best})` : ''}`}
      </p>
      <p class={note}>{noteText}</p>
    </div>
  );
}
