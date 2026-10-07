/*
 * pages island: interactive replacement for page-vector.png and
 * defragmentation.png.
 *
 * Disk reads come in pages, so reading one vector reads every vector stored on
 * its page. Here 64 vectors from 4 workspaces sit on 8 pages of 8. Pick the
 * workspace a query uses and switch between scattered storage and storage
 * grouped by workspace (defragmented) to see how many pages must be read.
 *
 * Illustrative: a real 4 KB page holds about 21 binary-quantized 1536d vectors
 * (192 bytes each); 8 per page keeps the picture readable. The shuffle is seeded.
 */

const NS = 'http://www.w3.org/2000/svg';
const WORKSPACES = 4;
const PER_WS = 16;
const PAGES = 8;
const SLOTS = 8;
const TOTAL = PAGES * SLOTS;

const WIDE = { VB_W: 760, VB_H: 340, perRow: 8, bw: 78, pitch: 92, x0: 14, y0: 56, rowH: 104, sq: 15, sp: 18, bh: 50, barW: 420 };
const NARROW = { VB_W: 340, VB_H: 336, perRow: 4, bw: 68, pitch: 82, x0: 10, y0: 40, rowH: 100, sq: 13, sp: 16, bh: 46, barW: 300 };

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

// slot -> workspace, for both layouts.
const grouped = Array.from({ length: TOTAL }, (_, s) => Math.floor(s / PER_WS));
const scattered = (() => {
  const a = [...grouped];
  const rnd = mulberry32(5);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
})();

export function mount(node) {
  node.classList.add('im-pg');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Storage layout">',
    '      <button type="button" class="qi-chip" data-layout="scattered" aria-pressed="false">Scattered</button>',
    '      <button type="button" class="qi-chip" data-layout="grouped" aria-pressed="false">Defragmented</button>',
    '    </div>',
    '    <div class="qi-group" role="group" aria-label="Workspace used by the query">',
    Array.from({ length: WORKSPACES }, (_, i) => `<button type="button" class="qi-chip" data-ws="${i}" aria-pressed="false"><span class="im-pg__sw im-pg__w${i + 1}"></span>Workspace #${i + 1}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 330" role="img" aria-label="Eight disk pages of eight vectors each, colored by workspace, with the pages a query for one workspace must read highlighted.">',
    '    <g class="im-pg__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 im-pg__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.im-pg__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.im-pg__status');
  const layoutChips = [...node.querySelectorAll('[data-layout]')];
  const wsChips = [...node.querySelectorAll('[data-ws]')];
  let layout = 'scattered';
  let ws = 1;
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
    const map = layout === 'scattered' ? scattered : grouped;
    const pagesRead = new Set();
    map.forEach((w, s) => {
      if (w === ws) pagesRead.add(Math.floor(s / SLOTS));
    });

    g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: G.x0, y: G.y0 - 30 }, `Disk pages, ${layout === 'scattered' ? 'vectors scattered' : 'vectors grouped by workspace'}`));
    for (let p = 0; p < PAGES; p++) {
      const x = G.x0 + (p % G.perRow) * G.pitch;
      const y = G.y0 + Math.floor(p / G.perRow) * G.rowH;
      const read = pagesRead.has(p);
      g.appendChild(el('rect', { class: `im-pg__page${read ? ' is-read' : ''}`, x, y, width: G.bw, height: G.bh, rx: 5 }));
      for (let k = 0; k < SLOTS; k++) {
        const sx = x + (G.bw - (4 * G.sp - (G.sp - G.sq))) / 2 + (k % 4) * G.sp;
        const sy = y + 8 + Math.floor(k / 4) * G.sp;
        const w = map[p * SLOTS + k];
        g.appendChild(el('rect', { class: `im-pg__vec im-pg__w${w + 1}${w === ws ? '' : ' is-other'}`, x: sx, y: sy, width: G.sq, height: G.sq, rx: 3 }));
      }
      g.appendChild(el('text', { class: `qi-label${read ? ' qi-label--strong' : ''}`, x: x + G.bw / 2, y: y + G.bh + 18, 'text-anchor': 'middle' }, `page ${p + 1}`));
      if (read) g.appendChild(el('text', { class: 'qi-label im-pg__readtag', x: x + G.bw / 2, y: y + G.bh + 36, 'text-anchor': 'middle' }, 'read'));
    }

    const n = pagesRead.size;
    const readVec = n * SLOTS;
    const by = G.y0 + Math.ceil(PAGES / G.perRow) * G.rowH + 4;
    const bar = (label, vec, cls, y) => {
      g.appendChild(el('text', { class: 'qi-label', x: G.x0, y }, label));
      g.appendChild(el('rect', { class: `im-pg__bar ${cls}`, x: G.x0, y: y + 8, width: Math.max(3, (G.barW * vec) / TOTAL), height: 16, rx: 3 }));
    };
    bar(`Needed by the query: ${PER_WS} vectors`, PER_WS, 'im-pg__bar--need', by);
    bar(`Read from disk: ${n} pages = ${readVec} vectors`, readVec, 'im-pg__bar--read', by + 46);

    const x = readVec / PER_WS;
    const xs = Number.isInteger(x) ? String(x) : x.toFixed(1);
    statusEl.innerHTML =
      layout === 'scattered'
        ? `<b>Scattered</b>: workspace #${ws + 1}'s ${PER_WS} vectors are spread over <b>${n}</b> of ${PAGES} pages, so reading them pulls in ${readVec} vectors, <b>${xs}×</b> the data needed.`
        : `<b>Defragmented</b>: workspace #${ws + 1}'s ${PER_WS} vectors fill <b>${n}</b> pages, so every vector read is one the query uses (<b>${xs}×</b> overhead).`;
  }

  function sync() {
    layoutChips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layout === layout)));
    wsChips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.ws) === ws)));
    render();
  }
  layoutChips.forEach((b) => b.addEventListener('click', () => {
    layout = b.dataset.layout;
    sync();
  }));
  wsChips.forEach((b) => b.addEventListener('click', () => {
    ws = Number(b.dataset.ws);
    sync();
  }));

  sync();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
