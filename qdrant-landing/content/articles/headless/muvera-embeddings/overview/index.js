/*
 * overview island: interactive replacement for muvera-high-level.png.
 *
 * A document and a query are each a variable-length list of token vectors.
 * MUVERA turns each list into one vector, and both vectors have the same fixed
 * length whatever the number of tokens. Change the token counts to see the
 * input grow while the output keeps its size.
 *
 * Numbers are illustrative, drawn from a seeded generator.
 */

const NS = 'http://www.w3.org/2000/svg';

const WIDE_W = 760;
const NARROW_W = 340;
const COLS = 4;
const CELL_W = 44;
const CELL_H = 24;
const FDE_COLS = 8;
const FDE_CELL_W = 38;
const ROW_GAP = 4;
const DOC_COUNTS = [3, 5, 7];
const QUERY_COUNTS = [2, 3, 4];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const values = (seed, n) => {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => (r() * 2).toFixed(1));
};

export function mount(node) {
  node.classList.add('mu-ov');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Number of document token vectors">',
    DOC_COUNTS.map((n) => `<button type="button" class="qi-chip" data-doc="${n}" aria-pressed="false">Document: ${n} tokens</button>`).join(''),
    '    </div>',
    '    <div class="qi-group" role="group" aria-label="Number of query token vectors">',
    QUERY_COUNTS.map((n) => `<button type="button" class="qi-chip" data-query="${n}" aria-pressed="false">Query: ${n} tokens</button>`).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg" viewBox="0 0 ${WIDE_W} 320" role="img" aria-label="A document and a query, each a list of token vectors of any length, are transformed by MUVERA into one fixed-length vector each.">`,
    '    <g class="mu-ov__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 mu-ov__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.mu-ov__g');
  const statusEl = node.querySelector('.mu-ov__status');
  const svg = node.querySelector('svg');
  const docChips = [...node.querySelectorAll('[data-doc]')];
  const queryChips = [...node.querySelectorAll('[data-query]')];
  let nDoc = 5;
  let nQuery = 3;

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

  const ROW = CELL_H + ROW_GAP;

  function tokens(kind, n, x0, y0, seed) {
    const cls = kind === 'doc' ? 'mu-ov__doc' : 'mu-ov__query';
    for (let r = 0; r < n; r++) {
      const vals = values(seed + r, COLS);
      for (let c = 0; c < COLS; c++) {
        const x = x0 + c * CELL_W;
        const y = y0 + r * ROW;
        g.appendChild(el('rect', { class: `mu-ov__cell ${cls}`, x, y, width: CELL_W, height: CELL_H, rx: 3 }));
        g.appendChild(el('text', { class: 'qi-label mu-ov__num', x: x + CELL_W / 2, y: y + 16, 'text-anchor': 'middle' }, vals[c]));
      }
      g.appendChild(el('text', { class: 'qi-label', x: x0 + COLS * CELL_W + 6, y: y0 + r * ROW + 16 }, '…'));
    }
  }

  function fde(kind, x0, y, seed) {
    const cls = kind === 'doc' ? 'mu-ov__doc' : 'mu-ov__query';
    const vals = values(seed, FDE_COLS);
    for (let c = 0; c < FDE_COLS; c++) {
      g.appendChild(el('rect', { class: `mu-ov__cell mu-ov__fde ${cls}`, x: x0 + c * FDE_CELL_W, y, width: FDE_CELL_W, height: CELL_H, rx: 3 }));
      g.appendChild(el('text', { class: 'qi-label mu-ov__num', x: x0 + c * FDE_CELL_W + FDE_CELL_W / 2, y: y + 16, 'text-anchor': 'middle' }, vals[c]));
    }
    g.appendChild(el('text', { class: 'qi-label', x: x0 + FDE_COLS * FDE_CELL_W + 4, y: y + 16 }, '…'));
  }

  function arrowH(x1, x2, y) {
    g.appendChild(el('line', { class: 'mu-ov__arrow', x1, y1: y, x2: x2 - 6, y2: y }));
    g.appendChild(el('polygon', { class: 'mu-ov__head', points: `${x2},${y} ${x2 - 8},${y - 4.5} ${x2 - 8},${y + 4.5}` }));
    g.appendChild(el('text', { class: 'qi-label', x: (x1 + x2) / 2, y: y - 8, 'text-anchor': 'middle' }, 'MUVERA'));
  }

  function arrowV(x, y1, y2) {
    g.appendChild(el('line', { class: 'mu-ov__arrow', x1: x, y1, x2: x, y2: y2 - 6 }));
    g.appendChild(el('polygon', { class: 'mu-ov__head', points: `${x},${y2} ${x - 4.5},${y2 - 8} ${x + 4.5},${y2 - 8}` }));
    g.appendChild(el('text', { class: 'qi-label', x: x + 10, y: (y1 + y2) / 2 + 4 }, 'MUVERA'));
  }

  function render() {
    g.replaceChildren();
    let h;
    if (!narrow) {
      // Desktop: tokens on the left, fixed-length vector on the right.
      const docY = 34;
      const queryY = docY + 7 * ROW + 36;
      g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: 10, y: docY - 8 }, 'Document: token vectors'));
      g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: 10, y: queryY - 8 }, 'Query: token vectors'));
      tokens('doc', nDoc, 10, docY, 11);
      tokens('query', nQuery, 10, queryY, 41);
      const dMid = docY + (nDoc * ROW) / 2 - CELL_H / 2 - 2;
      const qMid = queryY + (nQuery * ROW) / 2 - CELL_H / 2 - 2;
      arrowH(240, 420, dMid + CELL_H / 2);
      arrowH(240, 420, qMid + CELL_H / 2);
      fde('doc', 430, dMid, 71);
      fde('query', 430, qMid, 91);
      g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: 430, y: dMid - 8 }, 'Document: one fixed-length vector'));
      g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: 430, y: qMid - 8 }, 'Query: one fixed-length vector'));
      h = queryY + 4 * ROW + 6;
    } else {
      // Narrow: each side stacks tokens above its fixed-length vector.
      let y = 22;
      [['doc', nDoc, 11, 71, 'Document'], ['query', nQuery, 41, 91, 'Query']].forEach(([kind, n, tSeed, fSeed, name]) => {
        g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: 10, y }, `${name}: token vectors`));
        tokens(kind, n, 10, y + 10, tSeed);
        const end = y + 10 + n * ROW;
        arrowV(40, end + 2, end + 38);
        g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: 10, y: end + 58 }, `${name}: fixed-length vector`));
        fde(kind, 10, end + 66, fSeed);
        y = end + 66 + CELL_H + 40;
      });
      h = y - 20;
    }
    svg.setAttribute('viewBox', `0 0 ${narrow ? NARROW_W : WIDE_W} ${h}`);
    statusEl.innerHTML = `A document of <b>${nDoc}</b> token vectors and a query of <b>${nQuery}</b> both become a single vector of the <b>same dimension</b>. Their dot product approximates the multi-vector similarity, so ordinary single-vector search can fetch candidates for reranking.`;
  }

  function sync() {
    docChips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.doc) === nDoc)));
    queryChips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.query) === nQuery)));
    render();
  }
  docChips.forEach((b) => b.addEventListener('click', () => {
    nDoc = Number(b.dataset.doc);
    sync();
  }));
  queryChips.forEach((b) => b.addEventListener('click', () => {
    nQuery = Number(b.dataset.query);
    sync();
  }));

  sync();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
