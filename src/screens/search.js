/* Keepsy — Universal search across records, notes, reminders, documents, tags. */
import { ic } from '../core/ui.js';
import { esc, highlight, fmtDate, money, pluralize } from '../core/format.js';
import { store } from '../core/store.js';
import { getArea } from '../core/areas.js';
import { kindLabel, areaName } from '../core/viewkit.js';

export function renderSearch(params) {
  const q = (params?.get('q') || '').trim();
  const areaFilter = params?.get('area') || 'all';
  const typeFilter = params?.get('type') || 'all';

  const ql = q.toLowerCase();
  const match = (text) => ql.length > 0 && String(text || '').toLowerCase().includes(ql);

  let records = store.live.filter((r) => r.area !== 'private');
  if (ql) {
    records = records.filter((r) =>
      match(r.title) || match(r.note) || match(r.documentName) ||
      (r.tags || []).some((t) => match(t)) || match(areaName(r.area)) || match(kindLabel(r)) ||
      String(r.amount ?? '').includes(ql) ||
      match(fmtDate(r.date, 'short')));
  } else records = [];

  if (areaFilter !== 'all') records = records.filter((r) => r.area === areaFilter);
  if (typeFilter === 'expense') records = records.filter((r) => r.amount != null);
  if (typeFilter === 'document') records = records.filter((r) => r.documentName);
  if (typeFilter === 'expiring') records = records.filter((r) => r.expiry);

  let reminders = ql && typeFilter === 'all' ? store.reminders.filter((r) => !r.private && (match(r.title) || match(fmtDate(r.due, 'short')) || match(r.type))) : [];
  if (areaFilter !== 'all') {
    reminders = reminders.filter((r) => store.record(r.recordId)?.area === areaFilter);
  }

  const groups = new Map();
  records.forEach((r) => {
    if (!groups.has(r.area)) groups.set(r.area, []);
    groups.get(r.area).push(r);
  });

  const usedAreas = [...new Set(store.live.filter((r) => r.area !== 'private').map((r) => r.area))];
  const total = records.length + reminders.length;

  return {
    area: 'home-dash',
    eyebrow: 'Explore',
    title: 'Search',
    html: `
      <section class="screen-head">
        <div class="eyebrow">Find anything</div>
        <h1>Search</h1>
        <p class="lede">Records, notes, reminders, documents, tags and amounts — all in one place.</p>
      </section>

      <div class="search-bar" style="margin-top:16px">
        ${ic('i-search')}
        <input class="search-input" id="sq" value="${esc(q)}" placeholder="petrol, passport, shampoo, college, 450…" aria-label="Search everything" autocomplete="off" />
      </div>

      <div class="filter-strip">
        <a class="chip ${typeFilter === 'all' ? 'on' : ''}" aria-current="${typeFilter === 'all' ? 'true' : 'false'}" href="#/search?${buildQ(q, areaFilter, 'all')}" data-nav>All</a>
        <a class="chip ${typeFilter === 'expense' ? 'on' : ''}" aria-current="${typeFilter === 'expense' ? 'true' : 'false'}" href="#/search?${buildQ(q, areaFilter, 'expense')}" data-nav>With amount</a>
        <a class="chip ${typeFilter === 'document' ? 'on' : ''}" aria-current="${typeFilter === 'document' ? 'true' : 'false'}" href="#/search?${buildQ(q, areaFilter, 'document')}" data-nav>Documents</a>
        <a class="chip ${typeFilter === 'expiring' ? 'on' : ''}" aria-current="${typeFilter === 'expiring' ? 'true' : 'false'}" href="#/search?${buildQ(q, areaFilter, 'expiring')}" data-nav>Expiring</a>
      </div>
      ${usedAreas.length && q ? `<div class="filter-strip">
        <a class="chip ${areaFilter === 'all' ? 'on' : ''}" href="#/search?${buildQ(q, 'all', typeFilter)}" data-nav>Every area</a>
        ${usedAreas.map((slug) => `<a class="chip ${areaFilter === slug ? 'on' : ''}" href="#/search?${buildQ(q, slug, typeFilter)}" data-nav>${esc(getArea(slug)?.name || slug)}</a>`).join('')}
      </div>` : ''}

      ${!q ? `<section class="search-guide">
          <div class="search-guide-head"><span class="search-guide-mark">${ic('i-sparkle')}</span><div><span class="search-guide-kicker">A MEMORY FINDER</span><h2>What are you looking for?</h2><p>Search a note, a shop, an amount or a date. Keepsy checks your saved records and reminders.</p></div></div>
          <div class="search-suggestions"><span>TRY A SEARCH</span>${['petrol', 'passport', 'shampoo', 'college', 'service'].map((t) => `<button class="search-suggestion" data-search-seed="${t}">${t}<b aria-hidden="true">↗</b></button>`).join('')}</div>
        </section>`
      : total === 0 ? `<section class="search-empty">
          <span class="search-empty-mark">${ic('i-search')}</span><span class="search-guide-kicker">NO MATCHES THIS TIME</span>
          <h2>Nothing for “${esc(q)}”</h2>
          <p>Try a shorter word, a date, or an amount like “450”.</p>
          <a class="btn btn-ghost" href="#/search" data-nav>Clear search</a>
        </section>`
      : `
        <section class="search-results-cover" aria-live="polite"><span class="search-results-orbit" aria-hidden="true">${ic('i-search')}</span><div><span class="search-guide-kicker">FOUND IN YOUR KEEPSY</span><strong>${pluralize(total, 'result')} for “${esc(q)}”</strong><small>${records.length} ${records.length === 1 ? 'saved record' : 'saved records'}${reminders.length ? ` · ${pluralize(reminders.length, 'reminder')}` : ''}${areaFilter !== 'all' ? ` · ${esc(getArea(areaFilter)?.name || areaFilter)}` : ''}</small></div></section>
        ${[...groups.entries()].map(([areaSlug, items]) => `
          <section class="search-group">
            <h3>${esc(getArea(areaSlug)?.name || 'Other')} · ${items.length}</h3>
            <div class="panel panel-pad" style="padding:4px 18px">
              ${items.map((r) => `
                <button class="row" data-open-record="${r.id}" style="width:100%">
                  <span class="row-thumb">${ic(getArea(r.area)?.icon || 'i-grid')}</span>
                  <span class="row-main">
                    <span class="row-title">${highlight(r.title, q)}</span>
                    <span class="row-meta">${esc(kindLabel(r))}${r.amount != null ? ` · ${esc(money(r.amount))}` : ''} · ${esc(fmtDate(r.date, 'short'))}${resultContext(r, q) ? `<span class="search-context">${resultContext(r, q)}</span>` : ''}</span>
                  </span>
                  <span class="row-side">${ic('i-chevron-right')}</span>
                </button>`).join('')}
            </div>
          </section>`).join('')}
        ${reminders.length ? `<section class="search-group">
          <h3>Reminders · ${reminders.length}</h3>
          <div class="panel panel-pad" style="padding:4px 18px">
            ${reminders.map((r) => `<button class="row" data-open-reminder="${r.id}" style="width:100%">
              <span class="row-thumb">${ic('i-bell')}</span>
              <span class="row-main"><span class="row-title">${highlight(r.title, q)}</span>
                <span class="row-meta">${esc(fmtDate(r.snoozeUntil || r.due, 'relative'))} · ${esc(r.status === 'done' ? 'done' : 'open')}</span></span>
              <span class="row-side">${ic('i-chevron-right')}</span>
            </button>`).join('')}
          </div>
        </section>` : ''}
      `}
    `,
    mount() {
      const input = document.getElementById('sq');
      if (!input) return;
      input.focus({ preventScroll: true });
      input.setSelectionRange(input.value.length, input.value.length);
      let t;
      input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const val = input.value.trim();
          const base = `#/search?${buildQ(val, areaFilter, typeFilter)}`;
          history.replaceState(null, '', base);
          window.dispatchEvent(new CustomEvent('keepsy:route', { detail: { raw: base, segs: ['search'], params: new URLSearchParams(base.split('?')[1] || '') } }));
        }, 300);
      });
      document.querySelectorAll('[data-search-seed]').forEach((b) => b.addEventListener('click', () => {
        const base = `#/search?${buildQ(b.dataset.searchSeed, 'all', 'all')}`;
        history.replaceState(null, '', base);
        window.dispatchEvent(new CustomEvent('keepsy:route', { detail: { raw: base, segs: ['search'], params: new URLSearchParams(base.split('?')[1] || '') } }));
      }));
    }
  };
}

function buildQ(q, area, type) {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (area && area !== 'all') p.set('area', area);
  if (type && type !== 'all') p.set('type', type);
  return p.toString();
}

function resultContext(record, q) {
  const value = record.note || record.documentName || (record.tags || []).join(' · ');
  if (!value) return '';
  const short = String(value).trim().slice(0, 90);
  return `<span class="search-context">${highlight(short, q)}${String(value).length > 90 ? '…' : ''}</span>`;
}
