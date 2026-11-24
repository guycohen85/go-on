import { useState } from 'preact/hooks';
import { note } from './ui';

const COLORS = [
  { name: 'אדום', css: 'var(--color-i-pink)' },
  { name: 'כחול', css: 'var(--color-i-blue)' },
  { name: 'ירוק', css: 'var(--color-i-green)' },
  { name: 'סגול', css: 'var(--color-i-purple)' },
];
const rnd = (n: number) => Math.floor(Math.random() * n);
const make = () => {
  const word = rnd(4);
  let ink = rnd(4);
  if (Math.random() < 0.75) while (ink === word) ink = rnd(4);
  return { word, ink };
};

/** Colour or word? Response inhibition: choose the ink colour, not the written word. */
export default function Stroop() {
  const [card, setCard] = useState(make);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [last, setLast] = useState<boolean | null>(null);
  function answer(i: number) {
    const ok = i === card.ink;
    setLast(ok);
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
    setCard(make());
  }
  return (
    <div class="mt-4 rounded-card bg-sky p-4">
      <p class="grid min-h-24 place-items-center rounded-card bg-paper font-display text-display font-semibold" style={{ color: COLORS[card.ink]!.css }} aria-label={`המילה ${COLORS[card.word]!.name}, צבועה ב${COLORS[card.ink]!.name}`}>
        {COLORS[card.word]!.name}
      </p>
      <div class="mt-3 grid grid-cols-2 gap-2">
        {COLORS.map((c, i) => (
          <button key={c.name} type="button" onClick={() => answer(i)} class="min-h-11 rounded-tile border-2 border-line bg-paper font-semibold hover:border-ink">
            {c.name}
          </button>
        ))}
      </div>
      <p class="mt-3 font-semibold" aria-live="polite">
        {last !== null && (last ? 'נכון ✓ ' : 'לא הפעם. ')}
        {score.total > 0 && `נכון: ${score.right} מתוך ${score.total}`}
      </p>
      <p class={note}>בחרו את צבע האותיות, לא את המילה.</p>
    </div>
  );
}
