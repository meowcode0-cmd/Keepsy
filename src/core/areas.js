/* Keepsy — area definitions: identity, palette anchors, kinds, copy.
   Palette anchors are duplicated from CSS so JS can theme contextual details. */

export const AREAS = [
  {
    slug: 'health', name: 'Health', icon: 'i-heart', palette: ['#46364F', '#F6EFE8', '#C69B91', '#A4A58C'],
    kicker: 'Body & mind', blurb: 'Symptoms, medicines, appointments and the things you want to keep an eye on.',
    unit: 'entries', empty: 'No health notes yet. Add a symptom, a medicine or an appointment — Keepsy will remember the date for you.',
    kinds: [
      { id: 'symptom', label: 'Symptom', icon: 'i-heart', fields: ['date', 'time'] },
      { id: 'appointment', label: 'Appointment', icon: 'i-calendar', fields: ['date', 'time', 'reminder'] },
      { id: 'medicine', label: 'Medicine', icon: 'i-doc', fields: ['date', 'expiry', 'quantity', 'reminder'] },
      { id: 'measurement', label: 'Measurement', icon: 'i-target', fields: ['date', 'quantity', 'unit'] },
      { id: 'report', label: 'Report', icon: 'i-doc', fields: ['date', 'document'] },
      { id: 'routine', label: 'Routine', icon: 'i-repeat', fields: ['reminder'] }
    ],
    stats: ['records', 'upcoming', 'expiring']
  },
  {
    slug: 'beauty', name: 'Beauty & Grooming', icon: 'i-sparkle', palette: ['#49342F', '#FAF4EC', '#C69B91', '#E8D8BD'],
    kicker: 'Rituals & care', blurb: 'Products, appointments and the quiet upkeep of feeling like yourself.',
    unit: 'entries', empty: 'Nothing here yet. Log a haircut, a product you love, or when it will need replacing.',
    kinds: [
      { id: 'product', label: 'Product', icon: 'i-sparkle', fields: ['date', 'amount', 'expiry', 'replacement'] },
      { id: 'appointment', label: 'Appointment', icon: 'i-calendar', fields: ['date', 'time', 'amount', 'reminder'] },
      { id: 'routine', label: 'Routine', icon: 'i-repeat', fields: ['reminder'] },
      { id: 'purchase', label: 'Purchase', icon: 'i-receipt', fields: ['date', 'amount', 'quantity', 'amountOnly'] }
    ],
    stats: ['records', 'spent', 'upcoming']
  },
  {
    slug: 'home', name: 'Home', icon: 'i-home', palette: ['#35241F', '#F8F2E8', '#B58A62', '#E9DDCD'],
    kicker: 'The place you keep', blurb: 'Appliances, warranties, servicing and the small repairs that keep a home humming.',
    unit: 'things', empty: 'No home records yet. Add an appliance, a warranty, or the last time something was serviced.',
    kinds: [
      { id: 'appliance', label: 'Appliance', icon: 'i-home', fields: ['date', 'amount', 'warranty', 'quantity'] },
      { id: 'maintenance', label: 'Maintenance', icon: 'i-repeat', fields: ['date', 'amount', 'reminder'] },
      { id: 'repair', label: 'Repair', icon: 'i-edit', fields: ['date', 'amount', 'document'] },
      { id: 'purchase', label: 'Purchase', icon: 'i-receipt', fields: ['date', 'amount', 'warranty'] }
    ],
    stats: ['records', 'spent', 'upcoming', 'warranties']
  },
  {
    slug: 'food', name: 'Food & Groceries', icon: 'i-leaf', palette: ['#344338', '#F8F2E8', '#A4A58C', '#B58A62'],
    kicker: 'What you bring home', blurb: 'Groceries, quantities, the things you buy again and again, and what expires soon.',
    unit: 'entries', empty: 'No groceries yet. Tell Keepsy what you bought and it will remember the quantity.',
    kinds: [
      { id: 'grocery', label: 'Grocery', icon: 'i-leaf', fields: ['date', 'amount', 'quantity', 'unit', 'expiry'] },
      { id: 'pantry', label: 'Pantry item', icon: 'i-grid', fields: ['date', 'quantity', 'unit', 'expiry'] },
      { id: 'meal', label: 'Meal', icon: 'i-heart', fields: ['date', 'noteOnly'] }
    ],
    stats: ['records', 'spent', 'expiring']
  },
  {
    slug: 'education', name: 'Education', icon: 'i-book', palette: ['#26384E', '#EEE8DD', '#B5C7D2', '#B58A62'],
    kicker: 'Still learning', blurb: 'Courses, subjects, assignments, exams and certificates worth keeping.',
    unit: 'entries', empty: 'Nothing saved yet. Add a course, an assignment or an exam date to begin.',
    kinds: [
      { id: 'course', label: 'Course', icon: 'i-book', fields: ['date', 'amount', 'document'] },
      { id: 'assignment', label: 'Assignment', icon: 'i-edit', fields: ['date', 'time', 'reminder'] },
      { id: 'exam', label: 'Exam', icon: 'i-target', fields: ['date', 'time', 'reminder'] },
      { id: 'certificate', label: 'Certificate', icon: 'i-doc', fields: ['date', 'document'] },
      { id: 'note', label: 'Note', icon: 'i-list', fields: ['date', 'noteOnly'] }
    ],
    stats: ['records', 'upcoming', 'due']
  },
  {
    slug: 'work', name: 'Work', icon: 'i-briefcase', palette: ['#284A48', '#EEE8DD', '#A4A58C', '#A88763'],
    kicker: 'The work you do', blurb: 'Milestones, notes and records from your working life. Personal, not corporate.',
    unit: 'entries', empty: 'No work records yet. Save a milestone, a note or a document you will want later.',
    kinds: [
      { id: 'milestone', label: 'Milestone', icon: 'i-target', fields: ['date', 'noteOnly'] },
      { id: 'note', label: 'Note', icon: 'i-list', fields: ['date', 'noteOnly'] },
      { id: 'document', label: 'Document', icon: 'i-doc', fields: ['date', 'document'] },
      { id: 'meeting', label: 'Meeting', icon: 'i-users', fields: ['date', 'time'] }
    ],
    stats: ['records', 'upcoming']
  },
  {
    slug: 'vehicles', name: 'Vehicles', icon: 'i-car', palette: ['#283B46', '#E9DDCD', '#B58A62', '#AEBFC7'],
    kicker: 'Miles & maintenance', blurb: 'Fuel, servicing, insurance and the paperwork that lives in the glovebox.',
    unit: 'entries', empty: 'No vehicle records yet. Start with a fill-up, a service or your insurance renewal date.',
    kinds: [
      { id: 'fuel', label: 'Fuel', icon: 'i-car', fields: ['date', 'amount', 'quantity', 'unit', 'mileage'] },
      { id: 'service', label: 'Service', icon: 'i-repeat', fields: ['date', 'amount', 'mileage', 'reminder', 'document'] },
      { id: 'repair', label: 'Repair', icon: 'i-edit', fields: ['date', 'amount', 'document'] },
      { id: 'insurance', label: 'Insurance', icon: 'i-shield', fields: ['date', 'expiry', 'amount', 'reminder'] },
      { id: 'document', label: 'Document', icon: 'i-doc', fields: ['date', 'expiry', 'document'] }
    ],
    stats: ['records', 'spent', 'upcoming', 'expiring']
  },
  {
    slug: 'finance', name: 'Finance', icon: 'i-wallet', palette: ['#332823', '#F8F2E8', '#B58A62', '#E9DDCD'],
    kicker: 'Money, quietly', blurb: 'Expenses attached to real events, recurring costs and a calm monthly picture.',
    unit: 'entries', empty: 'Nothing recorded yet. Add an expense, or let Quick Add do it when you buy something.',
    kinds: [
      { id: 'expense', label: 'Expense', icon: 'i-receipt', fields: ['date', 'amount', 'noteOnly'] },
      { id: 'recurring', label: 'Recurring', icon: 'i-repeat', fields: ['date', 'amount', 'reminder'] }
    ],
    stats: ['records', 'spent', 'month', 'upcoming']
  },
  {
    slug: 'documents', name: 'Documents', icon: 'i-doc', palette: ['#414B4F', '#F4EFE6', '#713D43', '#B5C7D2'],
    kicker: 'Paper, remembered', blurb: 'Receipts, warranties, IDs and reports — with the date they matter.',
    unit: 'documents', empty: 'No documents saved yet. Note what you have and when it expires; the file stays where it is.',
    kinds: [
      { id: 'receipt', label: 'Receipt', icon: 'i-receipt', fields: ['date', 'amount'] },
      { id: 'warranty', label: 'Warranty', icon: 'i-shield', fields: ['date', 'expiry', 'amount'] },
      { id: 'id', label: 'Identity', icon: 'i-doc', fields: ['date', 'expiry', 'reminder'] },
      { id: 'certificate', label: 'Certificate', icon: 'i-doc', fields: ['date', 'expiry'] },
      { id: 'report', label: 'Report', icon: 'i-list', fields: ['date'] }
    ],
    stats: ['records', 'expiring', 'expired']
  },
  {
    slug: 'family', name: 'Family', icon: 'i-users', palette: ['#713D43', '#F8F2E8', '#C69B91', '#E9DDCD'],
    kicker: 'The people close', blurb: 'Birthdays, small memories and the dates you never want to miss.',
    unit: 'entries', empty: 'Nothing yet. Add a birthday, an anniversary or a memory worth keeping.',
    kinds: [
      { id: 'date', label: 'Important date', icon: 'i-calendar', fields: ['date', 'repeatYearly'] },
      { id: 'memory', label: 'Memory', icon: 'i-heart', fields: ['date', 'noteOnly'] },
      { id: 'note', label: 'Note', icon: 'i-list', fields: ['date', 'noteOnly'] }
    ],
    stats: ['records', 'upcoming']
  },
  {
    slug: 'pets', name: 'Pets', icon: 'i-paw', palette: ['#304B3F', '#E9DDCD', '#B58A62', '#A4A58C'],
    kicker: 'Small companions', blurb: 'Vet visits, vaccinations, food and the little routines that matter.',
    unit: 'entries', empty: 'No pet records yet. Add a vaccination date or the food you last bought.',
    kinds: [
      { id: 'appointment', label: 'Vet visit', icon: 'i-calendar', fields: ['date', 'time', 'amount', 'reminder'] },
      { id: 'vaccination', label: 'Vaccination', icon: 'i-shield', fields: ['date', 'expiry', 'reminder'] },
      { id: 'purchase', label: 'Purchase', icon: 'i-receipt', fields: ['date', 'amount', 'quantity'] },
      { id: 'routine', label: 'Routine', icon: 'i-repeat', fields: ['reminder'] }
    ],
    stats: ['records', 'spent', 'upcoming']
  },
  {
    slug: 'personal', name: 'Personal', icon: 'i-moon', palette: ['#46364F', '#F6EFE8', '#B9A995', '#E8D8BD'],
    kicker: 'Just for you', blurb: 'Notes, routines and milestones that belong to you alone.',
    unit: 'entries', empty: 'A blank page. Write a note, a routine, or something you want to remember about now.',
    kinds: [
      { id: 'note', label: 'Note', icon: 'i-list', fields: ['date', 'noteOnly'] },
      { id: 'routine', label: 'Routine', icon: 'i-repeat', fields: ['reminder'] },
      { id: 'milestone', label: 'Milestone', icon: 'i-target', fields: ['date', 'noteOnly'] },
      { id: 'memory', label: 'Memory', icon: 'i-heart', fields: ['date', 'noteOnly'] }
    ],
    stats: ['records', 'upcoming']
  },
  {
    slug: 'travel', name: 'Travel & Places', icon: 'i-plane', palette: ['#254F53', '#E9DDCD', '#B7C9D6', '#B58A62'],
    kicker: 'Places you have been', blurb: 'Trips, dates, tickets and the memories attached to somewhere else.',
    unit: 'entries', empty: 'No trips yet. Save a place you went, or one you are planning.',
    kinds: [
      { id: 'trip', label: 'Trip', icon: 'i-plane', fields: ['date', 'amount'] },
      { id: 'place', label: 'Place', icon: 'i-pin', fields: ['date', 'noteOnly'] },
      { id: 'document', label: 'Booking / ticket', icon: 'i-doc', fields: ['date', 'amount', 'document'] },
      { id: 'memory', label: 'Memory', icon: 'i-heart', fields: ['date', 'noteOnly'] }
    ],
    stats: ['records', 'spent', 'upcoming']
  },
  {
    slug: 'hobbies', name: 'Hobbies & Projects', icon: 'i-palette', palette: ['#713D43', '#F8F2E8', '#C69B91', '#E9DDCD'],
    kicker: 'Made for the joy of it', blurb: 'Projects, materials, milestones — the things you do because you want to.',
    unit: 'projects', empty: 'Nothing yet. Start a project or note the materials you bought for one.',
    kinds: [
      { id: 'project', label: 'Project', icon: 'i-palette', fields: ['date', 'noteOnly'] },
      { id: 'purchase', label: 'Materials', icon: 'i-receipt', fields: ['date', 'amount', 'quantity'] },
      { id: 'milestone', label: 'Milestone', icon: 'i-target', fields: ['date', 'noteOnly'] }
    ],
    stats: ['records', 'spent']
  },
  {
    slug: 'goals', name: 'Goals & Milestones', icon: 'i-target', palette: ['#26384E', '#F4EBDD', '#C9A777', '#A4A58C'],
    kicker: 'Where you are going', blurb: 'Quiet intentions with a date attached. No scores, no streaks.',
    unit: 'goals', empty: 'No goals yet. Write one down with a gentle target date.',
    kinds: [
      { id: 'goal', label: 'Goal', icon: 'i-target', fields: ['date', 'reminder'] },
      { id: 'milestone', label: 'Milestone', icon: 'i-star', fields: ['date', 'noteOnly'] }
    ],
    stats: ['records', 'upcoming']
  },
  {
    slug: 'other', name: 'Other', icon: 'i-grid', palette: ['#485051', '#F4EBDD', '#969780', '#B7C9D6'],
    kicker: 'Everything else', blurb: 'A flexible place for what does not fit neatly anywhere.',
    unit: 'entries', empty: 'Nothing here yet. Keepsy is happy to hold the odds and ends.',
    kinds: [
      { id: 'item', label: 'Item', icon: 'i-grid', fields: ['date', 'amount', 'quantity'] },
      { id: 'note', label: 'Note', icon: 'i-list', fields: ['date', 'noteOnly'] },
      { id: 'event', label: 'Event', icon: 'i-calendar', fields: ['date', 'time', 'reminder'] }
    ],
    stats: ['records', 'spent', 'upcoming']
  }
];

export const AREA_MAP = Object.fromEntries(AREAS.map((a) => [a.slug, a]));

export const PRIVATE_AREA = {
  slug: 'private', name: 'Private Space', icon: 'i-eye-off',
  palette: ['#392D3F', '#F6EFE8', '#B98292', '#B9A995'],
  kicker: 'Only you', blurb: 'A quieter room. Nothing here surfaces on Home, in Insights or on a lock screen.',
  unit: 'entries', empty: 'This space is empty. Anything you keep here stays out of the rest of Keepsy.',
  kinds: [
    { id: 'note', label: 'Private note', icon: 'i-list', fields: ['date', 'noteOnly'] },
    { id: 'reminder', label: 'Private reminder', icon: 'i-bell', fields: ['date', 'reminder'] },
    { id: 'tracking', label: 'Cycle / tracking', icon: 'i-moon', fields: ['date', 'noteOnly'] },
    { id: 'medicine', label: 'Medicine', icon: 'i-doc', fields: ['date', 'expiry'] }
  ],
  stats: ['records']
};

export const AREA_INDEX = [...AREAS, PRIVATE_AREA];

export const getArea = (slug) => (slug === 'private' ? PRIVATE_AREA : AREA_MAP[slug] || null);

export const ALL_FIELDS = {
  date: 'Date', time: 'Time', amount: 'Amount', quantity: 'Quantity',
  unit: 'Unit', mileage: 'Mileage', expiry: 'Expiry', warranty: 'Warranty until',
  document: 'Document', reminder: 'Reminder', noteOnly: null, amountOnly: null,
  replacement: 'Replacement reminder', repeatYearly: 'Repeats yearly'
};

export const KIND_LABEL = (() => {
  const m = {};
  for (const a of AREA_INDEX) for (const k of a.kinds) m[`${a.slug}:${k.id}`] = k.label;
  return m;
})();

export function kindsFor(areaSlug) {
  const a = getArea(areaSlug);
  return a ? a.kinds : [];
}
