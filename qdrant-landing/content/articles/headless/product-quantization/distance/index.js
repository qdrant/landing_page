/*
 * distance island: interactive replacement for distance-calculation.png.
 *
 * Qdrant builds a lookup table for each query: the distance from every chunk of the
 * query to every centroid of that chunk's clustering. The distance to a stored vector
 * is then a sum of table entries, one per stored id. Pick the stored ids to see which
 * entries are summed. The query, centroids, and distances are illustrative, and the
 * distance is the squared Euclidean distance.
 */

const NS = 'http://www.w3.org/2000/svg';
const QUERY = [0.62, 0.97, -0.08, -0.77, -0.1, -0.92, -0.96, 0.29];
const CENTROIDS = [
  [[0.5, 0.8, -0.1, -0.7], [-0.2, -0.4, 0.9, -0.6], [-0.7, 0.3, 0.2, 0.5], [0.1, -0.8, -0.5, 0.3]],
  [[0.8, 0.7, 0.6, 0.7], [-0.5, 0.6, 0.7, -0.4], [-0.9, -0.7, 0.1, 0.5], [0.2, -0.9, -0.9, 0.2], [0.7, 0.0, -0.3, -0.8], [-0.1, -0.3, 0.4, 0.9]],
];
const MAX_COLS = 6;
const TABLE = CENTROIDS.map((row, c) => {
  const q = QUERY.slice(c * 4, c * 4 + 4);
  return row.map((cent) => cent.reduce((sum, x, i) => sum + (x - q[i]) ** 2, 0));
});

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
  node.classList.toggle('pq-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('pq-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

export function mount(node) {
  node.classList.add('pq-ds');
  const group = (c) => [
    `    <div class="qi-group" role="group" aria-label="Stored id for chunk ${c + 1}">`,
    `      <span class="qi-hint">chunk ${c + 1}</span>`,
    CENTROIDS[c].map((_, i) => `<button type="button" class="qi-chip" data-chunk="${c}" data-id="${i}" aria-pressed="false">${i + 1}</button>`).join(''),
    '    </div>',
  ].join('');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    group(0),
    group(1),
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 330" role="img" aria-label="A query is split into two chunks. A lookup table holds the distance from each query chunk to each centroid. The distance to a stored vector is the sum of one table entry per stored id.">',
    '    <g class="pq-ds__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 pq-ds__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.pq-ds__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.pq-ds__status');
  const chips = [...node.querySelectorAll('[data-chunk]')];
  let stored = [1, 2];
  const isNarrow = watchNarrow(node, () => render());

  function box(x, y, w, h, cls, text, textCls = 'pq-ds__val') {
    g.appendChild(el('rect', { class: cls, x, y, width: w, height: h, rx: 4 }));
    g.appendChild(el('text', { class: textCls, x: x + w / 2, y: y + h / 2 + 5, 'text-anchor': 'middle' }, text));
  }

  function render() {
    const narrow = isNarrow();
    g.replaceChildren();
    const L = narrow
      ? { W: 340, H: 392, qx: 20, tx: 72, ty: 168, cw: 44, rh: 40 }
      : { W: 760, H: 330, qx: 100, tx: 150, ty: 120, cw: 96, rh: 44 };
    // The query, cut into chunks.
    g.appendChild(el('text', { class: 'qi-label', x: narrow ? 20 : 24, y: narrow ? 20 : 53 }, 'query'));
    QUERY.forEach((v, i) => {
      const c = Math.floor(i / 4);
      const x = narrow ? 20 + (i % 4) * 70 : L.qx + i * 78 + (i >= 4 ? 24 : 0);
      const y = narrow ? 30 + c * 46 : 28;
      box(x, y, narrow ? 62 : 68, 36, `pq-ds__q is-${c ? 'b' : 'a'}`, v.toFixed(2));
    });
    // The lookup table.
    const top = L.ty;
    g.appendChild(el('text', { class: 'qi-label', x: narrow ? 20 : 24, y: top - 10 }, 'lookup table: distance to each centroid'));
    for (let id = 0; id < MAX_COLS; id++) {
      g.appendChild(el('text', { class: 'qi-label', x: L.tx + id * L.cw + (L.cw - 6) / 2, y: top + 18, 'text-anchor': 'middle' }, String(id + 1)));
    }
    TABLE.forEach((row, c) => {
      const y = top + 28 + c * (L.rh + 6);
      g.appendChild(el('text', { class: 'qi-label', x: narrow ? 20 : 24, y: y + L.rh / 2 + 5 }, `chunk ${c + 1}`));
      for (let id = 0; id < MAX_COLS; id++) {
        const x = L.tx + id * L.cw;
        if (id >= row.length) {
          g.appendChild(el('text', { class: 'qi-label', x: x + (L.cw - 6) / 2, y: y + L.rh / 2 + 5, 'text-anchor': 'middle' }, '·'));
          continue;
        }
        const on = stored[c] === id;
        box(x, y, L.cw - 6, L.rh, `pq-ds__cell is-${c ? 'b' : 'a'}${on ? ' is-on' : ''}`, row[id].toFixed(1));
      }
    });
    const parts = stored.map((id, c) => TABLE[c][id]);
    const total = parts.reduce((a, b) => a + b, 0);
    const sy = top + 28 + 2 * (L.rh + 6) + 38;
    const label = `distance to [${stored.map((i) => i + 1).join(', ')}]`;
    const sum = `= ${parts.map((p) => p.toFixed(1)).join(' + ')} = ${total.toFixed(1)}`;
    const sx = narrow ? 20 : 24;
    if (narrow) {
      g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: sx, y: sy }, label));
      g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: sx, y: sy + 22 }, sum));
    } else {
      g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: sx, y: sy }, `${label} ${sum}`));
    }
    svg.setAttribute('viewBox', `0 0 ${L.W} ${L.H}`);
    statusEl.textContent = `The table is computed once per query. The stored vector [${stored.map((i) => i + 1).join(', ')}] needs no centroid coordinates and no distance computation of its own: its distance is the sum of two table entries.`;
  }

  function setStored(chunk, id) {
    stored = stored.map((s, c) => (c === chunk ? id : s));
    chips.forEach((b) => b.setAttribute('aria-pressed', String(stored[Number(b.dataset.chunk)] === Number(b.dataset.id))));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setStored(Number(b.dataset.chunk), Number(b.dataset.id))));

  setStored(0, 1);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
