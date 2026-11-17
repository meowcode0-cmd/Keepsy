/* Keepsy — Private Space: quieter, PIN-gated, excluded from everything else. */
import { ic, toast } from '../core/ui.js';
import { esc, fmtDate, money, dayDiff, todayISO, pluralize, monthKey } from '../core/format.js';
import { store } from '../core/store.js';
import { PRIVATE_AREA } from '../core/areas.js';
import { kindLabel, recordRow } from '../core/viewkit.js';
import { hashPin } from './settings.js';

const unlocked = () => store.data.settings.unlocked === true;

export function renderPrivate(params = new URLSearchParams()) {
  const s = store.data.settings;
  const hasPin = !!s.pinHash;
  const all = store.live.filter((r) => r.area === 'private');
  const rems = store.reminders.filter((r) => r.private);
  const filter = params?.get('kind') || 'all';

  if (hasPin && !unlocked()) {
    return {
      area: 'private', eyebrow: 'Only you', title: 'Private Space',
      html: `
        <div class="private-lock">
          <div class="pl-mark">${ic('i-eye-off')}</div>
          <h1>Private Space</h1>
          <p>This room stays out of Home, Timeline, Search and Insights. Enter your PIN to open it.</p>
          <div class="pin-dots" id="pin-dots" aria-hidden="true">${[0, 1, 2, 3].map(() => '<span class="pin-dot"></span>').join('')}</div>
          <div class="keypad" id="keypad">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-key="${n}" aria-label="${n}">${n}</button>`).join('')}
            <button data-key="clear" aria-label="Clear">C</button>
            <button data-key="0" aria-label="0">0</button>
            <button data-key="back" aria-label="Delete last digit">⌫</button>
          </div>
          <p class="hint" style="margin-top:18px;max-width:32ch">A PIN keeps this screen closed. It is not encryption — the records are stored in this browser's local storage.</p>
          <p class="hint" id="pin-error" role="alert" style="color:#8d3a33;min-height:18px"></p>
        </div>
      `,
      mount() {
        let entry = '';
        const dots = document.getElementById('pin-dots');
        const err = document.getElementById('pin-error');
        const paint = () => {
          [...dots.children].forEach((d, i) => d.classList.toggle('on', i < entry.length));
        };
        document.getElementById('keypad').addEventListener('click', async (e) => {
          const b = e.target.closest('[data-key]');
          if (!b) return;
          const k = b.dataset.key;
          if (k === 'clear') entry = '';
          else if (k === 'back') entry = entry.slice(0, -1);
          else if (entry.length < 4) entry += k;
          paint();
          if (entry.length === 4) {
            const hash = await hashPin(entry, store.data.settings.pinSalt);
            if (hash === store.data.settings.pinHash) {
              store.data.settings.unlocked = true;
              store.save();
              toast('Unlocked for this session.', 'i-shield');
              window.dispatchEvent(new CustomEvent('keepsy:route', { detail: { raw: location.hash } }));
            } else {
              err.textContent = 'That PIN does not match.';
              entry = '';
              paint();
            }
          }
        });
        const keypad = document.getElementById('keypad');
        document.addEventListener('keydown', function onKey(e) {
          if (document.getElementById('keypad') !== keypad) { document.removeEventListener('keydown', onKey); return; }
          if (/^\d$/.test(e.key)) {
            const btn = document.querySelector(`[data-key="${e.key}"]`);
            if (btn) btn.click();
          }
          if (e.key === 'Backspace') document.querySelector('[data-key="back"]')?.click();
        });
      }
    };
  }

  const monthRecs = all.filter((r) => monthKey(r.date) === monthKey(todayISO()));
  const kindCounts = Object.fromEntries(PRIVATE_AREA.kinds.map((kind) => [kind.id, all.filter((r) => r.kind === kind.id).length]));
  const openPrivateReminders = rems.filter((r) => r.status === 'open');
  const visiblePrivateReminders = (filter === 'all' || filter === 'reminder') ? openPrivateReminders : [];
  const filteredRecords = filter === 'all' ? all : all.filter((r) => r.kind === filter);
  const privateBoard = `
    <section class="private-board" aria-label="Private Space quick widgets">
      <div class="private-board-head"><span class="private-board-mark">${ic('i-eye-off')}</span><div><span class="private-board-kicker">ONLY YOURS · KEPT CLOSE</span><h2>Your private pockets</h2></div><span class="private-board-total">${all.length}<small>kept</small></span></div>
      <div class="private-widget-grid">
        ${PRIVATE_AREA.kinds.map((kind) => {
          const count = kind.id === 'reminder' ? kindCounts.reminder + openPrivateReminders.length : kindCounts[kind.id];
          const caption = kind.id === 'reminder'
            ? (count ? pluralize(count, 'private reminder') : 'Keep reminders in this space')
            : (count ? `${pluralize(count, 'memory')} kept private` : 'Open this private pocket');
          return `<a class="private-widget private-widget--${kind.id}" href="#/private?kind=${kind.id}" data-nav aria-label="${esc(kind.label)}: ${count} saved">
            <span class="private-widget-top">${ic(kind.icon)}<b>${count}</b></span><strong>${esc(kind.label)}</strong><small>${esc(caption)}</small><span class="private-widget-arrow" aria-hidden="true">↗</span>
          </a>`;
        }).join('')}
      </div>
      <button class="private-board-add" data-new-private>${ic('i-plus')} Add something private</button>
    </section>`;

  return {
    area: 'private',
    eyebrow: 'Only you',
    title: 'Private Space',
    html: `
      <section class="area-hero">
        <div class="ah-top">
          <span class="ah-ic">${ic('i-eye-off')}</span>
          <div style="flex:1;min-width:0">
            <h1>Private Space</h1>
            <p class="lede">${esc(PRIVATE_AREA.blurb)}</p>
          </div>
        </div>
        <div class="ah-actions">
          <button class="btn btn-sm btn-accent" data-new-private>${ic('i-plus')} Add a private note</button>
          ${hasPin ? `<button class="btn btn-sm btn-ghost" data-lock>${ic('i-shield')} Lock</button>` : ''}
        </div>
      </section>

      ${privateBoard}

      <div class="notice quiet" style="margin-top:16px">${ic('i-eye-off')}<span>Nothing here appears on Home, Timeline, Search, Insights, Your Month or notifications. Reminders marked private show as “Private reminder”.</span></div>

      ${all.length ? `<section class="section" style="margin-top:18px">
        <div class="stat-row">
          <div class="stat"><div class="s-label">Kept here</div><div class="s-value num">${all.length}</div></div>
          <div class="stat"><div class="s-label">This month</div><div class="s-value num">${monthRecs.length}</div></div>
          <div class="stat"><div class="s-label">Private reminders</div><div class="s-value num">${rems.filter((r) => r.status === 'open').length}</div></div>
        </div>
      </section>` : ''}

      <section class="section">
        ${filteredRecords.length || visiblePrivateReminders.length ? `<div class="record-list">${filteredRecords.map((r) => recordRow(r, { showArea: false })).join('')}</div>
          ${visiblePrivateReminders.length ? `<div class="private-reminders"><div class="private-reminders-title">${ic('i-bell')} Private reminders</div>${visiblePrivateReminders.map((r) => `<button class="row" data-open-reminder="${r.id}" style="width:100%"><span class="row-thumb">${ic('i-bell')}</span><span class="row-main"><span class="row-title">Private reminder</span><span class="row-meta">${esc(fmtDate(r.due, 'short'))}</span></span><span class="row-side">${ic('i-chevron-right')}</span></button>`).join('')}</div>` : ''}`
        : `<div class="empty"><div class="em-mark">${ic('i-moon')}</div>
            <h3>${filter === 'all' ? 'This space is empty' : `No ${esc(PRIVATE_AREA.kinds.find((kind) => kind.id === filter)?.label.toLowerCase() || 'memories')} yet`}</h3>
            <p>Notes, routines, tracking or a medicine schedule. Nothing here is shared with the rest of Keepsy.</p>
            <button class="btn btn-accent" data-new-private>Write the first note</button></div>`}
      </section>

      <p class="hint" style="margin-top:26px;text-align:center">Keepsy does not diagnose, recommend medicines or make predictions. Estimates are labelled as estimates.</p>
    `,
    mount() {
      document.querySelector('[data-lock]')?.addEventListener('click', () => {
        store.data.settings.unlocked = false;
        store.save();
        toast('Private Space locked.', 'i-shield');
        window.dispatchEvent(new CustomEvent('keepsy:route', { detail: { raw: location.hash } }));
      });
    }
  };
}
