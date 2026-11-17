/* Keepsy — Home: the emotional centre. Only real, saved information is shown. */
import { ic } from '../core/ui.js';
import { esc, fmtDate, greeting, money, dayDiff, todayISO, pluralize, monthKey, monthLabel } from '../core/format.js';
import { store } from '../core/store.js';
import { getArea } from '../core/areas.js';
import { kindLabel, areaName, areaIcon, relativeDay } from '../core/viewkit.js';

const visible = (r) => r.area !== 'private';

export function renderHome() {
  const recs = store.live.filter(visible);
  const allVisible = store.records.filter(visible);
  const reminders = store.reminders.filter((r) => r.status === 'open' && !r.private);
  const unread = store.unreadCount();
  const today = todayISO();
  const now = new Date();

  const dueSoon = reminders
    .filter((r) => dayDiff(r.snoozeUntil || r.due) <= 7)
    .sort((a, b) => (a.snoozeUntil || a.due).localeCompare(b.snoozeUntil || b.due));
  const expiring = recs
    .filter((r) => r.expiry && dayDiff(r.expiry) <= 21 && dayDiff(r.expiry) >= -30)
    .sort((a, b) => a.expiry.localeCompare(b.expiry));

  const todayItems = [
    ...reminders.filter((r) => dayDiff(r.snoozeUntil || r.due) === 0).map((r) => ({ kind: 'rem', r })),
    ...reminders.filter((r) => dayDiff(r.snoozeUntil || r.due) < 0).slice(0, 2).map((r) => ({ kind: 'rem', r }))
  ].slice(0, 3);

  const recent = [...allVisible].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, 5);

  const pinned = allVisible.filter((r) => r.pinned).slice(0, 4);

  const attention = [
    ...reminders.filter((r) => dayDiff(r.snoozeUntil || r.due) < 0).map((r) => ({
      key: `r-${r.id}`, type: 'rem', id: r.id,
      title: r.title, sub: `Overdue by ${Math.abs(dayDiff(r.snoozeUntil || r.due))} day${Math.abs(dayDiff(r.snoozeUntil || r.due)) === 1 ? '' : 's'}`,
      when: fmtDate(r.snoozeUntil || r.due, 'short'), icon: 'i-bell', tone: 'warn'
    })),
    ...dueSoon.filter((r) => dayDiff(r.snoozeUntil || r.due) >= 0).map((r) => ({
      key: `r-${r.id}`, type: 'rem', id: r.id,
      title: r.title, sub: relativeDay(r.snoozeUntil || r.due), when: r.time || '',
      icon: 'i-bell', tone: 'normal'
    })),
    ...expiring.filter((r) => !reminders.some((x) => x.recordId === r.id)).map((r) => ({
      key: `e-${r.id}`, type: 'rec', id: r.id,
      title: `${r.title} expires`, sub: dayDiff(r.expiry) < 0 ? 'Already expired' : `In ${dayDiff(r.expiry)} days`,
      when: fmtDate(r.expiry, 'short'), icon: 'i-clock', tone: dayDiff(r.expiry) < 0 ? 'warn' : 'normal'
    }))
  ].slice(0, 4);

  const firstRun = allVisible.length === 0 && reminders.length === 0;

  const areaStrip = ['health', 'home', 'vehicles', 'education', 'finance', 'food', 'documents', 'goals']
    .map((slug) => {
      const a = getArea(slug);
      const count = recs.filter((r) => r.area === slug).length;
      return { a, count };
    })
    .sort((x, y) => y.count - x.count)
    .slice(0, 6);

  return {
    area: 'home-dash',
    eyebrow: 'Keepsy',
    title: 'Home',
    html: `
      <section class="home-hero">
        <div class="home-hero-art" aria-hidden="true">
          <svg class="hero-lights" viewBox="0 0 430 150" preserveAspectRatio="none">
            <path class="hero-light-wire" d="M4 15 C70 20 92 76 151 70 S238 16 285 28 S354 91 426 45" />
            <g class="hero-bulb hero-bulb--gold"><path d="M72 38v16"/><path d="M66 54h12l-2 7h-8z"/><circle cx="72" cy="48" r="8"/></g>
            <g class="hero-bulb hero-bulb--rose"><path d="M160 70v17"/><path d="M154 87h12l-2 7h-8z"/><circle cx="160" cy="81" r="8"/></g>
            <g class="hero-bulb hero-bulb--sage"><path d="M245 38v17"/><path d="M239 55h12l-2 7h-8z"/><circle cx="245" cy="49" r="8"/></g>
            <g class="hero-bulb hero-bulb--gold"><path d="M341 69v16"/><path d="M335 85h12l-2 7h-8z"/><circle cx="341" cy="79" r="8"/></g>
          </svg>
          <span class="hero-orbit hero-orbit--one"></span>
          <span class="hero-orbit hero-orbit--two"></span>
          <span class="hero-sun"></span>
          <span class="hero-scribble">a softer place to remember</span>
          <span class="hero-stamp">${ic('i-sparkle')}<small>kept with care</small></span>
        </div>
        <div class="home-ribbon">YOUR LITTLE SPACE FOR EVERYTHING WORTH REMEMBERING</div>
        <div class="greet"><span class="pulse" aria-hidden="true"></span>${esc(greeting(now))}, ${esc(store.profile?.name || 'Me')} · ${esc(fmtDate(today, 'long'))}</div>
        <h1 class="display">${
          firstRun
            ? 'Your life, <em>quietly kept</em>.'
            : `${esc(greetingWord(now))} — <em>your life, kept</em>.`
        }</h1>
        <p class="lede">${
          firstRun
            ? 'Nothing to maintain. Tell Keepsy what happened — a purchase, a service, a medicine, a date — and it will remember the details for you.'
            : summaryLine(recs, reminders, expiring)
        }</p>
      </section>

      <nav class="home-shortcuts" aria-label="Keepsy shortcuts">
        <button class="home-shortcut home-shortcut--add" data-quick-add>${ic('i-plus')}<span>Add a memory</span><b>↗</b></button>
        <a class="home-shortcut home-shortcut--calendar" href="#/calendar" data-nav>${ic('i-calendar')}<span>Calendar</span><b>↗</b></a>
        <a class="home-shortcut home-shortcut--timeline" href="#/timeline" data-nav>${ic('i-clock')}<span>Timeline</span><b>↗</b></a>
        <a class="home-shortcut home-shortcut--reminders" href="#/reminders" data-nav>${ic('i-bell')}<span>Reminders</span><b>↗</b></a>
      </nav>

      ${firstRun ? firstRunBlock() : `
        <section class="section" aria-labelledby="attn-h">
          <div class="section-head">
            <span class="section-kicker">A gentle check-in</span>
            <h2 id="attn-h">What needs my attention?</h2>
            ${attention.length ? `<span class="tag accent">${attention.length} thing${attention.length === 1 ? '' : 's'}</span>` : ''}
          </div>
          ${attention.length ? `<div class="attn">${attention.map((a) => `
            <button class="attn-item" ${a.type === 'rem' ? `data-open-reminder="${a.id}"` : `data-open-record="${a.id}"`}>
              <span class="attn-mark">${ic(a.icon)}</span>
              <span class="attn-main">
                <span class="attn-title">${esc(a.title)}</span>
                <span class="attn-sub">${esc(a.sub)}</span>
              </span>
              <span class="attn-when">${esc(a.when)}</span>
            </button>`).join('')}</div>`
            : `<div class="empty" style="padding:26px 20px">
                 <div class="em-mark">${ic('i-check')}</div>
                 <h3>Nothing needs your attention right now</h3>
                 <p>Keepsy is keeping an eye on ${pluralize(reminders.length, 'reminder')}. Enjoy the quiet.</p>
               </div>`}
        </section>

        <section class="section" aria-labelledby="today-h">
          <div class="section-head"><h2 id="today-h">Today</h2></div>
          <div class="today-line">
            <div class="today-date">
              <div class="td-num num">${now.getDate()}</div>
              <div class="td-dow">${esc(fmtDate(today, 'long').split(',')[0])}</div>
            </div>
            <div class="today-items">
              ${todayItems.length
                ? todayItems.map(({ r }) => `<div class="ti">${ic('i-bell')}<span>${esc(r.title)}</span></div>`).join('')
                : `<div class="ti">${ic('i-moon')}<span>Nothing scheduled. A good day for a quiet note.</span></div>`}
            </div>
          </div>
        </section>

        ${pinned.length ? `
        <section class="section" aria-labelledby="pin-h">
          <div class="section-head"><h2 id="pin-h">Pinned</h2></div>
          <div class="tile-strip">
            ${pinned.map((r) => `<button class="tile tile--area" style="--tile-ink:${getArea(r.area)?.palette?.[0] || '#192A3B'};--tile-accent:${getArea(r.area)?.palette?.[2] || '#C9A777'}" data-open-record="${r.id}">
              <span class="t-ic">${ic(areaIcon(r.area))}</span>
              <span class="t-name">${esc(r.title)}</span>
              <span class="t-meta">${esc(kindLabel(r))}</span>
            </button>`).join('')}
          </div>
        </section>` : ''}

        <section class="section" aria-labelledby="up-h">
          <div class="section-head"><h2 id="up-h">Up next</h2>
            <a class="link-more" href="#/reminders">All reminders ${ic('i-chevron-right')}</a>
          </div>
          ${dueSoon.filter((r) => dayDiff(r.snoozeUntil || r.due) > 0).length
            ? `<div class="panel panel-pad">
                ${dueSoon.filter((r) => dayDiff(r.snoozeUntil || r.due) > 0).slice(0, 4).map((r) => `
                  <button class="row" data-open-reminder="${r.id}" style="width:100%">
                    <span class="row-thumb">${ic('i-bell')}</span>
                    <span class="row-main"><span class="row-title">${esc(r.title)}</span>
                      <span class="row-meta">${esc(relativeDay(r.snoozeUntil || r.due))}${r.time ? ` · ${esc(r.time)}` : ''}</span></span>
                    <span class="row-side">${ic('i-chevron-right')}</span>
                  </button>`).join('')}
              </div>`
            : `<p class="hint" style="padding:2px 0 8px">Nothing coming up in the next week.</p>`}
        </section>

        <section class="section" aria-labelledby="areas-h">
          <div class="section-head"><h2 id="areas-h">Your life</h2></div>
          <div class="tile-strip">
            ${areaStrip.map(({ a, count }) => `<a class="tile tile--area" style="--tile-ink:${a.palette[0]};--tile-accent:${a.palette[2]}" href="#/a/${a.slug}" data-nav>
              <span class="t-ic">${ic(a.icon)}</span>
              <span class="t-name">${esc(a.name)}</span>
              <span class="t-meta">${count ? pluralize(count, 'record') : 'Empty for now'}</span>
              <span class="tile-arrow" aria-hidden="true">↗</span>
            </a>`).join('')}
          </div>
        </section>

        <section class="section" aria-labelledby="recent-h">
          <div class="section-head"><h2 id="recent-h">Recently</h2>
            <a class="link-more" href="#/timeline">Timeline ${ic('i-chevron-right')}</a>
          </div>
          <div class="panel panel-pad" style="padding:6px 18px">
            ${recent.length ? recent.map((r) => `
              <button class="memory-row" data-open-record="${r.id}">
                <span class="mr-when">${esc(fmtDate(r.date, 'short'))}</span>
                <span class="mr-main">
                  <span class="mr-title">${esc(r.title)}</span>
                  <span class="mr-meta">${esc(areaName(r.area))} · ${esc(kindLabel(r))}${r.amount != null ? ` · ${esc(money(r.amount))}` : ''}</span>
                </span>
                <span class="row-side">${ic('i-chevron-right')}</span>
              </button>`).join('') : `<p class="hint" style="padding:14px 0">Nothing saved yet.</p>`}
          </div>
        </section>

        ${insightBlock(recs, reminders)}
      `}

      <section class="section">
        <div class="panel panel-pad" style="display:flex;gap:14px;align-items:center">
          <span class="avatar-lg" style="width:44px;height:44px;border-radius:13px;font-size:1.1rem">${ic('i-sparkle')}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:.9rem;font-weight:500">Something happened? Tell Keepsy.</div>
            <div class="hint">One sentence is enough. Keepsy fills in the rest, you confirm.</div>
          </div>
          <button class="btn btn-accent btn-sm" data-quick-add>Add</button>
        </div>
      </section>
    `,
    mount() {}
  };
}

function greetingWord(d) {
  const h = d.getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function summaryLine(recs, reminders, expiring) {
  const bits = [];
  if (reminders.length) bits.push(`${pluralize(reminders.length, 'reminder')} on your mind`);
  if (expiring.length) bits.push(`${expiring.length} expiring soon`);
  const month = monthKey(todayISO());
  const monthRecords = recs.filter((r) => monthKey(r.date) === month);
  if (monthRecords.length) bits.push(`${monthRecords.length} kept this month`);
  if (!bits.length) return 'A quiet page. Tell Keepsy what happened and it will hold on to the details.';
  return bits.join(' · ') + '. Everything else is quietly in its place.';
}

function firstRunBlock() {
  return `
    <section class="section">
      <div class="empty first-run-card">
        <span class="welcome-note">no pressure · just life</span>
        <div class="em-mark">${ic('i-sparkle')}</div>
        <h3>No memories yet</h3>
        <p>Tell Keepsy what happened — “Bought shampoo ₹450”, “AC serviced today”, “Medicine expires next month”. It will remember the date, the amount and when to remind you.</p>
        <button class="btn btn-accent" data-quick-add>Tell Keepsy something</button>
      </div>
    </section>
    <section class="section">
      <div class="section-head"><h2>Small things worth keeping</h2></div>
      <div class="tile-strip">
        ${['health', 'home', 'vehicles', 'education', 'finance', 'documents'].map((slug) => {
          const a = getArea(slug);
          return `<a class="tile tile--area" style="--tile-ink:${a.palette[0]};--tile-accent:${a.palette[2]}" href="#/a/${a.slug}" data-nav>
            <span class="t-ic">${ic(a.icon)}</span>
            <span class="t-name">${esc(a.name)}</span>
            <span class="t-meta">Nothing yet</span>
            <span class="tile-arrow" aria-hidden="true">↗</span>
          </a>`;
        }).join('')}
      </div>
    </section>
  `;
}

function insightBlock(recs, reminders) {
  const month = monthKey(todayISO());
  const monthRecs = recs.filter((r) => monthKey(r.date) === month);
  const spent = monthRecs.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const byArea = {};
  monthRecs.forEach((r) => { byArea[r.area] = (byArea[r.area] || 0) + (Number(r.amount) || 0); });
  const topArea = Object.entries(byArea).sort((a, b) => b[1] - a[1])[0];
  const titleCounts = {};
  recs.forEach((r) => { const k = r.title.toLowerCase(); titleCounts[k] = (titleCounts[k] || 0) + 1; });
  const repeated = Object.entries(titleCounts).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1])[0];

  let line = '';
  let label = 'A quiet observation';
  if (spent > 0 && topArea) {
    label = 'This month, quietly';
    line = `${money(spent)} kept in ${monthLabel(month)} so far — most of it in ${areaName(topArea[0])}.`;
  } else if (repeated) {
    label = 'A pattern';
    line = `You have noted “${repeated[0]}” ${repeated[1]} times. Keepsy can remember the next one too.`;
  } else if (reminders.length) {
    label = 'Upcoming';
    line = `${pluralize(reminders.length, 'reminder')} waiting. Nothing urgent, nothing forgotten.`;
  } else {
    return '';
  }

  return `<section class="section">
    <div class="insight-quote">
      <div class="iq-label">${esc(label)}</div>
      <p>${esc(line)}</p>
      <div class="iq-foot"><a href="#/insights" data-nav style="text-decoration:underline;text-underline-offset:3px">See insights ${'→'}</a></div>
    </div>
  </section>`;
}
