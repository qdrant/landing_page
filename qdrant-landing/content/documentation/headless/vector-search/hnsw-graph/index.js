/*
 * hnsw-graph island: interactive replacement for vector-search.png on the
 * vector search overview page. Styled like the sparse-query and dense-query
 * islands.
 *
 * 120 points in a 2D space stand in for vectors. They are indexed in a small
 * layered graph in the spirit of HNSW: every point is on layer 0 and about a
 * quarter also on layer 1; on each layer every point is linked to its nearest
 * neighbors on that layer. Real HNSW indexes have more layers; two keep the
 * animation calm while still showing the idea. The layers are drawn
 * flattened into one space: layer 0's short links faintly, layer 1's longer
 * links bolder, and points on layer 1 larger. That shows the index as a single
 * graph in vector space, with the upper layer as long-range shortcuts.
 *
 * A search starts at the entry point, a layer-1 point near the middle of the
 * space (HNSW's entry point is simply a point on the top layer). On layer 1 it
 * moves greedily along long links to whichever neighbor is closer to the query, until no
 * neighbor is closer. On layer 0 it keeps a short list of the best candidates
 * (ef) and explores their neighbors. Every distance it computes is counted and
 * compared with a full scan, which computes all 120.
 *
 * The result is usually the true nearest point; when it isn't, the status
 * says so (that is the "approximate" in approximate nearest neighbor search).
 *
 * The graph is a simplification: links are each point's nearest neighbors on
 * the layer, not built by HNSW's insertion with neighbor selection. The search
 * is the HNSW search. The space is 1.6 wide and 1 high, so the picture keeps
 * true distances.
 *
 * "New query" picks a random query. With reduced motion the search result is
 * shown at once.
 *
 * SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';
const N = 120;
const TOP = 1;
const LINKS = [5, 3]; // neighbors per point, by layer
const EF = 5; // candidate list size on layer 0
const SPAN = 1.6; // width of the space; height is 1
const VB = { w: 640, h: 412 };
const PAD = 16;
const SCALE = (VB.w - 2 * PAD) / SPAN;
const STEP_MS = { eval: 160, move: 380, down: 420 };

// Seeded random numbers, so the points are the same on every page load.
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
  const rand = rng(7);
  const pts = Array.from({ length: N }, () => {
    let level = 0;
    while (level < TOP && rand() < 0.25) level++;
    return { x: (0.03 + rand() * 0.94) * SPAN, y: 0.03 + rand() * 0.94, level };
  });
  if (!pts.some((p) => p.level === TOP)) pts[0].level = TOP;
  const d = (a, b) => Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y);
  const layers = [];
  for (let l = 0; l <= TOP; l++) {
    const ids = pts.flatMap((p, i) => (p.level >= l ? [i] : []));
    const links = new Map(ids.map((i) => [i, new Set()]));
    ids.forEach((i) => {
      ids
        .filter((j) => j !== i)
        .sort((a, b) => d(i, a) - d(i, b))
        .slice(0, LINKS[l])
        .forEach((j) => {
          links.get(i).add(j);
          links.get(j).add(i);
        });
    });
    layers.push({ ids, links });
  }
  // Entry point: the top-layer point closest to the middle of the space, so
  // searches start with short moves rather than a jump across the graph.
  const mid = { x: SPAN / 2, y: 0.5 };
  const toMid = (i) => Math.hypot(pts[i].x - mid.x, pts[i].y - mid.y);
  const entry = layers[TOP].ids.reduce((a, b) => (toMid(b) < toMid(a) ? b : a));
  return { pts, layers, entry };
}

// The search, recorded as a list of steps to animate.
function search(g, q) {
  const dist = (i) => Math.hypot(g.pts[i].x - q.x, g.pts[i].y - q.y);
  const steps = [];
  let count = 1;
  let cur = g.entry;
  steps.push({ type: 'start', layer: TOP, node: cur, count });
  for (let l = TOP; l >= 1; l--) {
    const seen = new Set([cur]);
    let improved = true;
    while (improved) {
      improved = false;
      let best = cur;
      for (const n of g.layers[l].links.get(cur)) {
        if (seen.has(n)) continue;
        seen.add(n);
        count++;
        steps.push({ type: 'eval', layer: l, from: cur, node: n, count });
        if (dist(n) < dist(best)) best = n;
      }
      if (best !== cur) {
        steps.push({ type: 'move', layer: l, from: cur, node: best, count });
        cur = best;
        improved = true;
      }
    }
    steps.push({ type: 'down', layer: l - 1, node: cur, count });
  }
  const seen = new Set([cur]);
  const cands = [cur];
  const found = [cur];
  while (cands.length) {
    cands.sort((a, b) => dist(a) - dist(b));
    const c = cands.shift();
    if (found.length >= EF && dist(c) > dist(found[found.length - 1])) break;
    if (c !== cur) steps.push({ type: 'move', layer: 0, from: cur, node: c, count });
    cur = c;
    for (const n of g.layers[0].links.get(c)) {
      if (seen.has(n)) continue;
      seen.add(n);
      count++;
      steps.push({ type: 'eval', layer: 0, from: c, node: n, count });
      if (found.length < EF || dist(n) < dist(found[found.length - 1])) {
        cands.push(n);
        found.push(n);
        found.sort((a, b) => dist(a) - dist(b));
        if (found.length > EF) found.pop();
      }
    }
  }
  const truth = g.pts.map((_, i) => i).sort((a, b) => dist(a) - dist(b))[0];
  steps.push({ type: 'done', layer: 0, node: found[0], count, exact: found[0] === truth, truth });
  return steps;
}

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

export function mount(node) {
  node.classList.add('qi-hg');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const g = buildGraph();

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-new>New query</button>',
    '      <button type="button" class="qi-chip" data-replay>Replay</button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-hg__svg" viewBox="0 0 ${VB.w} ${VB.h}" role="img" aria-label="An HNSW graph of ${N} points in vector space. Short links connect nearby points; a few long links connect distant ones. A search starts at the entry point, follows long links toward the query, then short ones."></svg>`,
    '  <div class="qi-hg__legend qi-hint">',
    '    <span class="qi-hg__key"><svg width="28" height="8" aria-hidden="true"><line class="qi-hg__edge qi-hg__edge--2" x1="2" y1="4" x2="26" y2="4"/></svg>long links (upper layer)</span>',
    '    <span class="qi-hg__key"><svg width="28" height="8" aria-hidden="true"><line class="qi-hg__edge qi-hg__edge--0 is-key" x1="2" y1="4" x2="26" y2="4"/></svg>short links</span>',
    '    <span class="qi-hg__key"><svg width="14" height="14" aria-hidden="true"><circle class="qi-hg__node is-seen" cx="7" cy="7" r="4"/></svg>distance computed</span>',
    '  </div>',
    '  <div class="qi-hg__fields">',
    '    <span class="qi-hint">HNSW</span>',
    '    <div class="qi-hg__score qi-hg__score--hnsw"><span class="qi-hg__track"><span class="qi-hg__fill"></span></span><b class="qi-hg__num"></b></div>',
    '    <span class="qi-hint">Full scan</span>',
    `    <div class="qi-hg__score qi-hg__score--scan"><span class="qi-hg__track"><span class="qi-hg__fill" style="width:100%"></span></span><b class="qi-hg__num">${N} distances</b></div>`,
    '  </div>',
    '  <p class="qi-status qi-status--2 qi-hg__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-hg__svg');
  const hnswFill = node.querySelector('.qi-hg__score--hnsw .qi-hg__fill');
  const hnswNum = node.querySelector('.qi-hg__score--hnsw .qi-hg__num');
  const statusEl = node.querySelector('.qi-hg__status');

  const sx = (p) => PAD + p.x * SCALE;
  const sy = (p) => PAD + p.y * SCALE;

  // Links: each pair once, drawn at the highest layer that links it; short
  // links first so the long ones sit on top.
  const pairs = new Map();
  g.layers.forEach((layer, l) =>
    layer.links.forEach((ns, i) =>
      ns.forEach((j) => pairs.set(i < j ? `${i}-${j}` : `${j}-${i}`, Math.max(l, pairs.get(i < j ? `${i}-${j}` : `${j}-${i}`) ?? 0))),
    ),
  );
  const edges = el('g', {}, svg);
  [...pairs].sort((a, b) => a[1] - b[1]).forEach(([key, l]) => {
    const [i, j] = key.split('-').map(Number);
    el('line', { class: `qi-hg__edge qi-hg__edge--${l}`, x1: sx(g.pts[i]), y1: sy(g.pts[i]), x2: sx(g.pts[j]), y2: sy(g.pts[j]) }, edges);
  });
  const live = el('g', {}, svg);
  const dots = g.pts.map((p) => el('circle', { class: `qi-hg__node qi-hg__node--${p.level}`, cx: sx(p), cy: sy(p) }, svg));
  const e = g.pts[g.entry];
  el('text', { class: 'qi-label qi-hg__entry', x: sx(e), y: sy(e) + (e.y < 0.12 ? 22 : -12), 'text-anchor': e.x > SPAN - 0.25 ? 'end' : e.x < 0.25 ? 'start' : 'middle' }, svg).textContent =
    'entry';
  const query = el('g', { class: 'qi-hg__query' }, svg);
  el('path', { d: 'M -6 -6 L 6 6 M -6 6 L 6 -6' }, query);

  // Default query: left of center, far from the entry.
  let q = { x: 0.3 * SPAN, y: 0.7 };
  let timers = [];
  let steps = [];

  // Draw the search state after the first k steps.
  function draw(k) {
    live.innerHTML = '';
    dots.forEach((d, i) => d.setAttribute('class', `qi-hg__node qi-hg__node--${g.pts[i].level}`));
    const path = [];
    let count = 0;
    let last = null;
    for (let s = 0; s < k; s++) {
      const st = steps[s];
      count = st.count;
      last = st;
      if (st.type === 'start') {
        path.push(st.node);
        dots[st.node].classList.add('is-seen');
      } else if (st.type === 'eval') {
        const a = g.pts[st.from];
        const b = g.pts[st.node];
        el('line', { class: `qi-hg__probe${st.layer ? ' is-long' : ''}`, x1: sx(a), y1: sy(a), x2: sx(b), y2: sy(b) }, live);
        dots[st.node].classList.add('is-seen');
      } else if (st.type === 'move') {
        path.push(st.node);
      }
    }
    if (path.length > 1) el('polyline', { class: 'qi-hg__path', points: path.map((i) => `${sx(g.pts[i])},${sy(g.pts[i])}`).join(' ') }, live);
    if (path.length) dots[path[path.length - 1]].classList.add('is-current');
    if (last && last.type === 'done') {
      dots.forEach((d) => d.classList.remove('is-current'));
      dots[last.node].classList.add('is-result');
      if (!last.exact) dots[last.truth].classList.add('is-truth');
    }
    // Keep the marked dots above the links and probes.
    dots.forEach((d) => d.classList.length > 2 && svg.appendChild(d));
    svg.appendChild(query);
    hnswFill.style.width = `${(count / N) * 100}%`;
    hnswNum.textContent = `${count} distances`;
    if (!last) {
      statusEl.textContent = '';
    } else if (last.type === 'done') {
      statusEl.textContent = last.exact
        ? `The search computed ${count} distances, not ${N}, and found the nearest point. A full scan would compare the query with every point.`
        : `The search computed ${count} distances, not ${N}, and found a point close to the query but not the nearest one. That's the trade-off of approximate nearest neighbor search.`;
    } else if (last.layer > 0 && last.type !== 'down') {
      statusEl.textContent = 'The search starts at the entry point and follows long links, jumping toward the query.';
    } else {
      statusEl.textContent = 'Close to the query, it switches to short links and checks the neighbors of the best candidates so far.';
    }
  }

  function run(next) {
    timers.forEach(clearTimeout);
    timers = [];
    if (next) q = next;
    query.setAttribute('transform', `translate(${sx(q)} ${sy(q)})`);
    steps = search(g, q);
    if (reduced) return draw(steps.length);
    let t = 0;
    draw(0);
    steps.forEach((st, k) => {
      t += STEP_MS[st.type] || STEP_MS.move;
      timers.push(setTimeout(() => draw(k + 1), t));
    });
  }

  node.querySelector('[data-new]').addEventListener('click', () =>
    run({ x: (0.05 + Math.random() * 0.9) * SPAN, y: 0.05 + Math.random() * 0.9 }),
  );
  node.querySelector('[data-replay]').addEventListener('click', () => run());

  // Start the first search when the island scrolls into view.
  if ('IntersectionObserver' in window && !reduced) {
    query.setAttribute('transform', `translate(${sx(q)} ${sy(q)})`);
    steps = search(g, q);
    draw(0);
    statusEl.textContent = 'Press Replay to run a search.';
    const io = new IntersectionObserver((entries) => {
      if (entries.some((x) => x.isIntersecting)) {
        io.disconnect();
        run();
      }
    });
    io.observe(node);
  } else {
    run();
  }

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
