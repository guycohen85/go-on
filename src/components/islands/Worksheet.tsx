import { useEffect, useState } from 'preact/hooks';
import { load, merge, type Answers } from '../../lib/store';

export interface WorksheetField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  options?: string[];
  placeholder?: string;
}

interface Props {
  id: string;
  title?: string;
  fields: WorksheetField[];
}

type Status = 'idle' | 'saved' | 'error';

/** A form whose answers are saved automatically to this device only. */
export default function Worksheet({ id, title, fields }: Props) {
  const key = `worksheet:${id}`;
  const [answers, setAnswers] = useState<Answers>({});
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    // If storage answers late, merge what was stored under anything typed meanwhile.
    const onLate = (late: Answers) => setAnswers((current) => ({ ...late, ...current }));
    load<Answers>(key, {}, onLate).then((stored) => {
      setAnswers((current) => ({ ...stored, ...current }));
      setReady(true);
    });
  }, [key]);

  // Save each change right away, merging only the changed field, so nothing typed is lost
  // when leaving the page and no earlier answer is overwritten.
  async function update(fieldId: string, value: string) {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
    setStatus((await merge<Answers>(key, { [fieldId]: value })) ? 'saved' : 'error');
  }

  const inputClass =
    'mt-1.5 w-full rounded-tile border-2 border-line bg-paper px-3 py-2.5 text-body text-ink focus:border-ink focus:outline-none';

  return (
    <form class="mt-4 rounded-card bg-sky p-4" onSubmit={(e) => e.preventDefault()} aria-busy={!ready}>
      {title && <h3 class="font-display text-card font-medium">{title}</h3>}
      <div class="mt-2 grid gap-4">
        {fields.map((field) => {
          const inputId = `${id}-${field.id}`;
          const value = answers[field.id] ?? '';
          return (
            <div key={field.id}>
              <label for={inputId} class="block font-semibold">
                {field.label}
              </label>
              {field.type === 'textarea' && (
                <textarea
                  id={inputId}
                  rows={3}
                  class={inputClass}
                  value={value}
                  placeholder={field.placeholder}
                  disabled={!ready}
                  onInput={(e) => update(field.id, e.currentTarget.value)}
                />
              )}
              {field.type === 'select' && (
                <select
                  id={inputId}
                  class={inputClass}
                  value={value}
                  disabled={!ready}
                  onChange={(e) => update(field.id, e.currentTarget.value)}
                >
                  <option value="">בחירה</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
              {field.type === 'text' && (
                <input
                  id={inputId}
                  type="text"
                  class={inputClass}
                  value={value}
                  placeholder={field.placeholder}
                  disabled={!ready}
                  onInput={(e) => update(field.id, e.currentTarget.value)}
                />
              )}
              {field.type === 'number' && (
                <input
                  id={inputId}
                  type="number"
                  inputMode="decimal"
                  class={inputClass}
                  value={value}
                  placeholder={field.placeholder}
                  disabled={!ready}
                  onInput={(e) => update(field.id, e.currentTarget.value)}
                />
              )}
            </div>
          );
        })}
      </div>
      <p class="mt-3 text-small text-ink-2" role="status" aria-live="polite">
        {status === 'saved' && 'נשמר בטלפון הזה.'}
        {status === 'error' && 'לא הצלחנו לשמור. ייתכן שהדפדפן חוסם שמירה (למשל בגלישה בסתר).'}
        {status === 'idle' && 'התשובות נשמרות אוטומטית, רק בטלפון הזה.'}
      </p>
    </form>
  );
}
