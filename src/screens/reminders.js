/* Keepsy — Reminders & the notification inbox. */
import { ic, toast, confirmSheet } from '../core/ui.js';
import { esc, fmtDate, dayDiff, todayISO, pluralize, timeAgo } from '../core/format.js';
import { store } from '../core/store.js';
import { openReminderSheet, openSnoozeSheet } from '../sheets.js';

const bucket = (rem) => {
  const d = dayDiff(rem.snoozeUntil || rem.due);
  if (rem.status === 'done') return 'done';
  if (d < 0) return 'overdue';
  if (d === 0) return 'today';
  if (d <= 14) return 'soon';
  return 'later';
};

function remRow(rem, { privatePreview = true } = {}) {
  const d = dayDiff(rem.snoozeUntil || rem.due);
  const isPrivate = rem.private;
  const title = isPrivate && !privatePreview ? 'Private reminder' : rem.title;
  return `<div class="rem-item ${rem.status === 'done' ? 'done' : ''} ${d < 0 && rem.status === 'open' ? 'overdue' : ''}" data-rem="${rem.id}">
    <button class="rem-check" data-complete="${rem.id}" aria-label="${rem.status === 'done' ? 'Reopen' : 'Complete'} ${esc(title)}">
      ${ic('i-check')}
    </button>
    <div class="rem-main" data-open-reminder="${rem.id}" role="button" tabindex="0" aria-label="Open ${esc(title)}">
      <div class="rem-title">${esc(title)}</div>
      <div class="rem-meta">
        <span class="due">${esc(fmtDate(rem.snoozeUntil || rem.due, 'relative'))}${rem.time ? ` · ${esc(rem.time)}` : ''}</span>
        ${rem.repeat !== 'none' ? `<span>· ${esc(rem.repeat)}</span>` : ''}
        ${isPrivate ? `<span class="private-mark">${ic('i-eye-off', 'ic-sm')} private</span>` : ''}
        ${rem.recordId && store.record(rem.recordId) ? `<span>· ${esc(store.record(rem.recordId).title)}</span>` : ''}
        ${rem.status === 'done' ? '<span>· done</span>' : ''}
      </div>
    </div>
    <div class="rem-actions">
      ${rem.status !== 'done' ? `<button class="icon-btn" data-snooze="${rem.id}" aria-label="Snooze ${esc(title)}" title="Snooze">${ic('i-snooze')}</button>` : ''}
      <button class="icon-btn" data-edit-rem="${rem.id}" aria-label="Edit ${esc(title)}" title="Edit">${ic('i-edit')}</button>
    </div>
  </div>`;
}

export function renderReminders() {
  const all = store.reminders.filter((r) => !r.private);
  const buckets = { overdue: [], today: [], soon: [], later: [], done: [] };
  all.forEach((r) => buckets[bucket(r)].push(r));
  Object.values(buckets).forEach((arr) => arr.sort((a, b) => (a.snoozeUntil || a.due).localeCompare(b.snoozeUntil || b.due)));

  const total = buckets.overdue.length + buckets.today.length + buckets.soon.length + buckets.later.length;
  const dueSoon = buckets.today.length + buckets.soon.length;

  return {
    area: 'home-dash',
    eyebrow: 'Keepsy',
    title: 'Reminders',
    html: `
      <section class="screen-head">
        <div class="eyebrow">Nothing forgotten</div>
        <h1>Reminders</h1>
        <p class="lede">${total ? `${pluralize(total, 'reminder')} open. Complete, snooze or reschedule them as you like.` : 'No reminders yet. Keepsy can watch an expiry, a service or a date for you.'}</p>
        <div class="ah-actions"><button class="btn btn-accent btn-sm" data-new-reminder>${ic('i-plus')} New reminder</button></div>
      </section>

      ${total || buckets.done.length ? `<section class="reminders-overview" aria-label="Reminder overview">
        <div class="reminders-overview-main"><span class="reminders-kicker">YOUR LITTLE NUDGE BOARD</span><strong>${total ? `${pluralize(total, 'thing')} still on your list` : 'All caught up'}</strong><small>${buckets.overdue.length ? `${pluralize(buckets.overdue.length, 'reminder')} needs a new moment.` : dueSoon ? `${pluralize(dueSoon, 'reminder')} coming up soon.` : 'Your saved reminders are right where you need them.'}</small></div>
        <span class="reminders-overview-count"><b>${total}</b><small>open</small></span>
        <nav class="reminder-jumps" aria-label="Jump to reminder group">
          ${buckets.overdue.length ? `<button type="button" data-scroll-rem="overdue">Overdue <b>${buckets.overdue.length}</b></button>` : ''}
          ${buckets.today.length ? `<button type="button" data-scroll-rem="today">Today <b>${buckets.today.length}</b></button>` : ''}
          ${buckets.soon.length ? `<button type="button" data-scroll-rem="soon">Soon <b>${buckets.soon.length}</b></button>` : ''}
          ${buckets.later.length ? `<button type="button" data-scroll-rem="later">Later <b>${buckets.later.length}</b></button>` : ''}
          ${buckets.done.length ? `<button type="button" data-scroll-rem="done">Done <b>${buckets.done.length}</b></button>` : ''}
        </nav>
      </section>` : ''}

      ${total === 0 && buckets.done.length === 0 ? `<div class="empty" style="margin-top:22px">
          <div class="em-mark">${ic('i-bell')}</div>
          <h3>Nothing to remember</h3>
          <p>When you save a medicine, a warranty or an appointment, Keepsy can remind you at the right time.</p>
          <button class="btn btn-accent" data-new-reminder>Add a reminder</button>
        </div>` : ''}

      ${[['overdue', 'Overdue'], ['today', 'Today'], ['soon', 'Next two weeks'], ['later', 'Further ahead'], ['done', 'Completed']]
        .map(([k, label]) => buckets[k].length ? `
          <section class="rem-group rem-group-${k}" id="rem-${k}">
            <h3>${esc(label)} <span class="n">${buckets[k].length}</span></h3>
            <div class="panel panel-pad" style="padding:4px 18px">
              ${buckets[k].map((r) => remRow(r)).join('')}
            </div>
          </section>` : '').join('')}

      <p class="hint" style="margin-top:24px;text-align:center">
        Reminders live in Keepsy. When closed-app reminders are enabled in Settings, Keepsy can send a device
        notification at the due time. The notification service receives the reminder title and schedule, not your notes or records.
      </p>
    `,
    mount() {}
  };
}

export function renderInbox() {
  const items = store.data.notifications.slice().sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return (b.days ?? 0) - (a.days ?? 0);
  });
  const settings = store.data.settings;
  const today = items.filter((n) => n.days === 0 && !n.read);
  const upcoming = items.filter((n) => n.days > 0);
  const earlier = items.filter((n) => n.days < 0 || (n.read && n.days === 0));

  const block = (label, list) => list.length ? `<section class="rem-group inbox-group">
    <h3>${esc(label)} <span class="n">${list.length}</span></h3>
    <div class="panel panel-pad" style="padding:4px 18px">
      ${list.map((n) => `<div style="display:flex;align-items:flex-start;gap:8px">
        <button class="inbox-item ${n.read ? '' : 'unread'}" data-notif="${n.id}" style="border:0">
          <span class="ib-ic">${ic(n.private && !settings.sensitivePreviews ? 'i-eye-off' : 'i-bell')}</span>
          <span class="ib-main">
            <span class="ib-t">${esc(n.title)}</span>
            <span class="ib-m">${esc(n.body)}${n.days != null ? ` · ${esc(n.days < 0 ? `${Math.abs(n.days)}d ago` : n.days === 0 ? 'today' : `in ${n.days}d`)}` : ''}</span>
          </span>
        </button>
        ${n.read ? '' : `<span class="unread-dot" aria-label="Unread"></span>`}
      </div>`).join('')}
    </div>
  </section>` : '';

  const unread = items.filter((n) => !n.read).length;

  return {
    area: 'home-dash',
    eyebrow: 'Keepsy',
    title: 'Notifications',
    html: `
      <section class="screen-head">
        <div class="eyebrow">A quiet inbox</div>
        <h1>Notifications</h1>
        <p class="lede">Keepsy only pings you about things you asked it to watch. Nothing else.</p>
        <div class="ah-actions">
          ${items.some((n) => !n.read) ? `<button class="btn btn-ghost btn-sm" data-mark-all>Mark all read</button>` : ''}
          <a class="btn btn-ghost btn-sm" href="#/reminders" data-nav>Open reminders</a>
        </div>
      </section>

      ${items.length ? `<section class="inbox-overview" aria-label="Inbox summary"><span class="inbox-orbit" aria-hidden="true">${ic('i-bell')}</span><div><span class="reminders-kicker">A SOFTER KIND OF NOTIFICATION</span><strong>${unread ? pluralize(unread, 'new nudge') : 'You’re all caught up'}</strong><small>${pluralize(items.length, 'notification')} from reminders you chose to keep.</small></div></section>` : ''}

      ${items.length === 0 ? `<div class="empty" style="margin-top:22px">
          <div class="em-mark">${ic('i-bell')}</div>
          <h3>All quiet</h3>
          <p>No notifications. When a reminder comes close, it will appear here.</p>
        </div>` : `
        ${block('Today', today)}
        ${block('Upcoming', upcoming)}
        ${block('Earlier', earlier)}
      `}

      <div class="notice quiet" style="margin-top:24px">${ic('i-shield')}<span>${settings.sensitivePreviews
        ? 'Sensitive previews are on, so reminders marked private still show their real title here — this screen is inside Keepsy. Turn this off in Settings to see “Private reminder” instead.'
        : 'Sensitive previews are off. Private reminders appear as “Private reminder”, even here.'}</span></div>
    `,
    mount() {}
  };
}

export function reminderActionHandler(e, rerender) {
  {
    const jump = e.target.closest('[data-scroll-rem]');
    if (jump) {
      e.preventDefault();
      document.getElementById(`rem-${jump.dataset.scrollRem}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    }
    const done = e.target.closest('[data-complete]');
    if (done) {
      e.stopPropagation();
      const id = done.dataset.complete;
      const rem = store.reminder(id);
      if (rem.status === 'done') { store.reopenReminder(id); toast('Reopened.', 'i-restore'); }
      else { store.completeReminder(id); toast('Done. One less thing.', 'i-check'); }
      store.syncNotifications();
      rerender();
      return true;
    }
    const sn = e.target.closest('[data-snooze]');
    if (sn) {
      e.stopPropagation();
      const rem = store.reminder(sn.dataset.snooze);
      openSnoozeSheet(rem, () => { store.syncNotifications(); rerender(); });
      return true;
    }
    const ed = e.target.closest('[data-edit-rem]');
    if (ed) {
      e.stopPropagation();
      const rem = store.reminder(ed.dataset.editRem);
      openReminderSheet({ reminder: rem, onSaved: () => { store.syncNotifications(); rerender(); } });
      return true;
    }
    const notif = e.target.closest('[data-notif]');
    if (notif) {
      const n = store.data.notifications.find((x) => x.id === notif.dataset.notif);
      store.markNotificationRead(n.id);
      if (n.reminderId) window.dispatchEvent(new CustomEvent('keepsy:open-reminder', { detail: n.reminderId }));
      else if (n.recordId) window.location.hash = `#/r/${n.recordId}`;
      rerender();
      return true;
    }
    return false;
  }
}
