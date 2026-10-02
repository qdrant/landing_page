/*
 * blue-green-migration island: interactive replacement for the static
 * embedding-model-migration.png in the "Migrate to a New Embedding Model"
 * tutorial.
 *
 * The reader steps through the five stages of the blue-green migration and
 * sees which services and collections are active at each one: create the new
 * collection, enable dual writes, migrate existing points, switch search, and
 * wrap up. The bars under the collections are illustrative, not measured.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Two
 * layouts: a wide one (three columns) and a narrow one (two columns) so labels
 * stay readable on phones.
 */

const NS = 'http://www.w3.org/2000/svg';
const WIDE_MIN = 560; // container px at which the wide layout keeps text >= 12px

// Which parts are active at each step. `fill` is the illustrative share of the
// points already present in the new collection; `search` is where queries go.
const ALL = ['app', 'oldSvc', 'oldColl', 'newSvc', 'newColl', 'mig', 'fOldW', 'fOldS', 'fNewW', 'fNewS', 'fRead', 'fEmb', 'fIns'];
const CORE = ['app', 'oldSvc', 'oldColl', 'fOldW', 'fOldS', 'newColl'];
const DUAL = [...CORE, 'newSvc', 'fNewW', 'fNewS'];
const MIGRATE = [...DUAL, 'mig', 'fRead', 'fEmb', 'fIns'];
const STEPS = [
  {
    label: '1 Create',
    on: CORE,
    fill: 0,
    search: 'old',
    text: '<b>Step 1: Create the new collection.</b> It is empty and sized for the new model. Updates and search still go only to the current collection.',
  },
  {
    label: '2 Dual writes',
    on: DUAL,
    fill: 0.06,
    search: 'old',
    text: '<b>Step 2: Enable dual writes.</b> Every update event is embedded once per model and written to both collections. The new collection only holds the new writes so far.',
  },
  {
    label: '3 Migrate',
    on: MIGRATE,
    fill: 1,
    search: 'old',
    text: '<b>Step 3: Migrate existing points.</b> The migration service reads the current collection, embeds each point with the new model, and inserts it only if the ID is not there yet, so it never overwrites a newer dual write.',
  },
  {
    label: '4 Switch search',
    on: MIGRATE,
    fill: 1,
    search: 'new',
    text: '<b>Step 4: Switch search.</b> After comparing retrieval quality, point search at the new collection and the new model. Dual writes keep the current collection up to date, so you can roll back.',
  },
  {
    label: '5 Wrap up',
    on: ['app', 'newSvc', 'newColl', 'fNewW', 'fNewS'],
    fill: 1,
    search: 'new',
    text: '<b>Step 5: Wrap up.</b> After an observation period, turn off dual writes. The current collection stops receiving updates: take a snapshot if you want a restore option, then delete it.',
  },
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

// Box geometry and flow paths for both layouts (viewBox units).
function layoutFor(wide) {
  if (wide) {
    return {
      w: 680,
      h: 330,
      boxes: {
        app: { x: 0, y: 130, w: 110, h: 70, c: 'old', lines: ['Application'] },
        oldSvc: { x: 230, y: 16, w: 150, h: 70, c: 'old', lines: ['Embedding', 'Service'] },
        oldColl: { x: 500, y: 16, w: 150, h: 70, c: 'old', lines: ['Qdrant', 'Collection'], coll: true },
        newSvc: { x: 230, y: 244, w: 150, h: 70, c: 'new', lines: ['New Embedding', 'Service'] },
        newColl: { x: 500, y: 244, w: 150, h: 70, c: 'new', lines: ['New Qdrant', 'Collection'], coll: true },
        mig: { x: 500, y: 130, w: 150, h: 70, c: 'mig', lines: ['Migration', 'Service'] },
      },
      flows: {
        fOldW: { c: 'old', d: 'M110 165 H170 V51 H228' },
        fNewW: { c: 'new', d: 'M110 165 H170 V279 H228' },
        fOldS: { c: 'old', d: 'M380 51 H498' },
        fNewS: { c: 'new', d: 'M380 279 H498' },
        fRead: { c: 'mig', d: 'M575 86 V128', label: [{ x: 583, y: 113, a: 'start', t: 'read' }] },
        fIns: { c: 'mig', d: 'M575 200 V242', label: [{ x: 567, y: 226, a: 'end', t: 'insert if absent' }] },
        fEmb: { c: 'mig', d: 'M500 165 H305 V242', label: [{ x: 402, y: 157, a: 'middle', t: 'new embedding' }] },
      },
    };
  }
  return {
    w: 360,
    h: 402,
    boxes: {
      app: { x: 110, y: 0, w: 140, h: 60, c: 'old', lines: ['Application'] },
      oldSvc: { x: 0, y: 100, w: 140, h: 60, c: 'old', lines: ['Embedding', 'Service'] },
      newSvc: { x: 220, y: 100, w: 140, h: 60, c: 'new', lines: ['New Embedding', 'Service'] },
      oldColl: { x: 0, y: 200, w: 140, h: 76, c: 'old', lines: ['Qdrant', 'Collection'], coll: true },
      newColl: { x: 220, y: 200, w: 140, h: 76, c: 'new', lines: ['New Qdrant', 'Collection'], coll: true },
      mig: { x: 110, y: 340, w: 140, h: 60, c: 'mig', lines: ['Migration', 'Service'] },
    },
    flows: {
      fOldW: { c: 'old', d: 'M150 60 V80 H70 V98' },
      fNewW: { c: 'new', d: 'M210 60 V80 H290 V98' },
      fOldS: { c: 'old', d: 'M70 160 V198' },
      fNewS: { c: 'new', d: 'M290 160 V198' },
      fRead: { c: 'mig', d: 'M70 276 V308 H130 V338', label: [{ x: 78, y: 300, a: 'start', t: 'read' }] },
      fIns: { c: 'mig', d: 'M230 340 V308 H330 V278', label: [{ x: 322, y: 300, a: 'end', t: 'insert if absent' }] },
      fEmb: {
        c: 'mig',
        d: 'M180 340 V130 H218',
        label: [
          { x: 188, y: 176, a: 'start', t: 'new' },
          { x: 188, y: 192, a: 'start', t: 'embedding' },
        ],
      },
    },
  };
}

export function mount(node) {
  node.classList.add('qi-mg');
  const uid = Math.random().toString(36).slice(2, 7);

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Migration step">',
    STEPS.map((s, i) => `<button type="button" class="qi-chip qi-mg__step" data-step="${i}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-mg__svg" role="img" aria-label="Blue-green embedding model migration. An application sends update events to the current embedding service and collection and, during migration, to a new embedding service and collection. A migration service reads the current collection, embeds with the new model, and inserts into the new collection only if the point does not exist."></svg>',
    '  <p class="qi-status qi-mg__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-mg__svg');
  const statusEl = node.querySelector('.qi-mg__status');
  const stepBtns = [...node.querySelectorAll('.qi-mg__step')];

  let step = 0;
  let layout = '';
  let parts = {}; // key -> <g>
  let bars = []; // { rect, w }
  let badges = {}; // 'old' | 'new' -> <g>

  function build() {
    svg.replaceChildren();
    parts = {};
    bars = [];
    badges = {};
    const wide = layout === 'wide';
    const L = layoutFor(wide);

    const defs = el('defs', {});
    ['old', 'new', 'mig'].forEach((c) => {
      const m = el('marker', { id: `qi-mg-${uid}-${c}`, markerUnits: 'userSpaceOnUse', markerWidth: 10, markerHeight: 10, refX: 9, refY: 5, orient: 'auto' });
      m.appendChild(el('path', { d: 'M0 0 L10 5 L0 10 z', class: `qi-mg__head qi-mg__head--${c}` }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);

    // Flows first so boxes draw over their ends.
    Object.entries(L.flows).forEach(([key, f]) => {
      const g = el('g', { class: 'qi-mg__flow' });
      g.appendChild(el('path', { class: `qi-mg__line qi-mg__line--${f.c}`, d: f.d, fill: 'none', 'marker-end': `url(#qi-mg-${uid}-${f.c})` }));
      (f.label || []).forEach((l) => g.appendChild(el('text', { class: `qi-label qi-mg__flow-label qi-mg__flow-label--${f.c}`, x: l.x, y: l.y, 'text-anchor': l.a }, l.t)));
      svg.appendChild(g);
      parts[key] = g;
    });

    Object.entries(L.boxes).forEach(([key, b]) => {
      const g = el('g', { class: 'qi-mg__box' });
      g.appendChild(el('rect', { class: `qi-mg__rect qi-mg__rect--${b.c}`, x: b.x + 0.5, y: b.y + 0.5, width: b.w - 1, height: b.h - 1, rx: 8 }));
      const cx = b.x + b.w / 2;
      const top = b.coll ? b.y + 22 : b.lines.length === 1 ? b.y + b.h / 2 + 5 : b.y + b.h / 2 - 3;
      b.lines.forEach((t, i) => g.appendChild(el('text', { class: `qi-title qi-mg__box-text qi-mg__box-text--${b.c}`, x: cx, y: top + i * 17, 'text-anchor': 'middle' }, t)));
      if (b.coll) {
        const bw = b.w - 24;
        g.appendChild(el('rect', { class: 'qi-mg__track', x: b.x + 12, y: b.y + b.h - 22, width: bw, height: 8, rx: 4 }));
        const fillRect = el('rect', { class: `qi-mg__fill qi-mg__fill--${b.c}`, x: b.x + 12, y: b.y + b.h - 22, width: 0, height: 8, rx: 4 });
        g.appendChild(fillRect);
        bars.push({ rect: fillRect, w: bw, key });
        // "search" badge straddling the top edge of the collection.
        const bg = el('g', { class: 'qi-mg__badge' });
        bg.appendChild(el('rect', { x: b.x + b.w - 68, y: b.y - 10, width: 64, height: 22, rx: 11 }));
        bg.appendChild(el('text', { x: b.x + b.w - 36, y: b.y + 6, 'text-anchor': 'middle' }, 'search'));
        g.appendChild(bg);
        badges[key === 'oldColl' ? 'old' : 'new'] = bg;
      }
      svg.appendChild(g);
      parts[key] = g;
    });

    svg.setAttribute('viewBox', `0 0 ${L.w} ${L.h}`);
    svg.classList.toggle('is-narrow', !wide);
  }

  function render() {
    const s = STEPS[step];
    const prev = step > 0 ? new Set(STEPS[step - 1].on) : new Set();
    const on = new Set(s.on);
    ALL.forEach((key) => {
      const g = parts[key];
      if (!g) return;
      g.classList.toggle('is-off', !on.has(key));
      g.classList.toggle('is-new', on.has(key) && (step === 0 ? key === 'newColl' : !prev.has(key)));
    });
    // The current collection is retired in the last step.
    parts.oldColl.classList.toggle('is-off', !on.has('oldColl') || step === STEPS.length - 1);
    bars.forEach((b) => b.rect.setAttribute('width', b.key === 'oldColl' ? b.w : b.w * s.fill));
    Object.entries(badges).forEach(([k, g]) => g.classList.toggle('is-active', k === s.search));
    stepBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === step)));
    statusEl.innerHTML = s.text;
  }

  function relayout(force) {
    const w = svg.getBoundingClientRect().width || WIDE_MIN;
    const next = w >= WIDE_MIN ? 'wide' : 'narrow';
    if (!force && next === layout) return;
    layout = next;
    build();
    render();
  }

  stepBtns.forEach((b) =>
    b.addEventListener('click', () => {
      step = Number(b.dataset.step);
      render();
    }),
  );

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => relayout(false)).observe(node);
  }

  relayout(true);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
