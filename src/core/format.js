/* Keepsy — dates, money, text helpers. All deterministic, no locale surprises. */

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const todayISO = () => toISO(new Date());

export function toISO(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export function fromISO(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function dayDiff(isoA, isoB = todayISO()) {
  const a = fromISO(isoA); const b = fromISO(isoB);
  if (!a || !b) return 0;
  return Math.round((a - b) / 86400000);
}

export function fmtDate(iso, style = 'medium') {
  const d = fromISO(iso);
  if (!d) return '';
  const diff = dayDiff(iso);
  if (style === 'relative') {
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 1 && diff <= 6) return DAYS[d.getDay()];
    if (diff < -1 && diff >= -6) return `Last ${DAYS[d.getDay()]}`;
  }
  if (style === 'long') return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if (style === 'short') return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtWhen(iso, time) {
  const label = fmtDate(iso, 'relative');
  return time ? `${label} · ${fmtTime(time)}` : label;
}

export function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const mer = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${m ? `:${String(m).padStart(2, '0')}` : ''} ${mer}`;
}

export function money(n, currency = '₹') {
  if (n == null || Number.isNaN(Number(n))) return '';
  const num = Number(n);
  const hasDec = Math.round(num * 100) % 100 !== 0;
  return `${currency}${num.toLocaleString('en-IN', { minimumFractionDigits: hasDec ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function timeAgo(isoDateTime) {
  if (!isoDateTime) return '';
  const then = new Date(isoDateTime).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return fmtDate(isoDateTime.slice(0, 10), 'short');
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'Still awake';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function highlight(text, q) {
  const safe = esc(text);
  if (!q || q.length < 2) return safe;
  try {
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  } catch { return safe; }
}

export function monthKey(iso) { return iso ? iso.slice(0, 7) : ''; }

export function monthLabel(key) {
  if (!key) return '';
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function weekStartDate(d = new Date(), weekStartsOn = 1) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function initials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function pluralize(n, one, many) {
  return `${n} ${n === 1 ? one : many || `${one}s`}`;
}
