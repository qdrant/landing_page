/*
 * hnsw-graph island: interactive replacement for vector-search.png on the
 * vector search overview page. Styled like the acorn island on the search
 * page (same node, arrow, halo and legend language).
 *
 * 40 vectors in a 2D space, indexed in a small graph in the spirit of HNSW:
 * every vector is on layer 0, linked to its nearest neighbors (short, dashed
 * links); about a quarter are also on layer 1, linked to their nearest
 * layer-1 neighbors (long, solid links). Real HNSW indexes have more layers;
 * two keep the animation calm while showing the idea. Both layers are drawn
 * in one space.
 *
 * The search starts at the entry point, a layer-1 vector near the middle. On
 * layer 1 it moves greedily along long links to whichever neighbor is closer
 * to the query. On layer 0 it runs a small beam search (as in HNSW's
 * search_layer) along short links. Every vector whose distance it computes
 * turns orange; the result turns teal. The traversal is not scripted: the
 * island runs the search, so the animation always matches the algorithm.
 *
 * The graph is a simplification: links are each vector's nearest neighbors
 * on the layer, not built by HNSW's insertion with neighbor selection.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

const SEED = 249; // layout seed: picked so the entry point sits near the middle
const N = 40;
const W = 560; // viewBox
const H = 336;
const PAD = 22;
const MIN_GAP = 46; // minimum distance between vectors, in viewBox units
const LINKS = [3, 3]; // neighbors per vector, by layer
const EF = 2; // beam width on layer 0: small, so every step is visible
const R = 6; // node radius
const RING = 11; // entry point and query rings
const STEP_MS = 1300; // one expanded node per step
const DRAW_MS = 500; // arrow draw-in

// Seeded random numbers, so the graph is the same on every page load.
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGraph() {
  const rand = rng(SEED);
  const pts = [];
  // Spread the vectors out so every one of them is easy to see.
  while (pts.length < N) {
    const p = { x: PAD + rand() * (W - 2 * PAD), y: PAD + rand() * (H - 2 * PAD) };
    if (pts.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= MIN_GAP)) pts.push({ ...p, level: rand() < 0.25 ? 1 : 0 });
  }
  const d = (a, b) => Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y);
  const layers = [0, 1].map((l) => {
    const ids = pts.flatMap((p, i) => (p.level >= l ? [i] : []));
    const adj = new Map(ids.map((i) => [i, new Set()]));
    ids.forEach((i) =>
      ids
        .filter((j) => j !== i)
        .sort((a, b) => d(i, a) - d(i, b))
        .slice(0, LINKS[l])
        .forEach((j) => {
          adj.get(i).add(j);
          adj.get(j).add(i);
        }),
    );
    return { ids, adj };
  });
  // Entry point: the layer-1 vector closest to the middle, so searches start
  // with moderate moves rather than a jump across the graph.
  const mid = { x: W / 2, y: H / 2 };
  const toMid = (i) => Math.hypot(pts[i].x - mid.x, pts[i].y - mid.y);
  const entry = layers[1].ids.reduce((a, b) => (toMid(b) < toMid(a) ? b : a));
  return { pts, layers, entry };
}

/* The search, as a list of expansions to animate. Each step expands one
   vector: it computes the distance to its unvisited neighbors (`checked`),
   and draws an arrow to each one it keeps as a candidate (`added`). */
function search(g, q) {
  const dist = (i) => Math.hypot(g.pts[i].x - q.x, g.pts[i].y - q.y);
  const byDist = (a, b) => dist(a) - dist(b);
  const steps = [];
  let count = 1;
  let cur = g.entry;

  // Layer 1: greedy, along long links.
  const seen1 = new Set([cur]);
  for (;;) {
    const checked = [...g.layers[1].adj.get(cur)].filter((n) => !seen1.has(n));
    checked.forEach((n) => seen1.add(n));
    count += checked.length;
    const best = [cur, ...checked].sort(byDist)[0];
    steps.push({ node: cur, checked, added: best !== cur ? [best] : [], long: true, count });
    if (best === cur) break;
    cur = best;
  }

  // Layer 0: beam search with EF candidates, along short links.
  const visited = new Set([cur]);
  const candidates = [cur];
  const results = [cur];
  while (candidates.length) {
    candidates.sort(byDist);
    const node = candidates.shift();
    if (dist(node) > dist(results[results.length - 1])) break;
    const checked = [...g.layers[0].adj.get(node)].filter((n) => !visited.has(n));
    const added = [];
    checked.forEach((n) => {
      visited.add(n);
      count++;
      if (results.length < EF || dist(n) < dist(results[results.length - 1])) {
        candidates.push(n);
        results.push(n);
        results.sort(byDist);
        if (results.length > EF) results.pop();
        added.push(n);
      }
    });
    steps.push({ node, checked, added, long: false, count });
  }
  const nearest = g.pts.map((_, i) => i).sort(byDist)[0];
  return { steps, result: results[0], nearest, count };
}

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

// Arrow from one vector to another, trimmed to start and end at the rims.
function arrowPath(a, b, fromRing) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const s = (fromRing ? RING + 3 : R + 4) / len;
  const e = (R + 6) / len;
  const p = (t) => `${(a.x + (b.x - a.x) * t).toFixed(1)} ${(a.y + (b.y - a.y) * t).toFixed(1)}`;
  return `M ${p(s)} L ${p(1 - e)}`;
}

const LEGEND = [
  { cls: 'query', label: 'Query' },
  { cls: 'ok', label: 'Vector' },
  { cls: 'visited', label: 'Distance computed' },
  { cls: 'long', label: 'Long link (upper layer)', line: true },
  { cls: 'short', label: 'Short link', line: true },
];

const START_MESSAGE =
  'The search starts at the entry point and moves toward the query, first along long links, then along short ones. It computes the distance only to the vectors it visits.';

// Query positions for "New query": in open space next to a vector, away from
// the entry point. Each one finds the exact nearest vector (checked offline).
const QUERIES = [
  { x: 142, y: 248 },
  { x: 490, y: 104 },
  { x: 274, y: 50 },
  { x: 352, y: 278 },
  { x: 88, y: 74 },
];

export function mount(node) {
  node.classList.add('qi-hg');
  const g = buildGraph();
  const ep = g.pts[g.entry];

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-new>New query</button>',
    '      <button type="button" class="qi-chip" data-replay>',
    '        <svg class="qi-chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Replay',
    '      </button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-hg__svg" viewBox="0 0 ${W} ${H}" role="img"`,
    `    aria-label="An HNSW graph of ${N} vectors. A search starts at the entry point, follows long links and then short links toward the query, and computes the distance only to the vectors it visits.">`,
    '    <defs>',
    '      <marker id="qi-hg-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">',
    '        <path class="qi-hg__head" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    '    <g class="qi-hg__edges"></g>',
    '    <g class="qi-hg__trails"></g>',
    '    <g class="qi-hg__marks"></g>',
    '    <g class="qi-hg__nodes"></g>',
    '  </svg>',
    '  <ul class="qi-hg__legend">',
    LEGEND.map(
      (l) =>
        `<li class="qi-hint"><svg width="${l.line ? 22 : 12}" height="12" aria-hidden="true">` +
        (l.line
          ? `<line class="qi-hg__edge qi-hg__edge--${l.cls}" x1="1" y1="6" x2="21" y2="6"/>`
          : l.cls === 'query'
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
  const marksG = node.querySelector('.qi-hg__marks');
  const nodesG = node.querySelector('.qi-hg__nodes');
  const statusEl = node.querySelector('.qi-hg__status');

  // Links: short ones dashed, long ones solid on top.
  const short = new Set();
  g.layers[0].adj.forEach((ns, i) => ns.forEach((j) => short.add(i < j ? `${i}-${j}` : `${j}-${i}`)));
  const long = new Set();
  g.layers[1].adj.forEach((ns, i) => ns.forEach((j) => long.add(i < j ? `${i}-${j}` : `${j}-${i}`)));
  const line = (key, cls) => {
    const [i, j] = key.split('-').map(Number);
    el('line', { class: `qi-hg__edge qi-hg__edge--${cls}`, x1: g.pts[i].x, y1: g.pts[i].y, x2: g.pts[j].x, y2: g.pts[j].y }, edgesG);
  };
  short.forEach((k) => !long.has(k) && line(k, 'short'));
  long.forEach((k) => line(k, 'long'));

  // Entry point ring and label, query ring and dot.
  el('circle', { class: 'qi-hg__entry-ring', cx: ep.x, cy: ep.y, r: RING }, marksG);
  // Label to the left of the ring, where this layout has open space.
  el('text', { class: 'qi-label qi-hg__entry-label', x: ep.x - RING - 6, y: ep.y + 4, 'text-anchor': 'end' }, marksG).textContent = 'Entry point';
  const queryG = el('g', { class: 'qi-hg__query-g' }, nodesG);
  el('circle', { class: 'qi-hg__query-ring', r: RING }, queryG);
  el('circle', { class: 'qi-hg__query', r: R }, queryG);

  const nodeEls = g.pts.map((p) => {
    const grp = el('g', { class: 'qi-hg__node' }, nodesG);
    el('circle', { class: 'qi-hg__halo', cx: p.x, cy: p.y, r: R + 5 }, grp);
    el('circle', { class: 'qi-hg__dot', cx: p.x, cy: p.y, r: R }, grp);
    return grp;
  });
  nodesG.appendChild(queryG);

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let q = QUERIES[0];
  let qi = 0;
  let timers = [];
  let started = false;
  const later = (ms, fn) => timers.push(window.setTimeout(fn, ms));

  function reset() {
    timers.forEach((t) => clearTimeout(t));
    timers = [];
    trailsG.textContent = '';
    nodeEls.forEach((n) => n.classList.remove('is-visited', 'is-current', 'is-best', 'is-near'));
    nodeEls[g.entry].classList.add('is-visited');
    queryG.setAttribute('transform', `translate(${q.x} ${q.y})`);
  }

  function showCurrent(step) {
    nodeEls.forEach((n) => n.classList.remove('is-current'));
    nodeEls[step.node].classList.add('is-current');
  }

  function markChecked(step) {
    step.checked.forEach((i) => nodeEls[i].classList.add('is-visited'));
  }

  function drawArrows(step, animate) {
    step.added.forEach((i) => {
      const arrow = el('path', { class: `qi-hg__arrow${step.long ? ' qi-hg__arrow--long' : ''}`, d: arrowPath(g.pts[step.node], g.pts[i], step.node === g.entry), pathLength: 1 }, trailsG);
      if (!animate) return arrow.setAttribute('marker-end', 'url(#qi-hg-head)');
      // Commit the undrawn state, then transition the stroke in; attach the
      // arrowhead once the line reaches it.
      arrow.classList.add('is-drawing');
      void arrow.getBoundingClientRect();
      arrow.classList.remove('is-drawing');
      later(DRAW_MS, () => arrow.setAttribute('marker-end', 'url(#qi-hg-head)'));
    });
  }

  function finish(run) {
    nodeEls.forEach((n) => n.classList.remove('is-current'));
    nodeEls[run.result].classList.add('is-best');
    statusEl.innerHTML =
      run.result === run.nearest
        ? `The search computed the distance to <b>${run.count} of ${N}</b> vectors and found the one closest to the query. A full scan would compute all ${N}.`
        : `The search computed the distance to <b>${run.count} of ${N}</b> vectors and found a vector close to the query, though not the closest. That is the trade-off of approximate search.`;
  }

  function play() {
    started = true;
    reset();
    const run = search(g, q);
    if (reduceMotion) {
      run.steps.forEach((s) => {
        markChecked(s);
        drawArrows(s, false);
      });
      return finish(run);
    }
    statusEl.innerHTML = START_MESSAGE;
    let t = 500;
    run.steps.forEach((s) => {
      later(t, () => showCurrent(s));
      later(t + 300, () => markChecked(s));
      later(t + 300, () => drawArrows(s, true));
      t += STEP_MS;
    });
    later(t, () => finish(run));
  }

  node.querySelector('[data-new]').addEventListener('click', () => {
    qi = (qi + 1) % QUERIES.length;
    q = QUERIES[qi];
    play();
  });
  node.querySelector('[data-replay]').addEventListener('click', play);

  // Show the graph at rest; start the search once the reader can see it.
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
