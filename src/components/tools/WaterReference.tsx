import { useState } from 'preact/hooks';
import { label, input, primary, result } from './ui';

interface Props {
  options: { label: string; result: string }[];
}

/** EFSA reference value for total water, by sex. Not a personal target. */
export default function WaterReference({ options }: Props) {
  const [choice, setChoice] = useState('');
  const [shown, setShown] = useState<string | null>(null);
  return (
    <form class="mt-4 rounded-card bg-sky p-4" onSubmit={(e) => { e.preventDefault(); setShown(options.find((o) => o.label === choice)?.result ?? null); }}>
      <label for="water-for" class={label}>ערך ייחוס עבור</label>
      <select id="water-for" class={input} value={choice} onChange={(e) => setChoice(e.currentTarget.value)}>
        <option value="">בחירה</option>
        {options.map((o) => <option key={o.label} value={o.label}>{o.label}</option>)}
      </select>
      <button type="submit" class={`${primary} mt-3`} disabled={!choice}>הצגת ערך הייחוס</button>
      <p class={result} role="status" aria-live="polite">{shown}</p>
    </form>
  );
}
