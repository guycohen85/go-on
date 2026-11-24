import { useState } from 'preact/hooks';
import { primary, secondary, result, shuffle } from './ui';

const BASE = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

/** A valid 4×4 board: relabel digits, swap rows within bands and columns within stacks. */
function newBoard() {
  const map = shuffle([1, 2, 3, 4]);
  const rows = [...shuffle([0, 1]), ...shuffle([2, 3])];
  const cols = [...shuffle([0, 1]), ...shuffle([2, 3])];
  const solution = rows.map((r) => cols.map((c) => map[BASE[r]![c]! - 1]!));
  const blanks = new Set(shuffle([...Array(16).keys()]).slice(0, 8));
  return { solution, given: solution.flat().map((v, i) => (blanks.has(i) ? 0 : v)) };
}

/** Easy 4×4 sudoku: each row, column and 2×2 box holds 1 to 4. */
export default function Sudoku() {
  const [board, setBoard] = useState(newBoard);
  const [cells, setCells] = useState<string[]>(() => board.given.map((v) => (v ? String(v) : '')));
  const [out, setOut] = useState('');
  function fresh() {
    const b = newBoard();
    setBoard(b);
    setCells(b.given.map((v) => (v ? String(v) : '')));
    setOut('');
  }
  function check() {
    if (cells.some((c) => !c)) return setOut('יש עוד תאים פתוחים.');
    // Accept any board that follows the rules (a puzzle can have more than one solution).
    const v = cells.map(Number);
    const unit = (idx: number[]) => new Set(idx.map((i) => v[i])).size === 4;
    const rows = [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => r * 4 + c));
    const cols = [0, 1, 2, 3].map((c) => [0, 1, 2, 3].map((r) => r * 4 + c));
    const boxes = [0, 2, 8, 10].map((s) => [s, s + 1, s + 4, s + 5]);
    const ok = [...rows, ...cols, ...boxes].every(unit);
    setOut(ok ? 'מצוין, הלוח נכון ✓' : 'יש כמה תאים שכדאי לבדוק שוב.');
  }
  return (
    <div class="mt-4 rounded-card bg-sky p-4">
      <div class="grid w-fit grid-cols-4 overflow-hidden rounded-tile border-2 border-ink bg-paper" dir="ltr" role="group" aria-label="לוח סודוקו 4 על 4">
        {cells.map((c, i) => {
          const r = Math.floor(i / 4), col = i % 4;
          const fixed = board.given[i] !== 0;
          const edge = `${col === 1 ? 'border-e-2 border-e-ink' : 'border-e border-e-line'} ${r === 1 ? 'border-b-2 border-b-ink' : 'border-b border-b-line'}`;
          return (
            <input key={i} value={c} readOnly={fixed} inputMode="numeric" maxLength={1}
              aria-label={`שורה ${r + 1}, עמודה ${col + 1}`}
              onInput={(e) => {
                const v = e.currentTarget.value.replace(/[^1-4]/g, '').slice(-1);
                e.currentTarget.value = v;
                setCells((cs) => cs.map((x, j) => (j === i ? v : x)));
              }}
              class={`size-14 text-center font-display text-title ${fixed ? 'font-semibold' : 'text-go'} ${edge} focus:bg-sky focus:outline-none`} />
          );
        })}
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" class={primary} onClick={check}>בדיקה</button>
        <button type="button" class={secondary} onClick={fresh}>לוח חדש</button>
      </div>
      <p class={result} role="status" aria-live="polite">{out}</p>
    </div>
  );
}
