/* Keepsy — Quick Add: free text in, structured draft out, review before save. */
import { openSheet, ic, toast } from './core/ui.js';
import { esc, todayISO } from './core/format.js';
import { parseEntry, resolveKind, EXAMPLES } from './core/parse.js';
import { AREAS, getArea } from './core/areas.js';
import { store } from './core/store.js';

let recognition = null;
let listening = false;

const SPEECH_OK = () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

export function openQuickAdd(preset = null) {
  let draft = null;

  const close = openSheet({
    title: 'What happened?',
    subtitle: 'Tell Keepsy anything…',
    body: `
      <div class="qa-input-wrap">
        <label class="sr-only" for="qa-text">Describe what happened</label>
        <textarea id="qa-text" class="qa-input" placeholder="Bought shampoo ₹450… filled petrol ₹1200… AC serviced today…" rows="3"></textarea>
        <button class="qa-mic" id="qa-mic" type="button" aria-label="Speak instead of typing" ${SPEECH_OK() ? '' : 'disabled title="Voice input is not available in this browser"'}>
          ${ic('i-mic')}
        </button>
      </div>
      <div class="qa-shortcuts" id="qa-shortcuts">
        ${[
          ['Filled petrol', 'Filled petrol ₹', 'i-car'],
          ['Bought something', 'Bought ', 'i-receipt'],
          ['Health / medicine', 'Medicine ', 'i-heart'],
          ['Study / college', 'Assignment due ', 'i-book'],
          ['Maintenance', 'AC serviced today', 'i-repeat'],
          ['Grooming', 'Haircut today', 'i-sparkle'],
          ['Expense', 'Paid ₹', 'i-wallet'],
          ['Note', '', 'i-list'],
          ['Something else', '', 'i-plus']
        ].map(([label, seed, icon], index) => `<button class="chip qa-chip qa-chip--${index + 1}" data-seed="${esc(seed)}">${ic(icon)}<span>${esc(label)}</span></button>`).join('')}
      </div>
      <div class="qa-examples" id="qa-examples">
        Try: ${EXAMPLES.slice(0, 4).map((e) => `<button data-seed="${esc(e)}">“${esc(e)}”</button>`).join(' · ')}
      </div>
      <div id="qa-review"></div>
    `,
    foot: `<button class="btn btn-ghost" data-sheet-close>Cancel</button>
           <button class="btn btn-accent" id="qa-next">Continue</button>`,
    onMount: (sheet, closeFn) => {
      const text = sheet.querySelector('#qa-text');
      const review = sheet.querySelector('#qa-review');
      const nextBtn = sheet.querySelector('#qa-next');
      const micBtn = sheet.querySelector('#qa-mic');
      const shortcuts = sheet.querySelector('#qa-shortcuts');
      const examples = sheet.querySelector('#qa-examples');

      if (preset) {
        text.value = preset;
        text.focus();
      } else {
        setTimeout(() => text.focus({ preventScroll: true }), 420);
      }

      sheet.querySelectorAll('[data-seed]').forEach((b) => b.addEventListener('click', () => {
        text.value = (text.value ? `${text.value} ` : '') + b.dataset.seed;
        text.focus();
      }));

      if (micBtn && SPEECH_OK()) {
        micBtn.addEventListener('click', () => {
          if (listening) { recognition?.stop(); return; }
          const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
          recognition = new SR();
          recognition.lang = navigator.language || 'en-IN';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;
          recognition.onstart = () => { listening = true; micBtn.classList.add('listening'); };
          recognition.onend = () => { listening = false; micBtn.classList.remove('listening'); };
          recognition.onerror = (e) => {
            listening = false; micBtn.classList.remove('listening');
            toast(e.error === 'not-allowed' ? 'Microphone permission was declined — you can type instead.' : 'Voice input stopped. Typing still works.', 'i-info');
          };
          recognition.onresult = (ev) => {
            const said = ev.results[0][0].transcript;
            text.value = (text.value ? `${text.value} ` : '') + said;
            text.focus();
          };
          try { recognition.start(); } catch { toast('Voice input could not start. You can type instead.', 'i-info'); }
        });
      }

      const buildReview = () => {
        const parsed = parseEntry(text.value);
        const area = getArea(parsed.area) || getArea('other');
        const kind = resolveKind(parsed, area.kinds) || area.kinds[0];
        draft = {
          area: area.slug,
          kind: kind.id,
          title: parsed.title,
          note: parsed.note,
          date: parsed.date,
          time: parsed.time,
          amount: parsed.amount,
          quantity: parsed.quantity,
          unit: parsed.unit,
          mileage: parsed.mileage,
          expiry: parsed.expiry,
          reminder: parsed.reminder ? { due: parsed.reminder.due, time: parsed.reminder.time || '' } : null,
          confidence: parsed.confidence
        };
        renderReview();
      };

      const renderReview = () => {
        const d = draft;
        const area = getArea(d.area);
        const kind = area.kinds.find((k) => k.id === d.kind) || area.kinds[0];
        const f = kind.fields;
        const has = (x) => f.includes(x);
        review.innerHTML = `
          <div class="section" style="margin-top:22px">
            <div class="section-head"><h2 style="font-size:1.02rem">Review</h2>
              <span class="tag">${esc(area.name)} · ${esc(kind.label)}</span></div>
            <div class="parsed-grid">
              <div class="field full"><label for="pr-title">Title</label><input id="pr-title" class="input" value="${esc(d.title)}" /></div>
              ${has('date') || true ? `<div class="field"><label for="pr-date">Date</label><input id="pr-date" type="date" class="input" value="${esc(d.date)}" /></div>` : ''}
              ${has('time') || true ? `<div class="field"><label for="pr-time">Time</label><input id="pr-time" type="time" class="input" value="${esc(d.time || '')}" /></div>` : ''}
              <div class="field"><label for="pr-area">Life area</label>
                <select id="pr-area" class="select">${AREAS.map((a) => `<option value="${a.slug}" ${a.slug === d.area ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
              <div class="field"><label for="pr-kind">Kind</label>
                <select id="pr-kind" class="select">${area.kinds.map((k) => `<option value="${k.id}" ${k.id === d.kind ? 'selected' : ''}>${esc(k.label)}</option>`).join('')}</select></div>
              ${has('amount') ? `<div class="field"><label for="pr-amount">Amount</label><input id="pr-amount" class="input num" inputmode="decimal" value="${d.amount ?? ''}" placeholder="0" /></div>` : ''}
              ${has('quantity') ? `<div class="field"><label for="pr-qty">Quantity</label><div style="display:flex;gap:6px"><input id="pr-qty" class="input num" inputmode="decimal" value="${d.quantity ?? ''}" placeholder="0" style="flex:1"/><input id="pr-unit" class="input" value="${esc(d.unit || '')}" placeholder="unit" style="width:74px"/></div></div>` : ''}
              ${has('mileage') ? `<div class="field"><label for="pr-mileage">Mileage (km)</label><input id="pr-mileage" class="input num" inputmode="numeric" value="${d.mileage ?? ''}" placeholder="optional" /></div>` : ''}
              ${has('expiry') ? `<div class="field"><label for="pr-expiry">Expires</label><input id="pr-expiry" type="date" class="input" value="${esc(d.expiry || '')}" /></div>` : ''}
              ${has('warranty') ? `<div class="field"><label for="pr-warranty">Warranty until</label><input id="pr-warranty" type="date" class="input" value="" /></div>` : ''}
              ${has('document') ? `<div class="field full"><label for="pr-doc">Document name or path</label><input id="pr-doc" class="input" value="" placeholder="e.g. warranty card in drawer" /></div>` : ''}
              <div class="field full"><label for="pr-note">Notes</label><textarea id="pr-note" class="textarea" rows="2">${esc(d.note)}</textarea></div>
              <div class="field full">
                <label style="display:flex;align-items:center;gap:9px;text-transform:none;letter-spacing:0;font-size:.85rem;font-weight:500;color:var(--ink)">
                  <input type="checkbox" id="pr-remind" ${d.reminder ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--ink)"/>
                  Remind me${d.expiry ? ' before it expires' : ''}
                </label>
              </div>
              <div class="field full" id="pr-remind-date-wrap" style="${d.reminder ? '' : 'display:none'}">
                <label for="pr-remind-date">Reminder date</label>
                <input id="pr-remind-date" type="date" class="input" value="${esc(d.reminder?.due || d.expiry || d.date || todayISO())}" />
              </div>
            </div>
            <div class="parse-note">${ic('i-info')}<span>Keepsy read this with simple rules — check the fields before saving.</span></div>
          </div>
        `;

        const bind = (id, key, transform = (v) => v) => {
          const el = review.querySelector(`#${id}`);
          if (!el) return;
          el.addEventListener('input', () => { d[key] = transform(el.value); });
          el.addEventListener('change', () => { d[key] = transform(el.value); });
        };
        bind('pr-title', 'title');
        bind('pr-date', 'date');
        bind('pr-time', 'time');
        bind('pr-note', 'note');
        bind('pr-amount', 'amount', (v) => (v === '' ? null : Number(v)));
        bind('pr-qty', 'quantity', (v) => (v === '' ? null : Number(v)));
        bind('pr-unit', 'unit');
        bind('pr-mileage', 'mileage', (v) => (v === '' ? null : Number(v)));
        bind('pr-expiry', 'expiry', (v) => v || null);
        bind('pr-warranty', 'warrantyUntil', (v) => v || null);
        bind('pr-doc', 'documentName');

        review.querySelector('#pr-area').addEventListener('change', (e) => {
          d.area = e.target.value;
          const a = getArea(d.area);
          d.kind = a.kinds[0].id;
          renderReview();
        });
        review.querySelector('#pr-kind').addEventListener('change', (e) => { d.kind = e.target.value; renderReview(); });
        const remind = review.querySelector('#pr-remind');
        remind.addEventListener('change', () => {
          review.querySelector('#pr-remind-date-wrap').style.display = remind.checked ? '' : 'none';
          d.reminder = remind.checked ? { due: review.querySelector('#pr-remind-date').value, time: d.time || '' } : null;
        });
        review.querySelector('#pr-remind-date')?.addEventListener('change', (e) => {
          if (d.reminder) d.reminder.due = e.target.value;
        });
      };

      nextBtn.addEventListener('click', () => {
        if (!text.value.trim() && !draft) {
          toast('Tell Keepsy what happened first.', 'i-info');
          text.focus();
          return;
        }
        if (!draft) {
          buildReview();
          nextBtn.textContent = 'Save to Keepsy';
          nextBtn.classList.add('btn-accent');
          text.style.display = 'none';
          shortcuts.style.display = 'none';
          examples.style.display = 'none';
          micBtn.style.display = 'none';
          review.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return;
        }
        save();
      });

      text.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); nextBtn.click(); }
      });

      const save = () => {
        const finalArea = draft.area;
        const finalKind = getArea(finalArea).kinds.find((k) => k.id === draft.kind) || getArea(finalArea).kinds[0];
        const rec = store.addRecord({
          area: finalArea,
          kind: finalKind.id,
          title: draft.title.trim() || 'Untitled memory',
          note: draft.note || '',
          date: draft.date || todayISO(),
          time: draft.time || '',
          amount: draft.amount ?? null,
          quantity: draft.quantity ?? null,
          unit: draft.unit || '',
          mileage: draft.mileage ?? null,
          expiry: draft.expiry || null,
          warrantyUntil: draft.warrantyUntil || null,
          documentName: draft.documentName || ''
        });
        if (draft.reminder && draft.reminder.due) {
          store.addReminder({
            recordId: rec.id,
            title: draft.expiry ? `${rec.title} expires` : rec.title,
            due: draft.reminder.due,
            time: draft.reminder.time || '',
            type: draft.expiry ? 'expiry' : 'personal',
            repeat: 'none',
            private: false
          });
        }
        store.syncNotifications();
        closeFn();
        toast('Keepsy remembered it.', 'i-check');
        window.dispatchEvent(new CustomEvent('keepsy:record-added', { detail: rec.id }));
      };
    }
  });
  return close;
}

