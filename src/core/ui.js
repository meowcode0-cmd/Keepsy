/* Keepsy — UI primitives: icons, sheets (bottom → top), layers (left → right),
   drawer, toasts, focus management. Gestures always have a visible control twin. */
import { esc } from './format.js';

export const ic = (name, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#${name}"/></svg>`;

const focusableSel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function trapFocus(container) {
  const previous = document.activeElement;
  const first = container.querySelector(focusableSel);
  if (first) requestAnimationFrame(() => first.focus({ preventScroll: true }));

  function onKey(e) {
    if (e.key !== 'Tab') return;
    const items = [...container.querySelectorAll(focusableSel)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const firstEl = items[0];
    const lastEl = items[items.length - 1];
    if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
  }
  container.addEventListener('keydown', onKey);
  return () => {
    container.removeEventListener('keydown', onKey);
    if (previous && previous.focus) previous.focus({ preventScroll: true });
  };
}

/* ---------------- Toasts ---------------- */
export function toast(message, iconName = 'i-check', ms = 3200) {
  const layer = document.getElementById('toasts');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `${ic(iconName)}<span>${esc(message)}</span>`;
  layer.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 260);
  }, ms);
  const live = document.getElementById('live');
  if (live) live.textContent = message;
}

/* ---------------- Sheets ---------------- */
const sheets = [];

export function openSheet({ title, subtitle = '', body, foot = '', onMount, dismissible = true, grab = true }) {
  const layer = document.getElementById('sheets');
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';

  const sheet = document.createElement('div');
  sheet.className = `sheet ${grab ? '' : 'grab-off'}`;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', title || 'Keepsy');
  sheet.innerHTML = `
    ${grab ? '<div class="sheet-grab"><span></span><small>Drag ↓ to close</small></div>' : ''}
    <div class="sheet-head">
      <div class="sh-titles">${title ? `<h2>${esc(title)}</h2>` : ''}${subtitle ? `<p class="lede">${esc(subtitle)}</p>` : ''}</div>
      <button class="icon-btn" data-sheet-close aria-label="Close">${ic('i-close')}</button>
    </div>
    <div class="sheet-body">${body}</div>
    ${foot ? `<div class="sheet-foot">${foot}</div>` : ''}
  `;
  layer.append(backdrop, sheet);
  const release = trapFocus(sheet);
  requestAnimationFrame(() => { backdrop.classList.add('in'); sheet.classList.add('in'); });

  let closed = false;
  const close = (reason = 'dismiss') => {
    if (closed) return;
    closed = true;
    release();
    backdrop.classList.remove('in');
    sheet.classList.remove('in');
    setTimeout(() => {
      backdrop.remove();
      sheet.remove();
      if (!sheets.length && !layers.length) document.body.style.overflow = '';
    }, 340);
    const i = sheets.findIndex((s) => s.sheet === sheet);
    if (i >= 0) sheets.splice(i, 1);
    if (typeof reason === 'function') reason();
  };

  sheet.querySelectorAll('[data-sheet-close]').forEach((b) => b.addEventListener('click', () => close()));
  if (dismissible) backdrop.addEventListener('click', () => close());
  document.body.style.overflow = 'hidden';

  // top → bottom drag dismiss
  if (grab && dismissible) {
    const handle = sheet.querySelector('.sheet-grab');
    let startY = 0; let dy = 0; let dragging = false;
    const down = (e) => { dragging = true; startY = e.touches ? e.touches[0].clientY : e.clientY; dy = 0; sheet.style.transition = 'none'; };
    const move = (e) => {
      if (!dragging) return;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      dy = Math.max(0, y - startY);
      sheet.style.transform = `translateY(${dy}px)`;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      sheet.style.transition = '';
      sheet.style.transform = '';
      if (dy > 96) close();
      dy = 0;
    };
    handle.addEventListener('touchstart', down, { passive: true });
    handle.addEventListener('touchmove', move, { passive: true });
    handle.addEventListener('touchend', up);
    handle.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  const entry = { sheet, close };
  sheets.push(entry);
  if (onMount) onMount(sheet, close);
  return close;
}

export function closeTopSheet() {
  const top = sheets[sheets.length - 1];
  if (top) { top.close(); return true; }
  return false;
}
export const hasOpenSheet = () => sheets.length > 0;
export function closeAllSheets() {
  while (sheets.length) { const top = sheets[sheets.length - 1]; top.close(); }
}

/* ---------------- Layers (records, side panels) ---------------- */
const layers = [];

export function openLayer({ label = '', render, onMount, onClose, kind = 'record' }) {
  const wrap = document.createElement('div');
  wrap.className = 'layer-wrap';
  wrap.innerHTML = `
    <div class="layer-backdrop"></div>
    <div class="layer" role="dialog" aria-modal="true" aria-label="${esc(label || 'Detail')}">
      <div class="layer-head">
        <button class="icon-btn" data-layer-back aria-label="Back">${ic('i-chevron-left')}</button>
        <div class="lh-label">${esc(label)}</div>
        <div class="layer-head-actions" style="display:flex;gap:2px"></div>
      </div>
      <div class="layer-motion-cue" aria-hidden="true">Swipe ← to close</div>
      <div class="layer-body"><div class="layer-inner"></div></div>
    </div>
  `;
  document.body.appendChild(wrap);
  const layerEl = wrap.querySelector('.layer');
  const body = wrap.querySelector('.layer-body');
  const inner = wrap.querySelector('.layer-inner');
  const backdrop = wrap.querySelector('.layer-backdrop');
  inner.innerHTML = render();

  const release = trapFocus(layerEl);
  requestAnimationFrame(() => { backdrop.classList.add('in'); layerEl.classList.add('in'); });
  document.body.style.overflow = 'hidden';

  let closed = false;
  const close = ({ silent = false } = {}) => {
    if (closed) return;
    closed = true;
    release();
    backdrop.classList.remove('in');
    layerEl.classList.remove('in');
    setTimeout(() => wrap.remove(), 380);
    const i = layers.findIndex((l) => l.el === wrap);
    if (i >= 0) layers.splice(i, 1);
    if (!layers.length) document.body.style.overflow = '';
    if (!silent && onClose) onClose();
  };

  wrap.querySelector('[data-layer-back]').addEventListener('click', () => {
    if (layers.length > 1) { close({ silent: true }); history.back(); }
    else history.back();
  });
  backdrop.addEventListener('click', () => history.back());
  if (onClose) wrap.querySelector('[data-layer-back]').setAttribute('data-has-close', '1');

  // right → left swipe to dismiss
  let sx = 0; let sy = 0; let swiping = false; let moved = false;
  layerEl.addEventListener('touchstart', (e) => {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = true; moved = false;
    layerEl.style.transition = 'none';
  }, { passive: true });
  layerEl.addEventListener('touchmove', (e) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - sx;
    const dyy = Math.abs(e.touches[0].clientY - sy);
    if (Math.abs(dx) > 12 && Math.abs(dx) > dyy) {
      moved = true;
      if (dx < 0) layerEl.style.transform = `translateX(${dx}px)`;
    }
  }, { passive: true });
  layerEl.addEventListener('touchend', (e) => {
    if (!swiping) return;
    swiping = false;
    layerEl.style.transition = '';
    layerEl.style.transform = '';
    const dx = (e.changedTouches[0]?.clientX || sx) - sx;
    if (moved && dx < -70) history.back();
  });

  const entry = { el: wrap, close, body, inner, layerEl, kind };
  layers.push(entry);
  if (onMount) onMount({ inner, body, close, layerEl, headActions: wrap.querySelector('.layer-head-actions') });
  return entry;
}

export function closeAllLayers() {
  while (layers.length) layers[layers.length - 1].close({ silent: true });
}
export const layersOpen = () => layers.length;

/* Escape closes the topmost thing. */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (sheets.length) { closeTopSheet(); return; }
  if (layers.length) { history.back(); }
});

/* ---------------- Drawer ---------------- */
let drawerRelease = null;

export function openDrawer() {
  const drawer = document.getElementById('drawer');
  const scrim = document.getElementById('scrim');
  scrim.hidden = false;
  requestAnimationFrame(() => {
    scrim.classList.add('in');
    drawer.classList.add('open');
  });
  drawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  drawerRelease = trapFocus(drawer);
}

export function closeDrawer() {
  const drawer = document.getElementById('drawer');
  const scrim = document.getElementById('scrim');
  if (!drawer.classList.contains('open')) return;
  drawer.classList.remove('open');
  scrim.classList.remove('in');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = sheets.length || layers.length ? 'hidden' : '';
  setTimeout(() => { scrim.hidden = true; }, 300);
  if (drawerRelease) { drawerRelease(); drawerRelease = null; }
}

export function toggleDrawer() {
  const drawer = document.getElementById('drawer');
  if (drawer.classList.contains('open')) closeDrawer();
  else openDrawer();
}

document.getElementById('scrim')?.addEventListener('click', closeDrawer);
document.getElementById('drawer-close')?.addEventListener('click', closeDrawer);

/* ---------------- Small helpers ---------------- */
export function confirmSheet({ title, message, confirmText = 'Delete', danger = true, onConfirm }) {
  return openSheet({
    title,
    subtitle: message,
    body: `<div class="notice ${danger ? 'danger' : 'quiet'}">${ic('i-info')}<span>${danger ? 'This cannot be undone.' : 'You can change this later.'}</span></div>`,
    foot: `<button class="btn btn-ghost" data-sheet-close>Cancel</button>
           <button class="btn ${danger ? 'btn-danger' : 'btn-accent'}" data-confirm>${esc(confirmText)}</button>`,
    onMount: (sheet, close) => {
      sheet.querySelector('[data-confirm]').addEventListener('click', () => { close(); onConfirm(); });
    }
  });
}

export function fieldWrap(label, control, hint = '') {
  return `<div class="field"><label>${esc(label)}</label>${control}${hint ? `<span class="hint">${esc(hint)}</span>` : ''}</div>`;
}

export function emptyState({ icon = 'i-sparkle', title, body, action = '' }) {
  return `<div class="empty">
    <div class="em-mark">${ic(icon)}</div>
    <h3>${esc(title)}</h3>
    <p>${esc(body)}</p>
    ${action}
  </div>`;
}
