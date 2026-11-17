/* Keepsy — shared rendering pieces: rows, badges, date helpers, widgets. */
import { ic } from './ui.js';
import { esc, fmtDate, fmtWhen, money, dayDiff, todayISO, timeAgo } from './format.js';
import { getArea, KIND_LABEL } from './areas.js';

export const kindLabel = (rec) => (rec.kind && KIND_LABEL[`${rec.area}:${rec.kind}`]) || 'Entry';

export const areaName = (slug) => getArea(slug)?.name || 'Other';
export const areaIcon = (slug) => getArea(slug)?.icon || 'i-grid';

export function recordRow(rec, { showArea = true } = {}) {
  const meta = [];
  if (showArea) meta.push(areaName(rec.area));
  meta.push(kindLabel(rec));
  if (rec.quantity) meta.push(`${rec.quantity}${rec.unit ? ` ${rec.unit}` : ''}`);
  const right = rec.amount != null
    ? `<span class="amt num">${money(rec.amount)}</span>`
    : '';
  return `<button class="record-item" data-open-record="${rec.id}">
    <span class="row-thumb">${ic(areaIcon(rec.area))}</span>
    <span class="rec-main">
      <span class="rec-title">${esc(rec.title)}</span>
      <span class="rec-meta">${meta.map((m) => esc(m)).join('<span class="sep">·</span>')}</span>
    </span>
    <span class="rec-right">${right}<span class="when">${esc(fmtDate(rec.date, 'short'))}</span></span>
  </button>`;
}

export function statusTag(rem) {
  if (rem.status === 'done') return `<span class="tag quiet">Done</span>`;
  const d = dayDiff(rem.snoozeUntil || rem.due);
  if (d < 0) return `<span class="tag warn">Overdue</span>`;
  if (d === 0) return `<span class="tag accent">Today</span>`;
  if (d <= 3) return `<span class="tag accent">${d}d</span>`;
  return '';
}

export function remMeta(rem, { privatePreview = true } = {}) {
  const bits = [];
  if (rem.private && !privatePreview) bits.push('Private reminder');
  bits.push(fmtWhen(rem.snoozeUntil || rem.due, rem.time));
  if (rem.repeat && rem.repeat !== 'none') bits.push(`repeats ${rem.repeat}`);
  return bits.join(' · ');
}

export function expiryBits(rec) {
  const out = [];
  if (rec.expiry) {
    const d = dayDiff(rec.expiry);
    let tone = 'quiet';
    let text = `Expires ${fmtDate(rec.expiry, 'short')}`;
    if (d < 0) { tone = 'warn'; text = `Expired ${fmtDate(rec.expiry, 'short')}`; }
    else if (d <= 30) { tone = 'accent'; text = d === 0 ? 'Expires today' : `Expires in ${d}d`; }
    out.push(`<span class="tag ${tone}">${esc(text)}</span>`);
  }
  if (rec.warrantyUntil) {
    const d = dayDiff(rec.warrantyUntil);
    out.push(`<span class="tag ${d < 0 ? 'warn' : 'quiet'}">Warranty ${d < 0 ? 'ended' : `to ${fmtDate(rec.warrantyUntil, 'short')}`}</span>`);
  }
  return out.join('');
}

export function statCard(label, value, unit = '') {
  return `<div class="stat"><div class="s-label">${esc(label)}</div><div class="s-value num">${esc(value)}${unit ? `<small>${esc(unit)}</small>` : ''}</div></div>`;
}

export function recordSummary(rec) {
  const bits = [kindLabel(rec)];
  if (rec.quantity) bits.push(`${rec.quantity}${rec.unit ? ` ${rec.unit}` : ''}`);
  if (rec.amount != null) bits.push(money(rec.amount));
  if (rec.mileage) bits.push(`${rec.mileage.toLocaleString('en-IN')} km`);
  return bits.join(' · ');
}

export function reminderChip(rem) {
  return `<button class="chip" data-open-reminder="${rem.id}">${ic('i-bell')}<span>${esc(rem.title)}</span></button>`;
}

export function relativeDay(iso) {
  const d = dayDiff(iso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  return fmtDate(iso, 'short');
}

export function groupByDate(items, key = 'date') {
  const map = new Map();
  for (const it of items) {
    const k = it[key] || todayISO();
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export function historyList(rec) {
  if (!rec.history?.length) return '<p class="hint">No history yet.</p>';
  return `<div class="history">${rec.history.slice(0, 12).map((h) => `
    <div class="hist-item"><strong>${esc(h.text)}</strong> · ${esc(timeAgo(h.at))}</div>`).join('')}</div>`;
}
