import { useEffect, useState } from 'preact/hooks';
import { load, save } from '../../lib/store';
import { note } from './ui';

interface Props {
  levels: { label: string; steps: { title: string; text: string }[] }[];
  caution: string;
}

const KEY = 'tool:workout-level';

/** Today's workout: pick a level, see a short plan. The last level is remembered. */
export default function Workout({ levels, caution }: Props) {
  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => {
    void load<number | null>(KEY, null).then((l) => l !== null && setLevel(l));
  }, []);
  function choose(i: number) {
    setLevel(i);
    void save(KEY, i);
  }
  const plan = level !== null ? levels[level] : undefined;
  return (
    <div class="mt-4">
      <div class="flex flex-wrap gap-2" role="group" aria-label="רמת האימון">
        {levels.map((l, i) => (
          <button key={l.label} type="button" aria-pressed={level === i} onClick={() => choose(i)}
            class={`min-h-11 rounded-pill border-2 px-4 font-semibold transition-colors ${level === i ? 'border-ink bg-ink text-white' : 'border-line bg-paper hover:border-ink'}`}>
            {l.label}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {plan && (
          <ol class="mt-4 border-t border-line">
            {plan.steps.map((s) => (
              <li key={s.title} class="border-b border-line py-3">
                <span class="block font-semibold">{s.title}</span>
                <span class="block text-ink-2">{s.text}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <p class={note}>{caution}</p>
    </div>
  );
}
