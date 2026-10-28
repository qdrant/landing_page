/*
 * datatype storage island for blog/qdrant-1.20-performance.
 *
 * A scatter plot of recall@100 against vector storage in MB, with one dot per
 * datatype or quantization.
 *
 * Values are averages over the three 1,536-dimension datasets of
 * modern-quantization-bench (ada-002, text-embedding-3-small and -large, 99,900
 * points each), at limit 100:
 *   - recall: mean recall@100, in percent;
 *   - latency: mean of the server-side p50, in ms;
 *   - storage: stored vector MB. Scalar and binary quantization keep the
 *     float32 originals next to the quantized copy, so they add the size of
 *     that copy (points x dimensions x bits / 8) to the 585 MB of originals.
 * Scalar and binary quantization run with rescoring and 2x oversampling. In the
 * benchmark their originals live on disk, which is what rescoring reads.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

const POINTS = [
  { id: 'float32', label: 'float32', color: 'var(--qi-muted)', recall: 94.8, storage: 585, latency: 1.9, place: { storage: 'up', latency: 'left' } },
  { id: 'turbo16', label: 'turbo16', color: 'var(--qi-cat-3)', recall: 95.0, storage: 293, latency: 2.1, place: { storage: 'up', latency: 'right' } },
  { id: 'turbo8', label: 'turbo8', color: 'var(--qi-cat-4)', recall: 95.4, storage: 147, latency: 2.0, place: { storage: 'up', latency: 'up' } },
  { id: 'turbo4', label: 'turbo4', color: 'var(--qi-cat-2)', recall: 94.0, storage: 74, latency: 1.1, place: { storage: 'up', latency: 'down' } },
  { id: 'scalar', label: 'scalar int8', color: 'var(--qi-cat-1)', recall: 98.0, storage: 732, latency: 105, place: { storage: 'left', latency: 'left' } },
  { id: 'binary', label: 'binary 1-bit', color: 'var(--qi-muted)', hollow: true, recall: 89.2, storage: 604, latency: 103, place: { storage: 'right', latency: 'left' } },
];

const VIEW = {
  key: 'storage',
  domain: [0, 800],
  ticks: [0, 200, 400, 600, 800],
  axis: 'vector storage (MB)',
  status:
    '<code>turbo8</code> stores the vectors in 147 MB, a quarter of <code>float32</code>, at the same recall. Scalar and binary quantization keep the <code>float32</code> originals next to the quantized copy, so they need more storage than <code>float32</code> alone.',
};

// Geometry (viewBox 520 x 400). The y axis starts at 88%, so it is labeled.
const VB = { w: 520, h: 400 };
const PLOT = { x: 56, y: 40, w: 444, h: 300 };
const Y_DOMAIN = [88, 99];
const Y_TICKS = [88, 90, 92, 94, 96, 98];
const R = 6;

function el(name, attrs, parent, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

export function mount(node) {
  node.classList.add('qi-dt');

  node.innerHTML = [
    '<div class="qi-fig">',
    `  <svg class="qi-svg qi-dt__svg" viewBox="0 0 ${VB.w} ${VB.h}" role="img"`,
    '    aria-label="Scatter plot of recall at 100 for float32, turbo16, turbo8, turbo4, scalar int8, and binary 1-bit quantization, against vector storage.">',
    '  </svg>',
    '  <p class="qi-status qi-dt__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-dt__svg');
  const statusEl = node.querySelector('.qi-dt__status');

  const y = (v) => PLOT.y + PLOT.h - ((v - Y_DOMAIN[0]) / (Y_DOMAIN[1] - Y_DOMAIN[0])) * PLOT.h;
  const xScale = (view) => {
    const f = view.log ? Math.log : (v) => v;
    const [lo, hi] = view.domain.map(f);
    return (v) => PLOT.x + ((f(v) - lo) / (hi - lo)) * PLOT.w;
  };

  // Y axis: gridlines and tick labels, 
  el('text', { class: 'qi-label', x: 0, y: 16 }, svg, 'recall@100 (%), axis starts at 88');
  Y_TICKS.forEach((t) => {
    el('line', { class: 'qi-dt__grid', x1: PLOT.x, x2: PLOT.x + PLOT.w, y1: y(t), y2: y(t) }, svg);
    el('text', { class: 'qi-label', x: PLOT.x - 8, y: y(t) + 4, 'text-anchor': 'end' }, svg, String(t));
  });
  el('line', { class: 'qi-axis', x1: PLOT.x, x2: PLOT.x + PLOT.w, y1: PLOT.y + PLOT.h, y2: PLOT.y + PLOT.h }, svg);

  // X axis.
  const xAxis = el('g', { class: 'qi-dt__xaxis' }, svg);

  const dots = POINTS.map((p) => {
    const g = el('g', { class: 'qi-dt__pt' }, svg);
    el('title', {}, g, p.label);
    el('circle', { class: p.hollow ? 'is-hollow' : '', r: R, fill: p.color }, g);
    const name = el('text', { class: 'qi-dt__name' }, g, p.label);
    return { p, g, name };
  });

  function render() {
    const view = VIEW;
    const id = 'storage';
    const x = xScale(view);

    xAxis.replaceChildren();
    view.ticks.forEach((t) => {
      el('line', { class: 'qi-axis', x1: x(t), x2: x(t), y1: PLOT.y + PLOT.h, y2: PLOT.y + PLOT.h + 5 }, xAxis);
      el('text', { class: 'qi-label', x: x(t), y: PLOT.y + PLOT.h + 20, 'text-anchor': 'middle' }, xAxis, String(t));
    });
    el('text', { class: 'qi-label qi-label--strong', x: PLOT.x + PLOT.w / 2, y: PLOT.y + PLOT.h + 44, 'text-anchor': 'middle' }, xAxis, view.axis);

    dots.forEach((d) => {
      d.g.style.transform = `translate(${x(d.p[view.key])}px, ${y(d.p.recall)}px)`;
      const at = d.p.place[id];
      d.name.setAttribute('x', at === 'left' ? -(R + 6) : at === 'right' ? R + 6 : 0);
      d.name.setAttribute('y', at === 'up' ? -(R + 7) : at === 'down' ? R + 17 : 4);
      d.name.setAttribute('text-anchor', at === 'left' ? 'end' : at === 'right' ? 'start' : 'middle');
    });
    statusEl.innerHTML = view.status;
  }

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
