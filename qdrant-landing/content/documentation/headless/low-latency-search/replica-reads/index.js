/*
 * replica-reads island: interactive replacement for replication.png on the
 * low-latency search page.
 *
 * A collection on a cluster with three peers, under a steady stream of
 * queries, with two independent steppers:
 *
 *   shards              1 and up, no upper limit. The collection is divided
 *                       into this many shards; shard s lives on peer s % 3.
 *   replication_factor  1 to 3 (one replica per peer at most). Replica a of
 *                       shard s lives on peer (s + a) % 3, as in the
 *                       replication island on the horizontal scaling page.
 *                       At 3 shards and a factor of 2 this is the page's
 *                       example: 6 replicas, 2 on each peer.
 *
 * Every query reads one replica of every shard, chosen at random; the
 * replicas it reads flash. Up to three replicas per peer are drawn as full
 * shard boxes; beyond that, each peer shows a grid of compact cells that
 * shrinks to fit. Shard colors cycle through six colors.
 *
 * A schematic chart under the cluster plots throughput and latency over time,
 * relative to one shard with one replica (100%), so every stepper change
 * shows as a step. The numbers come from a simple model (see metrics()), not
 * from benchmarks:
 *
 *   - Each peer has the same CPU. Throughput is limited by the busiest peer.
 *   - Searching a shard costs a fixed overhead plus a part that shrinks
 *     slowly with the shard's size (HNSW search cost grows slowly with data).
 *   - A query reads each shard from one of its replicas, at random, so a
 *     replica takes 1 / replication_factor of its shard's reads.
 *   - Latency: a peer searches its shards for one query in parallel, a few at
 *     a time (CORES), and merging results from more shards adds a little.
 *
 * So: replicas raise throughput while they bring idle peers into play (up to
 * 300% at one shard), and leave latency alone; shards cut latency while they
 * spread over idle peers, and past that cost throughput, then latency.
 *
 * "Pause" stops the stream and the chart. With reduced motion the island
 * starts paused; the chart and its readouts still follow the steppers.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). The first
 * three shard colors match the replication island.
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox -2 0 764 466).
const COLL = { x: 0, y: 2, w: 300, h: 44, chipX: 106, chipW: 44, gap: 6, chipH: 24 };
const CLIENT = { x: 420, y: 24, w: 120, h: 40 };
const CLUSTER = { x: 0, y: 72, w: 760, h: 246 };
const NODE = { w: 228, h: 196, y: 108, pitch: 252, x0: 14 };
const BOX = { w: 150, h: 42, dx: 39, dy: 40, pitch: 50 }; // full shard box
const BARS = 6;
const BAR = { x: 84, slot: 10, w: 5.5, y: 11, h: 20 };
const CELL = { w: 60, h: 30, gap: 6 }; // compact cell, before scaling
const AREA = { dx: 14, dy: 36, w: 200, h: 146 }; // where cells go in a peer
const MAX_K = 1.2; // largest cell scale
const TEXT_K = 0.6; // below this scale, cells drop their label
const CHART = { x: 0, y: 330, w: 760, h: 132 }; // chart frame
const PLOT = { x0: 52, x1: 548, y0: 368, y1: 448 }; // plot area: y0 top, y1 bottom (0%)
const VB_H = 466;
const COLORS = 6;

const PEERS = 3;
const MAX_RF = 3; // one replica per peer at most
const EVERY_MS = 650; // between queries
const TRAVEL_MS = 700; // client to cluster
const HOT_MS = 450;
const TOKEN = 10;
const WINDOW_MS = 24000; // time shown in the chart
const PAUSED_STEP_MS = 3000; // chart time per change while paused

// Schematic cost model (relative units; one full-collection search costs 1).
const OVERHEAD = 0.1; // fixed cost of searching one shard
const SIZE_EXP = 0.35; // search cost ~ (share of the data) ^ SIZE_EXP
const CORES = 4; // shards a peer searches in parallel for one query
const MERGE = 0.05; // merge cost per doubling of the shard count

const nodeX = (n) => NODE.x0 + n * NODE.pitch;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const peerOf = (s, a) => (s + a) % PEERS;

// Throughput and latency of a setup, relative to 1 shard, 1 replica (= 1).
function metrics(shards, rf) {
  const cost = OVERHEAD + (1 - OVERHEAD) * Math.pow(1 / shards, SIZE_EXP);
  const load = new Array(PEERS).fill(0); // work per query, per peer
  for (let s = 0; s < shards; s++) for (let a = 0; a < rf; a++) load[peerOf(s, a)] += cost / rf;
  const throughput = 1 / Math.max(...load);
  // A peer searches up to CORES shards at once; more shards per peer queue up.
  const rounds = Math.max(1, Math.ceil(shards / PEERS) / CORES);
  const latency = cost * rounds + MERGE * Math.log2(shards);
  return { throughput, latency };
}

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

const stepper = (key, label) =>
  [
    `<div class="qi-group" role="group" aria-label="${label}">`,
    `  <span class="qi-hint">${label}:</span>`,
    `  <button type="button" class="qi-chip" data-${key}="-1" aria-label="Decrease ${label}">−</button>`,
    `  <b class="qi-rr__value" data-value="${key}" aria-live="polite"></b>`,
    `  <button type="button" class="qi-chip" data-${key}="1" aria-label="Increase ${label}">+</button>`,
    '</div>',
  ].join('');

const PAUSE_ICON = '<svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
const PLAY_ICON = '<svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20"/></svg>';

export function mount(node) {
  node.classList.add('qi-rr');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls qi-controls--split">',
    '    <div class="qi-group qi-rr__steppers">',
    stepper('shards', 'shards'),
    stepper('rf', 'replication_factor'),
    '    </div>',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-play></button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-rr__svg" viewBox="-2 0 764 ${VB_H}" role="img"`,
    '    aria-label="A collection on a three-peer cluster under a steady stream of queries. Change the number of shards and the replication factor to see how the replicas are placed and read, and how throughput and latency change.">',
    '    <defs>',
    '      <marker id="qi-rr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">',
    '        <path class="qi-rr__arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '      <clipPath id="qi-rr-plot">',
    `        <rect x="${PLOT.x0}" y="${PLOT.y0 - 4}" width="${PLOT.x1 - PLOT.x0}" height="${PLOT.y1 - PLOT.y0 + 8}"/>`,
    '      </clipPath>',
    '    </defs>',
    '    <g class="qi-rr__collection"></g>',
    '    <g class="qi-rr__nodes"></g>',
    '    <g class="qi-rr__shards"></g>',
    `    <path class="qi-rr__wire" d="M ${CLIENT.x} ${CLIENT.y + CLIENT.h / 2} V ${CLUSTER.y - 6}" marker-end="url(#qi-rr-arrow)"/>`,
    `    <rect class="qi-rr__client" x="${CLIENT.x - CLIENT.w / 2}" y="${CLIENT.y - CLIENT.h / 2}" width="${CLIENT.w}" height="${CLIENT.h}" rx="6"/>`,
    `    <text class="qi-rr__client-text" x="${CLIENT.x}" y="${CLIENT.y + 4}">Client</text>`,
    '    <g class="qi-rr__tokens"></g>',
    '    <g class="qi-rr__chart"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-rr__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-rr__svg');
  const collG = svg.querySelector('.qi-rr__collection');
  const nodesG = svg.querySelector('.qi-rr__nodes');
  const shardsG = svg.querySelector('.qi-rr__shards');
  const wire = svg.querySelector('.qi-rr__wire');
  const tokensG = svg.querySelector('.qi-rr__tokens');
  const chartG = svg.querySelector('.qi-rr__chart');
  const statusEl = node.querySelector('.qi-rr__status');
  const playBtn = node.querySelector('[data-play]');
  const shardBtns = [...node.querySelectorAll('[data-shards]')];
  const rfBtns = [...node.querySelectorAll('[data-rf]')];
  const shardVal = node.querySelector('[data-value="shards"]');
  const rfVal = node.querySelector('[data-value="rf"]');

  // The collection, divided into its shards (chips rebuilt on every change).
  el('rect', { class: 'qi-frame', x: COLL.x, y: COLL.y, width: COLL.w, height: COLL.h, rx: 6 }, collG);
  el('text', { class: 'qi-frame-label', x: COLL.x + 12, y: COLL.y + 27 }, collG).textContent = 'Collection';
  const chipsG = el('g', {}, collG);

  // The cluster and its peers.
  el('rect', { class: 'qi-rr__cluster', x: CLUSTER.x, y: CLUSTER.y, width: CLUSTER.w, height: CLUSTER.h, rx: 8 }, nodesG);
  el('text', { class: 'qi-frame-label', x: CLUSTER.x + 16, y: CLUSTER.y + 24 }, nodesG).textContent = 'Cluster';
  for (let n = 0; n < PEERS; n++) {
    el('rect', { class: 'qi-frame', x: nodeX(n), y: NODE.y, width: NODE.w, height: NODE.h, rx: 6 }, nodesG);
    el('text', { class: 'qi-frame-label', x: nodeX(n) + 14, y: NODE.y + 24 }, nodesG).textContent = `Peer ${n + 1}`;
  }

  // The chart: frame, title, gridlines (redrawn when the scale changes), the
  // two step lines and the current values.
  el('rect', { class: 'qi-frame', x: CHART.x, y: CHART.y, width: CHART.w, height: CHART.h, rx: 6 }, chartG);
  el('text', { class: 'qi-frame-label', x: CHART.x + 16, y: CHART.y + 22 }, chartG).textContent =
    'Schematic, relative to 1 shard with 1 replica';
  const gridG = el('g', {}, chartG);
  const plotG = el('g', { 'clip-path': 'url(#qi-rr-plot)' }, chartG);
  const thrPath = el('path', { class: 'qi-rr__line qi-rr__line--thr' }, plotG);
  const latPath = el('path', { class: 'qi-rr__line qi-rr__line--lat' }, plotG);
  const LEGEND_X = PLOT.x1 + 28;
  const legend = (y, cls, label) => {
    el('line', { class: `qi-rr__line qi-rr__line--${cls}`, x1: LEGEND_X, x2: LEGEND_X + 22, y1: y - 4, y2: y - 4 }, chartG);
    el('text', { class: 'qi-label', x: LEGEND_X + 30, y }, chartG).textContent = label;
    return el('text', { class: 'qi-label qi-label--strong qi-rr__metric', x: CHART.x + CHART.w - 16, y, 'text-anchor': 'end' }, chartG);
  };
  const thrVal = legend(PLOT.y0 + 22, 'thr', 'Throughput');
  const latVal = legend(PLOT.y0 + 54, 'lat', 'Latency');

  // replicas[s][a]: replica a of shard s, made the first time it is needed.
  // Each has a full shard box (used while every peer holds three replicas or
  // fewer) and a compact cell (used beyond that); the svg's is-compact class
  // picks one. Hidden replicas fade out where they are.
  const replicas = [];
  function replica(s, a) {
    while (replicas.length <= s) replicas.push([]);
    if (replicas[s][a]) return replicas[s][a];
    const g = el('g', { class: `qi-rr__shard qi-rr__shard--${s % COLORS}` });
    const full = el('g', { class: 'qi-rr__full' }, g);
    el('rect', { class: 'qi-rr__box', width: BOX.w, height: BOX.h, rx: 6 }, full);
    el('text', { class: 'qi-label qi-label--strong', x: 12, y: 26 }, full).textContent = `Shard ${s}`;
    for (let i = 0; i < BARS; i++) el('rect', { class: 'qi-rr__bar', x: BAR.x + i * BAR.slot, y: BAR.y, width: BAR.w, height: BAR.h, rx: 1.5 }, full);
    const compact = el('g', { class: 'qi-rr__compact' }, g);
    el('rect', { class: 'qi-rr__cell', width: CELL.w, height: CELL.h, rx: 4 }, compact);
    el('text', { class: 'qi-rr__cell-text', x: CELL.w / 2, y: 19 }, compact).textContent = `S${s}`;
    // Later replicas are drawn underneath, so new ones slide out from under
    // the shard's first replica.
    if (a === 0) shardsG.appendChild(g);
    else shardsG.insertBefore(g, shardsG.firstChild);
    const r = { s, a, g, at: null };
    replicas[s][a] = r;
    return r;
  }

  let shards = 1;
  let rf = 1;
  let playing = !reduced;
  let visible = true;
  let clock = 0; // chart time, in ms; runs only while playing and visible
  let history = []; // [{ t, throughput, latency }], one entry per change
  let yMax = 3;
  let queryTimer = 0;
  let raf = 0;
  let lastFrame = 0;

  function intro() {
    const peers = Math.min(PEERS, shards + rf - 1);
    const what = `${plural(shards, 'shard')} with a replication factor of ${rf}: ${plural(shards * rf, 'replica')} on ${plural(peers, 'peer')}.`;
    const reads = shards === 1 ? 'Each query reads the shard' : `Each query reads all ${shards} shards`;
    const from =
      rf === 1
        ? shards === 1 ? ', from its only replica.' : ', each from its only replica.'
        : shards === 1 ? `, from one of its ${rf} replicas, chosen at random.` : `, each from one of its ${rf} replicas, chosen at random.`;
    return `${what} ${reads}${from}`;
  }

  // Collection chips: as many as there are shards, narrower as they multiply.
  function drawChips() {
    chipsG.innerHTML = '';
    const room = COLL.w - COLL.chipX - 10;
    const gap = Math.min(COLL.gap, room / shards / 6);
    const w = Math.min(COLL.chipW, (room + gap) / shards - gap);
    const y = COLL.y + (COLL.h - COLL.chipH) / 2;
    for (let s = 0; s < shards; s++) {
      const x = COLL.x + COLL.chipX + s * (w + gap);
      el('rect', { class: `qi-rr__chip qi-rr__chip--${s % COLORS}`, x, y, width: w, height: COLL.chipH, rx: Math.min(4, w / 3) }, chipsG);
      const label = `S${s}`;
      if (w >= label.length * 7.5 + 6) el('text', { class: 'qi-rr__chip-text', x: x + w / 2, y: y + 16 }, chipsG).textContent = label;
    }
  }

  // Lay out the replicas the settings call for. Each peer lists its replicas
  // in shard order. Up to three per peer: full boxes in a column. More: a grid
  // of compact cells, the same scale on every peer, as large as fits.
  function place() {
    const perPeer = Array.from({ length: PEERS }, () => []);
    for (let s = 0; s < shards; s++) for (let a = 0; a < rf; a++) perPeer[peerOf(s, a)].push(replica(s, a));
    const most = Math.max(...perPeer.map((l) => l.length));
    const compact = most > 3;
    let cols = 1;
    let k = 1;
    if (compact) {
      k = 0;
      for (let c = 1; c <= most; c++) {
        const rows = Math.ceil(most / c);
        const kc = Math.min(MAX_K, AREA.w / (c * (CELL.w + CELL.gap) - CELL.gap), AREA.h / (rows * (CELL.h + CELL.gap) - CELL.gap));
        if (kc > k) {
          k = kc;
          cols = c;
        }
      }
    }
    svg.classList.toggle('is-compact', compact);
    svg.classList.toggle('is-tiny', compact && k < TEXT_K);
    const pitchX = (CELL.w + CELL.gap) * k;
    const left = (AREA.w - cols * pitchX + CELL.gap * k) / 2; // centers the grid
    const target = new Map();
    perPeer.forEach((list, p) => {
      list.forEach((r, i) => {
        target.set(
          r,
          compact
            ? { x: nodeX(p) + AREA.dx + left + (i % cols) * pitchX, y: NODE.y + AREA.dy + Math.floor(i / cols) * (CELL.h + CELL.gap) * k, k }
            : { x: nodeX(p) + BOX.dx, y: NODE.y + BOX.dy + i * BOX.pitch, k: 1 },
        );
      });
    });
    replicas.flat().forEach((r) => {
      const t = target.get(r);
      r.g.classList.toggle('is-on', !!t);
      if (!t) return r.g.classList.remove('is-hot');
      if (!r.at) {
        // New replica: start on top of its shard's first replica (or in place)
        // without a transition, then slide to its spot.
        const from = (r.a > 0 && target.get(replicas[r.s][0])) || t;
        r.g.style.transition = 'none';
        r.g.style.transform = tf(from);
        r.g.getBoundingClientRect();
        r.g.style.transition = '';
      }
      r.at = t;
      r.g.style.transform = tf(t);
    });
    drawChips();
  }
  const tf = ({ x, y, k }) => `translate(${x}px, ${y}px) scale(${k})`;

  // --- Chart ---
  const pct = (v) => `${Math.round(v * 100)}%`;
  const xAt = (t) => PLOT.x1 - ((clock - t) / WINDOW_MS) * (PLOT.x1 - PLOT.x0);
  const yAt = (v) => PLOT.y1 - (Math.min(v, yMax * 1.04) / yMax) * (PLOT.y1 - PLOT.y0);

  function drawGrid() {
    gridG.innerHTML = '';
    for (let v = 0; v <= yMax + 1e-9; v += 1) {
      const y = yAt(v);
      el('line', { class: v === 0 ? 'qi-rr__axis' : 'qi-rr__grid', x1: PLOT.x0, x2: PLOT.x1, y1: y, y2: y }, gridG);
      el('text', { class: 'qi-label qi-rr__tick', x: PLOT.x0 - 8, y: y + 4, 'text-anchor': 'end' }, gridG).textContent = pct(v);
    }
  }

  function stepPath(key) {
    const start = clock - WINDOW_MS;
    let i = history.length - 1;
    while (i > 0 && history[i].t > start) i--;
    let d = `M ${xAt(Math.max(start, history[i].t))} ${yAt(history[i][key])}`;
    for (let j = i + 1; j < history.length; j++) d += ` H ${xAt(history[j].t)} V ${yAt(history[j][key])}`;
    return `${d} H ${xAt(clock)}`;
  }

  function drawChart() {
    // Scale: 0 to 300%, or more when a visible value needs it.
    const start = clock - WINDOW_MS;
    const seen = history.filter((h, i) => i === history.length - 1 || history[i + 1].t > start);
    const top = Math.max(3, Math.ceil(Math.max(...seen.map((h) => Math.max(h.throughput, h.latency))) - 1e-9));
    if (top !== yMax) {
      yMax = top;
      drawGrid();
    }
    thrPath.setAttribute('d', stepPath('throughput'));
    latPath.setAttribute('d', stepPath('latency'));
    // Drop changes that have scrolled out, keeping the one in effect.
    while (history.length > 1 && history[1].t <= start) history.shift();
  }

  function record() {
    const m = metrics(shards, rf);
    if (history.length && history[history.length - 1].t === clock) history.pop();
    // The first entry has always been in effect, so the chart starts full.
    history.push({ t: history.length ? clock : -Infinity, ...m });
    thrVal.textContent = pct(m.throughput);
    latVal.textContent = pct(m.latency);
    drawChart();
  }

  // --- Query stream ---
  function travel() {
    const len = wire.getTotalLength();
    const tok = el('rect', { class: 'qi-rr__token', width: TOKEN, height: TOKEN, rx: 2 }, tokensG);
    const t0 = performance.now();
    return new Promise((resolve) => {
      const frame = (now) => {
        if (!tok.isConnected) return resolve(false);
        const f = Math.min(1, (now - t0) / TRAVEL_MS);
        const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        const pt = wire.getPointAtLength(len * e);
        tok.setAttribute('x', pt.x - TOKEN / 2);
        tok.setAttribute('y', pt.y - TOKEN / 2);
        if (f < 1) return requestAnimationFrame(frame);
        tok.remove();
        resolve(true);
      };
      requestAnimationFrame(frame);
    });
  }

  // One query: reach the cluster, then read a random replica of every shard.
  function query() {
    travel().then((ok) => {
      if (!ok || !running()) return;
      const picks = [];
      for (let s = 0; s < shards; s++) picks.push(replica(s, Math.floor(Math.random() * rf)));
      picks.forEach((r) => r.g.classList.add('is-hot'));
      window.setTimeout(() => picks.forEach((r) => r.g.classList.remove('is-hot')), HOT_MS);
    });
  }

  const running = () => playing && visible;

  function tick(now) {
    clock += Math.min(100, now - lastFrame); // no jump after a stall
    lastFrame = now;
    drawChart();
    raf = requestAnimationFrame(tick);
  }

  // Start or stop the stream and the chart to match playing and visible.
  function sync() {
    window.clearInterval(queryTimer);
    cancelAnimationFrame(raf);
    queryTimer = 0;
    raf = 0;
    if (running()) {
      wire.classList.add('is-on');
      query();
      queryTimer = window.setInterval(query, EVERY_MS);
      lastFrame = performance.now();
      raf = requestAnimationFrame(tick);
    } else {
      wire.classList.remove('is-on');
      tokensG.innerHTML = '';
      replicas.flat().forEach((r) => r.g.classList.remove('is-hot'));
    }
    playBtn.innerHTML = playing ? `${PAUSE_ICON}Pause` : `${PLAY_ICON}Play`;
    playBtn.setAttribute('aria-label', playing ? 'Pause the queries' : 'Play the queries');
  }

  function render() {
    shardVal.textContent = String(shards);
    rfVal.textContent = String(rf);
    shardBtns.forEach((b) => (b.disabled = shards + Number(b.dataset.shards) < 1));
    rfBtns.forEach((b) => {
      const next = rf + Number(b.dataset.rf);
      b.disabled = next < 1 || next > MAX_RF;
    });
    const m = metrics(shards, rf);
    statusEl.textContent = `${intro()} Throughput: ${pct(m.throughput)}, latency: ${pct(m.latency)}.`;
  }

  function change(fn) {
    fn();
    place();
    render();
    record();
    // Paused, the chart doesn't move; give each change a few seconds of its
    // own so the steps stay readable.
    if (!running()) {
      clock += PAUSED_STEP_MS;
      drawChart();
    }
  }
  shardBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const next = shards + Number(b.dataset.shards);
      if (next >= 1) change(() => (shards = next));
    }),
  );
  rfBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const next = rf + Number(b.dataset.rf);
      if (next >= 1 && next <= MAX_RF) change(() => (rf = next));
    }),
  );
  playBtn.addEventListener('click', () => {
    playing = !playing;
    sync();
  });

  // Run only while the island is on screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      sync();
    }).observe(node);
  }

  place();
  render();
  record();
  drawGrid();
  drawChart();
  sync();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
