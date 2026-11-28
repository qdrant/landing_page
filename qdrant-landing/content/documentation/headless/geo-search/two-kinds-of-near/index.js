/*
 * two-kinds-of-near island: a map and an embedding space showing why geo
 * filtering is not a plain filter on top of vector search.
 *
 * 600 sample venues have a place on the map and a place in embedding space.
 * The reader moves a search circle and changes its radius, and three
 * strategies try to find the 10 venues inside the circle that are closest to
 * the query in embedding space:
 *   - Search, then filter: take the best matches citywide, then drop the ones
 *     outside the circle.
 *   - Filter during search: walk a nearest-neighbor graph and skip nodes outside
 *     the circle. The filter can cut the graph into islands.
 *   - Qdrant: the same walk on a graph with extra links between nearby venues,
 *     with an exact scan when few venues match.
 *
 * This is a simplified simulation with sample data, not a benchmark. The graph
 * is a single-layer nearest-neighbor graph, and the extra links come from a
 * simple grouping of nearby venues. It illustrates the effect and does not
 * reproduce how Qdrant builds its index.
 */

const NS = 'http://www.w3.org/2000/svg';

const N = 600; // venues
const K = 10; // results wanted
const EF = 48; // beam width of the graph walk
const POST_EF = 24; // candidates fetched before filtering in "search, then filter"
const FULL_SCAN = 60; // below this many matches, the planner scans exactly
const CELL_MAX = 14; // a map cell with more venues than this gets extra links
const BOX = { x0: -20, x1: 20, y0: -14, y1: 14 }; // km

const PLACES = [
  { id: 'center', label: 'City center', x: 0, y: 0 },
  { id: 'river', label: 'Riverside', x: 5, y: -6 },
  { id: 'suburb', label: 'Suburb', x: 9, y: 4 },
];
const R_MIN = 0.3; // km, slider is logarithmic
const R_MAX = 12;

// Venue categories sit at fixed spots in embedding space (unit square).
const CATEGORIES = [
  ['Cafés', 0.28, 0.32],
  ['Coworking', 0.18, 0.5],
  ['Bookstores', 0.3, 0.66],
  ['Bakeries', 0.5, 0.2],
  ['Ramen', 0.72, 0.26],
  ['Vegan', 0.62, 0.44],
  ['Wine bars', 0.82, 0.54],
  ['Cocktails', 0.72, 0.72],
  ['Clubs', 0.5, 0.86],
  ['Galleries', 0.4, 0.72],
].map(([name, x, y]) => ({ name, x, y }));
const QUERY = { x: 0.24, y: 0.4 };

const STRATEGIES = [
  { id: 'post', label: 'Search, then filter' },
  { id: 'graph', label: 'Filter during search' },
  { id: 'qdrant', label: 'Qdrant' },
];

/* ---- sample data ---------------------------------------------------------- */

function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildWorld() {
  const rand = seeded(7);
  const normal = () => {
    let u = 0;
    while (!u) u = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };
  // Dense at the center, a few smaller neighborhoods, a thin scatter elsewhere.
  const clusters = [
    { x: 0, y: 0, w: 0.4, s: 1.6 },
    { x: 5, y: -6, w: 0.17, s: 1.8 },
    { x: -6, y: 3, w: 0.15, s: 2.2 },
    { x: 9, y: 4, w: 0.1, s: 2.4 },
    { x: -2, y: -8, w: 0.08, s: 2.4 },
  ];
  const venues = [];
  for (let i = 0; i < N; i++) {
    let x;
    let y;
    if (rand() < 0.07) {
      x = BOX.x0 + rand() * (BOX.x1 - BOX.x0);
      y = BOX.y0 + rand() * (BOX.y1 - BOX.y0);
    } else {
      let pick = rand() * clusters.reduce((sum, c) => sum + c.w, 0);
      let c = clusters[0];
      for (const candidate of clusters) {
        pick -= candidate.w;
        if (pick <= 0) {
          c = candidate;
          break;
        }
      }
      do {
        x = c.x + normal() * c.s;
        y = c.y + normal() * c.s;
      } while (x < BOX.x0 || x > BOX.x1 || y < BOX.y0 || y > BOX.y1);
    }
    const cat = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
    venues.push({
      x,
      y,
      vx: cat.x + normal() * 0.06,
      vy: cat.y + normal() * 0.06,
      level: rand(),
    });
  }

  const dist = (i, px, py) => (venues[i].vx - px) ** 2 + (venues[i].vy - py) ** 2;

  // Link every venue in `ids` to its m nearest neighbors (in embedding space).
  const link = (ids, m, into) => {
    for (const i of ids) {
      const near = ids
        .filter((j) => j !== i)
        .map((j) => [dist(j, venues[i].vx, venues[i].vy), j])
        .sort((a, b) => a[0] - b[0])
        .slice(0, m);
      for (const [, j] of near) {
        into[i].add(j);
        into[j].add(i);
      }
    }
  };

  const all = venues.map((_, i) => i);
  const base = venues.map(() => new Set());
  link(all, 6, base);

  // Map cells holding many venues: the smallest quadtree cells above the limit.
  const cells = [];
  const split = (x0, y0, w, h, ids, depth) => {
    if (ids.length <= CELL_MAX) return;
    const hw = w / 2;
    const hh = h / 2;
    const kids = [[], [], [], []];
    for (const i of ids) kids[(venues[i].x >= x0 + hw ? 1 : 0) + (venues[i].y >= y0 + hh ? 2 : 0)].push(i);
    if (depth < 9) kids.forEach((k, q) => split(x0 + (q & 1) * hw, y0 + (q >> 1) * hh, hw, hh, k, depth + 1));
    if (ids.length < N * 0.6) cells.push({ x0, y0, w, h, ids });
  };
  split(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0, all, 0);

  const extra = venues.map(() => new Set());
  for (const cell of cells) link(cell.ids, 8, extra);
  const withExtra = base.map((set, i) => new Set([...set, ...extra[i]]));

  const pairs = (adj, skip) => {
    const out = [];
    adj.forEach((set, i) => {
      for (const j of set) if (j > i && !(skip && skip[i].has(j))) out.push(i, j);
    });
    return out;
  };
  const baseEdges = pairs(base);
  const extraEdges = pairs(extra, base);

  let globalEntry = 0;
  for (let i = 1; i < N; i++) if (venues[i].level > venues[globalEntry].level) globalEntry = i;

  return { venues, dist, base, withExtra, baseEdges, extraEdges, globalEntry };
}

/* ---- search --------------------------------------------------------------- */

// Best-first walk of a graph. Nodes that fail `ok` are never visited.
function walk(world, adj, entry, ok, ef) {
  const seen = new Uint8Array(N);
  const visited = [entry];
  seen[entry] = 1;
  const d0 = world.dist(entry, QUERY.x, QUERY.y);
  const frontier = [[d0, entry]];
  const best = [[d0, entry]];
  while (frontier.length) {
    frontier.sort((a, b) => a[0] - b[0]);
    const [d, node] = frontier.shift();
    if (best.length >= ef && d > best[best.length - 1][0]) break;
    for (const next of adj[node]) {
      if (seen[next]) continue;
      seen[next] = 1;
      if (!ok(next)) continue;
      visited.push(next);
      const dn = world.dist(next, QUERY.x, QUERY.y);
      if (best.length < ef || dn < best[best.length - 1][0]) {
        frontier.push([dn, next]);
        best.push([dn, next]);
        best.sort((a, b) => a[0] - b[0]);
        if (best.length > ef) best.pop();
      }
    }
  }
  return { found: best.map((b) => b[1]), visited };
}

function search(world, strategy, circle) {
  const { venues, dist } = world;
  const inside = new Uint8Array(N);
  const matching = [];
  for (let i = 0; i < N; i++) {
    if ((venues[i].x - circle.x) ** 2 + (venues[i].y - circle.y) ** 2 <= circle.r * circle.r) {
      inside[i] = 1;
      matching.push(i);
    }
  }
  const ok = (i) => inside[i] === 1;
  const truth = matching
    .map((i) => [dist(i, QUERY.x, QUERY.y), i])
    .sort((a, b) => a[0] - b[0])
    .slice(0, K)
    .map((t) => t[1]);

  let found = [];
  let plan = 'graph';
  let links = null; // which links the walk could use, for drawing
  if (strategy === 'post') {
    plan = 'post';
    links = 'base';
    found = walk(world, world.base, world.globalEntry, () => true, POST_EF).found.filter(ok).slice(0, K);
  } else if (strategy === 'qdrant' && matching.length < FULL_SCAN) {
    plan = 'exact';
    found = truth.slice();
  } else if (matching.length) {
    // Stand-in for descending the upper layers: start from the matching venue
    // among the top levels that is closest to the query.
    let entry = -1;
    for (const i of matching) {
      if (venues[i].level > 0.9 && (entry < 0 || dist(i, QUERY.x, QUERY.y) < dist(entry, QUERY.x, QUERY.y))) entry = i;
    }
    if (entry < 0) for (const i of matching) if (entry < 0 || venues[i].level > venues[entry].level) entry = i;
    const adj = strategy === 'qdrant' ? world.withExtra : world.base;
    links = strategy === 'qdrant' ? 'extra' : 'base';
    const result = walk(world, adj, entry, ok, EF);
    found = result.found.slice(0, K);
    return finish(result.visited.length);
  }
  return finish(matching.length);

  function finish(visited) {
    const truthSet = new Set(truth);
    const hits = found.filter((i) => truthSet.has(i)).length;
    return { count: matching.length, inside, truth, found, plan, links, hits, want: truth.length, visited };
  }
}

function explain(strategy, r, radiusLabel) {
  if (!r.count) return 'No venues in this area.';
  const good = r.hits === r.want;
  if (strategy === 'post') {
    return good
      ? 'The area is large, so the best matches citywide are already inside it.'
      : `Fetched the ${POST_EF} best matches citywide. ${r.found.length ? `Only ${r.found.length}` : 'None'} of them ${r.found.length === 1 ? 'is' : 'are'} inside the area.`;
  }
  if (strategy === 'graph') {
    return good
      ? 'Enough venues match that the graph stays connected.'
      : `The filter cut the graph into islands. The walk reached only ${r.visited} venue${r.visited === 1 ? '' : 's'}.`;
  }
  return r.plan === 'exact'
    ? `Only ${r.count} venues match, so Qdrant checks each one.`
    : `Extra links between nearby venues keep the graph connected within ${radiusLabel}.`;
}

/* ---- mount ---------------------------------------------------------------- */

export function mount(node) {
  node.classList.add('qi-gs');
  node.innerHTML = [
    '<div class="qi-controls qi-gs__controls">',
    '  <div class="qi-group" role="group" aria-label="Search area center" data-places></div>',
    '  <label class="qi-gs__radius"><span class="qi-hint">Radius</span>',
    '    <input type="range" min="0" max="1000" step="1" data-radius aria-label="Search radius">',
    '    <span class="qi-hint qi-gs__radius-value" data-radius-value></span></label>',
    '</div>',
    '<div class="qi-gs__panes">',
    '  <figure class="qi-gs__pane"><figcaption class="qi-hint">On the map. Drag the circle.</figcaption>',
    '    <canvas data-map tabindex="0" role="img" aria-label="Map of 600 venues with a circular search area. Drag it, or use the arrow keys, to move it."></canvas></figure>',
    '  <figure class="qi-gs__pane"><figcaption class="qi-hint">By meaning. Query: quiet café.</figcaption>',
    '    <canvas data-vec role="img" aria-label="The same venues placed by meaning, with the query and the results marked."></canvas></figure>',
    '</div>',
    '<div class="qi-gs__legend qi-hint">',
    '  <span><i class="qi-gs__dot qi-gs__dot--in"></i>Venue in the area</span>',
    '  <span><i class="qi-gs__dot qi-gs__dot--out"></i>Outside the area</span>',
    '  <span><i class="qi-gs__ring"></i>Returned</span>',
    '  <span><i class="qi-gs__ring qi-gs__ring--missed"></i>Best match missed</span>',
    '  <span data-legend-links><i class="qi-gs__line"></i>Graph links in the area</span>',
    '  <span data-legend-extra><i class="qi-gs__line qi-gs__line--extra"></i>Extra links</span>',
    '</div>',
    '<p class="qi-status qi-status--2" role="status" aria-live="polite" data-summary></p>',
    '<div class="qi-gs__results" role="group" aria-label="Search strategy" data-results></div>',
  ].join('');

  const world = buildWorld();
  const state = { x: 0, y: 0, r: 2, strategy: 'qdrant', results: {} };

  const placesEl = node.querySelector('[data-places]');
  const radiusEl = node.querySelector('[data-radius]');
  const radiusValueEl = node.querySelector('[data-radius-value]');
  const summaryEl = node.querySelector('[data-summary]');
  const resultsEl = node.querySelector('[data-results]');
  const legendLinks = node.querySelector('[data-legend-links]');
  const legendExtra = node.querySelector('[data-legend-extra]');
  const canvases = { map: node.querySelector('[data-map]'), vec: node.querySelector('[data-vec]') };

  const radiusOf = (v) => R_MIN * Math.pow(R_MAX / R_MIN, v / 1000);
  const sliderOf = (r) => Math.round((1000 * Math.log(r / R_MIN)) / Math.log(R_MAX / R_MIN));
  const radiusLabel = (r) => (r < 1 ? `${Math.round(r * 100) * 10} m` : `${r < 10 ? r.toFixed(1) : Math.round(r)} km`);
  radiusEl.value = sliderOf(state.r);

  PLACES.forEach((place) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'qi-chip';
    b.textContent = place.label;
    b.addEventListener('click', () => {
      state.x = place.x;
      state.y = place.y;
      update();
    });
    placesEl.append(b);
    place.button = b;
  });

  STRATEGIES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'qi-gs__result';
    b.dataset.strategy = s.id;
    b.innerHTML =
      `<span class="qi-gs__result-name">${s.label}</span>` +
      '<span class="qi-gs__result-score"></span><span class="qi-gs__result-count qi-hint"></span><span class="qi-gs__result-why"></span>';
    b.addEventListener('click', () => {
      state.strategy = s.id;
      update();
    });
    resultsEl.append(b);
  });

  /* Drawing. Colors come from the island tokens so both themes work. */
  let colors = {};
  const readColors = () => {
    const cs = getComputedStyle(node);
    colors = {
      fg: cs.getPropertyValue('--qi-fg').trim(),
      muted: cs.getPropertyValue('--qi-muted').trim(),
      line: cs.getPropertyValue('--qi-line').trim(),
      border: cs.getPropertyValue('--qi-border').trim(),
      accent: cs.getPropertyValue('--qi-accent').trim(),
      extra: cs.getPropertyValue('--qi-cat-1').trim(),
    };
  };
  const ctx = {};
  const size = {};
  const fit = () => {
    const ratio = window.devicePixelRatio || 1;
    for (const key in canvases) {
      const rect = canvases[key].getBoundingClientRect();
      size[key] = { w: rect.width, h: rect.height };
      canvases[key].width = Math.round(rect.width * ratio);
      canvases[key].height = Math.round(rect.height * ratio);
      ctx[key] = canvases[key].getContext('2d');
      ctx[key].setTransform(ratio, 0, 0, ratio, 0, 0);
    }
  };

  const mapTransform = () => {
    const { w, h } = size.map;
    const bw = BOX.x1 - BOX.x0;
    const bh = BOX.y1 - BOX.y0;
    const k = Math.min(w / bw, h / bh);
    const ox = (w - bw * k) / 2;
    const oy = (h - bh * k) / 2;
    return {
      k,
      X: (x) => ox + (x - BOX.x0) * k,
      Y: (y) => oy + (BOX.y1 - y) * k,
      x: (px) => (px - ox) / k + BOX.x0,
      y: (py) => BOX.y1 - (py - oy) / k,
    };
  };
  const vecTransform = () => {
    const { w, h } = size.vec;
    const pad = 14;
    return { X: (x) => pad + x * (w - 2 * pad), Y: (y) => pad + (1 - y) * (h - 2 * pad) };
  };
  const dot = (c, x, y, r) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  };
  const ring = (c, x, y, r) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.stroke();
  };
  const withAlpha = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  };

  function drawMap() {
    const c = ctx.map;
    const { w, h } = size.map;
    const t = mapTransform();
    const res = state.results[state.strategy];
    c.clearRect(0, 0, w, h);
    c.strokeStyle = colors.border;
    c.lineWidth = 1;
    c.strokeRect(t.X(BOX.x0) + 0.5, t.Y(BOX.y1) + 0.5, (BOX.x1 - BOX.x0) * t.k - 1, (BOX.y1 - BOX.y0) * t.k - 1);
    for (let i = 0; i < N; i++) {
      const v = world.venues[i];
      c.fillStyle = res.inside[i] ? colors.fg : colors.line;
      dot(c, t.X(v.x), t.Y(v.y), res.inside[i] ? 2 : 1.5);
    }
    c.beginPath();
    c.arc(t.X(state.x), t.Y(state.y), Math.max(2, state.r * t.k), 0, Math.PI * 2);
    c.fillStyle = withAlpha(colors.accent, 0.1);
    c.fill();
    c.strokeStyle = colors.accent;
    c.lineWidth = 1.5;
    c.stroke();
    for (const i of res.found) ring(c, t.X(world.venues[i].x), t.Y(world.venues[i].y), 4.5);
    // Scale bar
    const bar = 5 * t.k;
    const sx = w - bar - 12;
    const sy = h - 12;
    c.strokeStyle = colors.muted;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(sx, sy - 4);
    c.lineTo(sx, sy);
    c.lineTo(sx + bar, sy);
    c.lineTo(sx + bar, sy - 4);
    c.stroke();
    c.fillStyle = colors.muted;
    c.font = "10px 'Geist Mono', monospace";
    c.textAlign = 'center';
    c.fillText('5 km', sx + bar / 2, sy - 6);
    c.textAlign = 'left';
  }

  function drawEdges(c, list, inside, t) {
    c.beginPath();
    for (let e = 0; e < list.length; e += 2) {
      const a = list[e];
      const b = list[e + 1];
      if (!(inside[a] && inside[b])) continue;
      c.moveTo(t.X(world.venues[a].vx), t.Y(world.venues[a].vy));
      c.lineTo(t.X(world.venues[b].vx), t.Y(world.venues[b].vy));
    }
    c.stroke();
  }

  function drawVec() {
    const c = ctx.vec;
    const { w, h } = size.vec;
    const t = vecTransform();
    const res = state.results[state.strategy];
    c.clearRect(0, 0, w, h);
    c.font = "500 11px 'Mona Sans', sans-serif";
    c.textAlign = 'center';
    c.fillStyle = colors.muted;
    for (const cat of CATEGORIES) c.fillText(cat.name, t.X(cat.x), t.Y(cat.y + 0.12));
    c.textAlign = 'left';
    if (res.links) {
      c.lineWidth = 0.8;
      c.strokeStyle = withAlpha(colors.muted, 0.45);
      drawEdges(c, world.baseEdges, res.inside, t);
    }
    if (res.links === 'extra') {
      c.lineWidth = 0.8;
      c.strokeStyle = withAlpha(colors.extra, 0.5);
      drawEdges(c, world.extraEdges, res.inside, t);
    }
    for (let i = 0; i < N; i++) {
      const v = world.venues[i];
      c.fillStyle = res.inside[i] ? colors.fg : withAlpha(colors.line, 0.7);
      dot(c, t.X(v.vx), t.Y(v.vy), res.inside[i] ? 2.2 : 1.5);
    }
    const got = new Set(res.found);
    c.setLineDash([3, 2]);
    c.strokeStyle = colors.muted;
    c.lineWidth = 1.3;
    for (const i of res.truth) if (!got.has(i)) ring(c, t.X(world.venues[i].vx), t.Y(world.venues[i].vy), 6);
    c.setLineDash([]);
    c.strokeStyle = colors.accent;
    c.lineWidth = 1.8;
    for (const i of res.found) ring(c, t.X(world.venues[i].vx), t.Y(world.venues[i].vy), 6);
    const qx = t.X(QUERY.x);
    const qy = t.Y(QUERY.y);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(qx - 8, qy);
    c.lineTo(qx + 8, qy);
    c.moveTo(qx, qy - 8);
    c.lineTo(qx, qy + 8);
    c.stroke();
    c.fillStyle = colors.accent;
    c.font = "600 11px 'Geist Mono', monospace";
    c.fillText('query', qx + 10, qy - 8);
  }

  function update() {
    for (const s of STRATEGIES) state.results[s.id] = search(world, s.id, state);
    const best = state.results.qdrant;
    const want = Math.min(K, best.count);
    radiusValueEl.textContent = radiusLabel(state.r);
    summaryEl.innerHTML =
      `<b>${best.count} of ${N} venues</b> are within ${radiusLabel(state.r)}. ` +
      (want ? `Each strategy tries to return the ${want === 1 ? 'one' : want} closest in meaning.` : 'Move the circle to cover some venues.');
    PLACES.forEach((p) => p.button.classList.toggle('is-active', p.x === state.x && p.y === state.y));
    resultsEl.querySelectorAll('.qi-gs__result').forEach((b) => {
      const id = b.dataset.strategy;
      const r = state.results[id];
      b.setAttribute('aria-pressed', String(id === state.strategy));
      b.querySelector('.qi-gs__result-score').textContent = r.want ? `${Math.round((100 * r.hits) / r.want)}%` : '-';
      b.querySelector('.qi-gs__result-count').textContent = r.want ? `${r.hits} of ${r.want} best matches found` : '';
      b.querySelector('.qi-gs__result-why').textContent = explain(id, r, radiusLabel(state.r));
    });
    const current = state.results[state.strategy];
    legendLinks.hidden = !current.links;
    legendExtra.hidden = current.links !== 'extra';
    drawMap();
    drawVec();
  }

  /* Dragging the circle on the map, or moving it with the arrow keys. */
  const clampCenter = () => {
    state.x = Math.max(BOX.x0, Math.min(BOX.x1, state.x));
    state.y = Math.max(BOX.y0, Math.min(BOX.y1, state.y));
  };
  let dragging = null;
  canvases.map.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    dragging = event.pointerId;
    try {
      canvases.map.setPointerCapture(event.pointerId);
    } catch (_) {}
    moveTo(event);
  });
  canvases.map.addEventListener('pointermove', (event) => {
    if (dragging === event.pointerId) moveTo(event);
  });
  const stopDrag = (event) => {
    if (dragging === event.pointerId) dragging = null;
  };
  canvases.map.addEventListener('pointerup', stopDrag);
  canvases.map.addEventListener('pointercancel', stopDrag);
  function moveTo(event) {
    const rect = canvases.map.getBoundingClientRect();
    const t = mapTransform();
    state.x = t.x(event.clientX - rect.left);
    state.y = t.y(event.clientY - rect.top);
    clampCenter();
    update();
  }
  canvases.map.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 3 : 1;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    state.x += move[0];
    state.y += move[1];
    clampCenter();
    update();
  });

  radiusEl.addEventListener('input', () => {
    state.r = radiusOf(Number(radiusEl.value));
    update();
  });

  readColors();
  fit();
  update();

  // Keep the canvases sharp when the page resizes or the theme changes.
  new ResizeObserver(() => {
    fit();
    update();
  }).observe(node);
  const recolor = () => {
    readColors();
    update();
  };
  new MutationObserver(recolor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
