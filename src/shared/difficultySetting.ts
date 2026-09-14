// The difficulty picked in the lobby, remembered by the browser (old `nepho.` prefix like the rest).
import { DEFAULT_DIFFICULTY, isDifficulty, type Difficulty } from '../sim/difficulty';
const KEY = 'nepho.difficulty';
export function getDifficulty(): Difficulty {
  try { const v = localStorage.getItem(KEY); return isDifficulty(v) ? v : DEFAULT_DIFFICULTY; } catch { return DEFAULT_DIFFICULTY; }
}
export function setDifficulty(d: Difficulty): void {
  try { localStorage.setItem(KEY, d); } catch { /* private mode */ }
}
