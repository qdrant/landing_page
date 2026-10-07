/*
 * quantile island: interactive replacement for quantization-quantile.png.
 *
 * Scalar quantization needs the distribution of the data: its bounds are the
 * values that exclude the most extreme ones, set by the `quantile` parameter,
 * and the quantization levels are spread evenly between those bounds. Choose a
 * quantile to see the bounds, the levels, and the share of values that is
 * clamped to the end levels.
 *
 * The curve is a normal distribution, and 8 of the 256 levels are drawn.
 */

const NS = 'http://www.w3.org/2000/svg';
const RANGE = 4.2; // plot spans [-RANGE, RANGE] standard deviations
const LEVELS_DRAWN = 8;
const LEVELS = 256;
// Central quantile -> half-width in standard deviations of a normal distribution.
const QUANTILES = [
  { q: 0.9, z: 1.645 },
  { q: 0.99, z: 2.576 },
  { q: 0.999, z: 3.291 },
];

const WIDE = { VB_W: 760, VB_H: 322, x0: 40, x1: 720, base: 232, h: 190, dimY: 268, legendY: 306 };
const NARROW = { VB_W: 340, VB_H: 330, x0: 20, x1: 320, base: 190, h: 140, dimY: 224, legendY: 262 };

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

const pdf = (z) => Math.exp((-z * z) / 2);

export function mount(node) {
  node.classList.add('im-qt');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Quantile">',
    QUANTILES.map(({ q }) => `<button type="button" class="qi-chip" data-q="${q}" aria-pressed="false">quantile = ${q}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 322" role="img" aria-label="A bell curve of vector component values, with quantization levels spread evenly between the bounds set by the quantile and the extreme values outside the bounds shaded.">',
    '    <g class="im-qt__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 im-qt__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.im-qt__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.im-qt__status');
  const chips = [...node.querySelectorAll('[data-q]')];
  let cur = QUANTILES[1];
  let narrow = false;

  const NARROW_BELOW = 700;
  const isNarrow = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < NARROW_BELOW;
  };
  narrow = isNarrow();
  node.classList.toggle('im-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (isNarrow() !== narrow) {
        narrow = isNarrow();
        node.classList.toggle('im-narrow', narrow);
        render();
      }
    }).observe(node);
  }

  function render() {
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    const cx = (G.x0 + G.x1) / 2;
    const sx = (G.x1 - G.x0) / (2 * RANGE);
    const X = (z) => cx + z * sx;
    const Y = (z) => G.base - G.h * pdf(z);
    const z = cur.z;

    const curve = (from, to) => {
      const steps = Math.max(8, Math.round((to - from) * 40));
      let d = '';
      for (let i = 0; i <= steps; i++) {
        const t = from + ((to - from) * i) / steps;
        d += `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${Y(t).toFixed(1)}`;
      }
      return d;
    };
    const area = (from, to, cls) => g.appendChild(el('path', { class: cls, d: `${curve(from, to)} L${X(to).toFixed(1)} ${G.base} L${X(from).toFixed(1)} ${G.base} Z` }));

    area(-z, z, 'im-qt__core');
    area(-RANGE, -z, 'im-qt__tail');
    area(z, RANGE, 'im-qt__tail');
    g.appendChild(el('path', { class: 'im-qt__curve', d: curve(-RANGE, RANGE) }));
    g.appendChild(el('line', { class: 'qi-axis', x1: G.x0, y1: G.base, x2: G.x1, y2: G.base }));

    for (let i = 0; i <= LEVELS_DRAWN; i++) {
      const t = -z + (2 * z * i) / LEVELS_DRAWN;
      const end = i === 0 || i === LEVELS_DRAWN;
      g.appendChild(el('line', { class: `im-qt__level${end ? ' is-bound' : ''}`, x1: X(t), y1: G.base - G.h - 6, x2: X(t), y2: G.base + 6 }));
    }

    g.appendChild(el('line', { class: 'im-qt__dim', x1: X(-z), y1: G.dimY, x2: X(z), y2: G.dimY }));
    g.appendChild(el('line', { class: 'im-qt__dim', x1: X(-z), y1: G.dimY - 6, x2: X(-z), y2: G.dimY + 6 }));
    g.appendChild(el('line', { class: 'im-qt__dim', x1: X(z), y1: G.dimY - 6, x2: X(z), y2: G.dimY + 6 }));
    g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: cx, y: G.dimY + 24, 'text-anchor': 'middle' }, `${cur.q} quantile: bounds at ±${z.toFixed(2)}σ`));

    g.appendChild(el('rect', { class: 'im-qt__swatch', x: G.x0, y: G.legendY - 11, width: 14, height: 14, rx: 3 }));
    g.appendChild(el('text', { class: 'qi-label', x: G.x0 + 22, y: G.legendY }, narrow ? 'clamped to an end level' : 'extreme values, clamped to the first or last level'));

    const outside = ((1 - cur.q) * 100).toFixed(1).replace(/\.0$/, '');
    statusEl.innerHTML =
      `With <b>quantile = ${cur.q}</b>, the bounds sit at ±${z.toFixed(2)}σ for a normal distribution and <b>${outside}%</b> of the values fall outside and are clamped. ` +
      `Spread over ${LEVELS} levels, each step is <b>${((2 * z) / (LEVELS - 1)).toFixed(3)}σ</b> wide (${LEVELS_DRAWN} levels are drawn).`;
  }

  function setQ(q) {
    cur = QUANTILES.find((x) => x.q === q);
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.q) === cur.q)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setQ(Number(b.dataset.q))));

  setQ(0.99);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
