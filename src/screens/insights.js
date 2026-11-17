/* Keepsy — Insights: deterministic patterns from real saved data only. */
import { ic } from '../core/ui.js';
import { esc, money, todayISO, dayDiff, monthKey, monthLabel, addMonths, pluralize, fmtDate } from '../core/format.js';
import { store } from '../core/store.js';
import { getArea } from '../core/areas.js';

export function renderInsights() {
  const recs = store.live.filter((r) => r.area !== 'private');
  const thisMonth = monthKey(todayISO());
  const lastMonth = addMonths(thisMonth, -1);

  const spendOf = (list) => list.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const monthRecs = recs.filter((r) => monthKey(r.date) === thisMonth);
  const lastRecs = recs.filter((r) => monthKey(r.date) === lastMonth);

  const byArea = {};
  recs.forEach((r) => {
    if (r.amount == null) return;
    byArea[r.area] = (byArea[r.area] || 0) + Number(r.amount);
  });
  const areaRows = Object.entries(byArea).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxArea = Math.max(1, ...areaRows.map(([, v]) => v));

  const titleCounts = {};
  recs.forEach((r) => {
    const k = r.title.toLowerCase().trim();
    titleCounts[k] = titleCounts[k] || { n: 0, last: r.date, rec: r };
    titleCounts[k].n += 1;
    if (r.date > titleCounts[k].last) { titleCounts[k].last = r.date; titleCounts[k].rec = r; }
  });
  const repeats = Object.entries(titleCounts).filter(([, v]) => v.n >= 2).sort((a, b) => b[1].n - a[1].n).slice(0, 5);

  const expiring = recs.filter((r) => r.expiry && dayDiff(r.expiry) >= 0 && dayDiff(r.expiry) <= 45).sort((a, b) => a.expiry.localeCompare(b.expiry));
  const overdue = store.reminders.filter((r) => r.status === 'open' && dayDiff(r.snoozeUntil || r.due) < 0);

  const maintenance = [];
  recs.forEach((r) => {
    if (!r.expiry && !r.warrantyUntil) return;
    const target = r.warrantyUntil || r.expiry;
    const d = dayDiff(target);
    if (d >= 0 && d <= 90) maintenance.push({ rec: r, d, target });
  });
  maintenance.sort((a, b) => a.d - b.d);

  const monthCounts = {};
  for (let i = 5; i >= 0; i--) {
    const k = addMonths(thisMonth, -i);
    monthCounts[k] = { records: 0, spent: 0 };
  }
  recs.forEach((r) => {
    const k = monthKey(r.date);
    if (monthCounts[k]) {
      monthCounts[k].records += 1;
      monthCounts[k].spent += Number(r.amount) || 0;
    }
  });
  const maxMonthSpend = Math.max(1, ...Object.values(monthCounts).map((m) => m.spent));

  const change = lastRecs.length && spendOf(monthRecs)
    ? Math.round(((spendOf(monthRecs) - spendOf(lastRecs)) / Math.max(1, spendOf(lastRecs))) * 100)
    : null;

  const empty = recs.length === 0;
  const activeAreas = new Set(recs.map((r) => r.area)).size;
  const monthLabelText = new Date(`${thisMonth}-01T12:00:00`).toLocaleDateString(undefined, { month: 'long' });

  return {
    area: 'home-dash',
    eyebrow: 'Explore',
    title: 'Insights',
    html: `
      <section class="screen-head">
        <div class="eyebrow">Quiet patterns</div>
        <h1>Insights</h1>
        <p class="lede">Keepsy only shows what it can count from your own records. No predictions, no scores.</p>
      </section>

      ${!empty ? `<section class="insights-overview" aria-label="Your month at a glance">
        <div class="insights-orbit" aria-hidden="true"><i></i><i></i><i></i><b>✳</b></div>
        <div class="insights-overview-copy"><span class="insights-kicker">YOUR MONTH AT A GLANCE</span>
          <strong>${monthRecs.length ? `${pluralize(monthRecs.length, 'memory')} so far` : 'A fresh page for this month'}</strong>
          <small>${pluralize(activeAreas, 'area')} represented across ${pluralize(recs.length, 'memory')}</small>
        </div>
        <a class="insights-overview-link" href="#/timeline" data-nav>Open timeline <span aria-hidden="true">↗</span></a>
        <div class="insights-month-label">${esc(monthLabelText)}</div>
      </section>` : ''}

      ${empty ? `<section class="insights-empty" aria-label="What insights will show">
          <div class="insights-empty-head"><span class="insights-empty-spark">${ic('i-sparkle')}</span><div><span class="insights-kicker">A LITTLE PREVIEW</span><h2>Your patterns will appear here</h2><p>Save a few everyday moments and Keepsy will gently connect the dots.</p></div></div>
          <div class="insights-preview-grid">
            <article class="insight-preview-tile preview-spend"><span>₹</span><b>Spending</b><small>See where recorded amounts go</small></article>
            <article class="insight-preview-tile preview-repeat"><span>↻</span><b>Repeat buys</b><small>Find things you come back to</small></article>
            <article class="insight-preview-tile preview-dates"><span>✳</span><b>Dates ahead</b><small>Spot expiry and reminder dates</small></article>
          </div>
          <button class="btn btn-accent" data-quick-add>Save your first moment</button>
        </section>`
      : `
      <section class="section" style="margin-top:22px">
        <div class="stat-row">
          <div class="stat"><div class="s-label">This month</div><div class="s-value num">${esc(money(spendOf(monthRecs)))}</div></div>
          <div class="stat"><div class="s-label">Records this month</div><div class="s-value num">${monthRecs.length}</div></div>
          <div class="stat"><div class="s-label">Last month</div><div class="s-value num">${esc(money(spendOf(lastRecs)))}</div></div>
        </div>
        ${change != null ? `<p class="hint" style="margin-top:10px">${change === 0 ? 'Spending is level with last month.' : change > 0 ? `${change}% more recorded than last month.` : `${Math.abs(change)}% less than last month.`}</p>` : ''}
      </section>

      ${areaRows.length ? `<section class="section">
        <div class="section-head"><h2>Where money went</h2></div>
        <div class="bars">
          ${areaRows.map(([slug, val]) => `<div class="bar-row">
            <span class="b-label">${esc(getArea(slug)?.name || 'Other')}</span>
            <span class="bar-track"><i class="bar-fill" style="width:${Math.max(4, (val / maxArea) * 100)}%"></i></span>
            <span class="b-val num">${esc(money(val))}</span>
          </div>`).join('')}
        </div>
        <p class="hint" style="margin-top:12px">Only amounts you entered. Nothing is estimated.</p>
      </section>` : ''}

      ${repeats.length ? `<section class="section">
        <div class="section-head"><h2>Things you keep buying</h2></div>
        <div class="insight-list">
          ${repeats.map(([title, v]) => `<button class="insight-card insight-card-link" data-open-record="${esc(v.rec.id)}">
            <span class="ic-wrap">${ic('i-repeat')}</span>
            <div><h4>${esc(title)}</h4>
              <p>Noted ${v.n} times. Last on ${esc(fmtDate(v.last, 'short'))}${v.rec.amount != null ? ` · ${esc(money(v.rec.amount))}` : ''}.</p></div>
            <span class="insight-card-arrow" aria-hidden="true">↗</span>
          </button>`).join('')}
        </div>
      </section>` : ''}

      ${expiring.length || overdue.length || maintenance.length ? `<section class="section">
        <div class="section-head"><h2>Worth looking at</h2></div>
        <div class="insight-list">
          ${overdue.length ? `<div class="insight-card"><span class="ic-wrap">${ic('i-bell')}</span>
            <div><h4>${pluralize(overdue.length, 'reminder')} slipped past</h4>
              <p>${esc(overdue.slice(0, 3).map((r) => r.title).join(', '))}${overdue.length > 3 ? '…' : ''}</p></div></div>` : ''}
          ${expiring.slice(0, 3).map((r) => `<div class="insight-card"><span class="ic-wrap">${ic('i-clock')}</span>
            <div><h4>${esc(r.title)}</h4><p>Expires ${esc(fmtDate(r.expiry, 'long'))} — in ${dayDiff(r.expiry)} days.</p></div></div>`).join('')}
          ${maintenance.slice(0, 3).map(({ rec, d, target }) => `<div class="insight-card"><span class="ic-wrap">${ic('i-shield')}</span>
            <div><h4>${esc(rec.title)}</h4><p>${rec.warrantyUntil === target ? 'Warranty runs out' : 'Expires'} ${esc(fmtDate(target, 'long'))} — in ${d} days.</p></div></div>`).join('')}
        </div>
      </section>` : ''}

      <section class="section">
        <div class="section-head"><h2>Last six months</h2></div>
        <div class="bars">
          ${Object.entries(monthCounts).map(([k, v]) => `<div class="bar-row">
            <span class="b-label">${esc(monthLabel(k).replace(/ \d{4}/, ''))}</span>
            <span class="bar-track"><i class="bar-fill" style="width:${Math.max(2, (v.spent / maxMonthSpend) * 100)}%"></i></span>
            <span class="b-val num">${v.records}</span>
          </div>`).join('')}
        </div>
        <p class="hint" style="margin-top:12px">Bars show recorded spend; the number is how many records you kept that month.</p>
      </section>`}
    `,
    mount() {}
  };
}
