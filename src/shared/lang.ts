// The language of the dialog text (everything else in the game is English). Remembered by the
// browser under the old `nepho.` prefix like the other settings, so it survives the rebrand.
export type Lang = 'en' | 'he';
const KEY = 'nepho.lang';
let current: Lang | null = null;

export function getLang(): Lang {
  if (current) return current;
  try { current = localStorage.getItem(KEY) === 'he' ? 'he' : 'en'; } catch { current = 'en'; }
  return current;
}
export function setLang(lang: Lang): void {
  current = lang;
  try { localStorage.setItem(KEY, lang); } catch { /* private mode */ }
}
export const langLabel = (lang: Lang): string => (lang === 'he' ? 'TEXT: עברית' : 'TEXT: ENGLISH');
