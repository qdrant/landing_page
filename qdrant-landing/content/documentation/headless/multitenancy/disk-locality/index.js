/*
 * disk-locality island — interactive replacement for disk-locality.png.
 *
 * Measured p50 approximate-search latency (ms), on disk, from one production
 * run: 164,365 points, Qdrant Cloud 2 vCPU / 6.9 GB RAM. Compares a plain
 * keyword payload index against Qdrant's `is_tenant` tenant index across six
 * tenant sizes. The tenant index co-locates a tenant's points on disk, so a
 * filtered query reads fewer disk pages; the paired bars and the status
 * line make that gap visible as it narrows and widens across tenant sizes.
 *
 * Both bars render together for whichever tenant size is selected — the
 * index type is not a toggle. An earlier version let the reader switch
 * between "keyword" and "tenant" as mutually exclusive views, which hid the
 * comparison itself: the point is to see both numbers side by side, not to
 * flip a control and remember the previous one.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Both
 * series are a static lookup table: no latency value here is computed.
 */

const NS = 'http://www.w3.org/2000/svg';

const SIZES = [
  { value: 500, label: '500' },
  { value: 2000, label: '2,000' },
  { value: 5000, label: '5,000' },
  { value: 10000, label: '10,000' },
  { value: 20000, label: '20,000' },
  { value: 40000, label: '40,000' },
];

// p50 approximate-search latency in milliseconds, on disk. Measured, not
// computed: a static lookup table keyed by tenant size.
const LATENCY_MS = {
  500: { keyword: 0.95, tenant: 0.71 },
  2000: { keyword: 1.8, tenant: 1.13 },
  5000: { keyword: 3.25, tenant: 1.79 },
  10000: { keyword: 2.04, tenant: 1.78 },
  20000: { keyword: 2.11, tenant: 1.96 },
  40000: { keyword: 1.47, tenant: 1.36 },
};

// Total one-time setup, in seconds: load + indexing. Fixed, not per tenant size.
const SETUP = {
  keyword: { total: 250, load: 197, index: 53 },
  tenant: { total: 203, load: 167, index: 36 },
};

const INDEXES = [
  { id: 'keyword', label: 'Keyword index' },
  { id: 'tenant', label: 'Tenant index (<code>is_tenant</code>)' },
];

// Geometry (SVG user units).
const VB_W = 560;
const VB_H = 220;
const CHART_X0 = 56; // baseline / axis x
const CHART_X1 = 530; // chart right edge
const CHART_TOP = 70; // y for SCALE_MAX (leaves clearance under the frame label for bumped-up text)
const CHART_BOTTOM = 182; // y for 0 ms
const SCALE_MAX = 3.5; // ms, headroom above the largest measured value (3.25)
const BAR_W = 90;
const BAR_GAP = 40;
const PAIR_W = BAR_W * 2 + BAR_GAP;

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

function fmt(ms) {
  return ms.toFixed(2);
}

// Describes how much faster/slower `ratio` (always >= 1) makes something.
function phrase(ratio, word) {
  if (ratio >= 1.9) return `twice as ${word}`;
  if (ratio >= 1.5) return `almost twice as ${word}`;
  if (ratio >= 1.15) return `${ratio.toFixed(2)}× as ${word}`;
  return word === 'fast' ? 'slightly faster' : 'slightly slower';
}

export function mount(node) {
  node.classList.add('qi-dl');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-dl__legend" aria-hidden="true">',
    INDEXES.map((i) => `<span class="qi-dl__legend-item qi-dl__legend-item--${i.id}"><span class="qi-chip__swatch"></span>${i.label}</span>`).join(''),
    '    </div>',
    '  </div>',
    '  <div class="qi-controls">',
    '    <span class="qi-hint">Tenant size:</span>',
    '    <div class="qi-group" role="group" aria-label="Tenant size, in points">',
    SIZES.map((s) => `<button type="button" class="qi-chip qi-dl__size" data-size="${s.value}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-dl__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="Paired bar chart of on-disk filtered-search p50 latency in milliseconds, a keyword payload index against Qdrant's is_tenant tenant index, at the selected tenant size.">`,
    `    <rect class="qi-frame" x="2" y="8" width="${VB_W - 4}" height="196" rx="6"/>`,
    '    <text class="qi-frame-label" x="18" y="30">On-disk p50 latency</text>',
    '    <g class="qi-dl__grid"></g>',
    `    <line class="qi-axis" x1="${CHART_X0}" y1="${CHART_BOTTOM}" x2="${CHART_X1}" y2="${CHART_BOTTOM}"/>`,
    '    <rect class="qi-dl__bar qi-dl__bar--keyword" rx="4"/>',
    '    <text class="qi-dl__value qi-dl__value--keyword" text-anchor="middle"></text>',
    '    <rect class="qi-dl__bar qi-dl__bar--tenant" rx="4"/>',
    '    <text class="qi-dl__value qi-dl__value--tenant" text-anchor="middle"></text>',
    '  </svg>',
    '  <p class="qi-hint qi-dl__setup"></p>',
    '  <p class="qi-status qi-dl__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const gridG = node.querySelector('.qi-dl__grid');
  const bars = { keyword: node.querySelector('.qi-dl__bar--keyword'), tenant: node.querySelector('.qi-dl__bar--tenant') };
  const valueTexts = { keyword: node.querySelector('.qi-dl__value--keyword'), tenant: node.querySelector('.qi-dl__value--tenant') };
  const setupEl = node.querySelector('.qi-dl__setup');
  const statusEl = node.querySelector('.qi-dl__status');
  const sizeChips = [...node.querySelectorAll('.qi-dl__size')];

  // Baseline tick (0 ms).
  const zeroTick = el('text', { class: 'qi-label qi-dl__tick', x: CHART_X0 - 10, y: CHART_BOTTOM + 4, 'text-anchor': 'end' });
  zeroTick.textContent = '0';
  gridG.appendChild(zeroTick);

  // Lighter gridlines at 1, 2, 3 ms.
  [1, 2, 3].forEach((ms) => {
    const y = CHART_BOTTOM - (ms / SCALE_MAX) * (CHART_BOTTOM - CHART_TOP);
    gridG.appendChild(el('line', { class: 'qi-dl__gridline', x1: CHART_X0, y1: y, x2: CHART_X1, y2: y }));
    const tick = el('text', { class: 'qi-label qi-dl__tick', x: CHART_X0 - 10, y: y + 4, 'text-anchor': 'end' });
    tick.textContent = String(ms);
    gridG.appendChild(tick);
  });

  const unit = el('text', { class: 'qi-label', x: CHART_X0, y: CHART_TOP - 14 });
  unit.textContent = 'ms';
  gridG.appendChild(unit);

  setupEl.innerHTML =
    `Setup time (one time): keyword index ${SETUP.keyword.total} s ` +
    `(${SETUP.keyword.load} s load + ${SETUP.keyword.index} s indexing); ` +
    `tenant index ${SETUP.tenant.total} s (${SETUP.tenant.load} s load + ${SETUP.tenant.index} s indexing).`;

  let size = 5000;

  function render() {
    const data = LATENCY_MS[size];
    const pairX0 = CHART_X0 + (CHART_X1 - CHART_X0 - PAIR_W) / 2;
    const barX = { keyword: pairX0, tenant: pairX0 + BAR_W + BAR_GAP };

    ['keyword', 'tenant'].forEach((kind) => {
      const ms = data[kind];
      const h = Math.max(2, (ms / SCALE_MAX) * (CHART_BOTTOM - CHART_TOP));
      const y = CHART_BOTTOM - h;
      const x = barX[kind];

      bars[kind].setAttribute('x', x);
      bars[kind].setAttribute('width', BAR_W);
      bars[kind].setAttribute('y', y);
      bars[kind].setAttribute('height', h);

      valueTexts[kind].setAttribute('x', x + BAR_W / 2);
      valueTexts[kind].setAttribute('y', y - 10);
      valueTexts[kind].textContent = `${fmt(ms)} ms`;
    });

    sizeChips.forEach((c) => c.setAttribute('aria-pressed', String(Number(c.dataset.size) === size)));

    const sizeLabel = SIZES.find((s) => s.value === size).label;
    const ratio = Math.max(data.keyword, data.tenant) / Math.min(data.keyword, data.tenant);
    const tenantFaster = data.tenant <= data.keyword;
    statusEl.textContent = `At ${sizeLabel} points, the tenant index is ${phrase(ratio, tenantFaster ? 'fast' : 'slow')} (${fmt(data.tenant)} ms against ${fmt(data.keyword)} ms).`;
  }

  sizeChips.forEach((chip) =>
    chip.addEventListener('click', () => {
      size = Number(chip.dataset.size);
      render();
    }),
  );

  render();

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
