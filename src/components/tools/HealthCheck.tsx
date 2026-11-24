import { useState } from 'preact/hooks';
import { label, input, primary, note } from './ui';

type Key = 'energy' | 'sleep' | 'eating' | 'moveDays' | 'stress' | 'support';

interface Props {
  fields: { id: Key; label: string; max: number }[];
  strengths: Partial<Record<Key, string>>;
  steps: Partial<Record<Key, string>>;
  intro: string;
  stepsTitle: string;
  allGood: string;
  disclaimer: string;
}

/** Short weekly check-in with personal, non-diagnostic feedback. Nothing is stored. */
export default function HealthCheck({ fields, strengths, steps, intro, stepsTitle, allGood, disclaimer }: Props) {
  const [v, setV] = useState<Partial<Record<Key, string>>>({});
  const [out, setOut] = useState<{ good: string[]; next: string[] } | null>(null);

  function give(e: Event) {
    e.preventDefault();
    const n = (k: Key) => (v[k] === undefined || v[k] === '' ? null : Number(v[k]));
    const good: string[] = [];
    const next: string[] = [];
    const scale = (k: 'energy' | 'sleep' | 'eating' | 'support') => {
      const x = n(k);
      if (x === null) return;
      if (x >= 6 && strengths[k]) good.push(strengths[k]!);
      if (x <= 4 && steps[k]) next.push(steps[k]!);
    };
    scale('energy');
    scale('sleep');
    scale('eating');
    const days = n('moveDays');
    if (days !== null && days >= 3 && strengths.moveDays) good.push(strengths.moveDays);
    if (days !== null && days <= 1 && steps.moveDays) next.push(steps.moveDays);
    const stress = n('stress');
    if (stress !== null && stress >= 7 && steps.stress) next.push(steps.stress);
    scale('support');
    setOut({ good, next });
  }

  return (
    <form class="mt-4 rounded-card bg-sky p-4" onSubmit={give}>
      <div class="grid gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.id}>
            <label for={`hc-${f.id}`} class={label}>{f.label}</label>
            <input id={`hc-${f.id}`} type="number" inputMode="numeric" min={0} max={f.max} class={input} value={v[f.id] ?? ''} onInput={(e) => setV((c) => ({ ...c, [f.id]: e.currentTarget.value }))} />
          </div>
        ))}
      </div>
      <button type="submit" class={`${primary} mt-4`}>קבלת פידבק</button>
      <div role="status" aria-live="polite">
        {out && (
          <div class="mt-4 rounded-card bg-paper p-4">
            <h4 class="font-display text-card font-medium">הפידבק שלך</h4>
            <p class="mt-1">{intro}</p>
            {out.good.length > 0 && <ul class="mt-2 list-disc ps-5">{out.good.map((g) => <li key={g}>{g}</li>)}</ul>}
            {out.next.length > 0 ? (
              <>
                <p class="mt-3 font-semibold">{stepsTitle}</p>
                <ul class="mt-1 list-disc ps-5">{out.next.map((s) => <li key={s}>{s}</li>)}</ul>
              </>
            ) : (
              <p class="mt-3">{allGood}</p>
            )}
            <p class={note}>{disclaimer}</p>
          </div>
        )}
      </div>
    </form>
  );
}
