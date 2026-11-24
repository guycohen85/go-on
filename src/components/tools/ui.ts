// Shared class names for tool islands (tokens from DESIGN.md).
export const label = 'block font-semibold';
export const input =
  'mt-1.5 w-full rounded-tile border-2 border-line bg-paper px-3 py-2.5 text-body text-ink focus:border-ink focus:outline-none';
export const primary =
  'inline-flex min-h-11 items-center justify-center rounded-tile bg-go px-5 font-bold text-white transition-colors hover:bg-go-hover disabled:opacity-60';
export const secondary =
  'inline-flex min-h-11 items-center justify-center rounded-tile border-2 border-line bg-paper px-4 font-semibold text-ink transition-colors hover:border-ink';
export const result = 'mt-3 font-display text-card font-medium';
export const note = 'mt-2 text-small text-ink-2';

/** Today's date as YYYY-MM-DD in local time. */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
