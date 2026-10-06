/*
 * fde island: interactive replacement for fde-document-processing.png and
 * fde-query-processing.png.
 *
 * Once token vectors are assigned to SimHash clusters (k_sim = 3, so eight
 * clusters), documents and queries are aggregated differently:
 *   Document: average the vectors in each cluster, then fill every empty
 *             cluster with the vector of the nearest non-empty cluster, where
 *             distance is the Hamming distance between cluster IDs.
 *   Query:    sum the vectors in each cluster and leave empty clusters as
 *             zero vectors.
 * Switch between the two, and hover or click a cluster to trace it.
 *
 * The assignment of the four token vectors is illustrative.
 */

const NS = 'http://www.w3.org/2000/svg';

const K = 3;
const N = 2 ** K;
const WIDE = { VB_W: 760, VB_H: 372, X0: 40, CW: 85, CELL_H: 64, ROW_Y: [46, 168, 290], DOT: 8, SUM_STEP: 3 };
const NARROW = { VB_W: 340, VB_H: 352, X0: 10, CW: 40, CELL_H: 58, ROW_Y: [44, 154, 264], DOT: 7, SUM_STEP: 2 };

// Token vectors and the cluster each was assigned to (see the SimHash step).
const TOKENS = [
  { id: 1, cluster: 5 },
  { id: 2, cluster: 5 },
  { id: 3, cluster: 2 },
  { id: 4, cluster: 1 },
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

const bits = (c) => c.toString(2).padStart(K, '0');
const hamming = (a, b) => {
  let x = a ^ b;
  let n = 0;
  while (x) {
    n += x & 1;
    x >>= 1;
  }
  return n;
};
const members = (c) => TOKENS.filter((t) => t.cluster === c);

// Nearest non-empty clusters by Hamming distance (all ties returned).
function nearest(c) {
  const full = [...Array(N).keys()].filter((i) => members(i).length);
  const d = Math.min(...full.map((f) => hamming(c, f)));
  return { d, from: full.filter((f) => hamming(c, f) === d) };
}

export function mount(node) {
  node.classList.add('mu-fde');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Aggregation mode">',
    '      <button type="button" class="qi-chip" data-mode="doc" aria-pressed="false">Document<small>average + fill</small></button>',
    '      <button type="button" class="qi-chip" data-mode="query" aria-pressed="false">Query<small>sum</small></button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg" viewBox="0 0 ${WIDE.VB_W} ${WIDE.VB_H}" role="img" aria-label="Four token vectors in eight SimHash clusters, aggregated into one vector per cluster, for a document or for a query.">`,
    '    <g class="mu-fde__rows"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 mu-fde__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const rows = node.querySelector('.mu-fde__rows');
  const statusEl = node.querySelector('.mu-fde__status');
  const chips = [...node.querySelectorAll('[data-mode]')];
  const svg = node.querySelector('svg');
  let mode = 'doc';
  let hovered = null;
  let pinned = null;

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
        relayout();
      }
    }).observe(node);
  }
  let G = narrow ? NARROW : WIDE;

  const cx = (c) => G.X0 + (N - 1 - c) * G.CW; // 111 on the left, 000 on the right

  function dot(x, y, cls, r, attrs = {}) {
    return el('circle', { class: `mu-fde__dot ${cls}`, cx: x, cy: y, r, ...attrs });
  }

  function drawRow(y, title, cellFn) {
    rows.appendChild(el('text', { class: 'qi-label', x: G.X0, y: y - 26 }, title));
    for (let c = 0; c < N; c++) {
      const x = cx(c);
      rows.appendChild(el('rect', { class: 'mu-fde__cell', x: x + 1, y, width: G.CW - 2, height: G.CELL_H, rx: 4, 'data-code': c }));
      rows.appendChild(el('text', { class: 'qi-label qi-label--strong', x: x + G.CW / 2, y: y - 8, 'text-anchor': 'middle' }, bits(c)));
      cellFn(c, x + G.CW / 2, y + G.CELL_H / 2);
    }
  }

  function render() {
    G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    const ROW_Y = G.ROW_Y;
    rows.replaceChildren();

    drawRow(ROW_Y[0], 'Token vectors by cluster', (c, x, y) => {
      const m = members(c);
      m.forEach((t, j) => {
        const off = (j - (m.length - 1) / 2) * (G.DOT * 3);
        rows.appendChild(dot(x + off, y, `mu-fde__t${t.id}`, G.DOT, { 'data-code': c }));
        rows.appendChild(el('text', { class: 'qi-label mu-fde__tlabel', x: x + off, y: y + G.DOT * 3, 'text-anchor': 'middle' }, `t${t.id}`));
      });
    });

    const agg = mode === 'doc' ? 'average' : 'sum';
    drawRow(ROW_Y[1], narrow ? `Aggregated: ${agg}` : `Aggregated per cluster: ${agg}`, (c, x, y) => {
      const m = members(c);
      if (!m.length) return;
      // The aggregate of one token is that token; of several, a new vector.
      if (m.length === 1) {
        rows.appendChild(dot(x, y, `mu-fde__t${m[0].id}`, G.DOT, { 'data-code': c }));
      } else {
        const r = mode === 'doc' ? G.DOT : G.DOT + G.SUM_STEP * m.length;
        rows.appendChild(dot(x, y, 'mu-fde__agg', r, { 'data-code': c }));
        rows.appendChild(el('text', { class: 'qi-label mu-fde__tlabel', x, y: y + G.DOT * 3 + 5, 'text-anchor': 'middle', 'pointer-events': 'none' }, narrow ? (mode === 'doc' ? 'avg' : agg) : agg));
      }
    });

    drawRow(ROW_Y[2], mode === 'doc' ? (narrow ? 'Empty: filled from nearest' : 'Empty clusters filled from the nearest non-empty one') : (narrow ? 'Empty: stay zero' : 'Empty clusters stay zero vectors'), (c, x, y) => {
      const m = members(c);
      if (m.length) {
        // Occupied clusters keep their aggregate.
        if (m.length === 1) rows.appendChild(dot(x, y, `mu-fde__t${m[0].id}`, G.DOT, { 'data-code': c }));
        else rows.appendChild(dot(x, y, 'mu-fde__agg', mode === 'doc' ? G.DOT : G.DOT + G.SUM_STEP * m.length, { 'data-code': c }));
        return;
      }
      if (mode === 'doc') {
        const src = nearest(c).from[0];
        const sm = members(src);
        rows.appendChild(dot(x, y, sm.length === 1 ? `mu-fde__t${sm[0].id} is-copy` : 'mu-fde__agg is-copy', G.DOT, { 'data-code': c }));
        rows.appendChild(el('text', { class: 'qi-label mu-fde__tlabel', x, y: y + G.DOT * 3 + 5, 'text-anchor': 'middle', 'pointer-events': 'none' }, narrow ? `←${bits(src)}` : `← ${bits(src)}`));
      } else {
        rows.appendChild(el('text', { class: 'qi-label mu-fde__zero', x, y: y + 5, 'text-anchor': 'middle', 'pointer-events': 'none' }, '0'));
      }
    });
  }

  function defaultStatus() {
    return mode === 'doc'
      ? 'A <b>document</b> averages the token vectors in each cluster, then fills each empty cluster with the vector of the nearest non-empty one by Hamming distance. Result: <b>8 vectors</b>, none of them empty.'
      : 'A <b>query</b> sums the token vectors in each cluster, so a busier cluster gets a larger magnitude, and leaves empty clusters as zero vectors. Result: <b>8 vectors</b>, some of them zero.';
  }

  function highlight() {
    const hot = pinned ?? hovered;
    node.querySelectorAll('.is-hot').forEach((n) => n.classList.remove('is-hot'));
    if (hot == null) {
      statusEl.innerHTML = defaultStatus();
      return;
    }
    node.querySelectorAll(`[data-code="${hot}"]`).forEach((n) => n.classList.add('is-hot'));
    const m = members(hot);
    const code = `<b>${bits(hot)}</b>`;
    if (m.length === 0) {
      if (mode === 'query') {
        statusEl.innerHTML = `Cluster ${code} is empty. A query does not fill it, so it stays a zero vector: filling would make a term count more than once in the dot product.`;
        return;
      }
      const { d, from } = nearest(hot);
      const names = from.map(bits).map((s) => `<b>${s}</b>`).join(' and ');
      const tie = from.length > 1 ? ` Clusters ${names} are equally close; the illustration copies ${`<b>${bits(from[0])}</b>`}.` : ` It copies the vector of cluster ${names}.`;
      statusEl.innerHTML = `Cluster ${code} is empty. The nearest non-empty cluster is at Hamming distance <b>${d}</b>.${tie}`;
      return;
    }
    const names = m.map((t) => `t<sub>${t.id}</sub>`).join(', ');
    if (m.length === 1) {
      statusEl.innerHTML = `Cluster ${code} holds one token vector (${names}), so its ${mode === 'doc' ? 'average' : 'sum'} is that vector.`;
    } else {
      statusEl.innerHTML =
        mode === 'doc'
          ? `Cluster ${code} holds ${names}. Its vector is their <b>average</b>, so it stays the size of a single token vector.`
          : `Cluster ${code} holds ${names}. Its vector is their <b>sum</b>, so it is ${m.length} tokens' worth in magnitude.`;
    }
  }

  function setMode(next) {
    mode = next;
    pinned = null;
    hovered = null;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    render();
    highlight();
  }

  const codeFrom = (e) => {
    const t = e.target.closest ? e.target.closest('[data-code]') : null;
    return t ? Number(t.getAttribute('data-code')) : null;
  };
  svg.addEventListener('pointerover', (e) => {
    const c = codeFrom(e);
    if (c != null && c !== hovered) {
      hovered = c;
      highlight();
    }
  });
  svg.addEventListener('pointerout', (e) => {
    if (codeFrom(e) != null) {
      hovered = null;
      highlight();
    }
  });
  svg.addEventListener('click', (e) => {
    const c = codeFrom(e);
    if (c == null) return;
    pinned = pinned === c ? null : c;
    highlight();
  });
  chips.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

  function relayout() {
    render();
    highlight();
  }

  setMode('doc');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
