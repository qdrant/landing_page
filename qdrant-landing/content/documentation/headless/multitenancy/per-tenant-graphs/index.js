/*
 * per-tenant-graphs island — one real production run (164,365 points,
 * Qdrant Cloud 2 vCPU / 6.9 GB RAM). Toggles Qdrant's `m=0` + `payload_m=16`
 * per-tenant-graphs HNSW setting and shows the measured tradeoff: turning it
 * on barely changes one-time collection setup time (load + indexing) but
 * collapses recall@10 for a query that does not filter by tenant, because
 * that query searches the small per-tenant graphs, which have little
 * connectivity between them.
 *
 * Two plain bar gauges, not SVG (same reasoning as index-timing, the sibling
 * island for this same run): the numbers are the point, and SVG text set in
 * viewBox units shrinks with the figure's rendered width, which can drop it
 * under 12px on a narrow phone. Ordinary HTML text stays legible at any
 * width. Four baked constants below, no computation.
 */

const OFF = { load: 286, index: 21, setup: 307, recall: 0.996 }; // default HNSW graph
const ON = { load: 256, index: 29, setup: 285, recall: 0.237 }; // m=0, payload_m=16, per-tenant graphs

const SETUP_MAX = 320; // s, fixed linear scale for the setup-time bar (headroom above 307)

function pct(x) {
  return `${(x * 100).toFixed(1)}%`;
}

export function mount(node) {
  node.classList.add('qi-ptg');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <button type="button" class="qi-chip qi-ptg__toggle" aria-pressed="false">',
    '      <span class="qi-switch__track"><span class="qi-switch__knob"></span></span>',
    '      <span class="qi-ptg__toggle-label">Per-tenant graphs (m=0) = <b>false</b></span>',
    '    </button>',
    '  </div>',
    '  <div class="qi-ptg__gauges">',
    '    <div class="qi-ptg__gauge">',
    '      <div class="qi-ptg__row">',
    '        <span class="qi-ptg__label">Setup time (load + index)</span>',
    '        <span class="qi-ptg__value qi-ptg__value--setup"></span>',
    '      </div>',
    '      <div class="qi-ptg__track"><div class="qi-ptg__fill qi-ptg__fill--setup"></div></div>',
    '    </div>',
    '    <div class="qi-ptg__gauge">',
    '      <div class="qi-ptg__row">',
    '        <span class="qi-ptg__label">Recall@10 (no tenant filter)</span>',
    '        <span class="qi-ptg__value qi-ptg__value--recall"></span>',
    '      </div>',
    '      <div class="qi-ptg__track"><div class="qi-ptg__fill qi-ptg__fill--recall"></div></div>',
    '    </div>',
    '  </div>',
    '  <p class="qi-status qi-status--2 qi-ptg__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const toggle = node.querySelector('.qi-ptg__toggle');
  const toggleBool = toggle.querySelector('.qi-ptg__toggle-label b');
  const setupValue = node.querySelector('.qi-ptg__value--setup');
  const recallValue = node.querySelector('.qi-ptg__value--recall');
  const setupFill = node.querySelector('.qi-ptg__fill--setup');
  const recallFill = node.querySelector('.qi-ptg__fill--recall');
  const statusEl = node.querySelector('.qi-ptg__status');

  let on = false;
  let first = true;

  function render() {
    const data = on ? ON : OFF;

    toggle.setAttribute('aria-pressed', String(on));
    toggleBool.textContent = String(on);

    setupValue.textContent = `${data.setup} s`;
    recallValue.textContent = pct(data.recall);
    setupFill.style.width = `${(data.setup / SETUP_MAX) * 100}%`;
    recallFill.style.width = `${data.recall * 100}%`;

    if (first) {
      statusEl.textContent =
        `Default HNSW graph (m=0 off): setup time ${OFF.setup} s (${OFF.load} s load + ${OFF.index} s indexing), ` +
        `unfiltered-query recall ${pct(OFF.recall)}.`;
    } else if (on) {
      statusEl.textContent =
        `Setup time barely changed (${OFF.setup} s to ${ON.setup} s), but a search with no tenant filter now ` +
        `returns mostly wrong results (${pct(OFF.recall)} to ${pct(ON.recall)} recall).`;
    } else {
      statusEl.textContent =
        `Setup time barely changed (${ON.setup} s to ${OFF.setup} s), and unfiltered-query recall recovers ` +
        `(${pct(ON.recall)} to ${pct(OFF.recall)}).`;
    }
  }

  toggle.addEventListener('click', () => {
    on = !on;
    first = false;
    render();
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
