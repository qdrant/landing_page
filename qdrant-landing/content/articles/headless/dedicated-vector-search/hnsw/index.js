/*
 * hnsw island: interactive replacement for hnsw.png.
 *
 * A toy HNSW graph with three layers. Upper layers hold fewer points and long
 * links, layer 0 holds every point. A search enters at the top and, on each
 * layer, walks to the neighbor closest to the query until none is closer, then
 * drops to the same point one layer down. Pick how deep to follow the search.
 * The graph and its edges are illustrative; real HNSW also keeps a list of
 * candidates (ef) on layer 0 instead of a single greedy walk.
 */

const NS = 'http://www.w3.org/2000/svg';
const OY = { 2: 30, 1: 180, 0: 330 };
const PLANE_W = 480;
const PLANE_H = 110;
const R = 8;
// Wide: the full plane. Narrow: the plane is squeezed horizontally so the labels stay readable.
const WIDE = { W: 760, ox: 90, kx: 1, shear: 90 };
const NARROW = { W: 380, ox: 69, kx: 0.55, shear: 40 };

// Positions inside a plane, in plane pixels.
const NODES = {
  A: [400, 30], B: [250, 45], C: [420, 85], D: [170, 62], E: [130, 70],
  N: [40, 62], F: [20, 25], H: [300, 95], I: [200, 20], J: [350, 60], K: [190, 100],
};
const QUERY = [75, 92];
const LAYER_NODES = {
  2: ['A', 'B', 'C'],
  1: ['A', 'B', 'C', 'D', 'E'],
  0: ['A', 'B', 'C', 'D', 'E', 'N', 'F', 'H', 'I', 'J', 'K'],
};
const EDGES = {
  2: [['A', 'B'], ['A', 'C']],
  1: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['D', 'E']],
  0: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['D', 'E'], ['E', 'N'], ['N', 'F'], ['B', 'I'], ['I', 'D'], ['B', 'J'], ['J', 'A'], ['J', 'C'], ['B', 'H'], ['H', 'C'], ['D', 'K'], ['K', 'E'], ['K', 'H']],
};
// Greedy walk on each layer: every hop lands on a point closer to the query.
const HOPS = { 2: ['A', 'B'], 1: ['B', 'D', 'E'], 0: ['E', 'N'] };

const STATUS = {
  2: 'Layer 2 is the sparsest. The search starts at its entry point and moves to the neighbor closest to the query, until no neighbor is closer.',
  1: 'That point is the entry on layer 1, which has more points and shorter links. The same greedy walk continues, here for two hops.',
  0: 'Layer 0 holds every point. The search starts from the layer 1 result, and the closest point it reaches here is the nearest neighbor.',
};

function watchNarrow(node, onChange, below = 700) {
  const is = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < below;
  };
  let narrow = is();
  node.classList.toggle('dv-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('dv-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}


export function mount(node) {
  node.classList.add('dv-hn');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="How deep to follow the search">',
    [2, 1, 0].map((l) => `<button type="button" class="qi-chip" data-upto="${l}" aria-pressed="false">Down to layer ${l}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 470" role="img" aria-label="Three layers of an HNSW graph. A search enters on layer 2, walks to the neighbor closest to the query, drops to layer 1, walks again, drops to layer 0, and ends at the nearest neighbor.">',
    '    <g class="dv-hn__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 dv-hn__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.dv-hn__g');
  const statusEl = node.querySelector('.dv-hn__status');
  const chips = [...node.querySelectorAll('[data-upto]')];
  const svg = node.querySelector('svg');
  let upto = 0;
  let layout = WIDE;
  const isNarrow = watchNarrow(node, () => render());
  const P = (layer, [x, y]) => [layout.ox + x * layout.kx + layout.shear * (1 - y / PLANE_H), OY[layer] + y];

  function arrow(p1, p2, cls) {
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const ux = (p2[0] - p1[0]) / L;
    const uy = (p2[1] - p1[1]) / L;
    const a = [p1[0] + ux * (R + 1), p1[1] + uy * (R + 1)];
    const b = [p2[0] - ux * (R + 9), p2[1] - uy * (R + 9)];
    const tip = [p2[0] - ux * (R + 1), p2[1] - uy * (R + 1)];
    g.appendChild(el('line', { class: cls, x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));
    g.appendChild(el('polygon', {
      class: 'dv-hn__head',
      points: `${tip[0]},${tip[1]} ${tip[0] - ux * 10 - uy * 5},${tip[1] - uy * 10 + ux * 5} ${tip[0] - ux * 10 + uy * 5},${tip[1] - uy * 10 - ux * 5}`,
    }));
  }

  function render() {
    const narrow = isNarrow();
    layout = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${layout.W} 470`);
    g.replaceChildren();
    [2, 1, 0].forEach((l) => {
      const corners = [[0, 0], [PLANE_W, 0], [PLANE_W, PLANE_H], [0, PLANE_H]].map((c) => P(l, c).join(',')).join(' ');
      g.appendChild(el('polygon', { class: 'dv-hn__plane', points: corners }));
      g.appendChild(el('text', { class: 'qi-label', x: 10, y: OY[l] + 62 }, `layer ${l}`));
    });
    // Same point on every layer it belongs to.
    Object.keys(NODES).forEach((id) => {
      const layers = [2, 1, 0].filter((l) => LAYER_NODES[l].includes(id));
      if (layers.length < 2) return;
      const top = P(layers[0], NODES[id]);
      const bottom = P(layers[layers.length - 1], NODES[id]);
      g.appendChild(el('line', { class: 'dv-hn__vert', x1: top[0], y1: top[1], x2: bottom[0], y2: bottom[1] }));
    });
    // Query and its projection on the upper layers.
    const q0 = P(0, QUERY);
    const q2 = P(2, QUERY);
    g.appendChild(el('line', { class: 'dv-hn__vert', x1: q2[0], y1: q2[1], x2: q0[0], y2: q0[1] }));
    [2, 1].forEach((l) => {
      const p = P(l, QUERY);
      g.appendChild(el('circle', { class: 'dv-hn__ghost', cx: p[0], cy: p[1], r: R - 1 }));
    });
    [2, 1, 0].forEach((l) => {
      EDGES[l].forEach(([a, b]) => {
        const pa = P(l, NODES[a]);
        const pb = P(l, NODES[b]);
        g.appendChild(el('line', { class: 'dv-hn__edge', x1: pa[0], y1: pa[1], x2: pb[0], y2: pb[1] }));
      });
    });
    // Search path, from the top layer down to the chosen one.
    const walked = [];
    for (let l = 2; l >= upto; l--) {
      const hops = HOPS[l];
      for (let i = 0; i < hops.length - 1; i++) arrow(P(l, NODES[hops[i]]), P(l, NODES[hops[i + 1]]), 'dv-hn__path');
      walked.push(l);
      if (l > upto) {
        const last = hops[hops.length - 1];
        arrow(P(l, NODES[last]), P(l - 1, NODES[last]), 'dv-hn__drop');
      }
    }
    [2, 1, 0].forEach((l) => {
      LAYER_NODES[l].forEach((id) => {
        const p = P(l, NODES[id]);
        const on = walked.includes(l) && HOPS[l].includes(id);
        g.appendChild(el('circle', { class: `dv-hn__node${on ? ' is-on' : ''}`, cx: p[0], cy: p[1], r: R }));
      });
    });
    g.appendChild(el('circle', { class: 'dv-hn__query', cx: q0[0], cy: q0[1], r: R }));
    g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: q0[0], y: q0[1] + 26, 'text-anchor': 'middle' }, 'query'));
    // Entry and result labels on the layers the search has reached.
    walked.forEach((l) => {
      const entry = P(l, NODES[HOPS[l][0]]);
      g.appendChild(el('circle', { class: 'dv-hn__entry', cx: entry[0], cy: entry[1], r: R + 5 }));
      g.appendChild(el('text', { class: 'qi-label', x: entry[0], y: entry[1] - 20, 'text-anchor': 'middle' }, 'entry'));
    });
    const end = P(upto, NODES[HOPS[upto][HOPS[upto].length - 1]]);
    if (upto === 0) {
      // To the left of the point: below it, the label would collide with the query.
      g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: end[0] - 15, y: end[1] + 19, 'text-anchor': 'end' }, narrow ? 'nearest' : 'nearest neighbor'));
    } else {
      g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: end[0], y: end[1] + 28, 'text-anchor': 'middle' }, narrow ? 'closest' : `closest on layer ${upto}`));
    }
    statusEl.textContent = STATUS[upto];
  }

  function setUpto(l) {
    upto = l;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.upto) === upto)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setUpto(Number(b.dataset.upto))));

  setUpto(0);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
