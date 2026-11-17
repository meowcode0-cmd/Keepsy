/* Keepsy — Calendar: reminders, expiries, dates. Restrained markers only. */
import { ic } from '../core/ui.js';
import { esc, fmtDate, todayISO, dayDiff, fromISO, toISO, MONTHS, DAYS_SHORT, money } from '../core/format.js';
import { store } from '../core/store.js';
import { go } from '../core/router.js';

const pad = (n) => String(n).padStart(2, '0');

export function renderCalendar(params) {
  const now = new Date();
  const today = todayISO();
  const monthParam = params?.get('m');
  let year = now.getFullYear();
  let month = now.getMonth();
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    year = Number(monthParam.slice(0, 4));
    month = Number(monthParam.slice(5, 7)) - 1;
  }
  const selected = params?.get('d') || (monthParam ? '' : today);
  const showCycle = store.data.settings.showCycle === true;

  const reminders = store.reminders.filter((r) => r.status === 'open' && !r.private);
  const records = store.live.filter((r) => r.area !== 'private');
  const privateTracking = showCycle ? store.live.filter((r) => r.area === 'private' && r.kind === 'tracking') : [];

  const eventsFor = (iso) => {
    const out = [];
    reminders.forEach((r) => {
      if ((r.snoozeUntil || r.due) === iso) out.push({ type: 'reminder', label: r.title, tone: 'accent', id: r.id, private: r.private });
    });
    records.forEach((r) => {
      if (r.expiry === iso) out.push({ type: 'expiry', label: `${r.title} expires`, tone: r.private ? 'rose' : 'ink', id: r.id });
      if (r.date === iso && r.amount == null && !r.expiry) out.push({ type: 'record', label: r.title, tone: 'ink', id: r.id });
    });
    privateTracking.forEach((r) => {
      if (r.date === iso) out.push({ type: 'cycle', label: 'Cycle note', tone: 'rose', id: r.id });
    });
    return out;
  };

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    const d = prevMonthDays - startWeekday + 1 + i;
    const dt = new Date(year, month - 1, d);
    cells.push({ iso: toISO(dt), day: d, out: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: `${year}-${pad(month + 1)}-${pad(d)}`, day: d, out: false });
  }
  while (cells.length % 7 !== 0) {
    const d = cells.length - (startWeekday + daysInMonth) + 1;
    const dt = new Date(year, month + 1, d);
    cells.push({ iso: toISO(dt), day: d, out: true });
  }

  const selEvents = selected ? eventsFor(selected) : [];
  const monthEntries = cells.filter((c) => !c.out).flatMap((c) => eventsFor(c.iso));
  const reminderCount = monthEntries.filter((e) => e.type === 'reminder').length;
  const expiryCount = monthEntries.filter((e) => e.type === 'expiry').length;
  const dateCount = monthEntries.filter((e) => e.type === 'record' || e.type === 'cycle').length;
  const monthEvents = monthEntries.length;
  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);

  return {
    area: 'home-dash',
    eyebrow: 'Explore',
    title: 'Calendar',
    html: `
      <section class="screen-head">
        <div class="eyebrow">Dates that matter</div>
        <h1>Calendar</h1>
      </section>

      <div class="cal-head" style="margin-top:14px">
        <a class="cal-nav-btn" href="#/calendar?m=${prev.getFullYear()}-${pad(prev.getMonth() + 1)}" data-nav aria-label="Previous month">${ic('i-chevron-left')}<span>Previous</span></a>
        <h2 style="text-align:center">${MONTHS[month]} ${year}</h2>
        <a class="cal-nav-btn" href="#/calendar?m=${next.getFullYear()}-${pad(next.getMonth() + 1)}" data-nav aria-label="Next month"><span>Next</span>${ic('i-chevron-right')}</a>
      </div>

      <section class="cal-month-summary" aria-label="Month overview">
        <div class="cal-summary-copy"><span class="cal-summary-kicker">A LITTLE AT A GLANCE</span><strong>${monthEvents ? `${monthEvents} date${monthEvents === 1 ? '' : 's'} to keep in view` : 'A quiet month so far'}</strong><small>Choose any day to see what belongs there.</small><a class="cal-today-link" href="#/calendar?m=${today.slice(0, 7)}&d=${today}" data-nav>${ic('i-calendar')} Today</a></div>
        <span class="cal-summary-total"><b>${monthEvents}</b><small>this month</small></span>
        <div class="cal-summary-metrics"><span class="cal-metric cal-metric--reminder"><i></i>${reminderCount} reminders</span><span class="cal-metric cal-metric--expiry"><i></i>${expiryCount} expiries</span><span class="cal-metric cal-metric--date"><i></i>${dateCount} saved dates</span></div>
      </section>
      <div class="cal-swipe-hint">On phone, swipe the calendar to change months · on laptop, use Previous / Next</div>

      <div class="cal-dow">${DAYS_SHORT.map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="cal-grid" role="grid" aria-label="${MONTHS[month]} ${year}">
        ${cells.map((c) => {
          const ev = eventsFor(c.iso);
          const dots = ev.slice(0, 3).map((e) => `<i class="cd-dot ${e.tone === 'accent' ? '' : e.tone === 'rose' ? 'rose' : 'ink'}"></i>`).join('');
          const label = `${fmtDate(c.iso, 'long')}${ev.length ? `, ${ev.length} event${ev.length === 1 ? '' : 's'}` : ''}`;
          return `<a class="cal-cell ${c.out ? 'out' : ''} ${ev.length ? 'has-events' : ''} ${c.iso === today ? 'today' : ''} ${c.iso === selected ? 'sel' : ''}"
                     href="#/calendar?m=${c.iso.slice(0, 7)}&d=${c.iso}" data-nav aria-label="${esc(label)}" aria-current="${c.iso === today ? 'date' : 'false'}" role="gridcell">
            <span class="cd num">${c.day}</span>
            <span class="cal-dots">${dots}</span>
          </a>`;
        }).join('')}
      </div>

      <div class="cal-legend">
        <span><i></i>Reminder</span>
        <span><i class="ink"></i>Expiry or date</span>
        ${showCycle ? '<span><i style="background:#B98292"></i>Private tracking</span>' : ''}
      </div>

      <section class="section cal-day-detail" aria-live="polite">
        <div class="section-head"><h2>${selected ? fmtDate(selected, 'long') : 'Pick a day'}</h2>
          <span class="hint">${selected ? (selEvents.length ? `${selEvents.length} here` : 'A quiet date') : ''}</span></div>
        ${selected ? (selEvents.length ? `<div class="panel panel-pad" style="padding:4px 18px">
          ${selEvents.map((e) => e.type === 'reminder'
            ? `<button class="row" data-open-reminder="${e.id}" style="width:100%">
                 <span class="row-thumb">${ic('i-bell')}</span>
                 <span class="row-main"><span class="row-title">${esc(e.private ? 'Private reminder' : e.label)}</span>
                   <span class="row-meta">Reminder</span></span>
                 <span class="row-side">${ic('i-chevron-right')}</span></button>`
            : `<button class="row" data-open-record="${e.id}" style="width:100%">
                 <span class="row-thumb">${ic(e.type === 'expiry' ? 'i-clock' : 'i-calendar')}</span>
                 <span class="row-main"><span class="row-title">${esc(e.label)}</span>
                   <span class="row-meta">${e.type === 'expiry' ? 'Expiry' : 'Saved date'}</span></span>
                 <span class="row-side">${ic('i-chevron-right')}</span></button>`).join('')}
          </div>`
          : `<div class="empty" style="padding:26px 20px">
              <div class="em-mark">${ic('i-calendar')}</div>
              <h3>Nothing on this day</h3>
              <p>A quiet date. Add a reminder if something belongs here.</p>
              <button class="btn btn-ghost btn-sm" data-new-reminder>Add a reminder</button>
            </div>`)
        : `<p class="hint">Choose a date above to see what is attached to it.</p>`}
      </section>
    `,
    mount() {
      const grid = document.querySelector('.cal-grid');
      if (!grid) return;
      let start = null;
      grid.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }, { passive: true });
      grid.addEventListener('touchend', (e) => {
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        start = null;
        if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        e.preventDefault();
        const target = dx < 0 ? next : prev;
        go(`#/calendar?m=${target.getFullYear()}-${pad(target.getMonth() + 1)}`);
      }, { passive: false });
    }
  };
}
