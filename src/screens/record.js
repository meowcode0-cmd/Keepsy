/* Keepsy — record detail, opened as a layer above the current screen. */
import { openLayer, openSheet, ic, toast, confirmSheet } from '../core/ui.js';
import { esc, fmtDate, money, dayDiff, timeAgo, fmtTime, pluralize } from '../core/format.js';
import { store } from '../core/store.js';
import { getArea } from '../core/areas.js';
import { kindLabel, areaName, historyList } from '../core/viewkit.js';
import { openReminderSheet, openConnectSheet, openDocumentSheet, openRecordForm } from '../sheets.js';

export function openRecord(id) {
  const initial = store.record(id);
  if (!initial) {
    toast('That record is no longer here.', 'i-info');
    history.back();
    return;
  }
  const layer = openLayer({
    label: 'Record',
    render: () => body(id),
    onMount: ({ inner, close, headActions }) => {
      const paint = () => {
        const rec = store.record(id);
        if (!rec) { close({ silent: true }); return; }
        inner.innerHTML = body(id);
        headActions.innerHTML = head(rec);
        wire();
      };
      const wire = () => {
        const rec = store.record(id);
        inner.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => act(b.dataset.act, rec, { paint, close })));
        headActions.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => act(b.dataset.act, rec, { paint, close })));
        inner.querySelectorAll('[data-open-record]').forEach((b) => b.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.hash = `#/r/${b.dataset.openRecord}`;
        }));
        inner.querySelectorAll('[data-open-reminder]').forEach((b) => b.addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('keepsy:open-reminder', { detail: b.dataset.openReminder }));
        }));
        inner.querySelectorAll('[data-unlink]').forEach((b) => b.addEventListener('click', () => {
          store.unlinkRecords(id, b.dataset.unlink);
          paint();
          toast('Connection removed.', 'i-link');
        }));
      };
      paint();
    }
  });
  return layer;
}

function head(rec) {
  return `
    <button class="icon-btn" data-act="pin" aria-label="${rec.pinned ? 'Unpin' : 'Pin'} ${esc(rec.title)}" title="${rec.pinned ? 'Unpin' : 'Pin'}">${ic('i-pin')}</button>
    <button class="icon-btn" data-act="more" aria-label="More actions">${ic('i-list')}</button>
  `;
}

function body(id) {
  const rec = store.record(id);
  if (!rec) return '';
  const area = getArea(rec.area) || getArea('other');
  const links = (rec.links || []).map((l) => store.record(l.id)).filter(Boolean);
  const rems = store.data.reminders.filter((r) => r.recordId === rec.id && !r.archivedAt);
  const linkedRem = rems.filter((r) => r.status === 'open');

  const figures = [];
  if (rec.amount != null) figures.push(['Amount', money(rec.amount)]);
  if (rec.quantity != null) figures.push(['Quantity', `${rec.quantity}${rec.unit ? ` ${rec.unit}` : ''}`]);
  if (rec.mileage) figures.push(['Mileage', `${rec.mileage.toLocaleString('en-IN')} km`]);
  if (rec.expiry) figures.push(['Expires', fmtDate(rec.expiry, 'short')]);
  if (rec.warrantyUntil) figures.push(['Warranty', fmtDate(rec.warrantyUntil, 'short')]);

  const expiryNote = rec.expiry
    ? (() => {
        const d = dayDiff(rec.expiry);
        if (d < 0) return `<div class="notice danger" style="margin-top:14px">${ic('i-info')}<span>This expired ${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'} ago.</span></div>`;
        if (d === 0) return `<div class="notice" style="margin-top:14px">${ic('i-clock')}<span>Expires today.</span></div>`;
        if (d <= 30) return `<div class="notice" style="margin-top:14px">${ic('i-clock')}<span>Expires in ${d} days.</span></div>`;
        return '';
      })()
    : '';

  return `
    <section class="rec-showcase" style="--rec-accent:${area.palette?.[0] || '#192A3B'}">
    <div class="rec-kicker">
      <span class="rk-area">${esc(area.name)}</span>
      <span class="tag">${esc(kindLabel(rec))}</span>
      ${rec.pinned ? `<span class="tag accent">Pinned</span>` : ''}
      ${rec.archivedAt ? `<span class="tag quiet">Archived</span>` : ''}
    </div>
    <h1 class="rec-h1">${esc(rec.title)}</h1>
    <div class="rec-sub">
      <span>${esc(fmtDate(rec.date, 'long'))}</span>
      ${rec.time ? `<span>·</span><span>${esc(fmtTime(rec.time))}</span>` : ''}
      <span>·</span><span>added ${esc(timeAgo(rec.createdAt))}</span>
    </div>
    ${rec.note ? `<p class="rec-note">${esc(rec.note)}</p>` : ''}
    ${expiryNote}
    ${figures.length ? `<div class="rec-figures">${figures.slice(0, 3).map(([l, v]) => `<div class="rec-fig"><div class="rf-l">${esc(l)}</div><div class="rf-v num">${esc(v)}</div></div>`).join('')}</div>` : ''}
    ${figures.length > 3 ? `<dl class="dl" style="margin-top:14px">${figures.slice(3).map(([l, v]) => `<dt>${esc(l)}</dt><dd class="num">${esc(v)}</dd>`).join('')}</dl>` : ''}
    ${rec.tags?.length ? `<div class="chip-row" style="margin-top:14px">${rec.tags.map((t) => `<span class="tag quiet">${esc(t)}</span>`).join('')}</div>` : ''}
    </section>

    <div class="rec-block">
      <div class="rb-head"><span class="eyebrow">Actions</span></div>
      <div class="quick-actions">
        <button class="qa" data-act="remind">${ic('i-bell')}<span>Remind me</span></button>
        <button class="qa" data-act="connect">${ic('i-link')}<span>Connect</span></button>
        <button class="qa" data-act="document">${ic('i-doc')}<span>Document</span></button>
        <button class="qa" data-act="edit">${ic('i-edit')}<span>Edit</span></button>
      </div>
    </div>

    ${linkedRem.length || rems.length ? `
    <div class="rec-block">
      <div class="rb-head"><span class="eyebrow">Reminders</span>
        <button class="btn-quiet" data-act="remind">Add</button></div>
      <div class="panel panel-pad" style="padding:4px 16px">
        ${rems.map((r) => `
          <button class="row" data-open-reminder="${r.id}" style="width:100%">
            <span class="row-thumb">${ic('i-bell')}</span>
            <span class="row-main">
              <span class="row-title" style="${r.status === 'done' ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(r.title)}</span>
              <span class="row-meta">${esc(fmtDate(r.snoozeUntil || r.due, 'relative'))}${r.repeat !== 'none' ? ` · repeats ${esc(r.repeat)}` : ''}${r.status === 'done' ? ' · done' : ''}</span>
            </span>
            <span class="row-side">${ic('i-chevron-right')}</span>
          </button>`).join('')}
      </div>
    </div>` : ''}

    ${rec.documentName ? `
    <div class="rec-block">
      <div class="rb-head"><span class="eyebrow">Document</span><button class="btn-quiet" data-act="document">Change</button></div>
      <div class="document-row">
        <span class="row-thumb">${ic('i-doc')}</span>
        <span class="dr-main"><strong>${esc(rec.documentName)}</strong><span>Keepsy remembers where it is — the file stays in your own storage</span></span>
      </div>
    </div>` : ''}

    <div class="rec-block">
      <div class="rb-head"><span class="eyebrow">Connected (${links.length})</span><button class="btn-quiet" data-act="connect">Connect</button></div>
      ${links.length ? `<div class="linked">${links.map((l) => `
        <div class="linked-item" style="padding-right:6px">
          <button class="linked-item" data-open-record="${l.id}" style="border:0;background:none;padding:0;flex:1">
            <span class="li-ic">${ic(getArea(l.area)?.icon || 'i-grid')}</span>
            <span class="li-main"><span class="li-t">${esc(l.title)}</span><span class="li-m">${esc(areaName(l.area))} · ${esc(kindLabel(l))}</span></span>
            ${ic('i-chevron-right', 'ic-sm')}
          </button>
          <button class="icon-btn" data-unlink="${l.id}" aria-label="Disconnect ${esc(l.title)}" style="width:34px;height:34px">${ic('i-close')}</button>
        </div>`).join('')}</div>`
        : `<p class="hint">Nothing connected yet. Link a receipt, a service record, a course — anything that belongs with this.</p>`}
    </div>

    <div class="rec-block">
      <div class="rb-head"><span class="eyebrow">History</span></div>
      ${historyList(rec)}
    </div>

    <div class="rec-block" style="padding-bottom:32px">
      <div class="chip-row">
        <button class="btn btn-ghost btn-sm" data-act="archive">${ic('i-archive')} ${rec.archivedAt ? 'Unarchive' : 'Archive'}</button>
        <button class="btn btn-danger btn-sm" data-act="delete">${ic('i-trash')} Move to recently deleted</button>
      </div>
    </div>
  `;
}

function act(action, rec, { paint, close }) {
  switch (action) {
    case 'pin':
      store.togglePin(rec.id);
      paint();
      toast(store.record(rec.id).pinned ? 'Pinned to Home.' : 'Unpinned.', 'i-pin');
      break;
    case 'edit':
      openRecordForm({ record: rec, onSaved: () => paint() });
      break;
    case 'remind':
      openReminderSheet({ record: rec, onSaved: () => paint() });
      break;
    case 'connect':
      openConnectSheet(rec.id, () => paint());
      break;
    case 'document':
      openDocumentSheet(rec, () => paint());
      break;
    case 'archive':
      if (rec.archivedAt) { store.unarchiveRecord(rec.id); toast('Back from the archive.', 'i-restore'); }
      else { store.archiveRecord(rec.id); toast('Archived. Find it under Archive.', 'i-archive'); }
      paint();
      break;
    case 'delete':
      confirmSheet({
        title: 'Move to recently deleted?',
        message: 'It stays here until you delete it permanently. You can restore it any time.',
        confirmText: 'Move',
        onConfirm: () => {
          store.trashRecord(rec.id);
          toast('Moved to recently deleted.', 'i-trash');
          close({ silent: true });
          history.back();
        }
      });
      break;
    case 'more':
      openMoreSheet(rec, paint);
      break;
    default: break;
  }
}

function openMoreSheet(rec, paint) {
  openSheet({
      title: 'More',
      subtitle: rec.title,
      body: `<div class="chip-row" style="flex-direction:column;align-items:stretch">
        <button class="row" data-m="pin" style="width:100%;border:0">${'<span class="row-thumb">'}${ic('i-pin')}</span><span class="row-main"><span class="row-title">${rec.pinned ? 'Unpin' : 'Pin to Home'}</span></span></button>
        <button class="row" data-m="edit" style="width:100%;border:0"><span class="row-thumb">${ic('i-edit')}</span><span class="row-main"><span class="row-title">Edit details</span></span></button>
        <button class="row" data-m="archive" style="width:100%;border:0"><span class="row-thumb">${ic('i-archive')}</span><span class="row-main"><span class="row-title">${rec.archivedAt ? 'Unarchive' : 'Archive'}</span></span></button>
        <button class="row" data-m="delete" style="width:100%;border:0"><span class="row-thumb">${ic('i-trash')}</span><span class="row-main"><span class="row-title">Move to recently deleted</span></span></button>
      </div>`,
      onMount: (sheet, close) => {
        sheet.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
          const m = b.dataset.m;
          close();
          if (m === 'delete') act('delete', rec, { paint, close: () => {} });
          else act(m, store.record(rec.id), { paint, close: () => {} });
        }));
      }
  });
}
