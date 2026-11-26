/*
 * leaf-scores island: k-NN picks inside one leaf.
 *
 * The left side is an illustrative 5 x 5 score matrix (higher is closer), with
 * each row point's best two cells outlined. The right side is the graph those
 * picks produce: solid edges where both points picked each other, and for a
 * one-way pick a red dashed arrow for the pick plus a grey dashed arrow for the
 * reverse edge Qdrant adds. Select a point to see its picks and edges.
 */

const NS = 'http://www.w3.org/2000/svg';
const NAMES = ['A', 'B', 'C', 'D', 'E'];
const SCORES = [
  [0, 0.9, 0.2, 0.1, 0.3],
  [0.9, 0, 0.4, 0.3, 0.1],
  [0.2, 0.4, 0, 0.8, 0.7],
  [0.1, 0.3, 0.8, 0, 0.2],
  [0.3, 0.1, 0.7, 0.2, 0],
];
const K = 2;
const NODES = [[370, 175], [450, 85], [560, 190], [665, 95], [470, 275]];

const CELL = 44;
const PITCH = 48;
const MX = 28; // matrix left edge
const MY = 84; // matrix top edge
const R = 20;

const picks = SCORES.map((row, i) =>
  row
    .map((s, j) => [s, j])
    .filter(([, j]) => j !== i)
    .sort((a, b) => b[0] - a[0])
    .slice(0, K)
    .map(([, j]) => j),
);
const picked = (i, j) => picks[i].includes(j);

// Unique undirected edges, solid when mutual.
const EDGES = [];
for (let i = 0; i < NAMES.length; i++) {
  for (let j = i + 1; j < NAMES.length; j++) {
    if (picked(i, j) && picked(j, i)) EDGES.push({ a: i, b: j, mutual: true });
    else if (picked(i, j)) EDGES.push({ a: i, b: j, from: i, to: j, mutual: false });
    else if (picked(j, i)) EDGES.push({ a: i, b: j, from: j, to: i, mutual: false });
  }
}

let instanceId = 0;

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

const fmt = (s) => s.toFixed(1).replace(/^0/, '');

export function mount(node) {
  const uid = ++instanceId;
  node.classList.add('pn-ls');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Point to inspect">',
    NAMES.map((n, i) => `<button type="button" class="qi-chip" data-point="${i}" aria-pressed="false">${n}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 396" role="img" aria-label="A five-by-five score matrix with each point\'s best two neighbors outlined, and the graph of edges those picks produce, with one-way picks marked."></svg>',
    '  <p class="qi-status qi-status--2" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.qi-status');
  const chips = [...node.querySelectorAll('[data-point]')];

  svg.appendChild(el('defs', {})).innerHTML =
    `<marker id="pn-ls-arrow-${uid}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path class="pn-ls__arrowhead" d="M0 0L10 5L0 10Z"/></marker>` +
    `<marker id="pn-ls-grey-${uid}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path class="pn-ls__arrowhead pn-ls__arrowhead--grey" d="M0 0L10 5L0 10Z"/></marker>`;

  svg.appendChild(el('text', { class: 'qi-title', x: 0, y: 16 }, 'Scores inside one leaf'));
  svg.appendChild(el('text', { class: 'qi-title', x: 330, y: 16 }, 'Edges from those picks'));

  // Matrix
  const rows = [];
  NAMES.forEach((name, i) => {
    svg.appendChild(el('text', { class: 'pn-ls__axis', x: MX + i * PITCH + CELL / 2, y: MY - 10, 'text-anchor': 'middle' }, name));
    svg.appendChild(el('text', { class: 'pn-ls__axis', x: MX - 14, y: MY + i * PITCH + CELL / 2 + 5, 'text-anchor': 'middle' }, name));
    const g = el('g', { class: 'pn-ls__row' });
    svg.appendChild(g);
    NAMES.forEach((_, j) => {
      const x = MX + j * PITCH;
      const y = MY + i * PITCH;
      if (i === j) {
        g.appendChild(el('rect', { class: 'pn-ls__self', x, y, width: CELL, height: CELL, rx: 6 }));
        return;
      }
      const hot = picked(i, j);
      g.appendChild(
        el('rect', {
          class: `pn-ls__cell${hot ? ' is-pick' : ''}`,
          x, y, width: CELL, height: CELL, rx: 6,
          'fill-opacity': (0.1 + SCORES[i][j] * 0.5).toFixed(2),
        }),
      );
      g.appendChild(el('text', { class: `pn-ls__score${hot ? ' is-pick' : ''}`, x: x + CELL / 2, y: y + CELL / 2 + 5, 'text-anchor': 'middle' }, fmt(SCORES[i][j])));
    });
    rows.push(g);
  });
  ['Higher is closer.', 'Outlined cells are each', 'row point\'s best 2.'].forEach((t, i) =>
    svg.appendChild(el('text', { class: 'qi-label', x: 0, y: 342 + i * 20 }, t)),
  );

  // Graph edges, then nodes on top. A one-way pick is drawn twice, as two
  // parallel lines on opposite sides: the pick, and the reverse edge added for it.
  const arrowPath = (from, to, cls) => {
    const [ax, ay] = NODES[from];
    const [bx, by] = NODES[to];
    const len = Math.hypot(bx - ax, by - ay);
    const ux = (bx - ax) / len;
    const uy = (by - ay) / len;
    const x1 = ax + ux * (R + 3);
    const y1 = ay + uy * (R + 3);
    const x2 = bx - ux * (R + 3);
    const y2 = by - uy * (R + 3);
    const off = 6;
    const dx = -uy * off;
    const dy = ux * off;
    return el('line', { class: `pn-ls__edge ${cls}`, x1: (x1 + dx).toFixed(1), y1: (y1 + dy).toFixed(1), x2: (x2 + dx).toFixed(1), y2: (y2 + dy).toFixed(1), 'marker-end': `url(#${cls.includes('reverse') ? `pn-ls-grey-${uid}` : `pn-ls-arrow-${uid}`})` });
  };
  const edgeEls = EDGES.map((e) => {
    const g = el('g', { class: 'pn-ls__eg' });
    if (e.mutual) {
      const [ax, ay] = NODES[e.a];
      const [bx, by] = NODES[e.b];
      g.appendChild(el('line', { class: 'pn-ls__edge', x1: ax, y1: ay, x2: bx, y2: by }));
    } else {
      g.appendChild(arrowPath(e.from, e.to, 'pn-ls__edge--one'));
      g.appendChild(arrowPath(e.to, e.from, 'pn-ls__edge--reverse'));
    }
    svg.appendChild(g);
    return g;
  });
  const nodeEls = NODES.map(([x, y], i) => {
    const g = el('g', { class: 'pn-ls__node' });
    g.appendChild(el('circle', { cx: x, cy: y, r: R }));
    g.appendChild(el('text', { x, y: y + 5, 'text-anchor': 'middle' }, NAMES[i]));
    svg.appendChild(g);
    return g;
  });

  // Legend
  svg.appendChild(el('line', { class: 'pn-ls__edge', x1: 330, y1: 332, x2: 365, y2: 332 }));
  svg.appendChild(el('text', { class: 'qi-label', x: 373, y: 337 }, 'both points picked each other'));
  svg.appendChild(el('line', { class: 'pn-ls__edge pn-ls__edge--one', x1: 330, y1: 357, x2: 365, y2: 357, 'marker-end': `url(#pn-ls-arrow-${uid})` }));
  svg.appendChild(el('text', { class: 'qi-label', x: 373, y: 362 }, 'one-way pick'));
  svg.appendChild(el('line', { class: 'pn-ls__edge pn-ls__edge--reverse', x1: 330, y1: 382, x2: 365, y2: 382, 'marker-end': `url(#pn-ls-grey-${uid})` }));
  svg.appendChild(el('text', { class: 'qi-label', x: 373, y: 387 }, 'reverse edge added for it'));

  const defaultStatus =
    'Each point keeps its 2 best neighbors in the leaf. A pick becomes an edge in both directions, so a one-way pick still adds the reverse edge. Select a point to see its picks.';

  let sel = null;
  function render() {
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.point) === sel)));
    rows.forEach((g, i) => g.classList.toggle('is-dim', sel !== null && sel !== i));
    EDGES.forEach((e, k) => {
      const on = sel === null || e.a === sel || e.b === sel;
      edgeEls[k].classList.toggle('is-dim', !on);
    });
    nodeEls.forEach((g, i) => {
      const linked = sel === null || i === sel || EDGES.some((e) => (e.a === sel && e.b === i) || (e.b === sel && e.a === i));
      g.classList.toggle('is-dim', !linked);
      g.classList.toggle('is-sel', sel === i);
    });
    if (sel === null) {
      statusEl.textContent = defaultStatus;
      return;
    }
    const mine = picks[sel].map((j) => `${NAMES[j]} (${fmt(SCORES[sel][j])})`).join(' and ');
    const oneWay = picks[sel].filter((j) => !picked(j, sel)).map((j) => NAMES[j]);
    const extra = EDGES.filter((e) => !e.mutual && e.to === sel).map((e) => NAMES[e.from]);
    let text = `${NAMES[sel]} picks ${mine}.`;
    if (oneWay.length) text += ` ${oneWay.join(' and ')} did not pick ${NAMES[sel]} back, so that edge is one-way.`;
    if (extra.length) text += ` ${extra.join(' and ')} picked ${NAMES[sel]} without being picked back.`;
    if (!oneWay.length && !extra.length) text += ' Every pick is mutual.';
    statusEl.textContent = text;
  }
  chips.forEach((b) =>
    b.addEventListener('click', () => {
      const n = Number(b.dataset.point);
      sel = sel === n ? null : n;
      render();
    }),
  );

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
