/*
 * hnsw-graph island: interactive replacement for vector-search.png on the
 * vector search overview page.
 *
 * The acorn island on the search page without filtering: the same graph
 * layer, entry point and query, and the same animated search, but every
 * vector is a regular one. The search walks from the entry point toward the
 * query, computing the distance only to the vectors it visits, and stops at
 * the vector closest to the query.
 *
 * The traversal is not scripted: the island runs a small beam search (as in
 * HNSW's search_layer) over the graph below, so the animation always matches
 * the algorithm. Pure SVG + CSS on the shared island design system
 * (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox 280 x 368), as in the acorn island: the entry point at
// the bottom, the query near the top.
const NODES = {
  a: { x: 140, y: 20 },
  b: { x: 258, y: 52 },
  c: { x: 65, y: 86 },
  i: { x: 165, y: 88 },
  d: { x: 204, y: 94 },
  j: { x: 127, y: 130 },
  e: { x: 226, y: 140 },
  f: { x: 262, y: 162 },
  k: { x: 166, y: 168 },
  l: { x: 20, y: 176 },
  r1: { x: 98, y: 192 },
  m: { x: 219, y: 200 },
  r2: { x: 182, y: 221 },
  g: { x: 42, y: 250 },
  o: { x: 132, y: 276 },
  n: { x: 196, y: 274 },
  h: { x: 65, y: 348 },
  ep: { x: 158, y: 348 },
};
const EDGES = [
  'a-b', 'a-c', 'a-i', 'b-d', 'b-e', 'c-i', 'i-d', 'c-j', 'c-l', 'i-j', 'd-e', 'e-f', 'e-k',
  'j-k', 'j-r1', 'k-r1', 'k-r2', 'l-r1', 'l-g', 'r1-g', 'r1-o', 'm-f', 'm-r2', 'r2-o', 'r2-n',
  'g-o', 'g-h', 'o-n', 'o-h', 'o-ep', 'h-ep', 'n-ep',
].map((e) => e.split('-'));
const ENTRY = 'ep';
const QUERY = { x: 174, y: 126 };
const EF = 2; // beam width: small, so every step of the search is visible
const TOTAL = Object.keys(NODES).length;

const R = 7; // node radius
const RING = 12; // entry point and query rings
const STEP_MS = 1300; // one expanded node per step
const DRAW_MS = 500; // arrow draw-in

const ADJ = {};
Object.keys(NODES).forEach((k) => (ADJ[k] = []));
EDGES.forEach(([a, b]) => {
  ADJ[a].push(b);
  ADJ[b].push(a);
});

const dist = (k) => Math.hypot(NODES[k].x - QUERY.x, NODES[k].y - QUERY.y);
const byDist = (a, b) => dist(a) - dist(b);

// The closest vector: what a perfect search returns.
const NEAREST = Object.keys(NODES).sort(byDist)[0];

/* Beam search over one graph layer, recording each expansion for the
   animation. Expanding a node computes the distance to its unvisited
   neighbors (`checked`) and keeps the closer ones as candidates (`added`). */
function search() {
  const visited = new Set([ENTRY]);
  const candidates = [ENTRY];
  const results = [ENTRY];
  const steps = [];
  while (candidates.length) {
    candidates.sort(byDist);
    const node = candidates.shift();
    if (dist(node) > dist(results[results.length - 1])) break;
    const checked = [];
    const added = [];
    ADJ[node].forEach((n) => {
      if (visited.has(n)) return;
      visited.add(n);
      checked.push(n);
      if (results.length < EF || dist(n) < dist(results[results.length - 1])) {
        candidates.push(n);
        results.push(n);
        results.sort(byDist);
        if (results.length > EF) results.pop();
        added.push(n);
      }
    });
    steps.push({ node, checked, added });
  }
  return { steps, results, count: visited.size };
}

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

/* Arrow path between two nodes, trimmed so it starts and ends at the node
   rims rather than their centers. */
function arrowPath(from, to) {
  const a = NODES[from];
  const b = NODES[to];
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const s = (from === ENTRY ? RING + 3 : R + 4) / len;
  const e = (R + 6) / len;
  const p = (t) => `${(a.x + (b.x - a.x) * t).toFixed(1)} ${(a.y + (b.y - a.y) * t).toFixed(1)}`;
  return `M ${p(s)} L ${p(1 - e)}`;
}

const START_MESSAGE =
  'The search starts at the entry point and follows links to the neighbors closest to the query. It computes the distance only to the vectors it visits.';

const LEGEND = [
  { cls: 'query', label: 'Query' },
  { cls: 'ok', label: 'Vector' },
  { cls: 'visited', label: 'Visited' },
];

export function mount(node) {
  node.classList.add('qi-hg');

  const ep = NODES[ENTRY];
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-replay>',
    '        <svg class="qi-chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Replay',
    '      </button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-hg__svg" viewBox="0 0 280 368" role="img"',
    `    aria-label="An HNSW graph of ${TOTAL} vectors. A search walks from the entry point toward the query, computes the distance only to the vectors it visits, and stops at the vector closest to the query.">`,
    '    <defs>',
    '      <marker id="qi-hg-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">',
    '        <path class="qi-hg__head" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    `    <circle class="qi-hg__area" cx="${QUERY.x}" cy="${QUERY.y}" r="51"/>`,
    '    <g class="qi-hg__edges"></g>',
    '    <g class="qi-hg__trails"></g>',
    `    <circle class="qi-hg__query-ring" cx="${QUERY.x}" cy="${QUERY.y}" r="${RING}"/>`,
    `    <circle class="qi-hg__query" cx="${QUERY.x}" cy="${QUERY.y}" r="${R}"/>`,
    `    <circle class="qi-hg__entry-ring" cx="${ep.x}" cy="${ep.y}" r="${RING}"/>`,
    `    <text class="qi-label qi-hg__entry-label" x="${ep.x + RING + 6}" y="${ep.y + 4}">Entry point</text>`,
    '    <g class="qi-hg__nodes"></g>',
    '  </svg>',
    '  <ul class="qi-hg__legend">',
    LEGEND.map(
      (l) =>
        '<li class="qi-hint"><svg width="12" height="12" aria-hidden="true">' +
        (l.cls === 'query'
          ? '<circle class="qi-hg__query-ring" cx="6" cy="6" r="5"/><circle class="qi-hg__query" cx="6" cy="6" r="2.5"/>'
          : `<circle class="qi-hg__legend-dot qi-hg__legend-dot--${l.cls}" cx="6" cy="6" r="5"/>`) +
        `</svg>${l.label}</li>`,
    ).join(''),
    '  </ul>',
    '  <p class="qi-status qi-status--2 qi-hg__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const edgesG = node.querySelector('.qi-hg__edges');
  const trailsG = node.querySelector('.qi-hg__trails');
  const nodesG = node.querySelector('.qi-hg__nodes');
  const statusEl = node.querySelector('.qi-hg__status');
  const replayBtn = node.querySelector('[data-replay]');

  EDGES.forEach(([a, b]) => {
    edgesG.appendChild(el('line', { class: 'qi-hg__edge', x1: NODES[a].x, y1: NODES[a].y, x2: NODES[b].x, y2: NODES[b].y }));
  });

  const nodeEls = {};
  Object.keys(NODES).forEach((k) => {
    const n = NODES[k];
    const g = el('g', { class: 'qi-hg__node' });
    g.appendChild(el('circle', { class: 'qi-hg__halo', cx: n.x, cy: n.y, r: R + 5 }));
    g.appendChild(el('circle', { class: 'qi-hg__dot', cx: n.x, cy: n.y, r: R }));
    nodeEls[k] = g;
    nodesG.appendChild(g);
  });

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timers = [];
  let started = false;
  const later = (ms, fn) => timers.push(window.setTimeout(fn, ms));

  function reset() {
    timers.forEach((t) => clearTimeout(t));
    timers = [];
    trailsG.textContent = '';
    Object.values(nodeEls).forEach((g) => g.classList.remove('is-visited', 'is-current', 'is-best'));
    nodeEls[ENTRY].classList.add('is-visited');
  }

  function showCurrent(step) {
    Object.values(nodeEls).forEach((g) => g.classList.remove('is-current'));
    nodeEls[step.node].classList.add('is-current');
  }

  function drawArrows(step, animate) {
    step.added.forEach((to) => {
      const arrow = el('path', { class: 'qi-hg__arrow', d: arrowPath(step.node, to), pathLength: 1 });
      trailsG.appendChild(arrow);
      if (!animate) {
        arrow.setAttribute('marker-end', 'url(#qi-hg-head)');
        return;
      }
      // Commit the undrawn state, then transition the stroke in. The arrowhead
      // is attached once the line reaches it, so it never floats ahead.
      arrow.classList.add('is-drawing');
      void arrow.getBoundingClientRect();
      arrow.classList.remove('is-drawing');
      later(DRAW_MS, () => arrow.setAttribute('marker-end', 'url(#qi-hg-head)'));
    });
  }

  function markVisited(step) {
    step.checked.forEach((k) => nodeEls[k].classList.add('is-visited'));
  }

  function finish(run) {
    Object.values(nodeEls).forEach((g) => g.classList.remove('is-current'));
    nodeEls[run.results[0]].classList.add('is-best');
    statusEl.innerHTML =
      run.results[0] === NEAREST
        ? `The search reaches the vector closest to the query after computing the distance to <b>${run.count} of ${TOTAL}</b> vectors. The rest of the graph is never checked.`
        : `The search stops at a vector close to the query after computing the distance to <b>${run.count} of ${TOTAL}</b> vectors.`;
  }

  function play() {
    started = true;
    reset();
    const run = search();
    if (reduceMotion) {
      run.steps.forEach((step) => {
        drawArrows(step, false);
        markVisited(step);
      });
      finish(run);
      return;
    }
    statusEl.innerHTML = START_MESSAGE;
    let t = 500;
    run.steps.forEach((step) => {
      later(t, () => showCurrent(step));
      later(t + 300, () => drawArrows(step, true));
      later(t + 300 + DRAW_MS, () => markVisited(step));
      t += STEP_MS;
    });
    later(t, () => finish(run));
  }

  replayBtn.addEventListener('click', play);

  // Before the first run, show the graph at rest; the search starts once the
  // reader can see it, so the animation does not finish offscreen.
  reset();
  statusEl.innerHTML = START_MESSAGE;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          if (!started) play();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(node);
  } else {
    play();
  }

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
