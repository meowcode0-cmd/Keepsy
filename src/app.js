/* Keepsy — application entry: shell wiring, drawer, routes, global actions. */
import { store } from './core/store.js';
import { initNativeNotifications } from './core/native-notify.js';
import { go, parse, route, start, onBaseChange, rememberScroll, recallScroll, current } from './core/router.js';
import { ic, openDrawer, closeDrawer, toggleDrawer, openSheet, toast, closeAllLayers, closeAllSheets } from './core/ui.js';
import { esc, todayISO, pluralize, initials, fmtDate } from './core/format.js';
import { AREAS, PRIVATE_AREA, getArea } from './core/areas.js';
import { openQuickAdd } from './quickadd.js';
import { openRecord } from './screens/record.js';
import { openReminderSheet, openSnoozeSheet, openRecordForm } from './sheets.js';

import { renderHome } from './screens/home.js';
import { renderArea } from './screens/area.js';
import { renderTimeline } from './screens/timeline.js';
import { renderCalendar } from './screens/calendar.js';
import { renderSearch } from './screens/search.js';
import { renderInsights } from './screens/insights.js';
import { renderMonth } from './screens/month.js';
import { renderReminders, renderInbox, reminderActionHandler } from './screens/reminders.js';
import { renderSettings, renderArchive, renderTrash } from './screens/settings.js';
import { renderPrivate } from './screens/private.js';

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  window.keepsyInstallPrompt = event;
});
window.addEventListener('appinstalled', () => { window.keepsyInstallPrompt = null; });

store.init();
store.syncNotifications();
initNativeNotifications(); // Android only: schedules on-device reminders; web/iOS no-op

const view = document.getElementById('view');
const topbar = document.getElementById('topbar');
const app = document.getElementById('app');

/* ---------------- Drawer contents ---------------- */
const EXPLORE = [
  ['timeline', 'Timeline', 'i-clock'],
  ['calendar', 'Calendar', 'i-calendar'],
  ['search', 'Search', 'i-search'],
  ['insights', 'Insights', 'i-sparkle'],
  ['month', 'Your Month', 'i-calendar']
];
const OTHER = [
  ['reminders', 'Reminders', 'i-bell'],
  ['archive', 'Archive', 'i-archive'],
  ['trash', 'Recently Deleted', 'i-trash'],
  ['settings', 'Settings', 'i-settings'],
  ['data', 'Export / Import', 'i-download']
];

function drawerMarkup() {
  const unread = store.unreadCount();
  const openRem = store.reminders.filter((r) => r.status === 'open').length;
  const areaCount = (slug) => store.live.filter((r) => r.area === slug).length;

  return `
    <div class="nav-group">
      <div class="nav-label">Keepsy</div>
      <a class="nav-link" href="#/" data-nav>${ic('i-home')}<span>Home</span>
        ${unread ? `<span class="nav-count" aria-label="${unread} unread">${unread}</span>` : ''}</a>
    </div>

    <div class="nav-group">
      <div class="nav-label">Your Life</div>
      <div class="nav-area-grid">
        ${AREAS.map((a) => {
          const n = areaCount(a.slug);
          return `<a class="nav-link" href="#/a/${a.slug}" data-nav style="--nav-accent:${a.palette[2]}">
            ${ic(a.icon)}<span>${esc(a.name.replace(' & Grooming', '').replace(' & Milestones', ''))}</span>
            ${n ? `<span class="nav-count">${n}</span>` : ''}
          </a>`;
        }).join('')}
      </div>
    </div>

    <div class="nav-group">
      <div class="nav-label">Explore</div>
      ${EXPLORE.map(([slug, label, icon]) => `<a class="nav-link" href="#/${slug}" data-nav>${ic(icon)}<span>${label}</span></a>`).join('')}
    </div>

    <div class="nav-group">
      <div class="nav-label">Private</div>
      <a class="nav-link" href="#/private" data-nav style="--nav-accent:#B98292">${ic('i-eye-off')}<span>Private Space</span>
        ${store.data.settings.pinHash ? `<span class="nav-dot" aria-label="PIN protected"></span>` : ''}</a>
    </div>

    <div class="nav-group">
      <div class="nav-label">Other</div>
      ${OTHER.map(([slug, label, icon]) => `<a class="nav-link" href="#/${slug}" data-nav>${ic(icon)}<span>${label}</span>
        ${slug === 'reminders' && openRem ? `<span class="nav-count">${openRem}</span>` : ''}</a>`).join('')}
    </div>
  `;
}

function drawerFoot() {
  const p = store.profile;
  return `<button class="profile-switch" data-switch-profile-open>
    <span class="avatar">${esc(initials(p?.name || 'Me'))}</span>
    <span class="ps-meta"><strong>${esc(p?.name || 'Me')}</strong><span>${store.profiles.length} profile${store.profiles.length === 1 ? '' : 's'} · local</span></span>
    ${ic('i-chevron-down', 'ic-sm')}
  </button>`;
}

function paintDrawer() {
  document.getElementById('drawer-nav').innerHTML = drawerMarkup();
  document.getElementById('drawer-foot').innerHTML = drawerFoot();
  const active = current();
  document.querySelectorAll('#drawer-nav [data-nav]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  document.querySelectorAll('#drawer-nav a').forEach((a) => a.addEventListener('click', () => closeDrawer()));
  document.querySelector('[data-switch-profile-open]')?.addEventListener('click', () => {
    closeDrawer();
    openProfileSwitcher();
  });
}

function openProfileSwitcher() {
  openSheet({
    title: 'Profiles',
    subtitle: 'Each profile keeps its own records in this browser.',
    body: `<div>
      ${store.profiles.map((p) => `<div class="profile-card ${p.id === store.activeId ? 'active' : ''}">
        <span class="avatar">${esc(initials(p.name))}</span>
        <span class="pc-main"><strong>${esc(p.name)}</strong><span>${p.id === store.activeId ? 'Currently open' : 'Switch'}</span></span>
        <button class="btn btn-sm ${p.id === store.activeId ? 'btn-ghost' : 'btn-accent'}" data-pick="${p.id}" ${p.id === store.activeId ? 'disabled' : ''}>${p.id === store.activeId ? 'Open' : 'Switch'}</button>
      </div>`).join('')}
      <button class="btn btn-ghost btn-block" data-new-profile style="margin-top:8px">${ic('i-plus')} New profile</button>
    </div>`,
    onMount: (sheet, close) => {
      sheet.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        store.setProfile(b.dataset.pick);
        close(); toast(`Now showing ${store.profile.name}.`, 'i-users');
        go('#/');
        render();
syncDrawerA11y();
      }));
      sheet.querySelector('[data-new-profile]').addEventListener('click', () => {
        openSheet({
          title: 'New profile',
          body: `<div class="field"><label for="npp">Name</label><input id="npp" class="input" maxlength="40" placeholder="e.g. Aditi" /></div>`,
          foot: `<button class="btn btn-ghost" data-sheet-close>Cancel</button><button class="btn btn-accent" id="npp-save">Create</button>`,
          onMount: (s2, c2) => {
            s2.querySelector('#npp-save').addEventListener('click', () => {
              const name = s2.querySelector('#npp').value.trim();
              if (!name) return;
              store.addProfile(name);
              c2(); close();
              toast('Profile created — its records stay separate.', 'i-users');
              go('#/'); render();
            });
            setTimeout(() => s2.querySelector('#npp').focus(), 300);
          }
        });
      });
    }
  });
}

/* ---------------- Topbar ---------------- */
function paintTopbar(screen) {
  const unread = store.unreadCount();
  topbar.innerHTML = `
    <button class="icon-btn topbar-menu" id="menu-btn" aria-label="Open navigation; menu slides in from the left" title="Menu slides in from the left" aria-expanded="false">
      ${ic('i-menu')}
    </button>
    <div class="topbar-title">
      <span class="eyebrow">${esc(screen.eyebrow || 'Keepsy')}</span>
      <strong>${esc(screen.title || 'Keepsy')}</strong>
    </div>
    <div class="topbar-actions">
      <button class="icon-btn" data-global-search aria-label="Search Keepsy">${ic('i-search')}</button>
      <button class="icon-btn" data-global-inbox aria-label="Notifications${unread ? `, ${unread} unread` : ''}">
        ${ic('i-bell')}${unread ? '<span class="dot"></span>' : ''}
      </button>
    </div>
  `;
  topbar.querySelector('#menu-btn').addEventListener('click', () => {
    toggleDrawer();
    topbar.querySelector('#menu-btn')?.setAttribute('aria-expanded', String(document.getElementById('drawer').classList.contains('open')));
  });
  topbar.querySelector('[data-global-search]').addEventListener('click', () => go('#/search'));
  topbar.querySelector('[data-global-inbox]').addEventListener('click', () => go('#/inbox'));
}

/* ---------------- Render ---------------- */
let currentScreen = null;

function resolveScreen(r) {
  const seg = r.segs[0] || '';
  const params = r.params;
  switch (seg) {
    case '':
    case 'home': return renderHome();
    case 'a': {
      const slug = r.segs[1];
      if (slug === 'private') return renderPrivate(params);
      const s = renderArea(slug, params);
      if (s) return s;
      return notFound(`There is no life area called “${slug}”.`);
    }
    case 'timeline': return renderTimeline(params);
    case 'calendar': return renderCalendar(params);
    case 'search': return renderSearch(params);
    case 'insights': return renderInsights();
    case 'month': return renderMonth(params);
    case 'reminders': return renderReminders();
    case 'inbox': return renderInbox();
    case 'settings': return renderSettings();
    case 'data': return renderSettings();
    case 'archive': return renderArchive();
    case 'trash': return renderTrash();
    case 'private': return renderPrivate(params);
    case 'r':
      return currentScreen || renderHome();
    default:
      return notFound(`Keepsy has no page at “${seg}”.`);
  }
}

function notFound(msg) {
  return {
    area: 'home-dash', eyebrow: 'Keepsy', title: 'Not found',
    html: `<section class="screen-head"><div class="eyebrow">A wrong turn</div><h1>This page is not here</h1>
      <p class="lede">${esc(msg)}</p>
      <div class="ah-actions"><a class="btn btn-accent" href="#/" data-nav>Back to Home</a></div></section>`,
    mount() {}
  };
}

function applyAreaTheme(area) {
  const slug = area || 'home-dash';
  app.setAttribute('data-area', slug);
  document.documentElement.setAttribute('data-area', slug);
  document.body.setAttribute('data-area', slug);
}

function render() {
  const r = parse();
  const previousAreaSlug = app.dataset.area;
  const prevScrollKey = window.__keepsyKey;
  if (prevScrollKey) rememberScroll(prevScrollKey, window.scrollY);

  if (r.segs[0] === 'r' && r.segs[1]) {
    const id = r.segs[1];
    if (store.record(id)) {
      closeAllLayers();
      openRecord(id);
      return;
    }
    toast('That record is no longer here.', 'i-info');
    // ignore toast duplicate; redirect home
    go('#/', { replace: true });
    return;
  }

  closeAllSheets();
  const screen = resolveScreen(r);
  currentScreen = screen;
  const previousAreaIndex = AREAS.findIndex((area) => area.slug === previousAreaSlug);
  const nextAreaIndex = AREAS.findIndex((area) => area.slug === r.segs[1]);
  const areaEnterClass = r.segs[0] === 'a' && previousAreaIndex >= 0 && nextAreaIndex >= 0 && previousAreaIndex !== nextAreaIndex
    ? (nextAreaIndex > previousAreaIndex ? 'area-enter-from-right' : 'area-enter-from-left')
    : '';
  applyAreaTheme(screen.area);

  view.innerHTML = screen.html;
  view.classList.remove('area-enter-from-right', 'area-enter-from-left');
  if (areaEnterClass) {
    void view.offsetWidth;
    view.classList.add(areaEnterClass);
    clearTimeout(window.__areaEnterTimer);
    window.__areaEnterTimer = setTimeout(() => view.classList.remove(areaEnterClass), 460);
  }
  view.setAttribute('aria-busy', 'false');
  paintTopbar(screen);
  paintDrawer();

  // wire global controls inside the view
  view.querySelectorAll('[data-open-record]').forEach((b) => b.addEventListener('click', () => go(`#/r/${b.dataset.openRecord}`)));
  view.querySelectorAll('[data-open-reminder]').forEach((b) => b.addEventListener('click', () => {
    const rem = store.reminder(b.dataset.openReminder);
    if (rem) openReminderSheet({ reminder: rem, onSaved: () => render() });
  }));
  view.querySelectorAll('[data-quick-add]').forEach((b) => b.addEventListener('click', () => openQuickAdd()));
  view.querySelectorAll('[data-new-reminder]').forEach((b) => b.addEventListener('click', () => openReminderSheet({ onSaved: () => render() })));
  view.querySelectorAll('[data-new-record]').forEach((b) => b.addEventListener('click', () => openRecordForm({ area: b.dataset.newRecord, onSaved: () => render() })));
  view.querySelectorAll('[data-new-private]').forEach((b) => b.addEventListener('click', () => openRecordForm({ area: 'private', onSaved: () => render() })));
  view.querySelectorAll('[data-area-filter]').forEach((b) => b.addEventListener('click', () => {
    const slug = b.dataset.areaFilter;
    const kind = b.dataset.kind;
    go(`#/a/${slug}${kind === 'all' ? '' : `?kind=${kind}`}`);
  }));
  view.querySelectorAll('[data-area-sort]').forEach((b) => b.addEventListener('click', () => {
    const slug = b.dataset.areaSort;
    go(`#/a/${slug}?sort=${b.dataset.sort}`);
  }));
  view.querySelectorAll('[data-mark-all]').forEach((b) => b.addEventListener('click', () => {
    store.markAllNotificationsRead(); toast('All caught up.', 'i-check'); render();
  }));
  view.querySelectorAll('[data-nav]').forEach((a) => a.addEventListener('click', () => closeDrawer()));
  if (screen.mount) screen.mount();

  if (view.__remHandler) view.removeEventListener('click', view.__remHandler);
  view.__remHandler = (e) => wireReminderActionsOnce(e);
  view.addEventListener('click', view.__remHandler);

  window.__keepsyKey = r.raw;
  const remembered = recallScroll(r.raw);
  window.scrollTo({ top: remembered || 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  document.title = `${screen.title || 'Keepsy'} · Keepsy`;
}

/* Reminder actions are delegated once per render, never stacked. */
let _pendingRemRender = false;
function wireReminderActionsOnce(e) {
  const handled = reminderActionHandler(e, () => {
    if (_pendingRemRender) return;
    _pendingRemRender = true;
    requestAnimationFrame(() => { _pendingRemRender = false; render(); });
  });
  return handled;
}

/* Desktop: expose the pinned drawer to assistive tech. */
function syncDrawerA11y() {
  const d = document.getElementById('drawer');
  if (!d) return;
  if (window.matchMedia('(min-width:900px)').matches) d.setAttribute('aria-hidden', 'false');
  else if (!d.classList.contains('open')) d.setAttribute('aria-hidden', 'true');
}
window.addEventListener('resize', syncDrawerA11y);

/* Global event bridge */
window.addEventListener('keepsy:open-reminder', (e) => {
  const rem = store.reminder(e.detail);
  if (rem) openReminderSheet({ reminder: rem, onSaved: () => render() });
});
window.addEventListener('keepsy:record-added', (e) => {
  if (location.hash.startsWith('#/r/')) go(`#/r/${e.detail}`);
  else render();
});
window.addEventListener('keepsy:route', () => {
  render();
});

document.getElementById('fab').addEventListener('click', () => openQuickAdd());

/* Life areas are a horizontal carousel: visible arrows plus direct swiping. */
let areaSwipeStart = null;
view.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1 || !e.target.closest('[data-area-swipe-zone]')) return;
  if (e.target.closest('button,a,input,select,textarea')) return;
  areaSwipeStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, slug: app.dataset.area };
}, { passive: true });
view.addEventListener('touchend', (e) => {
  if (!areaSwipeStart) return;
  const start = areaSwipeStart;
  areaSwipeStart = null;
  const touch = e.changedTouches[0];
  if (!touch) return;
  const dx = touch.clientX - start.x;
  const dy = touch.clientY - start.y;
  if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
  const index = AREAS.findIndex((area) => area.slug === start.slug);
  if (index < 0) return;
  const target = dx < 0 ? AREAS[index + 1] : AREAS[index - 1];
  if (target) go(`#/a/${target.slug}`);
});

/* Drawer edge swipe (mobile) + scrim */
let edgeStart = null;
document.addEventListener('touchstart', (e) => {
  const x = e.touches[0].clientX;
  if (x < 26 && !document.getElementById('drawer').classList.contains('open')) edgeStart = { x, y: e.touches[0].clientY };
}, { passive: true });
document.addEventListener('touchmove', (e) => {
  if (!edgeStart) return;
  const dx = e.touches[0].clientX - edgeStart.x;
  if (dx > 42) { openDrawer(); edgeStart = null; }
}, { passive: true });
document.addEventListener('touchend', () => { edgeStart = null; });

/* Keyboard: "/" focuses search, "n" opens quick add */
document.addEventListener('keydown', (e) => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if (typing) return;
  if (!e.altKey && !e.metaKey && !e.ctrlKey && !e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    if (document.activeElement?.closest('button,a,[role="button"],[role="tab"]')) return;
    const index = AREAS.findIndex((area) => area.slug === app.dataset.area);
    if (index >= 0) {
      const target = AREAS[index + (e.key === 'ArrowRight' ? 1 : -1)];
      if (target) { e.preventDefault(); go(`#/a/${target.slug}`); }
      return;
    }
  }
  if (e.key === '/') { e.preventDefault(); go('#/search'); }
  if (e.key === 'n' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); openQuickAdd(); }
});

/* Topbar shadow on scroll */
window.addEventListener('scroll', () => {
  topbar.classList.toggle('stuck', window.scrollY > 8);
}, { passive: true });

store.subscribe(() => {
  if (!document.getElementById('drawer').classList.contains('open')) {
    paintDrawer();
  }
});

/* Service worker: caches the app shell for offline use. */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js?v=7', { updateViaCache: 'none' }).then((registration) => registration.update()).catch(() => {
      /* offline shell is a bonus; the app still works without it */
    });
  });
}

/* Boot */
start(() => {});
onBaseChange(() => { closeAllLayers(); closeAllSheets(); });
render();
syncDrawerA11y();
