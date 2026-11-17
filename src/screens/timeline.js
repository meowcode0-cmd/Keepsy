/* Keepsy — Timeline: real memories grouped by day. */
import { ic } from '../core/ui.js';
import { esc, fmtDate, fmtTime, money, todayISO, toISO, dayDiff, pluralize, highlight } from '../core/format.js';
import { store } from '../core/store.js';
import { getArea } from '../core/areas.js';
import { kindLabel, areaName, areaIcon } from '../core/viewkit.js';

export function renderTimeline(params) {
  const q = (params?.get('q') || '').trim();
  const areaFilter = params?.get('area') || 'all';
  const rangeFilter = params?.get('range') || 'all';
  const today = todayISO();
  let recs = store.live.filter((r) => r.area !== 'private');
  if (areaFilter !== 'all') recs = recs.filter((r) => r.area === areaFilter);
  if (rangeFilter === '7' || rangeFilter === '30') {
    const cutoff = new Date();
    cutoff.setHours(12, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (Number(rangeFilter) - 1));
    const cutoffISO = toISO(cutoff);
    recs = recs.filter((r) => r.date >= cutoffISO && r.date <= today);
  }
  if (q) {
    const ql = q.toLowerCase();
    recs = recs.filter((r) => r.title.toLowerCase().includes(ql) || (r.note || '').toLowerCase().includes(ql) || (r.tags || []).some((t) => t.toLowerCase().includes(ql)));
  }
  recs.sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')) || (b.createdAt || '').localeCompare(a.createdAt || ''));

  const groups = new Map();
  recs.forEach((r) => {
    if (!groups.has(r.date)) groups.set(r.date, []);
    groups.get(r.date).push(r);
  });

  const usedAreas = [...new Set(store.live.filter((r) => r.area !== 'private').map((r) => r.area))];
  const hrefFor = (area = areaFilter, range = rangeFilter, query = q) => {
    const parts = [];
    if (area !== 'all') parts.push(`area=${encodeURIComponent(area)}`);
    if (range !== 'all') parts.push(`range=${encodeURIComponent(range)}`);
    if (query) parts.push(`q=${encodeURIComponent(query)}`);
    return `#/timeline${parts.length ? `?${parts.join('&')}` : ''}`;
  };
  const rangeName = rangeFilter === '7' ? 'last 7 days' : rangeFilter === '30' ? 'last 30 days' : 'all time';

  return {
    area: 'home-dash',
    eyebrow: 'Explore',
    title: 'Timeline',
    html: `
      <section class="screen-head">
        <div class="eyebrow">Your life, in order</div>
        <h1>Timeline</h1>
        <p class="lede">Everything Keepsy has been told, gathered by the day it happened.</p>
      </section>

      <section class="timeline-overview" aria-label="Timeline summary">
        <div class="timeline-overview-copy"><span class="timeline-overview-kicker">A LIFE, IN LITTLE MOMENTS</span><strong>${recs.length ? `${recs.length} ${recs.length === 1 ? 'memory' : 'memories'} · ${groups.size} ${groups.size === 1 ? 'day' : 'days'}` : 'Your story starts here'}</strong><small>${recs.length ? `Showing ${rangeName}${areaFilter !== 'all' ? ` · ${esc(areaName(areaFilter))}` : ''}` : 'Each thing you save will find its place here.'}</small></div>
        <span class="timeline-overview-total"><b>${recs.length}</b><small>kept</small></span>
        <div class="timeline-overview-line" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      </section>

      <div class="search-bar" style="margin-top:16px">
        ${ic('i-search')}
        <input class="search-input" id="tl-q" value="${esc(q)}" placeholder="Search this timeline" aria-label="Search timeline" />
      </div>
      <nav class="tl-range" aria-label="Filter timeline by date">
        ${[['all', 'All time'], ['7', '7 days'], ['30', '30 days']].map(([value, label]) => `<a class="tl-range-chip ${rangeFilter === value ? 'on' : ''}" href="${hrefFor(areaFilter, value)}" data-nav aria-current="${rangeFilter === value ? 'true' : 'false'}">${label}</a>`).join('')}
      </nav>
      ${usedAreas.length ? `<div class="filter-strip">
        <a class="chip ${areaFilter === 'all' ? 'on' : ''}" href="${hrefFor('all')}" data-nav>All areas</a>
        ${usedAreas.map((slug) => `<a class="chip ${areaFilter === slug ? 'on' : ''}" href="${hrefFor(slug)}" data-nav>${esc(getArea(slug)?.name || slug)}</a>`).join('')}
      </div>` : ''}

      ${recs.length ? [...groups.entries()].map(([date, items]) => `
        <section class="tl-day" aria-label="${esc(dayTitle(date))}, ${esc(pluralize(items.length, 'memory'))}">
          <div class="tl-day-head">
            <span class="tl-date-mark"><b>${new Date(`${date}T12:00:00`).getDate()}</b><small>${fmtDate(date, 'short').split(' ')[0]}</small></span>
            <div class="tl-day-title"><span>${esc(dayTitle(date))}</span><small>${fmtDate(date, 'long')}</small></div>
            <span class="tl-count">${items.length}</span>
            <span class="tl-rule"></span>
          </div>
          <div class="tl-items">
            ${items.map((r) => `
              <button class="tl-item" data-open-record="${r.id}">
                <span class="tl-time">${esc(r.time ? fmtTime(r.time) : fmtDate(r.date, 'short'))}</span>
                <span class="tl-body">
                  <span class="tl-title">${highlight(r.title, q)}</span>
                  <span class="tl-meta">
                    <span>${esc(areaName(r.area))}</span><span>·</span><span>${esc(kindLabel(r))}</span>
                    ${r.amount != null ? `<span>·</span><span>${esc(money(r.amount))}</span>` : ''}
                    ${r.quantity ? `<span>·</span><span>${esc(`${r.quantity}${r.unit ? ` ${r.unit}` : ''}`)}</span>` : ''}
                  </span>
                </span>
                <span class="row-side tl-area-mark" style="--tl-area:${getArea(r.area)?.palette?.[0] || '#192A3B'}">${ic(areaIcon(r.area))}</span>
              </button>`).join('')}
          </div>
        </section>`).join('')
      : `<div class="empty" style="margin-top:26px">
          <div class="em-mark">${ic('i-clock')}</div>
          <h3>${q ? 'Nothing matches that' : 'No memories yet'}</h3>
          <p>${q ? 'Try a different word, or clear the search.' : 'Tell Keepsy what happened and it will appear here, day by day.'}</p>
          ${q ? `<a class="btn btn-ghost" href="#/timeline" data-nav>Clear search</a>` : `<button class="btn btn-accent" data-quick-add>Tell Keepsy something</button>`}
        </div>`}

      ${recs.length ? `<p class="hint" style="text-align:center;margin-top:26px">${pluralize(recs.length, 'memory', 'memories')}${q ? ' matching' : ''}</p>` : ''}
    `,
    mount() {
      const input = document.getElementById('tl-q');
      if (!input) return;
      let t;
      input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const val = input.value.trim();
          const base = hrefFor(areaFilter, rangeFilter, val);
          history.replaceState(null, '', base);
          window.dispatchEvent(new CustomEvent('keepsy:route', { detail: { raw: base } }));
        }, 320);
      });
    }
  };
}

function dayTitle(date) {
  const d = dayDiff(date);
  if (d === 0) return 'Today';
  if (d === -1) return 'Yesterday';
  if (d === 1) return 'Tomorrow';
  return fmtDate(date, 'long');
}
