import { useState } from 'preact/hooks';
import { label, input, secondary, note, shuffle } from './ui';

interface Props {
  groups: { name: string; items: string[] }[];
  note: string;
}

/** Chunking strategy: group mixed items into meaningful categories. */
export default function Chunking({ groups, note: noteText }: Props) {
  const pick = () => {
    const chosen = shuffle(groups).slice(0, 3);
    return { chosen, items: shuffle(chosen.flatMap((g) => g.items)) };
  };
  const [round, setRound] = useState(pick);
  const [text, setText] = useState('');
  const [reveal, setReveal] = useState(false);
  return (
    <div class="mt-4 rounded-card bg-sky p-4">
      <ul class="flex flex-wrap gap-2">
        {round.items.map((i) => <li key={i} class="rounded-pill bg-paper px-3.5 py-1.5 font-semibold">{i}</li>)}
      </ul>
      <label for="chunk-text" class={`${label} mt-4`}>איך היית מקבץ/ת את הפריטים?</label>
      <textarea id="chunk-text" rows={3} class={input} value={text} onInput={(e) => setText(e.currentTarget.value)} />
      <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" class={secondary} onClick={() => setReveal(true)}>הצגת קיבוץ אפשרי</button>
        <button type="button" class={secondary} onClick={() => { setRound(pick()); setText(''); setReveal(false); }}>תרגיל חדש</button>
      </div>
      <div aria-live="polite">
        {reveal && (
          <ul class="mt-3 grid gap-1">
            {round.chosen.map((g) => <li key={g.name}><strong>{g.name}:</strong> {g.items.join(', ')}</li>)}
          </ul>
        )}
      </div>
      <p class={note}>{noteText}</p>
    </div>
  );
}
