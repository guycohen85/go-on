import { useState } from 'preact/hooks';
import { label, input, primary, result } from './ui';

interface Props {
  clues: { clue: string; answer: string }[];
}

const norm = (s: string) => s.trim().replace(/[\s"׳'״-]/g, '');

/** Short word-retrieval quiz: a clue, and the word it describes. */
export default function Crossword({ clues }: Props) {
  const [a, setA] = useState<string[]>(clues.map(() => ''));
  const [out, setOut] = useState<boolean[] | null>(null);
  return (
    <form class="mt-4 rounded-card bg-sky p-4" onSubmit={(e) => { e.preventDefault(); setOut(clues.map((c, i) => norm(a[i]!) === norm(c.answer))); }}>
      <ol class="grid gap-3">
        {clues.map((c, i) => (
          <li key={c.clue}>
            <label for={`cw-${i}`} class={label}>{i + 1}. {c.clue} <span class="font-normal text-ink-2">({c.answer.length} אותיות)</span></label>
            <input id={`cw-${i}`} type="text" autoComplete="off" class={input} value={a[i]} onInput={(e) => setA((x) => x.map((v, j) => (j === i ? e.currentTarget.value : v)))} />
            {out && <span class="text-small">{out[i] ? 'נכון ✓' : `התשובה: ${c.answer}`}</span>}
          </li>
        ))}
      </ol>
      <button type="submit" class={`${primary} mt-4`}>בדיקה</button>
      <p class={result} role="status" aria-live="polite">{out && `נכון: ${out.filter(Boolean).length} מתוך ${clues.length}`}</p>
    </form>
  );
}
