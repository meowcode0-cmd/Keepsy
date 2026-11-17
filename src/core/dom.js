/* Keepsy — tiny DOM helpers (no framework, no deps). */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const on = (root, evt, sel, fn) => root.addEventListener(evt, (e) => {
  const t = e.target.closest(sel);
  if (t && root.contains(t)) fn(e, t);
});
export const debounce = (fn, ms = 180) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};
export const html = (strings, ...vals) => strings.reduce((out, s, i) => out + s + (vals[i] ?? ''), '');
