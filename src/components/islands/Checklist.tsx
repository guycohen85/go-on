import { useEffect, useState } from 'preact/hooks';
import { load, save } from '../../lib/store';

const STATUSES = ['לבדוק', 'בטיפול', 'הושלם', 'לא רלוונטי'] as const;
type ItemStatus = (typeof STATUSES)[number];

interface Props {
  id: string;
  items: string[];
}

/** A list of tasks, each with a status, saved to this device only. */
export default function Checklist({ id, items }: Props) {
  const key = `checklist:${id}`;
  const [state, setState] = useState<Record<number, ItemStatus>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    load<Record<number, ItemStatus>>(key, {}).then((stored) => {
      setState(stored);
      setReady(true);
    });
  }, [key]);

  function choose(index: number, status: ItemStatus) {
    const next = { ...state, [index]: status };
    setState(next);
    void save(key, next);
  }

  return (
    <div class="mt-4">
      <p class="text-small text-ink-2">אפשר לסמן לכל משימה איפה היא עומדת. הסימון נשמר רק בטלפון הזה.</p>
      <ul class="mt-2 border-t border-line">
        {items.map((item, index) => (
          <li key={item} class="border-b border-line py-3.5">
            <fieldset disabled={!ready}>
              <legend class="font-semibold">{item}</legend>
              <div class="mt-2.5 flex flex-wrap gap-2">
                {STATUSES.map((status) => {
                  const checked = state[index] === status;
                  return (
                    <label
                      key={status}
                      class={`inline-flex min-h-11 cursor-pointer items-center rounded-pill border-2 px-3.5 text-small font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ink ${
                        checked ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-ink hover:border-ink'
                      }`}
                    >
                      <input
                        type="radio"
                        class="sr-only"
                        name={`${id}-${index}`}
                        value={status}
                        checked={checked}
                        onChange={() => choose(index, status)}
                      />
                      {status}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ul>
    </div>
  );
}
