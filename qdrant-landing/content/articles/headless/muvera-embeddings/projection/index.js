/*
 * projection island: interactive replacement for random-projection.png.
 *
 * Each SimHash repetition produces a (2^k_sim x dim) block of cluster vectors.
 * Multiplying it by a random (dim x dim_proj) matrix with entries from {-1, +1}
 * (scaled by 1/sqrt(dim_proj)) gives a (2^k_sim x dim_proj) block. The FDE
 * concatenates r_reps of these blocks, so its size is r_reps * 2^k_sim * dim_proj.
 * Choose k_sim and dim_proj to see how the shapes and the final FDE size change.
 *
 * Block sizes are drawn to scale with dim = 128 and r_reps = 20, the values
 * used in the article. The bars compare the size with and without projection.
 */

const NS = 'http://www.w3.org/2000/svg';

const DIM = 128;
const R_REPS = 20;
const K_VALUES = [4, 5, 6];
const PROJ_VALUES = [16, 32, 64];

// Desktop: blocks on the left, size bars on the right. Narrow: stacked.
const WIDE = { VB_W: 760, VB_H: 366, S_COL: 1.05, S_ROW: 1.7, AX: 40, BARS_X: 470, BARS_W: 270, BARS_Y: 54 };
const NARROW = { VB_W: 340, VB_H: 476, S_COL: 0.62, S_ROW: 1.0, AX: 10, BARS_X: 10, BARS_W: 320, BARS_Y: 280 };
const GAP = 14;
const MAX_TOTAL = R_REPS * 2 ** Math.max(...K_VALUES) * DIM;

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

const fmt = (n) => n.toLocaleString('en-US');

export function mount(node) {
  node.classList.add('mu-pr');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Number of hyperplanes, k_sim">',
    K_VALUES.map((k) => `<button type="button" class="qi-chip" data-k="${k}" aria-pressed="false">k_sim = ${k}<small>${2 ** k} clusters</small></button>`).join(''),
    '    </div>',
    '    <div class="qi-group" role="group" aria-label="Projected dimension, dim_proj">',
    PROJ_VALUES.map((p) => `<button type="button" class="qi-chip" data-proj="${p}" aria-pressed="false">dim_proj = ${p}</button>`).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg" viewBox="0 0 ${WIDE.VB_W} ${WIDE.VB_H}" role="img" aria-label="A block of cluster vectors multiplied by a random projection matrix gives a smaller block; the final FDE size with and without projection is shown as two bars.">`,
    '    <g class="mu-pr__blocks"></g>',
    '    <g class="mu-pr__bars"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 mu-pr__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const blocks = node.querySelector('.mu-pr__blocks');
  const bars = node.querySelector('.mu-pr__bars');
  const statusEl = node.querySelector('.mu-pr__status');
  const svg = node.querySelector('svg');
  const kChips = [...node.querySelectorAll('[data-k]')];
  const pChips = [...node.querySelectorAll('[data-proj]')];
  let k = 6;
  let proj = 32;

  // Compact layout when the figure is narrower than the desktop composition,
  // so labels stay readable instead of scaling down with the SVG.
  const NARROW_BELOW = 700;
  const isNarrow = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < NARROW_BELOW;
  };
  let narrow = isNarrow();
  node.classList.toggle('mu-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (isNarrow() !== narrow) {
        narrow = isNarrow();
        node.classList.toggle('mu-narrow', narrow);
        render();
      }
    }).observe(node);
  }

  function render() {
    const { VB_W, VB_H, S_COL, S_ROW, AX, BARS_X, BARS_W, BARS_Y } = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
    const rows = 2 ** k;
    const aW = DIM * S_COL;
    const aH = rows * S_ROW;
    const bW = proj * S_COL;
    const bH = DIM * S_COL;
    const top = 40;
    const aY = top + bH + GAP + 8;
    const bX = AX + aW + GAP;

    blocks.replaceChildren();
    blocks.appendChild(el('rect', { class: 'mu-pr__block', x: AX, y: aY, width: aW, height: aH, rx: 3 }));
    blocks.appendChild(el('text', { class: 'qi-label', x: AX, y: aY + aH + 18 }, `2^k_sim × dim = ${rows} × ${DIM}`));
    blocks.appendChild(el('rect', { class: 'mu-pr__block mu-pr__block--matrix', x: bX, y: top, width: bW, height: bH, rx: 3 }));
    blocks.appendChild(el('text', { class: 'qi-label', x: bX, y: top - 8 }, `dim × dim_proj = ${DIM} × ${proj}`));
    blocks.appendChild(el('rect', { class: 'mu-pr__block mu-pr__block--out', x: bX, y: aY, width: bW, height: aH, rx: 3 }));
    blocks.appendChild(el('text', { class: 'qi-label qi-label--strong', x: AX, y: aY + aH + 38 }, `2^k_sim × dim_proj = ${rows} × ${proj}`));
    blocks.appendChild(el('text', { class: 'qi-label', x: AX + aW + GAP / 2, y: aY + aH / 2 + 4, 'text-anchor': 'middle' }, '×'));
    blocks.appendChild(el('text', { class: 'qi-label', x: bX + bW / 2, y: aY - 6, 'text-anchor': 'middle' }, '='));

    const before = R_REPS * rows * DIM;
    const after = R_REPS * rows * proj;
    const BX = BARS_X;
    const BW = BARS_W;
    bars.replaceChildren();
    bars.appendChild(el('text', { class: 'qi-label', x: BX, y: BARS_Y }, `FDE size with r_reps = ${R_REPS}`));
    [
      ['Without projection', `${R_REPS} × ${rows} × ${DIM}`, before, 'mu-pr__bar--before'],
      ['With projection', `${R_REPS} × ${rows} × ${proj}`, after, 'mu-pr__bar--after'],
    ].forEach(([label, formula, value, cls], i) => {
      const y = BARS_Y + 32 + i * 96;
      bars.appendChild(el('text', { class: 'qi-label qi-label--strong', x: BX, y }, label));
      bars.appendChild(el('rect', { class: `mu-pr__bar ${cls}`, x: BX, y: y + 10, width: Math.max(3, (BW * value) / MAX_TOTAL), height: 20, rx: 3 }));
      bars.appendChild(el('text', { class: 'qi-label', x: BX, y: y + 50 }, `${formula} = ${fmt(value)}`));
    });

    statusEl.innerHTML =
      `With <b>k_sim = ${k}</b> and <b>dim_proj = ${proj}</b>, each repetition shrinks from ${rows} × ${DIM} to ${rows} × ${proj}, and the final FDE has <b>${fmt(after)}</b> dimensions instead of ${fmt(before)}: ` +
      `<b>${DIM / proj}×</b> smaller.`;
  }

  function sync() {
    kChips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.k) === k)));
    pChips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.proj) === proj)));
    render();
  }
  kChips.forEach((b) => b.addEventListener('click', () => {
    k = Number(b.dataset.k);
    sync();
  }));
  pChips.forEach((b) => b.addEventListener('click', () => {
    proj = Number(b.dataset.proj);
    sync();
  }));

  sync();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
