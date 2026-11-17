/* Keepsy — deterministic natural-language parser.
   No model, no claims of AI. Rules are explicit and testable. */

const NUM_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, fifty: 50, hundred: 100
};

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const STOP = new Set([
  'bought', 'buy', 'purchased', 'got', 'get', 'the', 'a', 'an', 'today', 'yesterday', 'tomorrow',
  'at', 'for', 'on', 'in', 'of', 'to', 'and', 'i', 'my', 'me', 'was', 'is', 'were', 'new',
  'some', 'from', 'with', 'rs', 'rupees', 'inr', 'paid', 'spent', 'cost', 'costs'
]);

const AREA_HINTS = {
  health: ['doctor', 'medicine', 'tablet', 'pill', 'symptom', 'fever', 'headache', 'clinic', 'hospital', 'checkup', 'prescription', 'dose', 'vaccine', 'physio', 'dentist', 'health'],
  beauty: ['shampoo', 'haircut', 'salon', 'facial', 'cream', 'serum', 'lipstick', 'grooming', 'beard', 'spa', 'makeup', 'conditioner', 'perfume', 'skincare'],
  home: ['ac', 'fridge', 'refrigerator', 'washing', 'machine', 'sofa', 'mattress', 'geyser', 'serviced', 'service', 'repair', 'plumber', 'electrician', 'warranty', 'appliance', 'microwave', 'fan', 'home'],
  food: ['grocery', 'groceries', 'milk', 'rice', 'eggs', 'vegetables', 'vegetable', 'bread', 'snack', 'kitchen', 'pantry', 'food', 'flour', 'oil', 'sugar', 'dal'],
  education: ['course', 'college', 'assignment', 'exam', 'semester', 'class', 'lecture', 'professor', 'syllabus', 'study', 'studied', 'certificate', 'university', 'notes', 'tuition'],
  work: ['office', 'work', 'meeting', 'client', 'project', 'deadline', 'salary', 'presentation', 'colleague', 'shift', 'interview'],
  vehicles: ['petrol', 'diesel', 'fuel', 'car', 'bike', 'scooter', 'scooty', 'servicing', 'mileage', 'tyre', 'tire', 'insurance', 'rc', 'vehicle', 'puc', 'motorcycle'],
  finance: ['expense', 'paid', 'bill', 'subscription', 'rent', 'emi', 'tax', 'bank', 'fee', 'recharge', 'electricity'],
  documents: ['passport', 'aadhaar', 'license', 'licence', 'document', 'receipt', 'invoice', 'certificate', 'policy', 'visa', 'id'],
  family: ['mom', 'mother', 'dad', 'father', 'sister', 'brother', 'family', 'birthday', 'anniversary', 'wife', 'husband', 'son', 'daughter', 'grandma', 'grandpa'],
  pets: ['dog', 'cat', 'puppy', 'kitten', 'pet', 'vet', 'vaccination', 'leash', 'litter'],
  personal: ['note', 'routine', 'journal', 'diary', 'meditation', 'yoga', 'habit'],
  travel: ['trip', 'travel', 'flight', 'train', 'ticket', 'hotel', 'goa', 'trip', 'visited', 'travelled', 'booking'],
  hobbies: ['project', 'paint', 'guitar', 'yarn', 'hobby', 'crochet', 'canvas', 'music', 'sketch', 'knitting'],
  goals: ['goal', 'target', 'milestone', 'plan', 'aim', 'resolution'],
  other: []
};

const KIND_HINTS = {
  fuel: ['petrol', 'diesel', 'fuel', 'filled', 'fill'],
  grocery: ['grocery', 'groceries', 'milk', 'rice', 'eggs', 'bread', 'vegetables', 'flour'],
  medicine: ['medicine', 'tablet', 'pill', 'syrup', 'dose'],
  appointment: ['appointment', 'doctor', 'dentist', 'clinic', 'vet', 'meeting'],
  service: ['serviced', 'servicing', 'service', 'maintenance'],
  maintenance: ['serviced', 'service', 'maintenance', 'cleaned'],
  exam: ['exam', 'test', 'viva'],
  assignment: ['assignment', 'homework', 'submission'],
  expense: ['paid', 'spent', 'expense', 'bill'],
  product: ['shampoo', 'cream', 'serum', 'perfume', 'product', 'conditioner'],
  purchase: ['bought', 'purchase', 'ordered'],
  trip: ['trip', 'travelled', 'visited', 'flight'],
  vaccination: ['vaccination', 'vaccine', 'shot'],
  insurance: ['insurance', 'policy', 'renewal']
};

const CURRENCY_RE = /(₹|rs\.?|inr|rupees?)\s*/i;
const AMOUNT_RE = /(?:₹|rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|inr|rupees?)/i;

const iso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const todayISO = () => iso(new Date());

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function nextWeekday(from, idx) {
  const d = new Date(from);
  const diff = (idx - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function parseQuantityUnit(text) {
  const m = text.match(/\b(\d+(?:\.\d+)?)\s*(l|ltr|litre|liter|litres|liters|ml|kg|kgs|g|gm|grams|pack|packs|pcs|pieces|bottle|bottles|tablets?|strips?|bags?|dozen)\b/i);
  if (!m) return {};
  const raw = m[1];
  const unitRaw = m[2].toLowerCase();
  const unitMap = {
    l: 'L', ltr: 'L', litre: 'L', liter: 'L', litres: 'L', liters: 'L', ml: 'ml',
    kg: 'kg', kgs: 'kg', g: 'g', gm: 'g', grams: 'g', pack: 'pack', packs: 'pack',
    pcs: 'pcs', pieces: 'pcs', bottle: 'bottle', bottles: 'bottle',
    tablet: 'tablet', tablets: 'tablet', strip: 'strip', strips: 'strip',
    bag: 'bag', bags: 'bag', dozen: 'dozen'
  };
  return { quantity: Number(raw), unit: unitMap[unitRaw] || unitRaw };
}

export function parseEntry(raw, now = new Date()) {
  const original = String(raw || '').trim();
  const text = original.replace(/\s+/g, ' ');
  const lower = text.toLowerCase();
  const result = {
    original, title: '', area: null, kind: null, date: iso(now), time: '',
    amount: null, quantity: null, unit: '', note: '', expiry: null,
    reminder: null, mileage: null, tokensRemoved: [], confidence: []
  };
  if (!text) return result;

  // ---- amount
  const am = text.match(AMOUNT_RE);
  if (am) {
    const rawNum = (am[1] || am[2] || '').replace(/,/g, '');
    const n = Number(rawNum);
    if (!Number.isNaN(n)) { result.amount = n; result.confidence.push('amount'); }
  } else {
    // bare amount at the end, e.g. "bought shampoo 450"
    const tail = text.match(/\b([\d,]{2,7})(?:\.\d{1,2})?\s*$/);
    if (tail) {
      const n = Number(tail[1].replace(/,/g, ''));
      if (n >= 10) { result.amount = n; result.confidence.push('amount'); }
    }
    const wordAmt = lower.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|fifty|hundred)\s+(?:rupees|rs)\b/);
    if (wordAmt) { result.amount = NUM_WORDS[wordAmt[1]]; result.confidence.push('amount'); }
  }

  // ---- quantity + unit
  const qu = parseQuantityUnit(text);
  if (qu.quantity) {
    // avoid mistaking the amount for a quantity when no unit present
    if (qu.unit || qu.quantity !== result.amount) {
      result.quantity = qu.quantity; result.unit = qu.unit || '';
    }
  }

  // ---- dates
  let date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let dateFound = false;
  let explicitTime = '';

  if (/\bday before yesterday\b/.test(lower)) { date = addDays(date, -2); dateFound = true; }
  else if (/\byesterday\b/.test(lower)) { date = addDays(date, -1); dateFound = true; }
  else if (/\btomorrow\b/.test(lower)) { date = addDays(date, 1); dateFound = true; }
  else if (/\btoday\b/.test(lower)) { dateFound = true; }
  else if (/\bnext week\b/.test(lower)) { date = addDays(date, 7); dateFound = true; }
  else if (/\bnext month\b/.test(lower)) {
    const d = new Date(date); d.setMonth(d.getMonth() + 1); date = d; dateFound = true;
  }

  if (/\bnext month\b/.test(lower) && /expir|expiry|expires|valid/.test(lower)) {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    result.expiry = iso(d);
    result.confidence.push('expiry');
  }
  const exp = lower.match(/(?:expires?|expiry|expiring|valid (?:till|until|upto))\s+(?:on\s+)?(?:(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?|(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+))/);
  if (exp) {
    let d = null;
    if (exp[1] && exp[2]) {
      const yr = exp[3] ? (exp[3].length === 2 ? 2000 + Number(exp[3]) : Number(exp[3])) : now.getFullYear();
      d = new Date(yr, Number(exp[2]) - 1, Number(exp[1]));
      if (!exp[3] && d < now) d = new Date(yr + 1, Number(exp[2]) - 1, Number(exp[1]));
    } else if (exp[4] && exp[5]) {
      const mi = MONTHS.findIndex((m) => m.startsWith(exp[5].slice(0, 3)));
      if (mi >= 0) d = new Date(now.getFullYear(), mi, Number(exp[4]));
    }
    if (d && !Number.isNaN(d.getTime())) { result.expiry = iso(d); result.confidence.push('expiry'); }
  }

  if (!dateFound) {
    const dm = lower.match(/\bon\s+(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)/);
    const dm2 = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
    const monName = dm?.[2] || dm2?.[2];
    const dayNum = dm?.[1] || dm2?.[1];
    if (monName && dayNum) {
      const mi = MONTHS.findIndex((m) => m.startsWith(monName.slice(0, 3)));
      if (mi >= 0) {
        let d = new Date(now.getFullYear(), mi, Number(dayNum));
        if (d < addDays(now, -1)) d = new Date(now.getFullYear() + 1, mi, Number(dayNum));
        date = d; dateFound = true; result.confidence.push('date');
      }
    } else {
      const wd = lower.match(/\b(?:on\s+|this\s+|next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
      if (wd) {
        const idx = WEEKDAYS.indexOf(wd[1]);
        if (idx >= 0) {
          date = /\bnext\s/.test(lower) ? nextWeekday(addDays(now, 1), idx) : nextWeekday(now, idx);
          dateFound = true; result.confidence.push('date');
        }
      }
    }
  }
  if (dateFound) result.confidence.push('date');

  // ---- time: "at 5", "5pm", "at 5:30 pm", "morning"
  const tm = lower.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  const tm2 = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  const pick = tm || tm2;
  if (pick) {
    let h = Number(pick[1]);
    const mi = Number(pick[2] || 0);
    const mer = pick[3];
    if (mer === 'pm' && h < 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    if (!mer && h <= 7) h += 12; // "at 5" in a personal context usually means afternoon/evening
    if (h >= 0 && h <= 23) {
      explicitTime = `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
      result.confidence.push('time');
    }
  } else if (/\bmorning\b/.test(lower)) explicitTime = '09:00';
  else if (/\bafternoon\b/.test(lower)) explicitTime = '15:00';
  else if (/\bevening\b/.test(lower)) explicitTime = '19:00';
  else if (/\bnight\b/.test(lower)) explicitTime = '21:00';

  result.time = explicitTime;
  result.date = result.expiry && /\bexpir|expiry|expires|valid\b/.test(lower) && !dateFound ? result.date : iso(date);

  // ---- mileage
  const mil = lower.match(/\b(?:at|odo|odometer|mileage)\s*([\d,]{3,7})\s*(?:km)?\b/);
  if (mil) { result.mileage = Number(mil[1].replace(/,/g, '')); result.confidence.push('mileage'); }

  // ---- area then kind
  let bestArea = null; let bestScore = 0;
  for (const [area, words] of Object.entries(AREA_HINTS)) {
    let score = 0;
    for (const w of words) if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower)) score += 1;
    if (score > bestScore) { bestScore = score; bestArea = area; }
  }
  result.area = bestArea || 'other';

  let bestKind = null; let kindScore = 0;
  for (const [kind, words] of Object.entries(KIND_HINTS)) {
    let score = 0;
    for (const w of words) if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower)) score += 1;
    if (score > kindScore) { kindScore = score; bestKind = kind; }
  }
  if (bestKind) {
    const { getArea } = { getArea: null };
    result.kind = bestKind;
  } else {
    result.kind = null;
  }

  // ---- reminder intent
  if (/\b(remind|reminder|due|deadline|appointment|expires?|renew|don'?t forget)\b/.test(lower)) {
    result.reminder = {
      due: result.expiry || result.date,
      time: result.time || '',
      note: ''
    };
    if (result.expiry) result.reminder.type = 'expiry';
    result.confidence.push('reminder');
  }

  // ---- title: strip numbers/currency/date words
  let title = text
    .replace(AMOUNT_RE, ' ')
    .replace(/\b(?:₹|rs\.?|inr|rupees?)\s*[\d,.]+/gi, ' ')
    .replace(/\b(today|tomorrow|yesterday|day before yesterday|next week|next month)\b/gi, ' ')
    .replace(/\b(?:expires?|expiry|expiring|valid till|valid until)\b[^,.;]*/gi, ' ')
    .replace(/\b(?:at|on)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, ' ')
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, ' ')
    .replace(/\b(?:for|rs|inr)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, '')
    .trim();

  const words = title.split(' ').filter(Boolean);
  const cleaned = words.filter((w) => !STOP.has(w.toLowerCase()));
  result.title = (cleaned.length ? cleaned : words).join(' ').slice(0, 90) || 'Untitled memory';
  result.title = result.title.charAt(0).toUpperCase() + result.title.slice(1);
  result.note = original;

  return result;
}

/* Map a parsed result into a valid area/kind pair. */
export function resolveKind(parsed, kinds) {
  if (!kinds.length) return null;
  const byId = kinds.find((k) => k.id === parsed.kind);
  if (byId) return byId;
  // sensible fallbacks by intent
  if (parsed.reminder) {
    const r = kinds.find((k) => ['appointment', 'goal', 'insurance', 'vaccination', 'exam', 'assignment'].includes(k.id));
    if (r) return r;
  }
  if (parsed.amount != null) {
    const a = kinds.find((k) => k.fields.includes('amount'));
    if (a) return a;
  }
  return kinds[0];
}

export const EXAMPLES = [
  'Bought shampoo ₹450',
  'Filled petrol ₹1200',
  'AC serviced today',
  'Medicine expires next month',
  'Started a new course',
  'Assignment due Friday',
  'Haircut today',
  'Doctor appointment tomorrow at 5'
];
