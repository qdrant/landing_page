/*
 * calibration island: interactive replacement for per-coordinate-calibration.svg.
 *
 * TurboQuant's codebook is fixed for a N(0,1) distribution (here the 8
 * Lloyd-Max centroids). Real rotated coordinates are shifted and stretched
 * relative to it, so a long tail falls past the outermost centroid and is lost.
 * A per-coordinate (shift, scale) maps the data back onto the codebook grid.
 * Switch between before and after. The data distribution is illustrative (a
 * normal with a mean of 0.6 and a standard deviation of 1.5); the shares outside
 * the codebook are computed from it.
 */

const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

function watchNarrow(node, onChange, below = 700) {
  const is = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < below;
  };
  let narrow = is();
  node.classList.toggle('tq-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('tq-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

const CENTROIDS = [-2.152, -1.344, -0.756, -0.245, 0.245, 0.756, 1.344, 2.152]; // 3-bit Lloyd-Max for N(0,1)
const OUTER = 2.152;
const MU = 0.6;
const SIGMA = 1.5;
const RANGE = 4.6;
const BINS = 46;

const pdf = (x, mu, s) => Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
const erf = (x) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
};
const cdf = (x, mu, s) => 0.5 * (1 + erf((x - mu) / (s * Math.SQRT2)));
const outside = (mu, s) => 1 - (cdf(OUTER, mu, s) - cdf(-OUTER, mu, s));

const WIDE = { VB_W: 760, VB_H: 320, x0: 40, x1: 720, base: 250, h: 190 };
const NARROW = { VB_W: 340, VB_H: 300, x0: 16, x1: 324, base: 220, h: 150 };

export function mount(node) {
  node.classList.add('tq-cb');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Calibration">',
    '      <button type="button" class="qi-chip" data-after="0" aria-pressed="false">Before calibration</button>',
    '      <button type="button" class="qi-chip" data-after="1" aria-pressed="false">After (shift, scale)</button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 320" role="img" aria-label="A histogram of one rotated coordinate against the N(0,1) reference and the codebook centroids, before and after calibration.">',
    '    <g class="tq-cb__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 tq-cb__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.tq-cb__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.tq-cb__status');
  const chips = [...node.querySelectorAll('[data-after]')];
  let after = false;
  const isNarrow = watchNarrow(node, () => render());

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    const mu = after ? 0 : MU;
    const sg = after ? 1 : SIGMA;
    const sx = (G.x1 - G.x0) / (2 * RANGE);
    const cx = (G.x0 + G.x1) / 2;
    const X = (v) => cx + v * sx;
    const H = (v) => G.h * pdf(v, mu, sg) * 2.1; // scaled so N(0,1) peaks near the top

    // Histogram bars, red outside the outermost centroids.
    const bw = (2 * RANGE) / BINS;
    for (let b = 0; b < BINS; b++) {
      const lo = -RANGE + b * bw;
      const mid = lo + bw / 2;
      const h = H(mid);
      const out = Math.abs(mid) > OUTER;
      g.appendChild(el('rect', { class: `tq-cb__bar${out ? ' is-out' : ''}`, x: X(lo) + 0.5, y: G.base - h, width: Math.max(1, sx * bw - 1), height: h }));
    }
    // N(0,1) reference curve.
    let d = '';
    for (let i = 0; i <= 120; i++) {
      const v = -RANGE + (2 * RANGE * i) / 120;
      d += `${i ? 'L' : 'M'}${X(v).toFixed(1)} ${(G.base - G.h * pdf(v, 0, 1) * 2.1).toFixed(1)}`;
    }
    g.appendChild(el('path', { class: 'tq-cb__ref', d }));
    g.appendChild(el('line', { class: 'qi-axis', x1: G.x0 - 6, y1: G.base, x2: G.x1 + 6, y2: G.base }));
    CENTROIDS.forEach((c) => g.appendChild(el('circle', { class: 'tq-cb__cent', cx: X(c), cy: G.base, r: 5 })));
    [-OUTER, 0, OUTER].forEach((v) => g.appendChild(el('text', { class: 'qi-label', x: X(v), y: G.base + 24, 'text-anchor': 'middle' }, v === 0 ? '0' : `${v < 0 ? '−' : '+'}${OUTER}`)));

    g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: G.x0, y: 24 }, after ? 'After (shift, scale): data aligns with the N(0,1) codebook' : 'Before calibration: data drifts off the codebook grid'));
    // Legend
    const ly = G.base + 52;
    const lg = [['tq-cb__sw-ref', 'N(0,1) reference'], ['tq-cb__sw-cent', 'codebook centroids'], ['tq-cb__sw-in', 'data inside'], ['tq-cb__sw-out', 'data outside']];
    let lx = G.x0;
    const perRow = narrow ? 2 : 4;
    lg.forEach(([cls, t], i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = G.x0 + col * (narrow ? 150 : 170);
      const y = ly + row * 22;
      g.appendChild(el('rect', { class: cls, x, y: y - 11, width: 12, height: 12, rx: 2 }));
      g.appendChild(el('text', { class: 'qi-label', x: x + 18, y }, t));
    });
    if (narrow) svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${ly + 40}`);

    const pOut = outside(mu, sg);
    statusEl.innerHTML = after
      ? `After a per-coordinate <b>(shift, scale)</b>, the data matches N(0,1) and only <b>${(pOut * 100).toFixed(1)}%</b> of values fall past the outermost centroids.`
      : `Here the data is shifted and stretched relative to the codebook: <b>${(pOut * 100).toFixed(1)}%</b> of values fall past the outermost centroids (±${OUTER}) and are lost. The distribution is illustrative.`;
  }

  function setAfter(a) {
    after = a;
    chips.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.after === '1') === after)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setAfter(b.dataset.after === '1')));

  setAfter(false);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
