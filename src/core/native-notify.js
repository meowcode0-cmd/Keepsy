/* Keepsy — native bridge: on-device scheduled reminders for the Android app build.
   Uses Capacitor Local Notifications: reminders are scheduled on the device itself,
   they fire even when the app is closed. No server, no push service, nothing syncs.
   On the web/iPhone build this module detects it is not native and does nothing —
   reminders stay in-app only, with no permission prompt and no notification code path. */

import { store } from './store.js';

const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'android');

/* Stable numeric id (< 2^31) derived from the reminder's string id, so re-scheduling replaces cleanly. */
function notifId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 2000000000;
}

/* Next occurrence of a reminder as a concrete Date, or null if there is none. */
function nextDue(rem) {
  const [y, m, d] = String(rem.due || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  const when = new Date(y, m - 1, d);
  if (rem.time) {
    const [hh, mm] = String(rem.time).split(':').map(Number);
    when.setHours(hh || 0, mm || 0, 0, 0);
  } else {
    when.setHours(9, 0, 0, 0); // gentle default: 9 in the morning
  }
  const now = new Date();
  if (when > now) return when;
  const rep = rem.repeat || 'none';
  if (rep === 'none') return null;
  let guard = 0;
  while (when <= now && guard++ < 5000) {
    if (rep === 'daily') when.setDate(when.getDate() + 1);
    else if (rep === 'weekly') when.setDate(when.getDate() + 7);
    else if (rep === 'monthly') when.setMonth(when.getMonth() + 1);
    else if (rep === 'yearly') when.setFullYear(when.getFullYear() + 1);
    else return null;
  }
  return when;
}

let scheduling = null;

async function scheduleAll() {
  if (!isNative()) return;
  const Plugins = window.Capacitor.Plugins || {};
  const LocalNotifications = Plugins.LocalNotifications;
  if (!LocalNotifications) return;
  if (scheduling) return scheduling; // one at a time
  scheduling = (async () => {
    try {
      const perm = await LocalNotifications.requestPermissions();
      if (!perm || perm.display !== 'granted') return;
      const enabled = await LocalNotifications.areEnabled();
      if (enabled && enabled.value === false) return;

      // Clear everything Keepsy scheduled before, then re-schedule from current data.
      const pending = await LocalNotifications.getPending();
      const old = ((pending && pending.notifications) || [])
        .filter((n) => n && typeof n.id === 'number')
        .map((n) => ({ id: n.id }));
      if (old.length) { try { await LocalNotifications.cancel({ notifications: old }); } catch {} }

      const now = Date.now();
      const batch = [];
      for (const rem of store.reminders) {
        if (rem.status !== 'open') continue;
        if (rem.snoozeUntil) {
          const s = new Date(rem.snoozeUntil);
          if (!isNaN(s) && s > new Date(now)) {
            batch.push({
              id: notifId(rem.id),
              title: rem.title || 'Keepsy reminder',
              body: 'Snoozed — ready when you are.',
              schedule: { at: s, allowWhileIdle: true },
              smallIcon: 'ic_launcher',
              groupId: 'keepsy',
            });
            continue;
          }
        }
        const when = nextDue(rem);
        if (!when || when.getTime() <= now) continue;
        batch.push({
          id: notifId(rem.id),
          title: rem.title || 'Keepsy reminder',
          body: 'A reminder is ready when you are.',
          schedule: { at: when, allowWhileIdle: true },
          smallIcon: 'ic_launcher',
          groupId: 'keepsy',
        });
        if (batch.length >= 50) break; // Android caps pending notifications; 50 open reminders is plenty
      }
      if (batch.length) await LocalNotifications.schedule({ notifications: batch });
    } catch (err) {
      console.warn('Keepsy: local notifications unavailable', err);
    } finally {
      scheduling = null;
    }
  })();
  return scheduling;
}

export function initNativeNotifications() {
  if (!isNative()) return; // web / iPhone build: in-app only, nothing runs
  const original = store.syncNotifications.bind(store);
  let deb = null;
  store.syncNotifications = (...args) => {
    const out = original(...args);
    clearTimeout(deb);
    deb = setTimeout(scheduleAll, 600); // reschedule shortly after any data change
    return out;
  };
  store.syncNotifications(); // schedule whatever already exists
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleAll(); // catch up when reopened
  });
}
