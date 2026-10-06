/*
 * fusion island: interactive replacement for fusion-idea.png.
 *
 * Two prefetches return ranked results on different score scales: dense
 * (cosine) and sparse (BM25). The fused list combines them with the method
 * picked in the controls, computed live with the formulas from the page:
 *   - rrf:  sum of 1 / (k + rank), k = 2, zero-based ranks;
 *   - dbsf: each list normalized with its mean and sample standard deviation,
 *           (s - (mu - 3 sigma)) / (6 sigma), then summed.
 * Each fused bar is split into the dense and the sparse contribution. The
 * sample data is chosen so the methods disagree: A is near the top of both
 * lists and wins under RRF, while D's BM25 score stands far above the rest of
 * the sparse list and wins under DBSF.
 *
 * Documents keep one hue everywhere; hovering one highlights it in all three
 * lists. Pure SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

const DOCS = ['A', 'B', 'C', 'D', 'E', 'F'];
const DENSE = [
  ['A', 0.83],
  ['B', 0.81],
  ['C', 0.79],
  ['D', 0.62],
  ['E', 0.6],
];
const SPARSE = [
  ['D', 18.4],
  ['F', 7.2],
  ['A', 6.9],
  ['B', 6.1],
  ['C', 5.5],
];
const RRF_K = 2;

const METHODS = {
  rrf: {
    status:
      "RRF only looks at ranks. <b>A</b> is near the top of both lists, so it comes first, even though D's BM25 score is far ahead of every other sparse result.",
    fuse: (list) => list.map((_, r) => 1 / (RRF_K + r)),
  },
  dbsf: {
    status:
      "DBSF keeps the scores, normalized per list. D's BM25 score stands far above the rest of the sparse results, which lifts <b>D</b> to the top.",
    fuse: (list) => {
      const v = list.map(([, s]) => s);
      const mu = v.reduce((a, b) => a + b, 0) / v.length;
      const sd = Math.sqrt(v.reduce((a, b) => a + (b - mu) ** 2, 0) / (v.length - 1));
      return v.map((s) => (s - (mu - 3 * sd)) / (6 * sd));
    },
  },
};

// Geometry (viewBox 760 x 470). Prefetch lists side by side, fused list below,
// with arrows from both lists into a pill naming the fusion method.
const VB_W = 760;
const VB_H = 470;
const ROW = { h: 28, pitch: 34 };
const CHIP = { x: 8, y: 5, w: 34, h: 18 };
const LIST = { w: 370, y: 24, barX: 52, barMax: 250 };
const LIST_X = [0, VB_W - LIST.w];
const FUSED = { y: 268, barX: 52, barMax: 600 };
const BAR = { y: 9, h: 10 };
const PILL = { cx: VB_W / 2, cy: 222, hw: 36, hh: 11 };
const LISTS_BOTTOM = LIST.y + 4 * ROW.pitch + ROW.h;

function el(name, attrs, parent, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

function chip(parent, doc) {
  const g = el('g', { class: `qi-fu__chip qi-fu__chip--${DOCS.indexOf(doc)}` }, parent);
  el('rect', { x: CHIP.x, y: CHIP.y, width: CHIP.w, height: CHIP.h, rx: 3 }, g);
  el('text', { x: CHIP.x + CHIP.w / 2, y: CHIP.y + 13, 'text-anchor': 'middle' }, g, doc);
}

export function mount(node) {
  node.classList.add('qi-fu');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Fusion method">',
    '      <span class="qi-hint">fusion:</span>',
    Object.keys(METHODS)
      .map((m) => `<button type="button" class="qi-chip" data-method="${m}" aria-pressed="false">${m}</button>`)
      .join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-fu__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="Dense and sparse search results, each ranked on its own score scale, fused into one ranked list with RRF or DBSF.">',
    '    <g class="qi-fu__lists"></g>',
    '    <g class="qi-fu__fused"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-fu__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-fu__svg');
  const listsG = svg.querySelector('.qi-fu__lists');
  const fusedG = svg.querySelector('.qi-fu__fused');
  const statusEl = node.querySelector('.qi-fu__status');
  const methodBtns = [...node.querySelectorAll('[data-method]')];

  // The two prefetch lists. Bars are relative to each list's top score, so
  // the two scales are visible only in the numbers, as they are in practice.
  [
    { label: 'dense · cosine', list: DENSE, digits: 2 },
    { label: 'sparse · BM25', list: SPARSE, digits: 1 },
  ].forEach(({ label, list, digits }, i) => {
    const x = LIST_X[i];
    el('text', { class: 'qi-label', x: x + 8, y: LIST.y - 8 }, listsG, label);
    const top = list[0][1];
    list.forEach(([doc, score], r) => {
      const g = el('g', { class: 'qi-fu__row', 'data-doc': doc, transform: `translate(${x} ${LIST.y + r * ROW.pitch})` }, listsG);
      el('rect', { class: 'qi-fu__box', width: LIST.w, height: ROW.h, rx: 6 }, g);
      chip(g, doc);
      const w = (score / top) * LIST.barMax;
      el('rect', { class: `qi-fu__bar qi-fu__bar--${i ? 'sparse' : 'dense'}`, x: LIST.barX, y: BAR.y, width: w, height: BAR.h, rx: 2 }, g);
      el('text', { class: 'qi-label', x: LIST.barX + w + 8, y: 19 }, g, score.toFixed(digits));
    });
  });

  // Arrows from both lists into the method pill, and on into the fused list.
  // Drawn as plain paths with polygon heads, so the static export needs no
  // marker definitions.
  const flowG = el('g', { class: 'qi-fu__flow' }, fusedG);
  const head = (x, y, dir) => {
    const pts = {
      right: [[x, y], [x - 8, y - 5], [x - 8, y + 5]],
      left: [[x, y], [x + 8, y - 5], [x + 8, y + 5]],
      down: [[x, y], [x - 5, y - 8], [x + 5, y - 8]],
    }[dir];
    el('polygon', { class: 'qi-fu__head', points: pts.map((p) => p.join(',')).join(' ') }, flowG);
  };
  const r = 12; // corner radius
  LIST_X.forEach((x, i) => {
    const sx = x + LIST.w / 2;
    const d = i ? -1 : 1; // toward the pill
    const ex = PILL.cx - d * (PILL.hw + 2);
    el('path', { class: 'qi-fu__arrow', d: `M ${sx} ${LISTS_BOTTOM + 6} V ${PILL.cy - r} Q ${sx} ${PILL.cy} ${sx + d * r} ${PILL.cy} H ${ex - d * 6}` }, flowG);
    head(ex, PILL.cy, i ? 'left' : 'right');
  });
  el('path', { class: 'qi-fu__arrow', d: `M ${PILL.cx} ${PILL.cy + PILL.hh} V ${FUSED.y - 12}` }, flowG);
  head(PILL.cx, FUSED.y - 6, 'down');
  el('rect', { class: 'qi-fu__pill', x: PILL.cx - PILL.hw, y: PILL.cy - PILL.hh, width: 2 * PILL.hw, height: 2 * PILL.hh, rx: PILL.hh }, flowG);
  const pillText = el('text', { class: 'qi-fu__pill-text', x: PILL.cx, y: PILL.cy + 4, 'text-anchor': 'middle' }, flowG);

  // The fused list: one row per document, moved into place by rank.
  el('text', { class: 'qi-label qi-fu__fused-label', x: 8, y: FUSED.y - 8 }, fusedG);
  const legend = el('g', { class: 'qi-fu__legend' }, fusedG);
  [
    ['dense', 'dense'],
    ['sparse', 'sparse'],
  ].forEach(([kind, text], i) => {
    const lx = VB_W - 150 + i * 76;
    el('rect', { class: `qi-fu__bar--${kind}`, x: lx, y: FUSED.y - 17, width: 10, height: 10, rx: 2 }, legend);
    el('text', { class: 'qi-label', x: lx + 16, y: FUSED.y - 8 }, legend, text);
  });
  const fusedLabel = fusedG.querySelector('.qi-fu__fused-label');

  const rows = {};
  DOCS.forEach((doc) => {
    const g = el('g', { class: 'qi-fu__row qi-fu__fused-row', 'data-doc': doc }, fusedG);
    el('rect', { class: 'qi-fu__box', width: VB_W, height: ROW.h, rx: 6 }, g);
    chip(g, doc);
    const dense = el('rect', { class: 'qi-fu__bar qi-fu__bar--dense', x: FUSED.barX, y: BAR.y, width: 0, height: BAR.h }, g);
    const sparse = el('rect', { class: 'qi-fu__bar qi-fu__bar--sparse', x: FUSED.barX, y: BAR.y, width: 0, height: BAR.h }, g);
    const valueG = el('g', { class: 'qi-fu__value' }, g);
    const value = el('text', { class: 'qi-label qi-label--strong', x: 8, y: 19 }, valueG);
    rows[doc] = { g, dense, sparse, valueG, value };
  });

  let method = 'rrf';

  function render() {
    methodBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.method === method)));
    fusedLabel.textContent = 'fused';
    pillText.textContent = method;

    const { fuse } = METHODS[method];
    const parts = Object.fromEntries(DOCS.map((d) => [d, { dense: 0, sparse: 0 }]));
    [
      ['dense', DENSE],
      ['sparse', SPARSE],
    ].forEach(([kind, list]) => fuse(list).forEach((s, r) => (parts[list[r][0]][kind] += s)));
    const total = (d) => parts[d].dense + parts[d].sparse;
    const order = [...DOCS].sort((a, b) => total(b) - total(a));
    const max = total(order[0]);

    order.forEach((doc, rank) => {
      const r = rows[doc];
      const dw = (parts[doc].dense / max) * FUSED.barMax;
      const sw = (parts[doc].sparse / max) * FUSED.barMax;
      r.g.style.transform = `translate(0px, ${FUSED.y + rank * ROW.pitch}px)`;
      r.dense.style.width = `${dw}px`;
      r.sparse.style.x = `${FUSED.barX + dw}px`;
      r.sparse.style.width = `${sw}px`;
      r.valueG.style.transform = `translate(${FUSED.barX + dw + sw}px, 0px)`;
      r.value.textContent = total(doc).toFixed(3);
    });
    statusEl.innerHTML = METHODS[method].status;
  }

  // Hovering a document highlights it in all three lists.
  function hot(doc) {
    svg.querySelectorAll('.qi-fu__row').forEach((g) => g.classList.toggle('is-hot', g.dataset.doc === doc));
  }
  svg.addEventListener('pointerover', (e) => {
    const row = e.target.closest('.qi-fu__row');
    hot(row ? row.dataset.doc : null);
  });
  svg.addEventListener('pointerleave', () => hot(null));

  methodBtns.forEach((b) =>
    b.addEventListener('click', () => {
      method = b.dataset.method;
      render();
    }),
  );

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
