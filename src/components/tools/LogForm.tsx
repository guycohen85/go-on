import { useEffect, useState } from 'preact/hooks';
import { addEntry, entries, type LogEntry } from '../../lib/log';
import { label, input, primary, note } from './ui';

interface Field {
  id: string;
  label: string;
  type: 'number' | 'text' | 'textarea' | 'select';
  options?: string[];
  max?: number;
}

interface Props {
  id: string;
  fields: Field[];
}

/** A short form that adds a dated entry to a log on this device, showing the last entries. */
export default function LogForm({ id, fields }: Props) {
  const [v, setV] = useState<Record<string, string>>({});
  const [recent, setRecent] = useState<LogEntry[]>([]);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    void entries(id).then((l) => setRecent(l.slice(-3).reverse()));
  }, [id]);
  async function submit(e: Event) {
    e.preventDefault();
    if (!Object.values(v).some((x) => x.trim())) return;
    const ok = await addEntry(id, v);
    setMsg(ok ? 'נשמר במעקב, בטלפון הזה.' : 'לא הצלחנו לשמור.');
    if (ok) {
      setV({});
      setRecent((await entries(id)).slice(-3).reverse());
    }
  }
  const name = (fid: string) => fields.find((f) => f.id === fid)?.label ?? fid;
  return (
    <form class="mt-4 rounded-card bg-sky p-4" onSubmit={submit}>
      <div class="grid gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.id} class={f.type === 'textarea' ? 'md:col-span-2' : ''}>
            <label for={`${id}-${f.id}`} class={label}>{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea id={`${id}-${f.id}`} rows={2} class={input} value={v[f.id] ?? ''} onInput={(e) => setV((c) => ({ ...c, [f.id]: e.currentTarget.value }))} />
            ) : f.type === 'select' ? (
              <select id={`${id}-${f.id}`} class={input} value={v[f.id] ?? ''} onChange={(e) => setV((c) => ({ ...c, [f.id]: e.currentTarget.value }))}>
                <option value="">בחירה</option>
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'number' ? (
              <input id={`${id}-${f.id}`} type="number" inputMode="numeric" min={0} max={f.max} class={input} value={v[f.id] ?? ''} onInput={(e) => setV((c) => ({ ...c, [f.id]: e.currentTarget.value }))} />
            ) : (
              <input id={`${id}-${f.id}`} type="text" class={input} value={v[f.id] ?? ''} onInput={(e) => setV((c) => ({ ...c, [f.id]: e.currentTarget.value }))} />
            )}
          </div>
        ))}
      </div>
      <button type="submit" class={`${primary} mt-4`}>שמירה במעקב</button>
      <p class={note} role="status" aria-live="polite">{msg}</p>
      {recent.length > 0 && (
        <div class="mt-3">
          <p class="text-small font-semibold">הרישומים האחרונים</p>
          <ul class="mt-1 text-small text-ink-2">
            {recent.map((r) => (
              <li key={r.at} class="border-b border-line py-1.5">
                {new Date(r.at).toLocaleDateString('he-IL')}:{' '}
                {Object.entries(r.values).filter(([, x]) => x).map(([k, x]) => `${name(k)}: ${x}`).join(' · ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
