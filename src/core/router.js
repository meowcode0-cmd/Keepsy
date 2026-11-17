/* Keepsy — hash router. Every route is a real address; nothing 404s. */

const routes = new Map();
let onLayerClose = null;
const scrollMemory = new Map();
let lastBase = '#/';

export function route(pattern, handler) {
  routes.set(pattern, handler);
}

export function go(path, { replace = false } = {}) {
  const target = path.startsWith('#') ? path : `#${path}`;
  if (location.hash === target) {
    emit();
    return;
  }
  if (replace) history.replaceState(null, '', target);
  else location.hash = target;
  if (replace) emit();
}

export function back(fallback = '#/') {
  if (history.length > 1) history.back();
  else go(fallback, { replace: true });
}

export function current() {
  return location.hash && location.hash !== '#' ? location.hash : '#/';
}

export function parse() {
  const raw = current();
  const [pathPart, queryPart] = raw.slice(1).split('?');
  const segs = pathPart.split('/').filter(Boolean);
  const params = new URLSearchParams(queryPart || '');
  return { raw, segs, params, path: pathPart };
}

export function isLayerRoute(route) {
  return route.segs[0] === 'r';
}

export function rememberScroll(key, y) { scrollMemory.set(key, y); }
export function recallScroll(key) { return scrollMemory.get(key) || 0; }

export function setBase(hash) { if (hash) lastBase = hash; }
export function getBase() { return lastBase; }

function emit() {
  const r = parse();
  if (!isLayerRoute(r)) {
    lastBase = r.raw;
    if (onLayerClose) onLayerClose();
  }
  window.dispatchEvent(new CustomEvent('keepsy:route', { detail: r }));
}

export function start(handler) {
  window.addEventListener('hashchange', emit);
  if (!location.hash || location.hash === '#') history.replaceState(null, '', '#/');
  handler(parse());
}

export function onBaseChange(fn) { onLayerClose = fn; }

export function navigateWithScrollReset(path) {
  const r = parse();
  rememberScroll(r.raw, window.scrollY);
  go(path);
}

export { lastBase };
