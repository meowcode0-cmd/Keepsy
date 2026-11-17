/* Keepsy — Your Month: an editorial scrapbook of what actually happened. */
import { ic } from '../core/ui.js';
import { esc, money, monthKey, monthLabel, addMonths, todayISO, pluralize, fmtDate, fromISO, MONTHS_SHORT } from '../core/format.js';
import { store } from '../core/store.js';
import { getArea } from '../core/areas.js';
import { kindLabel, areaName } from '../core/viewkit.js';

export function renderMonth(params) {
  const thisMonth = monthKey(todayISO());
  const key = /^\d{4}-\d{2}$/.test(params?.get('m') || '') ? params.get('m') : thisMonth;
  const recs = store.live.filter((r) => r.area !== 'private' && monthKey(r.date) === key)
    .sort((a, b) => a.date.localeCompare(b.date));
  const remindersDone = store.data.reminders.filter((r) => r.status === 'done' && monthKey((r.completedAt || '').slice(0, 10)) === key && !r.private);

  const amountTotal = recs.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const byArea = {};
  recs.forEach((r) => { byArea[r.area] = (byArea[r.area] || 0) + 1; });
  const topAreas = Object.entries(byArea).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const notable = recs.filter((r) => r.amount != null).sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 4);
  const maintenance = recs.filter((r) => ['service', 'maintenance', 'repair'].includes(r.kind));
  const study = recs.filter((r) => r.area === 'education');
  const purchases = recs.filter((r) => r.amount != null);

  const prev = addMonths(key, -1);
  const next = addMonths(key, 1);
  const canGoNext = next <= thisMonth;

  const [yy, mm] = key.split('-').map(Number);
  const line = recs.length
    ? `${pluralize(recs.length, 'thing')} kept${amountTotal ? `, ${money(amountTotal)} in recorded amounts` : ''}${topAreas.length ? `, with most notes in ${getArea(topAreas[0][0])?.name || 'Other'}` : ''}.`
    : 'A quiet month with nothing recorded. Some months are like that.';

  const [yearNum, monthNum] = key.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const firstWeekday = new Date(yearNum, monthNum - 1, 1, 12).getDay();
  const recordsByDay = new Map();
  recs.forEach((r) => recordsByDay.set(r.date, (recordsByDay.get(r.date) || 0) + 1));
  const activityCells = `${'<span class="month-map-blank" aria-hidden="true"></span>'.repeat(firstWeekday)}${Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = `${key}-${String(day).padStart(2, '0')}`;
    const count = recordsByDay.get(date) || 0;
    return count
      ? `<button class="month-map-day has-memory" type="button" data-scroll-month="${date}" aria-label="${day} ${esc(monthLabel(key).split(' ')[0])}, ${pluralize(count, 'memory')}"><b>${day}</b><i>${count > 1 ? count : '✳'}</i></button>`
      : `<span class="month-map-day" aria-label="${day}, no saved memories"><b>${day}</b></span>`;
  }).join('')}`;

  return {
    area: 'home-dash',
    eyebrow: 'Explore',
    title: 'Your Month',
    html: `
      <section class="month-cover">
        <div class="mc-eyebrow">Your month · ${MM_YEAR(key)}</div>
        <h1>${esc(MONTHS_SHORT[mm - 1])}, <em style="font-style:italic">kept</em>.</h1>
        <p class="mc-line">${esc(line)}</p>
        <div class="mc-stats">
          <div class="mc-stat"><div class="ms-v num">${recs.length}</div><div class="ms-l">Records</div></div>
          <div class="mc-stat"><div class="ms-v num">${esc(money(amountTotal))}</div><div class="ms-l">Recorded amounts</div></div>
          <div class="mc-stat"><div class="ms-v num">${remindersDone.length}</div><div class="ms-l">Reminders done</div></div>
        </div>
      </section>

      <div class="month-nav-row" aria-label="Choose a month">
        <a class="month-nav-link" href="#/month?m=${prev}" data-nav aria-label="Previous month">${ic('i-chevron-left')} <span>${esc(monthLabel(prev).split(' ')[0])}</span></a>
        <span class="month-nav-current">${esc(monthLabel(key))}</span>
        ${canGoNext ? `<a class="month-nav-link" href="#/month?m=${next}" data-nav aria-label="Next month"><span>${esc(monthLabel(next).split(' ')[0])}</span> ${ic('i-chevron-right')}</a>` : '<span aria-hidden="true"></span>'}
      </div>

      ${recs.length || remindersDone.length ? `
        ${recs.length ? `<section class="month-map" aria-label="Memory map for ${esc(monthLabel(key))}">
          <div class="month-map-head"><div><span class="month-map-kicker">YOUR MONTH, AT A GLANCE</span><h2>Little dots, real days</h2></div><span class="month-map-key"><i></i> saved memory</span></div>
          <div class="month-map-grid" role="group" aria-label="Select a day with saved memories">${['S','M','T','W','T','F','S'].map((d) => `<span class="month-map-weekday">${d}</span>`).join('')}${activityCells}</div>
          <p class="month-map-note">Tap a marked day to jump to its memories.</p>
        </section>` : ''}
        ${topAreas.length ? `<section class="section">
          <div class="section-head"><h2>Where the month went</h2></div>
          <div class="chip-row">
            ${topAreas.map(([slug, n]) => `<a class="chip" href="#/a/${slug}" data-nav>${esc(getArea(slug)?.name || 'Other')} · ${n}</a>`).join('')}
          </div>
        </section>` : ''}

        ${maintenance.length ? `<section class="section">
          <div class="section-head"><h2>Things that were looked after</h2></div>
          <div class="panel panel-pad" style="padding:4px 18px">
            ${maintenance.slice(0, 5).map((r) => `<button class="row" data-open-record="${r.id}" style="width:100%">
              <span class="row-thumb">${ic('i-repeat')}</span>
              <span class="row-main"><span class="row-title">${esc(r.title)}</span>
                <span class="row-meta">${esc(kindLabel(r))} · ${esc(fmtDate(r.date, 'short'))}${r.amount != null ? ` · ${esc(money(r.amount))}` : ''}</span></span>
              <span class="row-side">${ic('i-chevron-right')}</span></button>`).join('')}
          </div>
        </section>` : ''}

        ${study.length ? `<section class="section">
          <div class="section-head"><h2>Learning notes</h2></div>
          <div class="panel panel-pad" style="padding:4px 18px">
            ${study.slice(0, 5).map((r) => `<button class="row" data-open-record="${r.id}" style="width:100%">
              <span class="row-thumb">${ic('i-book')}</span>
              <span class="row-main"><span class="row-title">${esc(r.title)}</span>
                <span class="row-meta">${esc(kindLabel(r))} · ${esc(fmtDate(r.date, 'short'))}</span></span>
              <span class="row-side">${ic('i-chevron-right')}</span></button>`).join('')}
          </div>
        </section>` : ''}

        ${notable.length ? `<section class="section">
          <div class="section-head"><h2>Largest amounts recorded</h2></div>
          <div class="insight-list">
            ${notable.map((r) => `<div class="insight-card"><span class="ic-wrap">${ic(getArea(r.area)?.icon || 'i-grid')}</span>
              <div><h4>${esc(r.title)}</h4><p>${esc(money(r.amount))} · ${esc(areaName(r.area))} · ${esc(fmtDate(r.date, 'short'))}</p></div></div>`).join('')}
          </div>
        </section>` : ''}

        <section class="section">
          <div class="section-head"><h2>Day by day</h2></div>
          <div class="panel panel-pad">
            ${groupDays(recs).map(([date, items]) => `
              <div class="month-entry" id="month-day-${date}">
                <div class="me-day"><div class="d num">${esc(date.slice(8))}</div><div class="m">${esc(MONTHS_SHORT[Number(date.slice(5, 7)) - 1])}</div></div>
                <div style="flex:1;min-width:0">
                  ${items.map((r) => `<button class="memory-row" style="padding:5px 0;border:0" data-open-record="${r.id}">
                    <span class="mr-main"><span class="mr-title">${esc(r.title)}</span>
                      <span class="mr-meta">${esc(areaName(r.area))} · ${esc(kindLabel(r))}${r.amount != null ? ` · ${esc(money(r.amount))}` : ''}</span></span>
                    <span class="row-side">${ic('i-chevron-right')}</span>
                  </button>`).join('')}
                </div>
              </div>`).join('')}
          </div>
        </section>

        ${purchases.length ? `<p class="hint" style="text-align:center;margin-top:18px">${pluralize(purchases.length, 'record')} with an amount this month. This page is a scrapbook of your notes.</p>` : ''}
      ` : `<section class="month-empty" aria-label="An empty month">
          <div class="month-empty-copy"><span class="month-empty-sticker">${ic('i-calendar')} A BLANK PAGE</span><h2>Nothing kept in ${esc(monthLabel(key))}</h2><p>Save a little moment whenever you’re ready. Keepsy will tuck it into this month for you.</p><button class="btn btn-accent" data-quick-add>Save a moment</button></div>
          <div class="month-empty-ticket" aria-hidden="true"><span>${esc(MONTHS_SHORT[mm - 1])}</span><b>✳</b><small>room for your story</small><i></i><i></i></div>
          <span class="month-empty-spark" aria-hidden="true">✦</span>
        </section>`}
    `,
    mount() {
      document.querySelectorAll('[data-scroll-month]').forEach((button) => button.addEventListener('click', () => {
        document.getElementById(`month-day-${button.dataset.scrollMonth}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
    }
  };
}

function MM_YEAR(key) {
  const [y, m] = key.split('-').map(Number);
  return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${y}`;
}

function groupDays(recs) {
  const m = new Map();
  recs.forEach((r) => { if (!m.has(r.date)) m.set(r.date, []); m.get(r.date).push(r); });
  return [...m.entries()];
}
