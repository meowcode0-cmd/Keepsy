/* Keepsy — Settings, profiles, data export/import, archive, recently deleted. */
import { ic, toast, openSheet, confirmSheet } from '../core/ui.js';
import { esc, fmtDate, timeAgo, pluralize, todayISO } from '../core/format.js';
import { store } from '../core/store.js';
import { getArea } from '../core/areas.js';

export function renderSettings() {
  const s = store.data.settings;
  const p = store.profile;
  const openReminders = store.reminders.filter((r) => r.status === 'open').length;
  return {
    area: 'home-dash',
    eyebrow: 'Keepsy',
    title: 'Settings',
    html: `
      <section class="screen-head">
        <div class="eyebrow">Quietly yours</div>
        <h1>Settings</h1>
        <p class="lede">Keepsy keeps everything in this browser. Nothing leaves unless you export it.</p>
      </section>

      <section class="settings-overview" aria-label="Keepsy profile overview">
        <div class="settings-overview-top"><span class="settings-avatar">${esc((p?.name || 'M')[0].toUpperCase())}</span><div><span class="settings-kicker">YOUR KEEPSY</span><strong>${esc(p?.name || 'Me')}, this space is yours</strong><small>Your information stays in this browser unless you export it.</small></div><span class="settings-spark" aria-hidden="true">✦</span></div>
        <div class="settings-metrics"><span><b>${store.live.length}</b><small>memories</small></span><span><b>${openReminders}</b><small>open reminders</small></span><span><b>${store.archived.length}</b><small>archived</small></span></div>
        <nav class="settings-shortcuts" aria-label="Settings shortcuts"><a href="#/private" data-nav>${ic('i-eye-off')} Private Space <b>↗</b></a><a href="#/inbox" data-nav>${ic('i-bell')} Inbox <b>↗</b></a><a href="#/archive" data-nav>${ic('i-archive')} Archive <b>↗</b></a></nav>
      </section>

      <section class="settings-install" aria-label="Install Keepsy on this device">
        <span class="settings-install-icon">${ic('i-download')}</span>
        <div class="settings-install-copy"><strong>Keep Keepsy close</strong><small>Add its icon to your phone or computer. It opens like an app and works offline after the first visit.</small></div>
        <button class="btn btn-accent btn-sm" data-install-keepsy>Install Keepsy</button>
      </section>

      <section class="set-group settings-group settings-group--profile">
        <h3><span class="settings-group-icon">${ic('i-users')}</span>Profile</h3>
        <p class="hint">Each profile keeps its own records, reminders and settings.</p>
        <div style="margin-top:10px">
          ${store.profiles.map((pr) => `
            <div class="profile-card ${pr.id === store.activeId ? 'active' : ''}">
              <span class="avatar">${esc((pr.name || '?')[0].toUpperCase())}</span>
              <span class="pc-main"><strong>${esc(pr.name)}</strong>
                <span>${pr.id === store.activeId ? 'Active' : `${store.activeId === pr.id ? '' : 'Switch to this profile'}`}</span></span>
              <button class="btn btn-sm ${pr.id === store.activeId ? 'btn-ghost' : 'btn-accent'}" data-switch-profile="${pr.id}" ${pr.id === store.activeId ? 'disabled' : ''}>
                ${pr.id === store.activeId ? 'Current' : 'Switch'}
              </button>
            </div>`).join('')}
          <div class="chip-row" style="margin-top:10px">
            <button class="btn btn-ghost btn-sm" data-add-profile>${ic('i-plus')} New profile</button>
            ${p ? `<button class="btn btn-quiet" data-rename-profile>Rename</button>` : ''}
            ${store.profiles.length > 1 ? `<button class="btn btn-quiet" data-delete-profile>Delete this profile</button>` : ''}
          </div>
        </div>
      </section>

      <section class="set-group settings-group settings-group--privacy">
        <h3><span class="settings-group-icon">${ic('i-shield')}</span>Privacy</h3>
        <div class="set-row">
          <div class="sr-main"><strong>Sensitive previews</strong>
            <span>When off, private reminders show as “Private reminder” in the inbox and on your device notifications.</span></div>
          <label class="switch"><input type="checkbox" id="set-previews" ${s.sensitivePreviews ? 'checked' : ''} /><span class="track"></span></label>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Private Space PIN</strong>
            <span>${s.pinHash ? 'A PIN is set. It is stored as a hash in this browser only.' : 'No PIN set. Anyone using this browser can open Private Space.'}</span></div>
          <button class="btn btn-ghost btn-sm" data-set-pin>${s.pinHash ? 'Change' : 'Set PIN'}</button>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Show private tracking on Calendar</strong>
            <span>Off by default. When on, cycle notes appear as neutral dots labelled “Private tracking”.</span></div>
          <label class="switch"><input type="checkbox" id="set-cycle" ${s.showCycle ? 'checked' : ''} /><span class="track"></span></label>
        </div>
        <div class="notice quiet" style="margin-top:12px">${ic('i-shield')}<span>Keepsy is local-first. Records are stored unencrypted in this browser's storage. Anyone with access to this device and browser profile could read them — set a PIN for Private Space if that matters to you.</span></div>
      </section>

      <section class="set-group settings-group settings-group--notifications">
        <h3><span class="settings-group-icon">${ic('i-bell')}</span>Notifications</h3>
        <div class="set-row">
          <div class="sr-main"><strong>Reminder style</strong>
            <span>On iPhone, reminders appear inside Keepsy when it's open. On Android, the Keepsy app shows on-device notifications even when closed — no account, no push service, everything stays on this device.</span></div>
          <span class="tag quiet">On device</span>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Notification inbox</strong>
            <span>Quiet, grouped by Today / Upcoming / Earlier. No badges that nag.</span></div>
          <a class="btn btn-ghost btn-sm" href="#/inbox" data-nav>Open</a>
        </div>
      </section>

      <section class="set-group settings-group settings-group--data">
        <h3><span class="settings-group-icon">${ic('i-download')}</span>Data & storage</h3>
        <div class="set-row">
          <div class="sr-main"><strong>Export everything</strong><span>One JSON file with records, reminders and settings.</span></div>
          <button class="btn btn-ghost btn-sm" data-export>${ic('i-download')} Export</button>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Import a Keepsy export</strong><span>Validated before anything is written. You choose merge or replace.</span></div>
          <button class="btn btn-ghost btn-sm" data-import>${ic('i-upload')} Import</button>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Archive</strong><span>${pluralize(store.archived.length, 'record')} archived.</span></div>
          <a class="btn btn-ghost btn-sm" href="#/archive" data-nav>Open</a>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Recently deleted</strong><span>${pluralize(store.trashed.length, 'record')} waiting. Delete permanently when you are sure.</span></div>
          <a class="btn btn-ghost btn-sm" href="#/trash" data-nav>Open</a>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Erase this profile</strong><span>Removes every record for this profile in this browser. Cannot be undone.</span></div>
          <button class="btn btn-danger btn-sm" data-wipe>Erase</button>
        </div>
      </section>

      <section class="set-group settings-group settings-group--accessibility">
        <h3><span class="settings-group-icon">${ic('i-info')}</span>Accessibility</h3>
        <div class="set-row">
          <div class="sr-main"><strong>Motion</strong><span>Keepsy respects your system reduced-motion setting automatically.</span></div>
          <span class="tag quiet">Follows system</span>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Text size</strong><span>Uses your browser's own zoom and font settings. Nothing is locked.</span></div>
          <span class="tag quiet">Browser</span>
        </div>
      </section>

      <section class="set-group settings-group settings-group--about">
        <h3><span class="settings-group-icon">${ic('i-sparkle')}</span>About Keepsy</h3>
        <div class="set-row"><div class="sr-main"><strong>Keepsy</strong><span>Version 1.0 · a local-first memory space. Built as a PWA; works offline once loaded.</span></div></div>
        <div class="set-row"><div class="sr-main"><strong>Storage used</strong><span id="storage-note">Calculating…</span></div></div>
        <p class="hint" style="margin-top:14px">Keepsy does not diagnose, treat or predict anything medical. Cycle and health entries are personal tracking only.</p>
      </section>
    `,
    mount() {
      const settings = () => store.data.settings;

      document.querySelector('[data-install-keepsy]')?.addEventListener('click', async () => {
        if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) {
          toast('Keepsy is already installed on this device.', 'i-check');
          return;
        }
        const installPrompt = window.keepsyInstallPrompt;
        if (installPrompt) {
          installPrompt.prompt();
          const choice = await installPrompt.userChoice;
          window.keepsyInstallPrompt = null;
          toast(choice.outcome === 'accepted' ? 'Keepsy installed.' : 'You can install Keepsy later from here.', choice.outcome === 'accepted' ? 'i-check' : 'i-info');
          return;
        }
        const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const instructions = ios
          ? '<ol class="install-steps"><li>Open Keepsy in Safari from its secure website.</li><li>Tap the Share button.</li><li>Choose <strong>Add to Home Screen</strong>, then tap Add.</li></ol>'
          : '<ol class="install-steps"><li>Open Keepsy from its secure website in Chrome or Edge.</li><li>Open the browser menu.</li><li>Choose <strong>Install Keepsy</strong> or <strong>Add to Home screen</strong>.</li></ol>';
        openSheet({ title: 'Add Keepsy to your device', subtitle: 'Keepsy can live beside your other apps.', body: `${instructions}<div class="notice quiet" style="margin-top:12px">${ic('i-info')}<span>Installation appears after Keepsy is published on a secure website. No app store is needed.</span></div>`, foot: '<button class="btn btn-accent" data-sheet-close>Got it</button>' });
      });

      document.querySelectorAll('[data-switch-profile]').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        store.setProfile(b.dataset.switchProfile);
        toast(`Now showing ${store.profile.name}'s Keepsy.`, 'i-users');
        window.location.hash = '#/';
        rerenderNow();
      }));

      document.querySelector('[data-add-profile]')?.addEventListener('click', () => {
        openSheet({
          title: 'New profile',
          subtitle: 'A separate set of records in this browser.',
          body: `<div class="field"><label for="np-name">Name</label><input id="np-name" class="input" placeholder="e.g. Aditi" maxlength="40" /></div>`,
          foot: `<button class="btn btn-ghost" data-sheet-close>Cancel</button><button class="btn btn-accent" id="np-save">Create</button>`,
          onMount: (sheet, close) => {
            sheet.querySelector('#np-save').addEventListener('click', () => {
              const name = sheet.querySelector('#np-name').value.trim();
              if (!name) { toast('Give the profile a name.', 'i-info'); return; }
              store.addProfile(name);
              close();
              toast('Profile created. Its records are kept separate.', 'i-users');
              window.location.hash = '#/';
              rerenderNow();
            });
            setTimeout(() => sheet.querySelector('#np-name').focus(), 350);
          }
        });
      });

      document.querySelector('[data-rename-profile]')?.addEventListener('click', () => {
        openSheet({
          title: 'Rename profile',
          body: `<div class="field"><label for="rp-name">Name</label><input id="rp-name" class="input" value="${esc(store.profile.name)}" maxlength="40" /></div>`,
          foot: `<button class="btn btn-ghost" data-sheet-close>Cancel</button><button class="btn btn-accent" id="rp-save">Save</button>`,
          onMount: (sheet, close) => {
            sheet.querySelector('#rp-save').addEventListener('click', () => {
              store.renameProfile(store.activeId, sheet.querySelector('#rp-name').value);
              close(); toast('Renamed.'); rerenderNow();
            });
          }
        });
      });

      document.querySelector('[data-delete-profile]')?.addEventListener('click', () => {
        confirmSheet({
          title: 'Delete this profile?',
          message: `Every record in “${store.profile.name}” will be removed from this browser.`,
          confirmText: 'Delete profile',
          onConfirm: () => {
            const r = store.deleteProfile(store.activeId);
            if (!r.ok) toast(r.reason, 'i-info');
            else { toast('Profile deleted.'); window.location.hash = '#/'; rerenderNow(); }
          }
        });
      });

      document.querySelector('#set-previews')?.addEventListener('change', (e) => {
        store.setSetting('sensitivePreviews', e.target.checked);
        store.syncNotifications();
        toast(e.target.checked ? 'Private reminders will show real titles here.' : 'Private reminders will show as “Private reminder”.', 'i-eye-off');
        rerenderNow();
      });

      document.querySelector('#set-cycle')?.addEventListener('change', (e) => {
        store.setSetting('showCycle', e.target.checked);
        toast(e.target.checked ? 'Private tracking appears on the calendar as neutral markers.' : 'Private tracking is hidden from the calendar.', 'i-eye-off');
      });

      document.querySelector('[data-set-pin]')?.addEventListener('click', () => {
        openSheet({
          title: settings().pinHash ? 'Change PIN' : 'Set a PIN',
          subtitle: 'Four digits. Stored as a hash in this browser, and only gates the Private Space screen.',
          body: `<div class="field"><label for="pin-in">PIN</label><input id="pin-in" class="input num" inputmode="numeric" maxlength="4" placeholder="4 digits" /></div>
                 <div class="notice quiet" style="margin-top:12px">${ic('i-info')}<span>This is a light deterrent, not encryption. It does not protect the underlying browser storage.</span></div>`,
          foot: `<button class="btn btn-ghost" data-sheet-close>Cancel</button><button class="btn btn-accent" id="pin-save">Save PIN</button>`,
          onMount: (sheet, close) => {
            sheet.querySelector('#pin-save').addEventListener('click', async () => {
              const v = sheet.querySelector('#pin-in').value.trim();
              if (!/^\d{4}$/.test(v)) { toast('Use four digits.', 'i-info'); return; }
              const salt = crypto.randomUUID();
              const hash = await hashPin(v, salt);
              store.data.settings.pinHash = hash;
              store.data.settings.pinSalt = salt;
              store.data.settings.unlocked = false;
              store.save();
              close(); toast('PIN set.', 'i-shield'); rerenderNow();
            });
          }
        });
      });

      document.querySelector('[data-export]')?.addEventListener('click', () => {
        const data = store.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `keepsy-${(store.profile?.name || 'me').toLowerCase().replace(/\s+/g, '-')}-${todayISO()}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        toast('Exported. Keep the file somewhere safe.', 'i-download');
      });

      document.querySelector('[data-import]')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.addEventListener('change', async () => {
          const file = input.files?.[0];
          if (!file) return;
          let parsed;
          try {
            parsed = JSON.parse(await file.text());
          } catch {
            toast('That file could not be read as JSON. Nothing was changed.', 'i-info');
            return;
          }
          openSheet({
            title: 'Import data',
            subtitle: `${(parsed.records || []).length} records found in “${file.name}”.`,
            body: `<div class="notice quiet" style="margin-bottom:12px">${ic('i-info')}<span>Merge keeps your current records and adds the new ones. Replace overwrites this profile's records.</span></div>
                   <div class="chip-row"><button class="chip" data-mode="merge">Merge</button><button class="chip" data-mode="replace">Replace</button></div>`,
            onMount: (sheet, close) => {
              sheet.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
                const mode = b.dataset.mode;
                if (mode === 'replace') {
                  close();
                  confirmSheet({
                    title: 'Replace all records?',
                    message: 'Current records for this profile will be overwritten by the file.',
                    confirmText: 'Replace',
                    onConfirm: () => doImport(parsed, 'replace')
                  });
                } else { close(); doImport(parsed, 'merge'); }
              }));
            }
          });
        });
        input.click();
      });

      const doImport = (parsed, mode) => {
        const res = store.importData(parsed, mode);
        if (!res.ok) {
          toast(res.errors[0] || 'Import failed.', 'i-info');
          return;
        }
        store.syncNotifications();
        toast(`Imported ${res.imported} record${res.imported === 1 ? '' : 's'}${res.errors.length ? ` (${res.errors.length} skipped)` : ''}.`, 'i-upload');
        rerenderNow();
      };

      document.querySelector('[data-wipe]')?.addEventListener('click', () => {
        confirmSheet({
          title: 'Erase this profile?',
          message: `All records, reminders and settings for “${store.profile.name}” in this browser will be removed permanently.`,
          confirmText: 'Erase everything',
          onConfirm: () => { store.wipe(); toast('Erased.'); window.location.hash = '#/'; rerenderNow(); }
        });
      });

      const note = document.getElementById('storage-note');
      if (note) {
        let bytes = 0;
        try {
          for (const k in localStorage) {
            if (Object.prototype.hasOwnProperty.call(localStorage, k) && k.startsWith('keepsy:')) bytes += (localStorage[k] || '').length;
          }
        } catch { bytes = 0; }
        note.textContent = `${(bytes / 1024).toFixed(1)} KB across ${store.profiles.length} profile${store.profiles.length === 1 ? '' : 's'} in this browser`;
      }
    }
  };
}

async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  if (crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // fallback for insecure contexts — still not plaintext
  let h = 5381;
  for (const b of data) h = ((h << 5) + h + b) | 0;
  return `fb${(h >>> 0).toString(16)}`;
}

function rerenderNow() {
  window.dispatchEvent(new CustomEvent('keepsy:route', { detail: { raw: location.hash } }));
}

/* ---------------- Archive & trash ---------------- */
export function renderArchive() {
  const list = store.archived.slice().sort((a, b) => (b.archivedAt || '').localeCompare(a.archivedAt || ''));
  return {
    area: 'home-dash', eyebrow: 'Keepsy', title: 'Archive',
    html: `
      <section class="screen-head">
        <div class="eyebrow">Out of the way, not gone</div>
        <h1>Archive</h1>
        <p class="lede">Records you set aside. They stay searchable here and can come back any time.</p>
      </section>
      <section class="archive-overview"><span class="archive-overview-icon">${ic('i-archive')}</span><div><span class="archive-overview-kicker">SAFE, JUST OUT OF SIGHT</span><strong>${pluralize(list.length, 'kept record')}</strong><small>${list.length ? 'Restore any record whenever it belongs back in your life.' : 'Set-aside records will stay here until you need them again.'}</small></div></section>
      ${list.length ? `<div class="record-list archive-list" style="margin-top:16px">
        ${list.map((r) => `<div class="record-item archive-item" style="cursor:default">
          <span class="row-thumb">${ic(getArea(r.area)?.icon || 'i-grid')}</span>
          <button class="rec-main" data-open-record="${r.id}" style="text-align:left;background:none;border:0">
            <span class="rec-title">${esc(r.title)}</span>
            <span class="rec-meta">${esc(getArea(r.area)?.name || '')} · archived ${esc(timeAgo(r.archivedAt))}</span>
          </button>
          <button class="btn btn-ghost btn-sm" data-unarchive="${r.id}">Restore</button>
        </div>`).join('')}
      </div>` : `<div class="archive-empty"><div class="archive-empty-mark">${ic('i-archive')}</div>
        <h3>Archive is empty</h3><p>Nothing has been archived yet. When you tidy up, records come here instead of disappearing.</p></div>`}
    `,
    mount() {
      document.querySelectorAll('[data-unarchive]').forEach((b) => b.addEventListener('click', () => {
        store.unarchiveRecord(b.dataset.unarchive);
        toast('Restored.', 'i-restore');
        rerenderNow();
      }));
    }
  };
}

export function renderTrash() {
  const list = store.trashed.slice().sort((a, b) => (b.deletedAt || '').localeCompare(a.deletedAt || ''));
  return {
    area: 'home-dash', eyebrow: 'Keepsy', title: 'Recently deleted',
    html: `
      <section class="screen-head">
        <div class="eyebrow">Second thoughts welcome</div>
        <h1>Recently deleted</h1>
        <p class="lede">Restore a record, or delete it forever. Permanent deletion cannot be undone.</p>
      </section>
      <section class="archive-overview trash-overview"><span class="archive-overview-icon">${ic('i-trash')}</span><div><span class="archive-overview-kicker">A PAUSE BEFORE THEY’RE GONE</span><strong>${pluralize(list.length, 'record')}</strong><small>${list.length ? 'Restore anything you want to keep, or permanently delete it.' : 'Deleted records will wait here until you decide what to do.'}</small></div></section>
      ${list.length ? `<div class="record-list archive-list trash-list" style="margin-top:16px">
        ${list.map((r) => `<div class="record-item archive-item trash-item" style="cursor:default">
          <span class="row-thumb">${ic(getArea(r.area)?.icon || 'i-grid')}</span>
          <div class="rec-main">
            <div class="rec-title">${esc(r.title)}</div>
            <div class="rec-meta">${esc(getArea(r.area)?.name || '')} · deleted ${esc(timeAgo(r.deletedAt))}</div>
          </div>
          <div class="trash-actions">
            <button class="btn btn-ghost btn-sm" data-restore="${r.id}">Restore</button>
            <button class="btn btn-danger btn-sm" data-purge="${r.id}">Delete forever</button>
          </div>
        </div>`).join('')}
      </div>` : `<div class="archive-empty trash-empty"><div class="archive-empty-mark">${ic('i-trash')}</div>
        <h3>Nothing deleted</h3><p>Good. Anything you delete will wait here until you decide.</p></div>`}
    `,
    mount() {
      document.querySelectorAll('[data-restore]').forEach((b) => b.addEventListener('click', () => {
        store.restoreRecord(b.dataset.restore);
        toast('Back in Keepsy.', 'i-restore');
        rerenderNow();
      }));
      document.querySelectorAll('[data-purge]').forEach((b) => b.addEventListener('click', () => {
        const rec = store.record(b.dataset.purge);
        confirmSheet({
          title: `Delete “${rec.title}” forever?`,
          message: 'This removes it permanently, along with its links and reminders.',
          confirmText: 'Delete forever',
          onConfirm: () => { store.purgeRecord(rec.id); toast('Deleted permanently.', 'i-trash'); rerenderNow(); }
        });
      }));
    }
  };
}

export { hashPin, rerenderNow };
