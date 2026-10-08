/*
 * replica-reads island: interactive replacement for replication.png on the
 * low-latency search page.
 *
 * A collection on a cluster with three peers, with two independent steppers:
 *
 *   shards              1 and up, no upper limit. The collection is divided
 *                       into this many shards; shard s lives on peer s % 3.
 *   replication_factor  1 to 3 (one replica per peer at most). Replica a of
 *                       shard s lives on peer (s + a) % 3, as in the
 *                       replication island on the horizontal scaling page.
 *                       At 3 shards and a factor of 2 this is the page's
 *                       example: 6 replicas, 2 on each peer.
 *
 * Up to three replicas per peer are drawn as full shard boxes with a read
 * counter. Beyond that, each peer shows its replicas as a grid of compact
 * cells that shrinks to fit; labels and counters drop out when the cells get
 * too small to hold them. Shard colors cycle through six colors.
 *
 * It starts with a single shard and a single replica. "Send queries" sends 6
 * queries to the cluster. Each query reads one replica of every shard, chosen
 * at random (but never all on one replica of a shard, so a short run still
 * shows the replicas sharing the reads). More shards: each query reads more
 * shards. More replicas: each shard's reads are spread over more copies. How
 * a peer receives a query and fans it out is left out.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). The first
 * three shard colors match the replication island.
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox -2 0 764 324).
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
const TEXT_K = 0.6; // below this scale, cells drop their text
const VB_H = 324;
const COLORS = 6;

const PEERS = 3;
const MAX_RF = 3; // one replica per peer at most
const QUERIES = 6;
const EVERY_MS = 1600; // between queries
const TRAVEL_MS = 800; // client to cluster
const HOT_MS = 1100;
const TOKEN = 10;

const nodeX = (n) => NODE.x0 + n * NODE.pitch;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const peerOf = (s, a) => (s + a) % PEERS;

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
    '      <button type="button" class="qi-chip" data-start>',
    '        <svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20"/></svg>Send queries',
    '      </button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-rr__svg" viewBox="-2 0 764 ${VB_H}" role="img"`,
    '    aria-label="A collection on a three-peer cluster. Change the number of shards and the replication factor to see how the shards and their replicas are placed on the peers and how queries read them.">',
    '    <defs>',
    '      <marker id="qi-rr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">',
    '        <path class="qi-rr__arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    '    <g class="qi-rr__collection"></g>',
    '    <g class="qi-rr__nodes"></g>',
    '    <g class="qi-rr__shards"></g>',
    `    <path class="qi-rr__wire" d="M ${CLIENT.x} ${CLIENT.y + CLIENT.h / 2} V ${CLUSTER.y - 6}" marker-end="url(#qi-rr-arrow)"/>`,
    `    <rect class="qi-rr__client" x="${CLIENT.x - CLIENT.w / 2}" y="${CLIENT.y - CLIENT.h / 2}" width="${CLIENT.w}" height="${CLIENT.h}" rx="6"/>`,
    `    <text class="qi-rr__client-text" x="${CLIENT.x}" y="${CLIENT.y + 4}">Client</text>`,
    `    <text class="qi-label qi-rr__count" x="${CLIENT.x + CLIENT.w / 2 + 16}" y="${CLIENT.y + 4}"></text>`,
    '    <g class="qi-rr__tokens"></g>',
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
  const countEl = svg.querySelector('.qi-rr__count');
  const statusEl = node.querySelector('.qi-rr__status');
  const startBtn = node.querySelector('[data-start]');
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

  // replicas[s][a]: replica a of shard s, made the first time it is needed.
  // Each has a full shard box (used while every peer holds three replicas or
  // fewer) and a compact cell (used beyond that); the svg's is-compact class
  // picks one. Hidden replicas fade out where they are.
  const replicas = [];
  function replica(s, a) {
    while (replicas.length <= s) replicas.push([]);
    if (replicas[s][a]) return replicas[s][a];
    const color = s % COLORS;
    const g = el('g', { class: `qi-rr__shard qi-rr__shard--${color}` });
    const full = el('g', { class: 'qi-rr__full' }, g);
    el('rect', { class: 'qi-rr__box', width: BOX.w, height: BOX.h, rx: 6 }, full);
    el('text', { class: 'qi-label qi-label--strong', x: 12, y: 26 }, full).textContent = `Shard ${s}`;
    for (let i = 0; i < BARS; i++) el('rect', { class: 'qi-rr__bar', x: BAR.x + i * BAR.slot, y: BAR.y, width: BAR.w, height: BAR.h, rx: 1.5 }, full);
    const counter = el('text', { class: 'qi-label qi-label--strong qi-rr__reads', x: BOX.w + 10, y: 26 }, full);
    const compact = el('g', { class: 'qi-rr__compact' }, g);
    el('rect', { class: 'qi-rr__cell', width: CELL.w, height: CELL.h, rx: 4 }, compact);
    el('text', { class: 'qi-rr__cell-text', x: 8, y: 19 }, compact).textContent = `S${s}`;
    const cellCount = el('text', { class: 'qi-rr__cell-text qi-rr__cell-count', x: CELL.w - 8, y: 19 }, compact);
    // Later replicas are drawn underneath, so new ones slide out from under
    // the shard's first replica.
    if (a === 0) shardsG.appendChild(g);
    else shardsG.insertBefore(g, shardsG.firstChild);
    const r = { s, a, g, counter, cellCount, reads: 0, at: null };
    replicas[s][a] = r;
    return r;
  }

  let shards = 1;
  let rf = 1;
  let compactMode = false;
  let timers = [];
  let gen = 0;
  let sent = 0;
  let running = false;
  let plan = []; // plan[s][q]: which replica of shard s query q reads
  const later = (fn, ms) => timers.push(window.setTimeout(fn, reduced ? 0 : ms));
  const live = () => Array.from({ length: shards }, (_, s) => Array.from({ length: rf }, (_, a) => replica(s, a)));

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

  function render() {
    shardVal.textContent = String(shards);
    rfVal.textContent = String(rf);
    shardBtns.forEach((b) => (b.disabled = shards + Number(b.dataset.shards) < 1));
    rfBtns.forEach((b) => {
      const next = rf + Number(b.dataset.rf);
      b.disabled = next < 1 || next > MAX_RF;
    });
    replicas.flat().forEach((r) => {
      const n = r.reads ? String(r.reads) : '';
      r.counter.textContent = n;
      r.cellCount.textContent = n;
    });
    countEl.textContent = sent ? `queries: ${sent} of ${QUERIES}` : '';
    startBtn.disabled = running;
  }

  // Lay out the replicas the settings call for. Each peer lists its replicas
  // in shard order. Up to three per peer: full boxes in a column. More: a grid
  // of compact cells, the same scale on every peer, as large as fits.
  function place() {
    const perPeer = Array.from({ length: PEERS }, () => []);
    for (let s = 0; s < shards; s++) for (let a = 0; a < rf; a++) perPeer[peerOf(s, a)].push(replica(s, a));
    const most = Math.max(...perPeer.map((l) => l.length));
    compactMode = most > 3;
    let cols = 1;
    let k = 1;
    if (compactMode) {
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
    svg.classList.toggle('is-compact', compactMode);
    svg.classList.toggle('is-tiny', compactMode && k < TEXT_K);
    const pitchX = (CELL.w + CELL.gap) * k;
    const left = (AREA.w - cols * pitchX + CELL.gap * k) / 2; // centers the grid
    const target = new Map();
    perPeer.forEach((list, p) => {
      list.forEach((r, i) => {
        target.set(r, compactMode
          ? {
              x: nodeX(p) + AREA.dx + left + (i % cols) * pitchX,
              y: NODE.y + AREA.dy + Math.floor(i / cols) * (CELL.h + CELL.gap) * k,
              k,
            }
          : { x: nodeX(p) + BOX.dx, y: NODE.y + BOX.dy + i * BOX.pitch, k: 1 });
      });
    });
    replicas.flat().forEach((r) => {
      const t = target.get(r);
      r.g.classList.toggle('is-on', !!t);
      if (!t) return;
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

  function reset() {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
    gen++;
    sent = 0;
    running = false;
    tokensG.innerHTML = '';
    replicas.flat().forEach((r) => {
      r.reads = 0;
      r.g.classList.remove('is-hot');
    });
    wire.classList.remove('is-on');
    statusEl.textContent = intro();
    render();
  }

  // Random replica choices for one run, one sequence per shard; a sequence
  // that leaves a replica without reads is drawn again.
  function makePlan() {
    plan = live().map(() => {
      let seq;
      do {
        seq = Array.from({ length: QUERIES }, () => Math.floor(Math.random() * rf));
      } while (new Set(seq).size < rf);
      return seq;
    });
  }

  function travel(myGen) {
    return new Promise((resolve) => {
      const len = wire.getTotalLength();
      const tok = el('rect', { class: 'qi-rr__token', width: TOKEN, height: TOKEN, rx: 2 }, tokensG);
      const t0 = performance.now();
      const frame = (now) => {
        if (myGen !== gen) {
          tok.remove();
          return resolve(false);
        }
        const f = reduced ? 1 : Math.min(1, (now - t0) / TRAVEL_MS);
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

  // One query: reach the cluster, then read one replica of every shard.
  function query(q, myGen) {
    sent = q + 1;
    render();
    travel(myGen).then((ok) => {
      if (!ok) return;
      const picks = live().map((reps, s) => reps[plan[s][q]]);
      picks.forEach((r) => {
        r.reads++;
        r.g.classList.add('is-hot');
      });
      later(() => picks.forEach((r) => r.g.classList.remove('is-hot')), HOT_MS);
      render();
    });
  }

  function summary() {
    if (rf === 1) {
      return shards === 1
        ? `The shard's only replica served all ${QUERIES} reads. Add replicas to spread them.`
        : `Every query read all ${shards} shards, and each shard's only replica served all ${QUERIES} of its reads. Add replicas to spread them.`;
    }
    if (shards > 3) {
      const reads = live().flat().map((r) => r.reads);
      return `Each shard's ${QUERIES} reads were spread over its ${rf} replicas: every replica served between ${Math.min(...reads)} and ${Math.max(...reads)}.`;
    }
    const split = live()
      .map((reps) => `Shard ${reps[0].s}: ${reps.map((r) => r.reads).join(', ')}`)
      .join('; ');
    return shards === 1
      ? `The shard's ${QUERIES} reads were spread over its ${rf} replicas (${split}).`
      : `Each shard's ${QUERIES} reads were spread over its ${rf} replicas (${split}).`;
  }

  function start() {
    if (running) return;
    reset();
    makePlan();
    running = true;
    wire.classList.add('is-on');
    render();
    const myGen = gen;
    for (let q = 0; q < QUERIES; q++) later(() => myGen === gen && query(q, myGen), q * EVERY_MS);
    later(() => {
      if (myGen !== gen) return;
      wire.classList.remove('is-on');
      running = false;
      statusEl.textContent = summary();
      render();
    }, (QUERIES - 1) * EVERY_MS + TRAVEL_MS + 400);
  }

  function change(fn) {
    fn();
    place();
    reset();
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
  startBtn.addEventListener('click', start);

  place();
  reset();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
