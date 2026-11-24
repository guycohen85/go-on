import { useState } from 'preact/hooks';
import { secondary, result } from './ui';

interface Props {
  ideas: string[];
}

/** A random short activity idea. */
export default function ActivityIdea({ ideas }: Props) {
  const [i, setI] = useState<number | null>(null);
  function next() {
    if (!ideas.length) return;
    let n = Math.floor(Math.random() * ideas.length);
    if (ideas.length > 1 && n === i) n = (n + 1) % ideas.length;
    setI(n);
  }
  return (
    <div class="mt-4 rounded-card bg-sky p-4">
      <button type="button" class={secondary} onClick={next}>תן/י לי פעילות</button>
      <p class={result} aria-live="polite">{i !== null ? ideas[i] : ''}</p>
    </div>
  );
}
