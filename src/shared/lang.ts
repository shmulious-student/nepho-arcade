// The language of the whole UI (see shared/i18n.ts): Hebrew unless the player picked English with the
// TEXT toggle. Remembered by the browser under the old `nepho.` prefix like the other settings, so it
// survives the rebrand.
export type Lang = 'en' | 'he';
const KEY = 'nepho.lang';
let current: Lang | null = null;

export function getLang(): Lang {
  if (current) return current;
  try { current = localStorage.getItem(KEY) === 'en' ? 'en' : 'he'; } catch { current = 'he'; }
  return current;
}
export function setLang(lang: Lang): void {
  current = lang;
  try { localStorage.setItem(KEY, lang); } catch { /* private mode */ }
}
export const langLabel = (lang: Lang): string => (lang === 'he' ? 'TEXT: עברית' : 'TEXT: ENGLISH');
