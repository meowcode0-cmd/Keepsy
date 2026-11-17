/* Keepsy — local-first store.
   One namespace per profile, all data in localStorage. No server, no sync. */

const NS = 'keepsy:v1';
const K_PROFILES = `${NS}:profiles`;
const K_ACTIVE = `${NS}:active`;
const profKey = (id) => `${NS}:p:${id}`;

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

const nowISO = () => new Date().toISOString();

const blank = () => ({
  records: [],
  reminders: [],
  notifications: [],
  settings: {
    weekStart: 1,
    sensitivePreviews: true,
    motion: 'system',
    pinHash: '',
    pinSalt: '',
    alertsEnabled: false,
    lastAlertScan: ''
  },
  meta: { createdAt: nowISO(), version: 1 }
});

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('Keepsy storage write failed', err);
    return false;
  }
}

const listeners = new Set();

export const store = {
  profiles: [],
  activeId: null,
  data: blank(),
  ready: false,

  init() {
    this.profiles = readJSON(K_PROFILES, null) || [];
    if (!this.profiles.length) {
      const p = { id: uid(), name: 'Me', createdAt: nowISO() };
      this.profiles = [p];
      writeJSON(K_PROFILES, this.profiles);
    }
    this.activeId = localStorage.getItem(K_ACTIVE);
    if (!this.activeId || !this.profiles.some((p) => p.id === this.activeId)) {
      this.activeId = this.profiles[0].id;
      localStorage.setItem(K_ACTIVE, this.activeId);
    }
    this.load();
    this.ready = true;
    return this;
  },

  load() {
    const d = readJSON(profKey(this.activeId), null);
    this.data = d && d.records ? { ...blank(), ...d, settings: { ...blank().settings, ...(d.settings || {}) } } : blank();
    if (!d) this.save();
  },

  save() {
    const ok = writeJSON(profKey(this.activeId), this.data);
    this.emit();
    return ok;
  },

  emit() { listeners.forEach((fn) => { try { fn(this.data); } catch (e) { console.warn(e); } }); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  get profile() { return this.profiles.find((p) => p.id === this.activeId); },

  /* ---------------- profiles ---------------- */
  setProfile(id) {
    if (!this.profiles.some((p) => p.id === id)) return false;
    this.activeId = id;
    localStorage.setItem(K_ACTIVE, id);
    this.load();
    this.emit();
    return true;
  },
  addProfile(name) {
    const p = { id: uid(), name: String(name || 'Someone').trim().slice(0, 40) || 'Someone', createdAt: nowISO() };
    this.profiles.push(p);
    writeJSON(K_PROFILES, this.profiles);
    this.setProfile(p.id);
    return p;
  },
  renameProfile(id, name) {
    const p = this.profiles.find((x) => x.id === id);
    if (!p) return false;
    p.name = String(name).trim().slice(0, 40) || p.name;
    writeJSON(K_PROFILES, this.profiles);
    this.emit();
    return true;
  },
  deleteProfile(id) {
    if (this.profiles.length <= 1) return { ok: false, reason: 'Keepsy needs at least one profile.' };
    this.profiles = this.profiles.filter((p) => p.id !== id);
    localStorage.removeItem(profKey(id));
    writeJSON(K_PROFILES, this.profiles);
    if (this.activeId === id) this.setProfile(this.profiles[0].id);
    else this.emit();
    return { ok: true };
  },

  /* ---------------- records ---------------- */
  get records() { return this.data.records.filter((r) => !r.deletedAt); },
  get live() { return this.records.filter((r) => !r.archivedAt); },
  get archived() { return this.records.filter((r) => r.archivedAt); },
  get trashed() { return this.data.records.filter((r) => r.deletedAt); },

  record(id) { return this.data.records.find((r) => r.id === id) || null; },

  addRecord(input) {
    const rec = {
      id: uid(),
      area: 'other',
      kind: 'item',
      title: 'Untitled',
      note: '',
      date: new Date().toISOString().slice(0, 10),
      time: '',
      amount: null,
      quantity: null,
      unit: '',
      mileage: null,
      expiry: null,
      warrantyUntil: null,
      documentName: '',
      tags: [],
      links: [],
      pinned: false,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      archivedAt: null,
      deletedAt: null,
      history: [],
      ...input
    };
    rec.history = [{ at: rec.createdAt, text: 'Keepsy remembered this' }, ...(input.history || [])];
    this.data.records.unshift(rec);
    this.save();
    return rec;
  },

  updateRecord(id, patch, historyText) {
    const rec = this.record(id);
    if (!rec) return null;
    Object.assign(rec, patch, { updatedAt: nowISO() });
    if (historyText) rec.history.unshift({ at: nowISO(), text: historyText });
    this.save();
    return rec;
  },

  archiveRecord(id) {
    const rec = this.record(id);
    if (!rec) return null;
    rec.archivedAt = nowISO();
    rec.history.unshift({ at: nowISO(), text: 'Archived' });
    this.data.reminders.forEach((r) => { if (r.recordId === id && r.status === 'open') r.archivedAt = nowISO(); });
    this.save();
    return rec;
  },

  unarchiveRecord(id) {
    const rec = this.record(id);
    if (!rec) return null;
    rec.archivedAt = null;
    rec.history.unshift({ at: nowISO(), text: 'Restored from archive' });
    this.save();
    return rec;
  },

  trashRecord(id) {
    const rec = this.record(id);
    if (!rec) return null;
    rec.deletedAt = nowISO();
    rec.history.unshift({ at: nowISO(), text: 'Moved to recently deleted' });
    this.save();
    return rec;
  },

  restoreRecord(id) {
    const rec = this.record(id);
    if (!rec) return null;
    rec.deletedAt = null;
    rec.history.unshift({ at: nowISO(), text: 'Restored' });
    this.save();
    return rec;
  },

  purgeRecord(id) {
    this.data.records = this.data.records.filter((r) => r.id !== id);
    this.data.reminders = this.data.reminders.filter((r) => r.recordId !== id);
    this.data.notifications = this.data.notifications.filter((n) => n.recordId !== id);
    this.data.records.forEach((r) => { r.links = (r.links || []).filter((l) => l.id !== id); });
    this.save();
  },

  togglePin(id) {
    const rec = this.record(id);
    if (!rec) return null;
    rec.pinned = !rec.pinned;
    this.save();
    return rec;
  },

  /* links are stored on both records so either side can navigate */
  linkRecords(aId, bId, rel = 'related to') {
    const a = this.record(aId); const b = this.record(bId);
    if (!a || !b || a.id === b.id) return false;
    a.links = a.links || []; b.links = b.links || [];
    if (!a.links.some((l) => l.id === b.id)) a.links.push({ id: b.id, rel });
    if (!b.links.some((l) => l.id === a.id)) b.links.push({ id: a.id, rel });
    a.history.unshift({ at: nowISO(), text: `Connected to “${b.title}”` });
    b.history.unshift({ at: nowISO(), text: `Connected to “${a.title}”` });
    this.save();
    return true;
  },

  unlinkRecords(aId, bId) {
    const a = this.record(aId); const b = this.record(bId);
    if (!a || !b) return false;
    a.links = (a.links || []).filter((l) => l.id !== bId);
    b.links = (b.links || []).filter((l) => l.id !== aId);
    a.history.unshift({ at: nowISO(), text: `Disconnected from “${b.title}”` });
    this.save();
    return true;
  },

  /* ---------------- reminders ---------------- */
  get reminders() { return this.data.reminders.filter((r) => !r.archivedAt); },
  reminder(id) { return this.data.reminders.find((r) => r.id === id) || null; },

  addReminder(input) {
    const rem = {
      id: uid(),
      recordId: null,
      title: 'Reminder',
      due: new Date().toISOString().slice(0, 10),
      time: '',
      type: 'personal',
      repeat: 'none',
      status: 'open',
      snoozeUntil: null,
      lastAlerted: null,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      private: false,
      ...input
    };
    this.data.reminders.push(rem);
    this.save();
    return rem;
  },

  updateReminder(id, patch, note) {
    const rem = this.reminder(id);
    if (!rem) return null;
    Object.assign(rem, patch, { updatedAt: nowISO() });
    if (rem.recordId && note) {
      const rec = this.record(rem.recordId);
      if (rec) { rec.history.unshift({ at: nowISO(), text: note }); }
    }
    this.save();
    return rem;
  },

  completeReminder(id) {
    const rem = this.reminder(id);
    if (!rem) return null;
    rem.status = 'done';
    rem.completedAt = nowISO();
    rem.updatedAt = nowISO();
    this.data.notifications = this.data.notifications.map((n) => (n.reminderId === id ? { ...n, read: true, resolved: true } : n));
    if (rem.recordId) {
      const rec = this.record(rem.recordId);
      if (rec) rec.history.unshift({ at: nowISO(), text: `Reminder completed — ${rem.title}` });
    }
    this.save();
    return rem;
  },

  reopenReminder(id) {
    const rem = this.reminder(id);
    if (!rem) return null;
    rem.status = 'open';
    rem.completedAt = null;
    rem.snoozeUntil = null;
    rem.updatedAt = nowISO();
    this.save();
    return rem;
  },

  snoozeReminder(id, days = 1) {
    const rem = this.reminder(id);
    if (!rem) return null;
    const d = new Date();
    d.setDate(d.getDate() + days);
    rem.status = 'open';
    rem.snoozeUntil = d.toISOString().slice(0, 10);
    rem.updatedAt = nowISO();
    this.data.notifications = this.data.notifications.map((n) => (n.reminderId === id ? { ...n, read: true, resolved: true } : n));
    this.save();
    return rem;
  },

  archiveReminder(id) {
    const rem = this.reminder(id);
    if (!rem) return null;
    rem.archivedAt = nowISO();
    this.data.notifications = this.data.notifications.map((n) => (n.reminderId === id ? { ...n, read: true, resolved: true } : n));
    this.save();
    return rem;
  },

  deleteReminder(id) {
    this.data.reminders = this.data.reminders.filter((r) => r.id !== id);
    this.data.notifications = this.data.notifications.filter((n) => n.reminderId !== id);
    this.save();
  },

  /* ---------------- notifications (derived from real reminders) ---------------- */
  syncNotifications() {
    const today = new Date().toISOString().slice(0, 10);
    const settings = this.data.settings;
    const existing = new Map(this.data.notifications.map((n) => [n.key, n]));
    const next = [];
    for (const rem of this.reminders) {
      if (rem.status !== 'open') continue;
      const effective = rem.snoozeUntil || rem.due;
      const days = Math.round((new Date(effective + 'T00:00:00') - new Date(today + 'T00:00:00')) / 86400000);
      if (days > 14) continue;
      const key = `rem:${rem.id}:${effective}`;
      const discreet = rem.private && !settings.sensitivePreviews;
      const prev = existing.get(key);
      next.push(prev ? {
        ...prev,
        title: discreet ? 'Private reminder' : rem.title,
        body: discreet ? 'Open Keepsy to see this.' : reminderBody(rem, days),
        days
      } : {
        id: uid(),
        key,
        reminderId: rem.id,
        recordId: rem.recordId,
        kind: 'reminder',
        title: discreet ? 'Private reminder' : rem.title,
        body: discreet ? 'Open Keepsy to see this.' : reminderBody(rem, days),
        createdAt: nowISO(),
        read: false,
        days,
        private: !!rem.private
      });
    }
    // keep read notifications that no longer map (recent history, up to 30)
    const mapped = new Set(next.map((n) => n.key));
    const keepOld = this.data.notifications.filter((n) => !mapped.has(n.key) && n.read).slice(0, 30);
    this.data.notifications = [...next, ...keepOld];
    this.save();
  },

  markNotificationRead(id) {
    const n = this.data.notifications.find((x) => x.id === id);
    if (n) { n.read = true; this.save(); }
  },
  markAllNotificationsRead() {
    this.data.notifications.forEach((n) => { n.read = true; });
    this.save();
  },
  unreadCount() { return this.data.notifications.filter((n) => !n.read).length; },

  /* ---------------- settings ---------------- */
  setSetting(key, value) {
    this.data.settings[key] = value;
    this.save();
  },

  /* ---------------- export / import ---------------- */
  exportData() {
    return {
      app: 'Keepsy',
      schema: 1,
      exportedAt: nowISO(),
      profile: { name: this.profile?.name || 'Me' },
      records: this.data.records,
      reminders: this.data.reminders,
      notifications: this.data.notifications,
      settings: { ...this.data.settings, pinHash: '', pinSalt: '' }
    };
  },

  importData(obj, mode = 'merge') {
    const errors = [];
    if (!obj || typeof obj !== 'object') return { ok: false, errors: ['That file is not readable JSON.'] };
    if (!Array.isArray(obj.records)) return { ok: false, errors: ['This file has no “records” list, so it does not look like a Keepsy export.'] };

    const validRecords = [];
    obj.records.forEach((r, i) => {
      if (!r || typeof r !== 'object') { errors.push(`Record ${i + 1} is not an object.`); return; }
      if (typeof r.title !== 'string' || !r.title.trim()) { errors.push(`Record ${i + 1} has no title.`); return; }
      if (typeof r.area !== 'string') { errors.push(`Record ${i + 1} has no life area.`); return; }
      validRecords.push({
        ...blank().records[0],
        ...r,
        id: r.id || uid(),
        links: Array.isArray(r.links) ? r.links : [],
        history: Array.isArray(r.history) ? r.history : [],
        tags: Array.isArray(r.tags) ? r.tags : []
      });
    });

    const validRem = (Array.isArray(obj.reminders) ? obj.reminders : []).filter((r) => r && r.title && r.due).map((r) => ({
      ...r, id: r.id || uid()
    }));

    if (mode === 'replace') {
      this.data.records = validRecords;
      this.data.reminders = validRem;
      this.data.notifications = Array.isArray(obj.notifications) ? obj.notifications : [];
    } else {
      const ids = new Set(this.data.records.map((r) => r.id));
      const remIds = new Set(this.data.reminders.map((r) => r.id));
      validRecords.forEach((r) => {
        if (ids.has(r.id)) r.id = uid();
        this.data.records.push(r);
      });
      validRem.forEach((r) => { if (!remIds.has(r.id)) this.data.reminders.push(r); });
    }
    this.save();
    return { ok: true, errors, imported: validRecords.length, reminders: validRem.length };
  },

  wipe() {
    localStorage.removeItem(profKey(this.activeId));
    this.data = blank();
    this.save();
  },

  allStats() {
    return {
      records: this.records.length,
      reminders: this.reminders.filter((r) => r.status === 'open').length,
      archived: this.archived.length,
      trashed: this.trashed.length
    };
  }
};

function reminderBody(rem, days) {
  if (days < 0) return `Was due ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return rem.time ? `Today at ${rem.time}` : 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

export const newId = uid;
