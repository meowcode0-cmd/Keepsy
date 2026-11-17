/* Keepsy — shared sheets: reminders, connections, documents, record form.
   Every control has a visible twin; sheets trap focus and close on Escape. */
import { openSheet, ic, toast, confirmSheet } from './core/ui.js';
import { esc, todayISO, fmtDate, money, dayDiff } from './core/format.js';
import { store } from './core/store.js';
import { AREAS, getArea, AREA_INDEX } from './core/areas.js';

const REPEATS = [
  ['none', 'Does not repeat'],
  ['daily', 'Every day'],
  ['weekly', 'Every week'],
  ['monthly', 'Every month'],
  ['yearly', 'Every year']
];

const TYPES = [
  ['personal', 'Personal'],
  ['expiry', 'Expiry'],
  ['maintenance', 'Maintenance'],
  ['replacement', 'Replacement'],
  ['study', 'Study'],
  ['document', 'Document renewal'],
  ['subscription', 'Subscription'],
  ['appointment', 'Appointment'],
  ['event', 'Event']
];

export function openReminderSheet({ reminder = null, record = null, onSaved } = {}) {
  const isEdit = !!reminder;
  const isPrivate = record?.area === 'private';
  const state = {
    title: reminder?.title || (record ? (record.expiry ? `${record.title} expires` : `Check ${record.title}`) : ''),
    due: reminder?.due || record?.expiry || todayISO(),
    time: reminder?.time || '',
    repeat: reminder?.repeat || 'none',
    type: reminder?.type || (record?.expiry ? 'expiry' : 'personal'),
    private: reminder?.private ?? isPrivate,
    recordId: reminder?.recordId || record?.id || null
  };

  openSheet({
    title: isEdit ? 'Edit reminder' : 'New reminder',
    subtitle: isEdit ? 'Adjust the date or the wording.' : 'Keepsy will keep an eye on this for you.',
    body: `
      <div class="field" style="margin-bottom:10px">
        <label for="rm-title">What is it about</label>
        <input id="rm-title" class="input" value="${esc(state.title)}" placeholder="e.g. Bike insurance renewal" />
      </div>
      <div class="field-row" style="margin-bottom:10px">
        <div class="field"><label for="rm-due">Date</label><input id="rm-due" type="date" class="input" value="${esc(state.due)}" /></div>
        <div class="field"><label for="rm-time">Time (optional)</label><input id="rm-time" type="time" class="input" value="${esc(state.time)}" /></div>
      </div>
      <div class="field-row" style="margin-bottom:10px">
        <div class="field"><label for="rm-repeat">Repeat</label><select id="rm-repeat" class="select">${REPEATS.map(([v, l]) => `<option value="${v}" ${v === state.repeat ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="rm-type">Kind</label><select id="rm-type" class="select">${TYPES.map(([v, l]) => `<option value="${v}" ${v === state.type ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      </div>
      <div class="field" style="margin-bottom:6px">
        <label for="rm-record">Attach to a record (optional)</label>
        <select id="rm-record" class="select">
          <option value="">Nothing — a standalone reminder</option>
          ${store.live.filter((r) => r.area !== 'private' || isPrivate).map((r) => `<option value="${r.id}" ${r.id === state.recordId ? 'selected' : ''}>${esc(r.title)}</option>`).join('')}
        </select>
      </div>
      <label class="switch" style="margin-top:6px">
        <input type="checkbox" id="rm-private" ${state.private ? 'checked' : ''} />
        <span class="track" aria-hidden="true"></span>
        <span class="sw-label">Keep this discreet (shows as “Private reminder” in notifications)</span>
      </label>
      ${isEdit ? '<button class="btn btn-danger btn-block" id="rm-delete" style="margin-top:16px">Delete reminder</button>' : ''}
    `,
    foot: `<button class="btn btn-ghost" data-sheet-close>Cancel</button>
           <button class="btn btn-accent" id="rm-save">${isEdit ? 'Save changes' : 'Add reminder'}</button>`,
    onMount: (sheet, close) => {
      const val = (id) => sheet.querySelector(id).value;
      const save = () => {
        const title = val('#rm-title').trim();
        if (!title) { toast('Give the reminder a name first.', 'i-info'); sheet.querySelector('#rm-title').focus(); return; }
        const due = val('#rm-due') || todayISO();
        const payload = {
          title, due,
          time: val('#rm-time'),
          repeat: val('#rm-repeat'),
          type: val('#rm-type'),
          private: sheet.querySelector('#rm-private').checked,
          recordId: val('#rm-record') || null
        };
        let rem;
        if (isEdit) {
          rem = store.updateReminder(reminder.id, payload, `Reminder updated — ${title}`);
        } else {
          rem = store.addReminder({ ...payload, status: 'open' });
          if (payload.recordId) {
            const rec = store.record(payload.recordId);
            if (rec) rec.history.unshift({ at: new Date().toISOString(), text: `Reminder set — ${title}` });
          }
        }
        store.syncNotifications();
        store.save();
        close();
        toast(isEdit ? 'Reminder updated.' : 'Reminder set.', 'i-bell');
        if (onSaved) onSaved(rem);
      };
      sheet.querySelector('#rm-save').addEventListener('click', save);
      sheet.querySelector('#rm-delete')?.addEventListener('click', () => {
        close();
        confirmSheet({
          title: 'Delete this reminder?',
          message: 'It will be removed from Keepsy completely.',
          confirmText: 'Delete',
          onConfirm: () => { store.deleteReminder(reminder.id); toast('Reminder deleted.', 'i-trash'); if (onSaved) onSaved(null); }
        });
      });
      setTimeout(() => sheet.querySelector('#rm-title').focus({ preventScroll: true }), 380);
    }
  });
}

export function openSnoozeSheet(reminder, onDone) {
  openSheet({
    title: 'Snooze reminder',
    subtitle: 'Keepsy will stay quiet until then.',
    body: `<div class="chip-row">
      ${[['Later today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7], ['In a month', 30]]
        .map(([label, days]) => `<button class="chip" data-snooze-days="${days}">${label}</button>`).join('')}
    </div>`,
    onMount: (sheet, close) => {
      sheet.querySelectorAll('[data-snooze-days]').forEach((b) => b.addEventListener('click', () => {
        const days = Number(b.dataset.snoozeDays);
        const d = new Date();
        if (days === 0) {
          store.updateReminder(reminder.id, { snoozeUntil: todayISO(), status: 'open' }, 'Snoozed to later today');
        } else {
          d.setDate(d.getDate() + days);
          store.updateReminder(reminder.id, { snoozeUntil: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, status: 'open' }, `Snoozed by ${days} day${days === 1 ? '' : 's'}`);
        }
        close();
        toast('Snoozed. Keepsy will bring it back.', 'i-snooze');
        if (onDone) onDone();
      }));
    }
  });
}

export function openConnectSheet(recordId, onDone) {
  const rec = store.record(recordId);
  if (!rec) return;
  const candidates = store.live.filter((r) => r.id !== recordId && (rec.area === 'private' ? r.area === 'private' : r.area !== 'private'));
  openSheet({
    title: 'Connect a record',
    subtitle: 'Keepsy will link both records so you can move between them.',
    body: candidates.length ? `
      <div class="search-bar" style="margin-top:4px">
        ${ic('i-search')}
        <input class="search-input" id="cn-search" placeholder="Search your records" aria-label="Search records to connect" />
      </div>
      <div id="cn-list" style="margin-top:6px">
        ${candidates.slice(0, 40).map((r) => `
          <button class="record-item" data-connect="${r.id}" style="width:100%">
            <span class="row-thumb">${ic(getArea(r.area)?.icon || 'i-grid')}</span>
            <span class="rec-main"><span class="rec-title">${esc(r.title)}</span>
              <span class="rec-meta">${esc(getArea(r.area)?.name || 'Other')} · ${esc(fmtDate(r.date, 'short'))}</span></span>
            <span class="rec-right">${ic('i-link')}</span>
          </button>`).join('')}
      </div>` : `<div class="empty"><div class="em-mark">${ic('i-link')}</div><h3>Nothing to connect yet</h3><p>Add another record first and Keepsy will let you link them.</p></div>`,
    onMount: (sheet, close) => {
      const search = sheet.querySelector('#cn-search');
      if (search) {
        search.addEventListener('input', () => {
          const q = search.value.trim().toLowerCase();
          const list = sheet.querySelector('#cn-list');
          const filtered = candidates.filter((r) => r.title.toLowerCase().includes(q) || (r.note || '').toLowerCase().includes(q));
          list.innerHTML = filtered.length ? filtered.slice(0, 40).map((r) => `
            <button class="record-item" data-connect="${r.id}" style="width:100%">
              <span class="row-thumb">${ic(getArea(r.area)?.icon || 'i-grid')}</span>
              <span class="rec-main"><span class="rec-title">${esc(r.title)}</span>
                <span class="rec-meta">${esc(getArea(r.area)?.name || 'Other')} · ${esc(fmtDate(r.date, 'short'))}</span></span>
              <span class="rec-right">${ic('i-link')}</span>
            </button>`).join('') : '<p class="hint" style="padding:12px 4px">No match.</p>';
        });
        setTimeout(() => search.focus({ preventScroll: true }), 380);
      }
      sheet.addEventListener('click', (e) => {
        const b = e.target.closest('[data-connect]');
        if (!b) return;
        const ok = store.linkRecords(recordId, b.dataset.connect);
        close();
        if (ok) toast('Connected.', 'i-link');
        if (onDone) onDone();
      });
    }
  });
}

export function openDocumentSheet(record, onDone) {
  openSheet({
    title: 'Attach a document note',
    subtitle: 'Keepsy does not upload files. It remembers where a document lives and when it matters.',
    body: `
      <div class="notice quiet" style="margin-bottom:12px">${ic('i-info')}<span>Files stay in your own storage. This note is the reminder of what it is and where it is.</span></div>
      <div class="field"><label for="dc-name">Name or location</label>
        <input id="dc-name" class="input" value="${esc(record.documentName || '')}" placeholder="e.g. Warranty card, top drawer" /></div>
    `,
    foot: `<button class="btn btn-ghost" data-sheet-close>Cancel</button><button class="btn btn-accent" id="dc-save">Save</button>`,
    onMount: (sheet, close) => {
      sheet.querySelector('#dc-save').addEventListener('click', () => {
        const name = sheet.querySelector('#dc-name').value.trim();
        store.updateRecord(record.id, { documentName: name }, name ? `Document noted — ${name}` : null);
        close();
        toast('Document note saved.', 'i-doc');
        if (onDone) onDone();
      });
    }
  });
}

/* Create or edit a record with a full, progressively-disclosed form. */
export function openRecordForm({ area = 'other', kind = null, record = null, onSaved } = {}) {
  const isEdit = !!record;
  const state = {
    area: record?.area || area,
    kind: record?.kind || kind || getArea(area)?.kinds?.[0]?.id || 'item',
    title: record?.title || '',
    note: record?.note || '',
    date: record?.date || todayISO(),
    time: record?.time || '',
    amount: record?.amount ?? '',
    quantity: record?.quantity ?? '',
    unit: record?.unit || '',
    mileage: record?.mileage ?? '',
    expiry: record?.expiry || '',
    warrantyUntil: record?.warrantyUntil || '',
    documentName: record?.documentName || '',
    tags: (record?.tags || []).join(', '),
    pinned: record?.pinned || false
  };

  const areaOptions = AREA_INDEX.filter((a) => a.slug !== 'private' || record?.area === 'private');

  openSheet({
    title: isEdit ? 'Edit record' : 'New record',
    subtitle: isEdit ? 'Nothing is written in stone.' : 'A few details now saves remembering later.',
    body: `
      <div class="field" style="margin-bottom:10px"><label for="rf-title">Title</label>
        <input id="rf-title" class="input" value="${esc(state.title)}" placeholder="What is this?" /></div>
      <div class="field-row" style="margin-bottom:10px">
        <div class="field"><label for="rf-area">Life area</label>
          <select id="rf-area" class="select">${areaOptions.map((a) => `<option value="${a.slug}" ${a.slug === state.area ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="rf-kind">Kind</label><select id="rf-kind" class="select"></select></div>
      </div>
      <div class="field-row" style="margin-bottom:10px">
        <div class="field"><label for="rf-date">Date</label><input id="rf-date" type="date" class="input" value="${esc(state.date)}" /></div>
        <div class="field"><label for="rf-time">Time</label><input id="rf-time" type="time" class="input" value="${esc(state.time)}" /></div>
      </div>
      <div id="rf-extra"></div>
      <div class="field" style="margin:10px 0"><label for="rf-note">Notes</label>
        <textarea id="rf-note" class="textarea" rows="3" placeholder="Anything you want to remember">${esc(state.note)}</textarea></div>
      <div class="field" style="margin-bottom:8px"><label for="rf-tags">Tags</label>
        <input id="rf-tags" class="input" value="${esc(state.tags)}" placeholder="comma, separated" /></div>
    `,
    foot: `<button class="btn btn-ghost" data-sheet-close>Cancel</button>
           <button class="btn btn-accent" id="rf-save">${isEdit ? 'Save changes' : 'Add to Keepsy'}</button>`,
    onMount: (sheet, close) => {
      const kindSel = sheet.querySelector('#rf-kind');
      const extra = sheet.querySelector('#rf-extra');
      const areaSel = sheet.querySelector('#rf-area');

      const drawExtra = () => {
        const a = getArea(state.area) || getArea('other');
        kindSel.innerHTML = a.kinds.map((k) => `<option value="${k.id}" ${k.id === state.kind ? 'selected' : ''}>${esc(k.label)}</option>`).join('');
        const kindObj = a.kinds.find((k) => k.id === state.kind) || a.kinds[0];
        const f = kindObj.fields;
        const blocks = [];
        if (f.includes('amount') || f.includes('amountOnly')) blocks.push(`<div class="field"><label for="rf-amount">Amount</label><input id="rf-amount" class="input num" inputmode="decimal" value="${state.amount}" placeholder="0" /></div>`);
        if (f.includes('quantity')) blocks.push(`<div class="field"><label for="rf-qty">Quantity</label><div style="display:flex;gap:6px"><input id="rf-qty" class="input num" inputmode="decimal" value="${state.quantity}" placeholder="0" style="flex:1"/><input id="rf-unit" class="input" value="${esc(state.unit)}" placeholder="unit" style="width:74px"/></div></div>`);
        if (f.includes('mileage')) blocks.push(`<div class="field"><label for="rf-mileage">Mileage (km)</label><input id="rf-mileage" class="input num" inputmode="numeric" value="${state.mileage}" placeholder="optional" /></div>`);
        if (f.includes('expiry')) blocks.push(`<div class="field"><label for="rf-expiry">Expires</label><input id="rf-expiry" type="date" class="input" value="${esc(state.expiry)}" /></div>`);
        if (f.includes('warranty')) blocks.push(`<div class="field"><label for="rf-warranty">Warranty until</label><input id="rf-warranty" type="date" class="input" value="${esc(state.warrantyUntil)}" /></div>`);
        if (f.includes('document')) blocks.push(`<div class="field full"><label for="rf-doc">Document note</label><input id="rf-doc" class="input" value="${esc(state.documentName)}" placeholder="where it lives" /></div>`);
        extra.innerHTML = blocks.length ? `<div class="field-row" style="margin-bottom:10px">${blocks.join('')}</div>` : '';
        const bind = (id, key, num = false) => {
          const el = sheet.querySelector(id);
          if (!el) return;
          el.addEventListener('input', () => { state[key] = num ? (el.value === '' ? '' : Number(el.value)) : el.value; });
        };
        bind('#rf-amount', 'amount', true);
        bind('#rf-qty', 'quantity', true);
        bind('#rf-unit', 'unit');
        bind('#rf-mileage', 'mileage', true);
        bind('#rf-expiry', 'expiry');
        bind('#rf-warranty', 'warrantyUntil');
        bind('#rf-doc', 'documentName');
      };

      drawExtra();
      kindSel.addEventListener('change', () => { state.kind = kindSel.value; drawExtra(); });
      areaSel.addEventListener('change', () => {
        state.area = areaSel.value;
        state.kind = getArea(state.area).kinds[0].id;
        drawExtra();
      });
      sheet.querySelector('#rf-title').addEventListener('input', (e) => { state.title = e.target.value; });
      sheet.querySelector('#rf-note').addEventListener('input', (e) => { state.note = e.target.value; });
      sheet.querySelector('#rf-tags').addEventListener('input', (e) => { state.tags = e.target.value; });
      sheet.querySelector('#rf-date').addEventListener('change', (e) => { state.date = e.target.value; });
      sheet.querySelector('#rf-time').addEventListener('change', (e) => { state.time = e.target.value; });

      sheet.querySelector('#rf-save').addEventListener('click', () => {
        const title = sheet.querySelector('#rf-title').value.trim();
        if (!title) { toast('A record needs a title.', 'i-info'); sheet.querySelector('#rf-title').focus(); return; }
        const payload = {
          area: state.area,
          kind: state.kind,
          title,
          note: sheet.querySelector('#rf-note').value,
          date: state.date || todayISO(),
          time: state.time || '',
          amount: state.amount === '' ? null : Number(state.amount),
          quantity: state.quantity === '' ? null : Number(state.quantity),
          unit: state.unit || '',
          mileage: state.mileage === '' ? null : Number(state.mileage),
          expiry: state.expiry || null,
          warrantyUntil: state.warrantyUntil || null,
          documentName: state.documentName || '',
          tags: sheet.querySelector('#rf-tags').value.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8)
        };
        let saved;
        if (isEdit) saved = store.updateRecord(record.id, payload, 'Details updated');
        else saved = store.addRecord(payload);
        close();
        toast(isEdit ? 'Saved.' : 'Keepsy remembered it.', 'i-check');
        if (onSaved) onSaved(saved);
      });
      setTimeout(() => sheet.querySelector('#rf-title').focus({ preventScroll: true }), 380);
    }
  });
}
