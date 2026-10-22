/*
 * acorn island: interactive replacement for hnsw-acorn.png.
 *
 * One HNSW graph layer in which some vectors are filtered out. An animated
 * search walks from the entry point toward the query. Without ACORN, the
 * search can only follow links to vectors that match the filter, so it gets
 * stuck when every link out of the explored region leads to a filtered-out
 * vector. With ACORN, the search also follows the links of filtered-out
 * neighbors (the second hop), so it can hop over them and reach the vectors
 * closest to the query.
 *
 * The traversal is not scripted: the island runs a small beam search (as in
 * HNSW's search_layer) over the graph below, so the animation always matches
 * the algorithm. Pure SVG + CSS on the shared island design system
 * (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox 280 x 368), traced from the left graph of the original
// illustration at half its size: the entry point at the bottom, the query
// near the top.
// `ok`: the vector matches the filter.
const NODES = {
  a: { x: 140, y: 20, ok: true },
  b: { x: 258, y: 52, ok: true },
  c: { x: 65, y: 86, ok: true },
  f1: { x: 165, y: 88, ok: false },
  d: { x: 204, y: 94, ok: true },
  f2: { x: 127, y: 130, ok: false },
  e: { x: 226, y: 140, ok: true },
  f: { x: 262, y: 162, ok: true },
  f3: { x: 166, y: 168, ok: false },
  f4: { x: 20, y: 176, ok: false },
  r1: { x: 98, y: 192, ok: true },
  f5: { x: 219, y: 200, ok: false },
  r2: { x: 182, y: 221, ok: true },
  g: { x: 42, y: 250, ok: true },
  o: { x: 132, y: 276, ok: true },
  f6: { x: 196, y: 274, ok: false },
  h: { x: 65, y: 348, ok: true },
  ep: { x: 158, y: 348, ok: true },
};
const EDGES = [
  'a-b', 'a-c', 'a-f1', 'b-d', 'b-e', 'c-f1', 'f1-d', 'c-f2', 'c-f4', 'f1-f2', 'd-e', 'e-f', 'e-f3',
  'f2-f3', 'f2-r1', 'f3-r1', 'f3-r2', 'f4-r1', 'f4-g', 'r1-g', 'r1-o', 'f5-f', 'f5-r2', 'r2-o', 'r2-f6',
  'g-o', 'g-h', 'o-f6', 'o-h', 'o-ep', 'h-ep', 'f6-ep',
].map((e) => e.split('-'));
const ENTRY = 'ep';
const QUERY = { x: 174, y: 126 };
const EF = 2; // beam width: small, so every step of the search is visible

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
const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// The closest vector that matches the filter: what a perfect search returns.
const NEAREST = Object.keys(NODES)
  .filter((k) => NODES[k].ok)
  .sort(byDist)[0];

/* Beam search over one graph layer, recording each expansion for the
   animation. Without ACORN, a node's links to filtered-out vectors are dead
   ends. With ACORN, a filtered-out neighbor is looked through: its own
   neighbors that match the filter become candidates (the second hop). */
function search(acorn) {
  const visited = new Set([ENTRY]);
  const candidates = [ENTRY];
  const results = [ENTRY];
  const steps = [];
  while (candidates.length) {
    candidates.sort(byDist);
    const node = candidates.shift();
    if (dist(node) > dist(results[results.length - 1])) break;

    const paths = [];
    const blocked = [];
    ADJ[node].forEach((n) => {
      if (NODES[n].ok) paths.push([node, n]);
      else if (acorn) ADJ[n].forEach((m) => m !== node && NODES[m].ok && paths.push([node, n, m]));
      else blocked.push(n);
    });

    const added = [];
    paths.forEach((path) => {
      const next = path[path.length - 1];
      if (visited.has(next)) return;
      visited.add(next);
      if (results.length < EF || dist(next) < dist(results[results.length - 1])) {
        candidates.push(next);
        results.push(next);
        results.sort(byDist);
        if (results.length > EF) results.pop();
        added.push(path);
      }
    });
    steps.push({ node, added, blocked });
  }
  return { steps, results };
}

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

/* Arrow path through the given nodes, trimmed so it starts and ends at the
   node rims rather than their centers. */
function arrowPath(ids) {
  const pts = ids.map((k) => ({ x: NODES[k].x, y: NODES[k].y }));
  const trim = (from, to, by) => {
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    return { x: from.x + ((to.x - from.x) * by) / len, y: from.y + ((to.y - from.y) * by) / len };
  };
  const start = trim(pts[0], pts[1], ids[0] === ENTRY ? RING + 3 : R + 4);
  const end = trim(pts[pts.length - 1], pts[pts.length - 2], R + 6);
  const mid = pts.slice(1, -1);
  return [start, ...mid, end].map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

/* The status line holds one caption while the search runs and one when it
   ends; per-step captions changed too fast to read. */
function startMessage(acorn) {
  return acorn
    ? 'The search follows links to vectors that match the filter. When a neighbor is filtered out, ACORN checks <b>its</b> neighbors (the second hop).'
    : 'The search starts at the entry point and follows links to neighbors that match the filter.';
}

const LEGEND = [
  { cls: 'query', label: 'Query' },
  { cls: 'ok', label: 'Matches filter' },
  { cls: 'filtered', label: 'Filtered out' },
  { cls: 'visited', label: 'Visited' },
  { cls: 'hop', label: 'Second hop (ACORN)', line: true },
];

export function mount(node) {
  node.classList.add('qi-ac');

  const ep = NODES[ENTRY];
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <label class="qi-chip qi-ac__opt">',
    '        <input type="checkbox" class="qi-ac__check">Enable ACORN',
    '      </label>',
    '      <button type="button" class="qi-chip" data-replay>',
    '        <svg class="qi-chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Replay',
    '      </button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-ac__svg" viewBox="0 0 280 368" role="img"',
    '    aria-label="An HNSW graph in which some vectors are filtered out. A search walks from the entry point toward the query. Without ACORN, it gets stuck behind filtered-out vectors. With ACORN, it hops over them and reaches the vectors closest to the query.">',
    '    <defs>',
    '      <marker id="qi-ac-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">',
    '        <path class="qi-ac__head" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '      <marker id="qi-ac-head-hop" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">',
    '        <path class="qi-ac__head qi-ac__head--hop" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    `    <circle class="qi-ac__area" cx="${QUERY.x}" cy="${QUERY.y}" r="51"/>`,
    '    <g class="qi-ac__edges"></g>',
    '    <g class="qi-ac__trails"></g>',
    `    <circle class="qi-ac__query-ring" cx="${QUERY.x}" cy="${QUERY.y}" r="${RING}"/>`,
    `    <circle class="qi-ac__query" cx="${QUERY.x}" cy="${QUERY.y}" r="${R}"/>`,
    `    <circle class="qi-ac__entry-ring" cx="${ep.x}" cy="${ep.y}" r="${RING}"/>`,
    `    <text class="qi-label qi-ac__entry-label" x="${ep.x + RING + 6}" y="${ep.y + 4}">Entry point</text>`,
    '    <g class="qi-ac__nodes"></g>',
    '  </svg>',
    '  <ul class="qi-ac__legend">',
    LEGEND.map(
      (l) =>
        `<li class="qi-hint"${l.line ? ' data-legend-hop hidden' : ''}><svg width="${l.line ? 22 : 12}" height="12" aria-hidden="true">` +
        (l.line
          ? '<line class="qi-ac__legend-hop" x1="1" y1="6" x2="21" y2="6"/>'
          : l.cls === 'query'
            ? '<circle class="qi-ac__query-ring" cx="6" cy="6" r="5"/><circle class="qi-ac__query" cx="6" cy="6" r="2.5"/>'
            : `<circle class="qi-ac__legend-dot qi-ac__legend-dot--${l.cls}" cx="6" cy="6" r="5"/>`) +
        `</svg>${l.label}</li>`,
    ).join(''),
    '  </ul>',
    '  <p class="qi-status qi-status--2 qi-ac__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const edgesG = node.querySelector('.qi-ac__edges');
  const trailsG = node.querySelector('.qi-ac__trails');
  const nodesG = node.querySelector('.qi-ac__nodes');
  const statusEl = node.querySelector('.qi-ac__status');
  const check = node.querySelector('.qi-ac__check');
  const replayBtn = node.querySelector('[data-replay]');
  const hopLegend = node.querySelector('[data-legend-hop]');

  const edgeEls = {};
  EDGES.forEach(([a, b]) => {
    const ok = NODES[a].ok && NODES[b].ok;
    const line = el('line', {
      class: `qi-ac__edge${ok ? '' : ' qi-ac__edge--filtered'}`,
      x1: NODES[a].x,
      y1: NODES[a].y,
      x2: NODES[b].x,
      y2: NODES[b].y,
    });
    edgeEls[edgeKey(a, b)] = line;
    edgesG.appendChild(line);
  });

  const nodeEls = {};
  Object.keys(NODES).forEach((k) => {
    const n = NODES[k];
    const g = el('g', { class: `qi-ac__node qi-ac__node--${n.ok ? 'ok' : 'filtered'}` });
    g.appendChild(el('circle', { class: 'qi-ac__halo', cx: n.x, cy: n.y, r: R + 5 }));
    g.appendChild(el('circle', { class: 'qi-ac__dot', cx: n.x, cy: n.y, r: R }));
    nodeEls[k] = g;
    nodesG.appendChild(g);
  });

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let acorn = false;
  let timers = [];
  let blockedEls = [];
  let started = false;

  const later = (ms, fn) => timers.push(window.setTimeout(fn, ms));
  const clearBlocked = () => {
    blockedEls.forEach((e) => e.classList.remove('is-blocked'));
    blockedEls = [];
  };

  function reset() {
    timers.forEach((t) => clearTimeout(t));
    timers = [];
    clearBlocked();
    trailsG.textContent = '';
    Object.values(nodeEls).forEach((g) => g.classList.remove('is-visited', 'is-current', 'is-best', 'is-stuck'));
    nodeEls[ENTRY].classList.add('is-visited');
  }

  function showCurrent(step) {
    Object.values(nodeEls).forEach((g) => g.classList.remove('is-current'));
    nodeEls[step.node].classList.add('is-current');
    clearBlocked();
    step.blocked.forEach((n) => {
      const e = edgeEls[edgeKey(step.node, n)];
      e.classList.add('is-blocked');
      blockedEls.push(e);
    });
  }

  function drawArrows(step, animate) {
    step.added.forEach((path) => {
      const hop = path.length === 3;
      const arrow = el('path', { class: `qi-ac__arrow${hop ? ' qi-ac__arrow--hop' : ''}`, d: arrowPath(path), pathLength: 1 });
      const head = `url(#qi-ac-head${hop ? '-hop' : ''})`;
      trailsG.appendChild(arrow);
      if (!animate) {
        arrow.setAttribute('marker-end', head);
        return;
      }
      // Commit the undrawn state, then transition the stroke in. The arrowhead
      // is attached once the line reaches it, so it never floats ahead.
      arrow.classList.add('is-drawing');
      void arrow.getBoundingClientRect();
      arrow.classList.remove('is-drawing');
      later(DRAW_MS, () => arrow.setAttribute('marker-end', head));
    });
  }

  function markVisited(step) {
    step.added.forEach((path) => nodeEls[path[path.length - 1]].classList.add('is-visited'));
  }

  function finish(results) {
    clearBlocked();
    Object.values(nodeEls).forEach((g) => g.classList.remove('is-current'));
    if (results[0] === NEAREST) {
      nodeEls[NEAREST].classList.add('is-best');
      statusEl.innerHTML =
        'The search reaches the vector closest to the query that matches the filter, at the cost of checking more vectors.';
    } else {
      // Every result is a dead end, as in the original illustration.
      results.forEach((k) => nodeEls[k].classList.add('is-stuck'));
      statusEl.innerHTML =
        "The search cannot reach the query's vector space, because the nodes that connect to it have been filtered out. Enable ACORN to compare.";
    }
  }

  function play() {
    started = true;
    reset();
    const { steps, results } = search(acorn);
    if (reduceMotion) {
      steps.forEach((step) => {
        drawArrows(step, false);
        markVisited(step);
      });
      finish(results);
      return;
    }
    statusEl.innerHTML = startMessage(acorn);
    let t = 500;
    steps.forEach((step) => {
      later(t, () => showCurrent(step));
      later(t + 300, () => drawArrows(step, true));
      later(t + 300 + DRAW_MS, () => markVisited(step));
      t += STEP_MS;
    });
    later(t, () => finish(results));
  }

  check.addEventListener('change', () => {
    acorn = check.checked;
    // Second hops only happen with ACORN, so only then do they need a key.
    hopLegend.hidden = !acorn;
    play();
  });
  replayBtn.addEventListener('click', play);

  // Before the first run, show the graph at rest; the search starts once the
  // reader can see it, so the animation does not finish offscreen.
  reset();
  statusEl.innerHTML = startMessage(acorn);
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
