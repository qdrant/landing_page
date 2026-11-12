/*
 * repairs island: interactive replacement for two-repairs.svg.
 *
 * The same 12-point HNSW graph, searched under a filter that only four points
 * match (the red ones), starting from the matching point on the left:
 *   Plain graph:      both neighbors of the entry point are filtered out, so the
 *                     search is blocked.
 *   ACORN:            at search time, the search also looks through filtered-out
 *                     neighbors to the matching points behind them.
 *   Filterable HNSW:  at index time, extra edges link the matching points, so the
 *                     search walks them directly.
 * The traversals are computed on this graph with the rules above; the graph
 * itself is a toy.
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
  node.classList.toggle('ac-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('ac-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

const NODES = [
  [45, 110], [125, 45], [210, 35], [290, 60], [255, 150], [165, 120],
  [75, 190], [235, 235], [320, 225], [335, 140], [150, 255], [285, 290],
];
const EDGES = [[0, 1], [0, 6], [1, 2], [1, 5], [2, 3], [2, 5], [3, 9], [9, 4], [9, 8], [4, 5], [4, 7], [5, 6], [6, 10], [10, 7], [7, 8], [7, 11], [8, 11]];
const MATCH = new Set([0, 9, 10, 11]);
const ENTRY = 0;
const EXTRA = [[0, 10], [10, 11], [11, 9]]; // index-time edges between points sharing the indexed value
const adj = NODES.map(() => []);
EDGES.forEach(([a, b]) => {
  adj[a].push(b);
  adj[b].push(a);
});

// ACORN: from each reached matching point, step to matching neighbors, and through filtered-out
// neighbors to the matching points behind them.
function acorn() {
  const reached = [ENTRY];
  const hops = []; // { from, via, to }
  const queue = [ENTRY];
  while (queue.length) {
    const u = queue.shift();
    adj[u].forEach((v) => {
      if (MATCH.has(v)) {
        if (!reached.includes(v)) {
          reached.push(v);
          hops.push({ from: u, via: null, to: v });
          queue.push(v);
        }
      } else {
        adj[v].forEach((w) => {
          if (MATCH.has(w) && !reached.includes(w)) {
            reached.push(w);
            hops.push({ from: u, via: v, to: w });
            queue.push(w);
          }
        });
      }
    });
  }
  return { reached, hops };
}
function plain() {
  const reached = [ENTRY];
  const blocked = [];
  adj[ENTRY].forEach((v) => (MATCH.has(v) ? reached.push(v) : blocked.push(v)));
  return { reached, blocked };
}
const ACORN = acorn();
const PLAIN = plain();

const STATES = [
  { id: 'plain', label: 'Plain graph' },
  { id: 'acorn', label: 'ACORN (search time)' },
  { id: 'filterable', label: 'Filterable HNSW (index time)' },
];

const WIDE = { VB_W: 760, VB_H: 440, s: 1.12, ox: 40, oy: 30, legendX: 500 };
const NARROW = { VB_W: 340, VB_H: 470, s: 0.86, ox: 8, oy: 22, legendX: 10 };

export function mount(node) {
  node.classList.add('ac-rp');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Repair">',
    STATES.map((s) => `<button type="button" class="qi-chip" data-state="${s.id}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 440" role="img" aria-label="A 12-point HNSW graph searched under a filter that four points match, with a plain search blocked, an ACORN search stepping through filtered-out neighbors, and a filterable HNSW search following extra edges.">',
    '    <defs><marker id="ac-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" class="ac-rp__marker"/></marker></defs>',
    '    <g class="ac-rp__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ac-rp__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ac-rp__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.ac-rp__status');
  const chips = [...node.querySelectorAll('[data-state]')];
  let state = 'acorn';
  const isNarrow = watchNarrow(node, () => render());

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    const P = (i) => [G.ox + NODES[i][0] * G.s, G.oy + NODES[i][1] * G.s];
    const line = (a, b, cls, extra = {}) => g.appendChild(el('line', { class: cls, x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...extra }));
    // shorten a segment so it stops at the node edge
    const trim = (a, b, r) => {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [b[0] - ((b[0] - a[0]) / L) * r, b[1] - ((b[1] - a[1]) / L) * r];
    };

    EDGES.forEach(([a, b]) => line(P(a), P(b), 'ac-rp__edge'));

    if (state === 'plain') {
      PLAIN.blocked.forEach((v) => {
        const a = P(ENTRY);
        const b = P(v);
        const mid = [a[0] + (b[0] - a[0]) * 0.55, a[1] + (b[1] - a[1]) * 0.55];
        line(a, mid, 'ac-rp__path');
        g.appendChild(el('path', { class: 'ac-rp__x', d: `M${mid[0] - 6} ${mid[1] - 6} L${mid[0] + 6} ${mid[1] + 6} M${mid[0] - 6} ${mid[1] + 6} L${mid[0] + 6} ${mid[1] - 6}` }));
      });
    } else if (state === 'acorn') {
      ACORN.hops.forEach(({ from, via, to }) => {
        const a = P(from);
        const b = P(to);
        if (via == null) {
          line(a, trim(a, b, 13), 'ac-rp__path', { 'marker-end': 'url(#ac-arrow)' });
        } else {
          const v = P(via);
          line(a, v, 'ac-rp__path');
          line(v, trim(v, b, 13), 'ac-rp__path', { 'marker-end': 'url(#ac-arrow)' });
          g.appendChild(el('circle', { class: 'ac-rp__through', cx: v[0], cy: v[1], r: 17 }));
        }
      });
    } else {
      EXTRA.forEach(([a, b], k) => {
        const pa = P(a);
        const pb = P(b);
        const mx = (pa[0] + pb[0]) / 2;
        const my = (pa[1] + pb[1]) / 2;
        const nx = -(pb[1] - pa[1]);
        const ny = pb[0] - pa[0];
        const L = Math.hypot(nx, ny) || 1;
        const bend = 40 * (k % 2 ? 1 : -1) + (k === 0 ? -10 : 0);
        const c = [mx + (nx / L) * bend, my + (ny / L) * bend];
        g.appendChild(el('path', { class: 'ac-rp__extra', d: `M${pa[0]} ${pa[1]} Q${c[0]} ${c[1]} ${pb[0]} ${pb[1]}` }));
      });
      // The search follows the extra edges: same chain, drawn as the path on top.
      EXTRA.forEach(([a, b], k) => {
        const pa = P(a);
        const pb = P(b);
        const mx = (pa[0] + pb[0]) / 2;
        const my = (pa[1] + pb[1]) / 2;
        const nx = -(pb[1] - pa[1]);
        const ny = pb[0] - pa[0];
        const L = Math.hypot(nx, ny) || 1;
        const bend = 40 * (k % 2 ? 1 : -1) + (k === 0 ? -10 : 0);
        const c = [mx + (nx / L) * bend, my + (ny / L) * bend];
        const end = trim(c, pb, 13);
        g.appendChild(el('path', { class: 'ac-rp__path', d: `M${pa[0]} ${pa[1]} Q${c[0]} ${c[1]} ${end[0]} ${end[1]}`, 'marker-end': 'url(#ac-arrow)' }));
      });
    }

    NODES.forEach((_, i) => {
      const p = P(i);
      const m = MATCH.has(i);
      g.appendChild(el('circle', { class: `ac-rp__node ${m ? 'is-match' : 'is-out'}`, cx: p[0], cy: p[1], r: m ? 11 : 9.5 }));
    });
    const e = P(ENTRY);
    g.appendChild(el('circle', { class: 'ac-rp__entry', cx: e[0], cy: e[1], r: 16 }));

    // Legend
    const items = [
      ['node-match', 'matches the filter'],
      ['node-out', 'filtered out'],
      ['edge', 'base HNSW edge'],
      ['extra', 'extra HNSW edge'],
      ['path', 'search path'],
      ['x', 'blocked'],
    ];
    const ly0 = narrow ? G.oy + 350 * G.s + 28 : 90;
    items.forEach(([k, t], i) => {
      const col = narrow ? i % 2 : 0;
      const row = narrow ? Math.floor(i / 2) : i;
      const x = G.legendX + col * (narrow ? 168 : 160);
      const y = ly0 + row * 28;
      if (k === 'node-match') g.appendChild(el('circle', { class: 'ac-rp__node is-match', cx: x + 10, cy: y - 4, r: 8 }));
      if (k === 'node-out') g.appendChild(el('circle', { class: 'ac-rp__node is-out', cx: x + 10, cy: y - 4, r: 8 }));
      if (k === 'edge') line([x, y - 4], [x + 22, y - 4], 'ac-rp__edge');
      if (k === 'extra') line([x, y - 4], [x + 22, y - 4], 'ac-rp__extra');
      if (k === 'path') line([x, y - 4], [x + 22, y - 4], 'ac-rp__path');
      if (k === 'x') g.appendChild(el('path', { class: 'ac-rp__x', d: `M${x + 4} ${y - 9} L${x + 16} ${y + 3} M${x + 4} ${y + 3} L${x + 16} ${y - 9}` }));
      g.appendChild(el('text', { class: `qi-label${narrow ? ' ac-rp__leg' : ''}`, x: x + (narrow ? 28 : 30), y }, t));
    });
    if (narrow) svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${ly0 + 3 * 28 + 6}`);

    const nMatch = MATCH.size;
    statusEl.innerHTML = {
      plain: `<b>Plain graph</b>: the entry point's ${PLAIN.blocked.length} neighbors are both filtered out, so the search is blocked and reaches <b>${PLAIN.reached.length} of ${nMatch}</b> matching points.`,
      acorn: `<b>ACORN</b> steps through filtered-out neighbors at search time (${new Set(ACORN.hops.filter((h) => h.via != null).map((h) => h.via)).size} here, circled) and reaches <b>${ACORN.reached.length} of ${nMatch}</b> matching points. The repair costs extra distance computations on every query.`,
      filterable: `<b>Filterable HNSW</b> adds <b>${EXTRA.length}</b> extra edges at index time between points that share an indexed value, so the search walks them directly and reaches <b>${nMatch} of ${nMatch}</b>. The repair costs build time and memory instead of query time.`,
    }[state];
  }

  function setState(s) {
    state = s;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.state === state)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setState(b.dataset.state)));

  setState(state);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
