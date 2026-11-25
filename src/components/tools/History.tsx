import { useEffect, useState } from 'preact/hooks';
import { entries as allEntries } from 'idb-keyval';
import { entries, type LogEntry } from '../../lib/log';
import { url } from '../../lib/url';
import { secondary } from './ui';

interface Log {
  id: string;
  title: string;
  href: string;
  fields: { id: string; label: string }[];
}

interface Props {
  logs: Log[];
  steps: { title: string; href: string };
}

const SHOW = 5;
const date = (iso: string) => new Date(iso).toLocaleDateString('he-IL');

/** Everything logged on this device (activity, brain training, steps, between stations), newest first. */
export default function History({ logs, steps }: Props) {
  const [data, setData] = useState<Record<string, LogEntry[]> | null>(null);
  const [days, setDays] = useState<{ day: string; steps: number }[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void Promise.all(logs.map(async (l) => [l.id, (await entries(l.id)).slice().reverse()] as const)).then((pairs) =>
      setData(Object.fromEntries(pairs)),
    );
    allEntries()
      .then((all) =>
        setDays(
          all
            .filter(([k]) => typeof k === 'string' && /^steps:\d{4}-\d{2}-\d{2}$/.test(k))
            .map(([k, v]) => ({ day: (k as string).slice(6), steps: Number((v as { steps?: number })?.steps ?? 0) }))
            .filter((d) => d.steps > 0)
            .sort((a, b) => b.day.localeCompare(a.day)),
        ),
      )
      .catch(() => setDays([]));
  }, []);

  if (!data) return <p class="mt-3 text-ink-2" aria-busy="true">טוענים…</p>;

  const toggle = (id: string) => setOpen((c) => ({ ...c, [id]: !c[id] }));
  const empty = (href: string) => (
    <p class="mt-1 text-ink-2">
      עוד אין רישומים.{' '}
      <a href={url(href)} class="font-semibold underline">
        לרישום
      </a>
    </p>
  );

  return (
    <div class="mt-4 grid gap-6">
      {logs.map((log) => {
        const list = data[log.id] ?? [];
        const all = open[log.id];
        const name = (fid: string) => log.fields.find((f) => f.id === fid)?.label ?? fid;
        return (
          <section key={log.id}>
            <h3 class="font-display text-card font-medium">
              {log.title}
              {list.length > 0 && <span class="ms-2 text-small font-normal text-ink-2">({list.length})</span>}
            </h3>
            {list.length === 0 ? (
              empty(log.href)
            ) : (
              <>
                <ul class="mt-1">
                  {(all ? list : list.slice(0, SHOW)).map((r) => (
                    <li key={r.at} class="border-b border-line py-2">
                      <span class="font-semibold">{date(r.at)}</span>
                      <span class="text-ink-2">
                        {' · '}
                        {Object.entries(r.values)
                          .filter(([, x]) => x)
                          .map(([k, x]) => `${name(k)}: ${x}`)
                          .join(' · ')}
                      </span>
                    </li>
                  ))}
                </ul>
                {list.length > SHOW && (
                  <button type="button" class={`${secondary} mt-2`} aria-expanded={!!all} onClick={() => toggle(log.id)}>
                    {all ? 'הצגת פחות' : `הצגת הכול (${list.length})`}
                  </button>
                )}
              </>
            )}
          </section>
        );
      })}
      <section>
        <h3 class="font-display text-card font-medium">{steps.title}</h3>
        {days.length === 0 ? (
          empty(steps.href)
        ) : (
          <ul class="mt-1">
            {(open.steps ? days : days.slice(0, SHOW)).map((d) => (
              <li key={d.day} class="border-b border-line py-2">
                <span class="font-semibold">{new Date(`${d.day}T12:00`).toLocaleDateString('he-IL')}</span>
                <span class="text-ink-2"> · {d.steps.toLocaleString('he-IL')} צעדים</span>
              </li>
            ))}
          </ul>
        )}
        {days.length > SHOW && (
          <button type="button" class={`${secondary} mt-2`} aria-expanded={!!open.steps} onClick={() => toggle('steps')}>
            {open.steps ? 'הצגת פחות' : `הצגת הכול (${days.length})`}
          </button>
        )}
      </section>
    </div>
  );
}
