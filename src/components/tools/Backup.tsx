import { useEffect, useState } from 'preact/hooks';
import { entries, keys, setMany, delMany } from 'idb-keyval';
import { load, save } from '../../lib/store';
import { label, primary, secondary, note, today } from './ui';

/** The backup file: every stored key and value, as is (the diary stays encrypted inside it). */
interface BackupFile {
  app: 'go-on';
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

const LAST = 'meta:lastBackup';
/** Not worth carrying to another phone: feedback waiting to be sent from this one. */
const SKIP = new Set(['feedbackQueue']);

function parse(text: string): BackupFile | null {
  try {
    const f = JSON.parse(text) as Partial<BackupFile>;
    const ok = f.app === 'go-on' && f.version === 1 && !!f.data && typeof f.data === 'object' && !Array.isArray(f.data);
    return ok ? (f as BackupFile) : null;
  } catch {
    return null;
  }
}

const date = (iso: string) => new Date(iso).toLocaleDateString('he-IL');

/** Save everything to a file, and restore it from one (replacing what is on this phone). */
export default function Backup() {
  const [last, setLast] = useState('');
  const [msg, setMsg] = useState('');
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => {
    void load<string>(LAST, '').then(setLast);
  }, []);

  async function exportAll() {
    try {
      const data = Object.fromEntries(
        (await entries()).filter(([k]) => typeof k === 'string' && !SKIP.has(k)) as [string, unknown][],
      );
      const exportedAt = new Date().toISOString();
      const file: BackupFile = { app: 'go-on', version: 1, exportedAt, data: { ...data, [LAST]: exportedAt } };
      const href = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = href;
      a.download = `go-on-backup-${today()}.json`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 10_000);
      await save(LAST, exportedAt);
      setLast(exportedAt);
      setMsg('קובץ הגיבוי נוצר. בדקו שהוא נשמר בהורדות או בקבצים של הטלפון.');
    } catch {
      setMsg('לא הצלחנו ליצור את קובץ הגיבוי.');
    }
  }

  async function choose(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    const f = el.files?.[0];
    el.value = '';
    setPending(null);
    if (!f) return;
    const parsed = parse(await f.text());
    if (!parsed) return setImportMsg('זה לא קובץ גיבוי של GO ON, או שהקובץ פגום.');
    setImportMsg('');
    setPending(parsed);
  }

  async function restore() {
    if (!pending) return;
    try {
      // Write the backup first (one transaction), then remove what it does not have. If writing
      // fails, nothing on the phone was lost. This phone's own keys (SKIP) are kept.
      const incoming = Object.entries(pending.data).filter(([k]) => !SKIP.has(k));
      await setMany(incoming);
      const keep = new Set(incoming.map(([k]) => k));
      await delMany((await keys()).filter((k) => typeof k !== 'string' || (!keep.has(k) && !SKIP.has(k))));
      void navigator.storage?.persist?.();
      setPending(null);
      setLast(String(pending.data[LAST] ?? ''));
      setImportMsg('המידע שוחזר מהקובץ. היומן נפתח עם הקוד האישי שהיה לו.');
    } catch {
      setImportMsg('השחזור נכשל. ייתכן שהדפדפן חוסם שמירה (למשל בגלישה בסתר).');
    }
  }

  return (
    <div class="mt-4 grid gap-4">
      <div class="rounded-card bg-sky p-4">
        <h3 class="font-display text-card font-medium">שמירת גיבוי</h3>
        <p class="mt-1 text-ink-2">{last ? `גיבוי אחרון: ${date(last)}` : 'עוד לא נשמר גיבוי.'}</p>
        <button type="button" class={`${primary} mt-3`} onClick={exportAll}>
          שמירת קובץ גיבוי
        </button>
        <p class={note} role="status" aria-live="polite">
          {msg}
        </p>
      </div>
      <div class="rounded-card bg-sky p-4">
        <h3 class="font-display text-card font-medium">שחזור מגיבוי</h3>
        <label for="backup-file" class={`${label} mt-2`}>
          בחירת קובץ גיבוי
        </label>
        <input
          id="backup-file"
          type="file"
          accept=".json,application/json"
          class="mt-1.5 block min-h-11 w-full text-body file:me-3 file:min-h-11 file:rounded-tile file:border-2 file:border-line file:bg-paper file:px-4 file:font-semibold file:text-ink"
          onChange={choose}
        />
        {pending && (
          <div class="mt-3 rounded-tile border-2 border-ink bg-paper p-3" role="group" aria-label="אישור שחזור">
            <p class="font-semibold">
              הגיבוי נשמר ב‑{date(pending.exportedAt)}. השחזור מחליף את כל המידע שבטלפון הזה, ואי אפשר לבטל אותו.
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" class={secondary} onClick={restore}>
                שחזור מהקובץ
              </button>
              <button type="button" class={secondary} onClick={() => setPending(null)}>
                ביטול
              </button>
            </div>
          </div>
        )}
        <p class={note} role="status" aria-live="polite">
          {importMsg}
        </p>
      </div>
    </div>
  );
}
