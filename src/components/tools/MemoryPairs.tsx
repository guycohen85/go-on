import { useState } from 'preact/hooks';
import { secondary, shuffle } from './ui';

const SYMBOLS = ['🍎', '🌟', '🎵', '🌈', '🐱', '🌻', '⚽', '📚'];
const deal = () => shuffle([...SYMBOLS, ...SYMBOLS].map((s, i) => ({ id: i, s })));

/** Visual memory: find all pairs. */
export default function MemoryPairs() {
  const [cards, setCards] = useState(deal);
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);

  function flip(i: number) {
    if (open.length === 2 || open.includes(i) || done.has(cards[i]!.s)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next as [number, number];
      if (cards[a]!.s === cards[b]!.s) {
        setDone((d) => new Set(d).add(cards[a]!.s));
        setOpen([]);
      } else {
        window.setTimeout(() => setOpen([]), 900);
      }
    }
  }
  function reset() {
    setCards(deal());
    setOpen([]);
    setDone(new Set());
    setMoves(0);
  }
  const finished = done.size === SYMBOLS.length;
  return (
    <div class="mt-4 rounded-card bg-sky p-4">
      <div class="grid max-w-80 grid-cols-4 gap-2">
        {cards.map((c, i) => {
          const shown = open.includes(i) || done.has(c.s);
          return (
            <button key={c.id} type="button" onClick={() => flip(i)} aria-label={shown ? c.s : `קלף ${i + 1}, סגור`}
              class={`grid aspect-square place-items-center rounded-tile border-2 text-icon-md transition-colors ${shown ? 'border-line bg-paper' : 'border-ink bg-ink text-white'}`}>
              {shown ? c.s : ''}
            </button>
          );
        })}
      </div>
      <p class="mt-3 font-semibold" aria-live="polite">{finished ? `הושלם ב־${moves} מהלכים ✓` : `מהלכים: ${moves}`}</p>
      <button type="button" class={`${secondary} mt-2`} onClick={reset}>משחק חדש</button>
    </div>
  );
}
