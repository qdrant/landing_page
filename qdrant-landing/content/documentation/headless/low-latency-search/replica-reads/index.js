/*
 * replica-reads island: interactive replacement for replication.png on the
 * low-latency search page.
 *
 * Same scenario as the replication island on the horizontal scaling page: a
 * three-node cluster with a collection of three shards and a replication
 * factor of two, so six replicas, two per node. A client sends a stream of
 * queries. Each query reads one replica of every shard; successive queries
 * alternate between a shard's two replicas, so each replica serves half of
 * its shard's reads. A counter next to each replica shows how many reads it
 * served.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Shard
 * colors match the replication island.
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox -2 0 764 244), node and shard sizes from the replication island.
const NODE = { w: 230, h: 152, y: 86, pitch: 265 };
const BOX = { w: 150, h: 42, dx: 40, dy: 40, pitch: 50 };
const BARS = 6;
const BAR = { x: 84, slot: 10, w: 5.5, y: 11, h: 20 };
const CLIENT = { x: 380, y: 22, w: 120, h: 40 };
const JUNCTION_Y = 64;
const VB_H = 244;

const SHARDS = 3;
const FACTOR = 2;
// 6 queries split evenly over 2 replicas (3 each). Slow enough to follow
// one query at a time.
const QUERIES = 6;
const EVERY_MS = 1600; // between queries
const TRAVEL_MS = 1200; // client to node
const TOKEN = 10;

const nodeX = (n) => n * NODE.pitch;
// Replica `a` of shard `s` lives on node (s + a) % 3, in row `a` (as in the
// replication island).
const nodeOf = (s, a) => (s + a) % 3;

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

// Wire from the client down to a node, with rounded corners.
function drop(n) {
  const x = nodeX(n) + NODE.w / 2;
  const start = CLIENT.y + CLIENT.h / 2;
  const end = NODE.y - 6;
  if (x === CLIENT.x) return `M ${x} ${start} V ${end}`;
  const d = x > CLIENT.x ? 1 : -1;
  return `M ${CLIENT.x} ${start} V ${JUNCTION_Y - 10} Q ${CLIENT.x} ${JUNCTION_Y} ${CLIENT.x + d * 10} ${JUNCTION_Y} H ${x - d * 10} Q ${x} ${JUNCTION_Y} ${x} ${JUNCTION_Y + 10} V ${end}`;
}

export function mount(node) {
  node.classList.add('qi-rr');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-start>',
    '        <svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20"/></svg>Start queries',
    '      </button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-rr__svg" viewBox="-2 0 764 ${VB_H}" role="img"`,
    '    aria-label="A three-node cluster with three shards and a replication factor of two. Each query reads one replica of every shard, and the reads of each shard are split between its two replicas.">',
    '    <defs>',
    '      <marker id="qi-rr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">',
    '        <path class="qi-rr__arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    '    <g class="qi-rr__nodes"></g>',
    '    <g class="qi-rr__wires"></g>',
    `    <rect class="qi-rr__client" x="${CLIENT.x - CLIENT.w / 2}" y="${CLIENT.y - CLIENT.h / 2}" width="${CLIENT.w}" height="${CLIENT.h}" rx="6"/>`,
    `    <text class="qi-rr__client-text" x="${CLIENT.x}" y="${CLIENT.y + 4}">Client</text>`,
    `    <text class="qi-label qi-rr__count" x="${CLIENT.x + CLIENT.w / 2 + 16}" y="${CLIENT.y + 4}"></text>`,
    '    <g class="qi-rr__tokens"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-rr__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-rr__svg');
  const nodesG = svg.querySelector('.qi-rr__nodes');
  const wiresG = svg.querySelector('.qi-rr__wires');
  const tokensG = svg.querySelector('.qi-rr__tokens');
  const countEl = svg.querySelector('.qi-rr__count');
  const statusEl = node.querySelector('.qi-rr__status');
  const startBtn = node.querySelector('[data-start]');

  for (let n = 0; n < 3; n++) {
    el('rect', { class: 'qi-frame', x: nodeX(n), y: NODE.y, width: NODE.w, height: NODE.h, rx: 6 }, nodesG);
    el('text', { class: 'qi-frame-label', x: nodeX(n) + 14, y: NODE.y + 24 }, nodesG).textContent = `Node ${n + 1}`;
  }
  const wires = [0, 1, 2].map((n) => el('path', { class: 'qi-rr__wire', d: drop(n), 'marker-end': 'url(#qi-rr-arrow)' }, wiresG));

  // replicas[s][a]: the box of replica a of shard s, with its read counter.
  const replicas = [];
  for (let s = 0; s < SHARDS; s++) {
    replicas.push([]);
    for (let a = 0; a < FACTOR; a++) {
      const n = nodeOf(s, a);
      const x = nodeX(n) + BOX.dx;
      const y = NODE.y + BOX.dy + a * BOX.pitch;
      const g = el('g', { class: `qi-rr__shard qi-rr__shard--${s}`, transform: `translate(${x} ${y})` }, nodesG);
      el('rect', { class: 'qi-rr__box', width: BOX.w, height: BOX.h, rx: 6 }, g);
      el('text', { class: 'qi-label qi-label--strong', x: 12, y: 26 }, g).textContent = `Shard ${s}`;
      for (let i = 0; i < BARS; i++) el('rect', { class: 'qi-rr__bar', x: BAR.x + i * BAR.slot, y: BAR.y, width: BAR.w, height: BAR.h, rx: 1.5 }, g);
      const counter = el('text', { class: 'qi-label qi-label--strong qi-rr__reads', x: BOX.w + 10, y: 26 }, g);
      replicas[s].push({ s, a, n, g, counter, reads: 0 });
    }
  }

  let timers = [];
  let gen = 0;
  let sent = 0;
  let running = false;
  const later = (fn, ms) => timers.push(window.setTimeout(fn, reduced ? 0 : ms));

  function render() {
    replicas.flat().forEach((r) => (r.counter.textContent = r.reads ? String(r.reads) : ''));
    countEl.textContent = sent ? `queries: ${sent} of ${QUERIES}` : '';
    startBtn.disabled = running;
  }

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
    wires.forEach((w) => w.classList.remove('is-on'));
    statusEl.innerHTML = 'Three shards, two replicas each, on three nodes. Press Start queries.';
    render();
  }

  // Send one sub-request from the client to a node; resolve on arrival.
  function travel(n, myGen) {
    return new Promise((resolve) => {
      const path = wires[n];
      const len = path.getTotalLength();
      const tok = el('rect', { class: 'qi-rr__token', width: TOKEN, height: TOKEN, rx: 2 }, tokensG);
      const t0 = performance.now();
      const frame = (now) => {
        if (myGen !== gen) return resolve(false);
        const f = reduced ? 1 : Math.min(1, (now - t0) / TRAVEL_MS);
        const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        const pt = path.getPointAtLength(len * e);
        tok.setAttribute('x', pt.x - TOKEN / 2);
        tok.setAttribute('y', pt.y - TOKEN / 2);
        if (f < 1) return requestAnimationFrame(frame);
        tok.remove();
        resolve(true);
      };
      requestAnimationFrame(frame);
    });
  }

  function query(q, myGen) {
    sent = q + 1;
    // Query q reads replica (q % FACTOR) of every shard.
    const picks = replicas.map((reps) => reps[q % FACTOR]);
    wires.forEach((w) => w.classList.add('is-on'));
    render();
    picks.forEach((r) =>
      travel(r.n, myGen).then((ok) => {
        if (!ok) return;
        r.reads++;
        r.g.classList.add('is-hot');
        later(() => r.g.classList.remove('is-hot'), 1000);
        render();
      }),
    );
  }

  function start() {
    if (running) return;
    reset();
    running = true;
    render();
    const myGen = gen;
    // One sentence for the whole run: the counters show the progress.
    statusEl.innerHTML =
      'Each query reads one replica of every shard. Successive queries alternate between a shard’s two replicas.';
    for (let q = 0; q < QUERIES; q++) later(() => myGen === gen && query(q, myGen), q * EVERY_MS);
    later(() => {
      if (myGen !== gen) return;
      wires.forEach((w) => w.classList.remove('is-on'));
      running = false;
      statusEl.innerHTML = `Each replica served ${QUERIES / FACTOR} of its shard’s ${QUERIES} reads, so the reads spread across all three nodes.`;
      render();
    }, (QUERIES - 1) * EVERY_MS + TRAVEL_MS + 400);
  }

  startBtn.addEventListener('click', start);

  reset();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
