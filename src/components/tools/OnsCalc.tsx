import { useEffect, useState } from 'preact/hooks';
import { load, merge } from '../../lib/store';
import { label, input, primary, result, note } from './ui';

type Fields = { product: string; servings: string; protein: string };
const KEY = 'tool:ons';

/** Daily protein contributed by an oral supplement. Inputs are remembered on this device. */
export default function OnsCalc() {
  const [f, setF] = useState<Fields>({ product: '', servings: '', protein: '' });
  const [out, setOut] = useState<string | null>(null);
  useEffect(() => {
    // Stored values fill in only what the user has not typed yet.
    const fill = (s: Partial<Fields>) =>
      setF((c) => ({ product: c.product || s.product || '', servings: c.servings || s.servings || '', protein: c.protein || s.protein || '' }));
    void load<Partial<Fields>>(KEY, {}, fill).then(fill);
  }, []);
  function set(k: keyof Fields, v: string) {
    setF((c) => ({ ...c, [k]: v }));
    void merge<Fields>(KEY, { [k]: v });
  }
  function calc(e: Event) {
    e.preventDefault();
    const s = Number(f.servings), p = Number(f.protein);
    if (!(s > 0) || !(p > 0)) {
      setOut('הזינו מספר מנות ביום וכמות חלבון למנה.');
      return;
    }
    const total = Math.round(s * p * 10) / 10;
    setOut(`תרומת החלבון מהתוסף: ${total} גרם חלבון ליום${f.product ? ` (${f.product})` : ''}.`);
  }
  return (
    <form class="mt-4 grid gap-4 rounded-card bg-sky p-4" onSubmit={calc}>
      <div>
        <label for="ons-product" class={label}>איזה תוסף אני נוטל/ת כרגע?</label>
        <input id="ons-product" type="text" placeholder="שם התוסף או אבקת החלבון" class={input} value={f.product} onInput={(e) => set('product', e.currentTarget.value)} />
      </div>
      <div>
        <label for="ons-servings" class={label}>כמה פעמים ביום?</label>
        <input id="ons-servings" type="number" inputMode="decimal" min={0} placeholder="למשל 1" class={input} value={f.servings} onInput={(e) => set('servings', e.currentTarget.value)} />
      </div>
      <div>
        <label for="ons-protein" class={label}>כמה גרם חלבון במנה?</label>
        <input id="ons-protein" type="number" inputMode="decimal" min={0} placeholder="למשל 20" class={input} value={f.protein} onInput={(e) => set('protein', e.currentTarget.value)} />
      </div>
      <div>
        <button type="submit" class={primary}>חישוב תרומת החלבון היומית</button>
        <p class={result} role="status" aria-live="polite">{out}</p>
        {out?.startsWith('תרומת') && <p class={note}>יש לחבר זאת לצריכת החלבון מהמזון ולבחון מול היעד האישי.</p>}
        <p class={note}>הפרטים נשמרים רק בטלפון הזה.</p>
      </div>
    </form>
  );
}
