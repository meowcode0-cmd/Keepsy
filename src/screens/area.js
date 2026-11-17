/* Keepsy — a Life area page: its own atmosphere, summary, records, reminders. */
import { ic } from '../core/ui.js';
import { esc, fmtDate, money, dayDiff, todayISO, pluralize, monthKey } from '../core/format.js';
import { store } from '../core/store.js';
import { AREAS, getArea } from '../core/areas.js';
import { kindLabel, recordRow, expiryBits, statCard, remMeta } from '../core/viewkit.js';

const areaStickers = {
  health: ['care note', 'i-heart'],
  beauty: ['little rituals', 'i-sparkle'],
  home: ['loved & lived in', 'i-home'],
  food: ['good things inside', 'i-leaf'],
  education: ['keep becoming', 'i-book'],
  work: ['in your own time', 'i-briefcase'],
  vehicles: ['miles & moments', 'i-car'],
  finance: ['money, remembered', 'i-wallet'],
  documents: ['paper trail', 'i-doc'],
  family: ['for your people', 'i-heart'],
  pets: ['little life', 'i-paw'],
  personal: ['just for you', 'i-moon'],
  travel: ['somewhere new', 'i-plane'],
  hobbies: ['made for fun', 'i-palette'],
  goals: ['one thing at a time', 'i-target'],
  other: ['odds & ends', 'i-grid'],
  private: ['only you', 'i-eye-off']
};

/* One hand-drawn signature per area; the leaf belongs to Food alone. */
const areaMotifs = {
  health: '<path d="M16 125h38l18-43 28 91 27-69 18 29h59"/><path d="M111 55v-18m-9 9h18"/>',
  beauty: '<path d="M78 48h58l-8 20H86zM85 68h44l8 99H77z"/><path d="M101 102h12m-6-6v12M166 52l5 13 13 5-13 5-5 13-5-13-13-5 13-5z"/>',
  home: '<path d="m28 106 82-69 82 69M48 97v83h124V97M92 180v-54h37v54M66 112h16v18H66zM144 112h16v18h-16z"/>',
  food: '<path class="motif-leaf" d="M111 224C75 190 36 161 39 112 42 66 81 31 174 20c8 84-6 145-53 181-4 3-7 5-10 7Z"/><path d="M111 224C108 170 106 107 174 20M108 188 64 138M108 160 151 111M106 131 68 91M111 102 156 69M108 76 90 50"/>',
  education: '<path d="M26 55h55c17 0 29 10 29 25v111c0-17-12-27-29-27H26zM194 55h-55c-17 0-29 10-29 25v111c0-17 12-27 29-27h55z"/><path d="M42 82h35M42 103h35M143 82h35M143 103h35"/>',
  work: '<rect x="33" y="76" width="154" height="105" rx="14"/><path d="M76 76V57h68v19M33 116h154M94 116v16h32v-16"/><path d="m110 31 5 12 13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1z"/>',
  vehicles: '<path d="M68 18h84M82 18c-8 37-12 66-12 102s4 64 12 102M138 18c8 37 12 66 12 102s-4 64-12 102M109 40v30m0 22v30m0 22v30m0 22v15"/>',
  finance: '<circle cx="109" cy="116" r="68"/><circle cx="109" cy="116" r="48"/><circle cx="109" cy="116" r="25"/><path d="M109 91v50m14-38c-5-7-25-8-28 2-5 14 29 10 28 25-1 12-22 15-31 5"/>',
  documents: '<path d="M62 34h74l28 29v143H62zM136 34v31h28M80 91h64M80 113h64M80 135h48M80 157h55"/><path d="M45 50v153h20"/>',
  family: '<circle cx="79" cy="82" r="21"/><circle cx="141" cy="82" r="21"/><circle cx="110" cy="58" r="19"/><path d="M38 172c3-31 18-48 41-48s38 17 41 48M102 172c3-31 18-48 41-48s38 17 41 48M84 147c6-17 15-27 26-27s20 10 26 27"/>',
  pets: '<ellipse cx="67" cy="75" rx="13" ry="18"/><ellipse cx="104" cy="57" rx="13" ry="18"/><ellipse cx="143" cy="67" rx="13" ry="18"/><ellipse cx="171" cy="101" rx="12" ry="17"/><path d="M109 105c29 0 48 20 48 43 0 18-14 29-31 25-11-3-23-3-34 0-17 4-31-7-31-25 0-23 19-43 48-43Z"/>',
  personal: '<path d="M145 45c-35 10-55 43-45 77 9 31 41 50 72 41-17 25-50 38-81 28-39-12-61-54-49-94 12-39 54-61 94-49 4 1 7 2 9 3Z"/><path d="m163 42 4 10 10 4-10 4-4 10-4-10-10-4 10-4zM64 151l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
  travel: '<path d="m24 174 51-69 28 33 35-73 58 109z"/><path d="M34 193c25-24 49-8 70-25 20-16 18-40 45-48 15-5 26 2 38 10"/><circle cx="187" cy="128" r="7"/>',
  hobbies: '<path d="M110 39c-42 0-77 32-77 72s34 75 73 75c15 0 25-11 25-23 0-10-9-17-9-27 0-9 7-16 17-16h18c21 0 35-14 35-34 0-26-35-47-82-47Z"/><circle cx="73" cy="91" r="7"/><circle cx="100" cy="70" r="7"/><circle cx="132" cy="75" r="7"/><circle cx="155" cy="97" r="7"/>',
  goals: '<circle cx="110" cy="122" r="76"/><circle cx="110" cy="122" r="51"/><circle cx="110" cy="122" r="25"/><path d="m110 122 75-80M161 42h24v24"/>',
  other: '<rect x="38" y="48" width="54" height="54" rx="16"/><circle cx="145" cy="74" r="28"/><path d="M42 158h52m-26-26v52M129 146h49v40h-49zM152 146v40"/><path d="m110 36 4 10 11 4-11 4-4 11-4-11-11-4 11-4z"/>'
};

export function renderArea(slug, params) {
  const area = getArea(slug);
  if (!area || slug === 'private') return null;
  const isPrivate = slug === 'private';
  const botanical = slug === 'food';
  const areaIndex = AREAS.findIndex((a) => a.slug === slug);
  const previousArea = areaIndex > 0 ? AREAS[areaIndex - 1] : null;
  const nextArea = areaIndex >= 0 && areaIndex < AREAS.length - 1 ? AREAS[areaIndex + 1] : null;
  const motif = areaMotifs[slug] || '';
  const [stickerLabel, stickerIcon] = areaStickers[slug] || ['kept here', area.icon];
  const all = store.live.filter((r) => r.area === slug);
  const filter = params?.get('kind') || 'all';
  const sort = params?.get('sort') || 'recent';
  const q = (params?.get('q') || '').toLowerCase();

  let list = all.slice();
  if (filter !== 'all') list = list.filter((r) => r.kind === filter);
  if (q) list = list.filter((r) => r.title.toLowerCase().includes(q) || (r.note || '').toLowerCase().includes(q));
  if (sort === 'recent') list.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  if (sort === 'oldest') list.sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt));
  if (sort === 'amount') list.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));

  const reminders = store.reminders.filter((r) => {
    if (r.status !== 'open') return false;
    const rec = r.recordId ? store.record(r.recordId) : null;
    return r.recordId ? rec?.area === slug : false;
  });

  const spend = all.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const monthSpend = all.filter((r) => monthKey(r.date) === monthKey(todayISO())).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const upcoming = all.filter((r) => r.expiry && dayDiff(r.expiry) >= 0 && dayDiff(r.expiry) <= 60).length;
  const expiring = all.filter((r) => r.expiry && dayDiff(r.expiry) <= 30).length;
  const expired = all.filter((r) => r.expiry && dayDiff(r.expiry) < 0).length;
  const warranties = all.filter((r) => r.warrantyUntil).length;
  const due = all.filter((r) => r.expiry && dayDiff(r.expiry) <= 30 && dayDiff(r.expiry) >= 0).length;

  const statFor = (key) => {
    switch (key) {
      case 'records': return statCard('Saved', all.length);
      case 'spent': return statCard('Total spent', money(spend));
      case 'month': return statCard('This month', money(monthSpend));
      case 'upcoming': return statCard('Upcoming', reminders.length || all.filter((r) => dayDiff(r.date) >= 0).length);
      case 'expiring': return statCard('Expiring', expiring);
      case 'expired': return statCard('Expired', expired);
      case 'warranties': return statCard('Warranties', warranties);
      case 'due': return statCard('Due soon', due);
      default: return '';
    }
  };

  const kindCounts = {};
  all.forEach((r) => { kindCounts[r.kind] = (kindCounts[r.kind] || 0) + 1; });
  const healthBoard = slug === 'health' ? `
    <section class="health-board" aria-labelledby="health-board-title">
      <div class="health-board-head">
        <div><span class="health-board-kicker">YOUR CARE, AT A GLANCE</span><h2 id="health-board-title">Little health hub</h2></div>
        <svg class="health-pulse-art" viewBox="0 0 160 56" aria-hidden="true"><path d="M2 31h38l13-19 17 34 16-26 12 11h60"/></svg>
      </div>
      <div class="health-widget-grid">
        ${[
          ['medicine', 'Medicines', 'i-doc', 'Keep expiry dates close'],
          ['appointment', 'Appointments', 'i-calendar', 'Keep care dates together'],
          ['symptom', 'Symptoms', 'i-heart', 'Notice what changes']
        ].map(([kind, label, icon, hint]) => `<a class="health-widget health-widget--${kind}" href="#/a/health?kind=${kind}" data-nav aria-label="${label}: ${kindCounts[kind] || 0} saved. ${hint}">
          <span class="health-widget-top">${ic(icon)}<b>${kindCounts[kind] || 0}</b></span>
          <strong>${label}</strong><small>${kindCounts[kind] ? `${pluralize(kindCounts[kind], 'memory')} saved` : hint}</small><span class="health-widget-arrow" aria-hidden="true">↗</span>
        </a>`).join('')}
      </div>
      <button class="health-add" data-new-record="health">${ic('i-plus')} Add a care memory <span>one small note is enough</span></button>
    </section>` : '';
  const sectionBoard = slug === 'health' ? healthBoard : `
    <section class="section-board section-board--${slug}" aria-label="${esc(area.name)} quick widgets" style="--board-ink:${area.palette[0]};--board-accent:${area.palette[2]};--board-wash:${area.palette[3]}">
      <div class="section-board-head">
        <span class="section-board-icon">${ic(area.icon)}</span>
        <div><span class="section-board-kicker">${esc(area.kicker)}</span><h2>${esc(area.name)} at a glance</h2></div>
        <span class="section-board-count">${all.length}<small>saved</small></span>
      </div>
      <div class="section-widget-grid ${area.kinds.length < 3 ? 'section-widget-grid--two' : ''}">
        ${area.kinds.slice(0, 3).map((kind) => `<a class="section-widget" href="#/a/${slug}?kind=${kind.id}" data-nav aria-label="${esc(kind.label)}: ${kindCounts[kind.id] || 0} saved">
          <span class="section-widget-top">${ic(kind.icon)}<b>${kindCounts[kind.id] || 0}</b></span>
          <strong>${esc(kind.label)}</strong><small>${kindCounts[kind.id] ? `${pluralize(kindCounts[kind.id], 'memory')} saved` : `Open ${esc(kind.label.toLowerCase())} pocket`}</small><span class="section-widget-arrow" aria-hidden="true">↗</span>
        </a>`).join('')}
      </div>
      <button class="section-board-add" data-new-record="${slug}">${ic('i-plus')} Add to ${esc(area.name)}</button>
    </section>`;

  return {
    area: slug,
    eyebrow: area.kicker,
    title: area.name,
    html: `
      <section class="area-hero area-hero--${slug} ${botanical ? 'area-hero--botanical' : ''}" data-area-swipe-zone>
        <span class="area-tape" aria-hidden="true"></span>
        ${motif ? `<svg class="area-motif area-motif--${slug}" viewBox="0 0 220 240" aria-hidden="true" focusable="false">${motif}</svg>` : ''}
        <div class="ah-top">
          <span class="ah-ic">${ic(area.icon)}</span>
          <div style="flex:1;min-width:0">
            <h1>${esc(area.name)}</h1>
            <p class="lede">${esc(area.blurb)}</p>
          </div>
          <div class="area-ornament" aria-hidden="true">
            <span class="area-orbit"></span>
            <span class="area-sticker">${ic(stickerIcon)}<small>${esc(stickerLabel)}</small></span>
            <span class="area-spark">✳</span>
          </div>
        </div>
        <div class="ah-actions">
          <button class="btn btn-sm btn-accent" data-new-record="${slug}">${ic('i-plus')} Add to ${esc(area.name.split(' ')[0])}</button>
          ${all.length ? `<a class="chip" href="#/a/${slug}?sort=amount">${ic('i-filter')} Highest amount</a>` : ''}
        </div>
      </section>

      ${areaIndex >= 0 ? `
        <nav class="area-switcher" aria-label="Browse life areas">
          <div class="area-switcher-head">
            <span class="area-switcher-label">Your Life <b>${String(areaIndex + 1).padStart(2, '0')} <i>/</i> ${String(AREAS.length).padStart(2, '0')}</b></span>
            <span class="area-switcher-hint">Swipe on phone · use arrows on laptop</span>
          </div>
          <div class="area-switcher-rail" role="list">
            ${AREAS.map((a, i) => `<a role="listitem" class="area-switcher-chip ${a.slug === slug ? 'active' : ''}" href="#/a/${a.slug}" data-nav aria-current="${a.slug === slug ? 'page' : 'false'}" style="--nav-color:${a.palette[0]};--nav-pop:${a.palette[2]}">
              <span class="asc-icon">${ic(a.icon)}</span><span>${esc(a.name.replace(' & Grooming', '').replace(' & Milestones', ''))}</span>
            </a>`).join('')}
          </div>
          <div class="area-switcher-foot">
            ${previousArea ? `<a class="area-dir-btn" href="#/a/${previousArea.slug}" data-nav aria-label="Previous area: ${esc(previousArea.name)}">${ic('i-chevron-left')}<span>Previous</span></a>` : '<span class="area-dir-spacer"></span>'}
            <span class="area-swipe-note">Phone: swipe · Laptop: ← / →</span>
            ${nextArea ? `<a class="area-dir-btn" href="#/a/${nextArea.slug}" data-nav aria-label="Next area: ${esc(nextArea.name)}"><span>Next</span>${ic('i-chevron-right')}</a>` : '<span class="area-dir-spacer"></span>'}
          </div>
        </nav>` : ''}

      ${isPrivate ? `<div class="notice quiet" style="margin-top:14px">${ic('i-eye-off')}<span>These records stay out of Home, Timeline, Search and Insights. Only you see them.</span></div>` : ''}

      ${sectionBoard}

      ${all.length ? `
        <section class="section" style="margin-top:20px">
          <div class="stat-row">${area.stats.map(statFor).join('')}</div>
        </section>` : ''}

      <section class="section">
        ${all.length ? `
          <div class="filter-strip" role="tablist" aria-label="Filter by kind">
            <button class="chip ${filter === 'all' ? 'on' : ''}" data-area-filter="${slug}" data-kind="all" role="tab" aria-selected="${filter === 'all'}">All · ${all.length}</button>
            ${area.kinds.filter((k) => kindCounts[k.id]).map((k) => `
              <button class="chip ${filter === k.id ? 'on' : ''}" data-area-filter="${slug}" data-kind="${k.id}" role="tab" aria-selected="${filter === k.id}">
                ${ic(k.icon)} ${esc(k.label)} · ${kindCounts[k.id]}
              </button>`).join('')}
          </div>
          <div class="record-list">
            ${list.length ? list.map((r) => recordRow(r, { showArea: false })).join('')
              : `<p class="hint" style="padding:18px 2px">Nothing matches that filter.</p>`}
          </div>
          ${all.length > 3 ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
            <span class="hint">${pluralize(list.length, 'record')} shown</span>
            <div class="seg" role="group" aria-label="Sort">
              <button data-area-sort="${slug}" data-sort="recent" aria-pressed="${sort === 'recent'}">Recent</button>
              <button data-area-sort="${slug}" data-sort="oldest" aria-pressed="${sort === 'oldest'}">Oldest</button>
              <button data-area-sort="${slug}" data-sort="amount" aria-pressed="${sort === 'amount'}">Amount</button>
            </div>
          </div>` : ''}
        ` : `<div class="empty">
            <div class="em-mark">${ic(area.icon)}</div>
            <h3>Nothing here yet</h3>
            <p>${esc(area.empty)}</p>
            <button class="btn btn-accent" data-new-record="${slug}">Add the first one</button>
          </div>`}
      </section>

      ${reminders.length ? `
        <section class="section">
          <div class="section-head"><h2>Watching this area</h2><a class="link-more" href="#/reminders">All ${ic('i-chevron-right')}</a></div>
          <div class="panel panel-pad" style="padding:6px 18px">
            ${reminders.slice(0, 5).map((r) => `
              <button class="row" data-open-reminder="${r.id}" style="width:100%">
                <span class="row-thumb">${ic('i-bell')}</span>
                <span class="row-main"><span class="row-title">${esc(r.title)}</span>
                  <span class="row-meta">${esc(remMeta(r))}</span></span>
                <span class="row-side">${ic('i-chevron-right')}</span>
              </button>`).join('')}
          </div>
        </section>` : ''}

      ${all.length ? `
        <section class="section">
          <div class="section-head"><h2>Latest activity</h2></div>
          <div class="history">
            ${all.slice()
              .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
              .slice(0, 4)
              .map((r) => `<div class="hist-item"><strong>${esc(r.title)}</strong> — ${esc(kindLabel(r))}, ${esc(fmtDate(r.date, 'short'))}${r.amount != null ? ` · ${esc(money(r.amount))}` : ''}</div>`)
              .join('')}
          </div>
        </section>` : ''}
    `,
    mount() {}
  };
}
