/*
 * index-timing island — approximate-search latency and recall@10 across
 * tenant sizes, by when the tenant payload index was created.
 *
 * Measured data (one production run, 164,365 points total, Qdrant Cloud
 * 2 vCPU / 6.9 GB RAM). This is a static lookup by (state, tenant size) —
 * no live computation, no interpolation between the six measured sizes.
 *
 * Two plain bar gauges, not SVG: the numbers are the point of this island,
 * and SVG text set in viewBox units shrinks with the figure's rendered
 * width (it can drop under 12px on a narrow phone). Ordinary HTML text
 * stays legible at any width, so the labels, values and bar fills below
 * are all DOM elements sized in real CSS pixels.
 */

const STATES = [
  { id: 'start', label: 'Index from the start', phrase: 'index from the start', cat: '--qi-cat-1' },
  { id: 'none', label: 'No index', phrase: 'no index', cat: '--qi-cat-4' },
  { id: 'after', label: 'Index added after loading', phrase: 'index added after loading', cat: '--qi-cat-2' },
];
const SIZES = [500, 2000, 5000, 10000, 20000, 40000];

// [p50 approximate-search latency (ms), mean recall@10]
const DATA = {
  start: {
    500: [0.68, 1.0],
    2000: [1.04, 1.0],
    5000: [1.7, 1.0],
    10000: [1.81, 1.0],
    20000: [1.98, 1.0],
    40000: [1.39, 0.84],
  },
  none: {
    500: [80.17, 1.0],
    2000: [82.29, 1.0],
    5000: [83.11, 1.0],
    10000: [3.88, 0.05],
    20000: [3.98, 0.5],
    40000: [4.17, 0.85],
  },
  after: {
    500: [0.91, 1.0],
    2000: [1.72, 1.0],
    5000: [3.03, 1.0],
    10000: [0.83, 0.05],
    20000: [1.37, 0.5],
    40000: [1.36, 0.85],
  },
};

const LATENCY_MAX_MS = 90; // fixed linear scale; table max is 83.11 ms
const RECALL_WARN = 0.9; // recall at or below this flags the bar red

function fmtSize(n) {
  return n.toLocaleString('en-US');
}

function statusText(stateDef, size, latency, recall) {
  const lat = latency.toFixed(2);
  const rec = Math.round(recall * 100);
  const base = `At ${fmtSize(size)} points, with ${stateDef.phrase}, approximate search takes ${lat} ms and recall at 10 is ${rec}%.`;
  return recall <= RECALL_WARN ? `${base} That is a sharp drop from full recall.` : base;
}

export function mount(node) {
  node.classList.add('qi-it');

  let state = 'start';
  let size = 10000;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="When the tenant payload index was created">',
    STATES.map(
      (s) =>
        `<button type="button" class="qi-chip qi-it__state" data-state="${s.id}" aria-pressed="${s.id === state}">${s.label}</button>`,
    ).join(''),
    '    </div>',
    '  </div>',
    '  <div class="qi-controls">',
    '    <span class="qi-hint">Tenant size</span>',
    '    <div class="qi-group" role="group" aria-label="Tenant size, in points">',
    SIZES.map(
      (n) =>
        `<button type="button" class="qi-chip qi-it__size" data-size="${n}" aria-pressed="${n === size}">${fmtSize(n)}</button>`,
    ).join(''),
    '    </div>',
    '  </div>',
    '  <div class="qi-it__gauges">',
    '    <div class="qi-it__gauge">',
    '      <div class="qi-it__row">',
    '        <span class="qi-it__label">Approx-search latency (p50)</span>',
    '        <span class="qi-it__value qi-it__value--latency"></span>',
    '      </div>',
    '      <div class="qi-it__track"><div class="qi-it__fill qi-it__fill--latency"></div></div>',
    '    </div>',
    '    <div class="qi-it__gauge">',
    '      <div class="qi-it__row">',
    '        <span class="qi-it__label">Recall@10</span>',
    '        <span class="qi-it__value qi-it__value--recall"></span>',
    '      </div>',
    '      <div class="qi-it__track"><div class="qi-it__fill qi-it__fill--recall"></div></div>',
    '    </div>',
    '  </div>',
    '  <p class="qi-status qi-it__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const stateButtons = [...node.querySelectorAll('.qi-it__state')];
  const sizeButtons = [...node.querySelectorAll('.qi-it__size')];
  const latencyValue = node.querySelector('.qi-it__value--latency');
  const recallValue = node.querySelector('.qi-it__value--recall');
  const latencyFill = node.querySelector('.qi-it__fill--latency');
  const recallFill = node.querySelector('.qi-it__fill--recall');
  const statusEl = node.querySelector('.qi-it__status');

  function render() {
    const stateDef = STATES.find((s) => s.id === state);
    const [latency, recall] = DATA[state][size];

    latencyValue.textContent = `${latency.toFixed(2)} ms`;
    recallValue.textContent = `${Math.round(recall * 100)}%`;

    latencyFill.style.width = `${Math.max(2, Math.min(100, (latency / LATENCY_MAX_MS) * 100))}%`;
    latencyFill.style.background = `var(${stateDef.cat})`;

    recallFill.style.width = `${Math.max(2, recall * 100)}%`;
    recallFill.style.background = recall <= RECALL_WARN ? 'var(--qi-accent)' : `var(${stateDef.cat})`;

    statusEl.textContent = statusText(stateDef, size, latency, recall);
  }

  stateButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.state === state) return;
      state = btn.dataset.state;
      stateButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      render();
    });
  });

  sizeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const n = Number(btn.dataset.size);
      if (n === size) return;
      size = n;
      sizeButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      render();
    });
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
