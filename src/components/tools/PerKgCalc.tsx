import { useState } from 'preact/hooks';
import { label, input, primary, result, note } from './ui';

interface Props {
  id: string;
  /** Range per kg body weight, e.g. 1 to 1.5 (g protein) or 25 to 30 (kcal). */
  min: number;
  max: number;
  /** Round results to this step (e.g. 1 for grams, 10 for kcal). */
  step: number;
  unit: string;
  basis: string;
  button: string;
}

/** A general range by body weight. A starting point only, never a personal prescription. */
export default function PerKgCalc({ id, min, max, step, unit, basis, button }: Props) {
  const [weight, setWeight] = useState('');
  const [out, setOut] = useState<string | null>(null);
  const round = (n: number) => Math.round(n / step) * step;
  function calc(e: Event) {
    e.preventDefault();
    const w = Number(weight.replace(',', '.'));
    if (!Number.isFinite(w) || w < 25 || w > 300) {
      setOut('הזינו משקל תקין (בק״ג).');
      return;
    }
    setOut(`${round(w * min).toLocaleString('he-IL')} עד ${round(w * max).toLocaleString('he-IL')} ${unit}`);
  }
  return (
    <form class="mt-4 rounded-card bg-sky p-4" onSubmit={calc}>
      <label for={`${id}-w`} class={label}>משקל בק״ג</label>
      <input id={`${id}-w`} type="number" inputMode="decimal" min={25} max={300} placeholder="למשל 65" class={input} value={weight} onInput={(e) => setWeight(e.currentTarget.value)} />
      <button type="submit" class={`${primary} mt-3`}>{button}</button>
      <p class={result} role="status" aria-live="polite">{out}</p>
      {out && <p class={note}>{basis}</p>}
    </form>
  );
}
