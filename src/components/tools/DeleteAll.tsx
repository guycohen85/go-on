import { useState } from 'preact/hooks';
import { clear } from 'idb-keyval';
import { secondary, note } from './ui';

/** Delete everything the app stored on this phone, after one confirmation in place. */
export default function DeleteAll() {
  const [asking, setAsking] = useState(false);
  const [msg, setMsg] = useState('');

  async function wipe() {
    try {
      await clear();
      setMsg('כל המידע נמחק מהטלפון הזה.');
    } catch {
      setMsg('המחיקה נכשלה.');
    }
    setAsking(false);
  }

  return (
    <div class="mt-4">
      {asking ? (
        <div class="rounded-tile border-2 border-ink bg-paper p-3" role="group" aria-label="אישור מחיקת כל המידע">
          <p class="font-semibold">למחוק לצמיתות את כל המידע באפליקציה, כולל היומן? לא ניתן לשחזר לאחר המחיקה.</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button type="button" class={secondary} onClick={wipe}>
              כן, למחוק הכול
            </button>
            <button type="button" class={secondary} onClick={() => setAsking(false)}>
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <button type="button" class={secondary} onClick={() => (setAsking(true), setMsg(''))}>
          מחיקת כל המידע מהטלפון
        </button>
      )}
      <p class={note} role="status" aria-live="polite">
        {msg}
      </p>
    </div>
  );
}
