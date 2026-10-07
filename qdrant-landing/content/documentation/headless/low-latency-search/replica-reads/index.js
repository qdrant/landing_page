/*
 * replica-reads island: interactive replacement for replication.png on the
 * low-latency search page.
 *
 * Shows the page's example: a collection divided into three shards, on a
 * cluster with three peers. A switch compares:
 *
 *   Shards    the three shards distributed across the peers, one per peer.
 *             Every query reads all three shards, so the only copy of each
 *             shard serves every read.
 *   Replicas  a replication factor of two: each shard has two replicas, six
 *             in total, two on each peer (placed as in the replication island
 *             on the horizontal scaling page). Each query reads one randomly
 *             chosen replica of every shard, so the replicas share the reads.
 *
 * "Send queries" sends 6 queries to the cluster; a counter next to each
 * replica shows how many reads it served. The replica choice is random, but
 * never all on one replica of a shard, so a short run still shows the
 * replicas sharing the reads (for example 4 and 2, never 6 and 0). How a peer receives a
 * query and fans it out is left out.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Shard
 * colors match the replication island.
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox -2 0 764 280).
const COLL = { x: 0, y: 2, w: 250, h: 44, chip: { x: 98, w: 44, h: 24, gap: 6 } };
const CLIENT = { x: 380, y: 24, w: 120, h: 40 };
const CLUSTER = { x: 0, y: 72, w: 760, h: 202 };
const NODE = { w: 228, h: 152, y: 108, pitch: 252, x0: 14 };
const BOX = { w: 150, h: 42, dx: 39, dy: 40, pitch: 50 };
const BARS = 6;
const BAR = { x: 84, slot: 10, w: 5.5, y: 11, h: 20 };
const VB_H = 280;

const SHARDS = 3;
const QUERIES = 6;
const EVERY_MS = 1600; // between queries
const TRAVEL_MS = 800; // client to cluster
const HOT_MS = 1100;
const TOKEN = 10;

const nodeX = (n) => NODE.x0 + n * NODE.pitch;
// Replica a of shard s lives on peer (s + a) % 3, in row a.
const pos = (s, a) => ({ x: nodeX((s + a) % 3) + BOX.dx, y: NODE.y + BOX.dy + a * BOX.pitch });
const translate = ({ x, y }) => `translate(${x}px, ${y}px)`;

const TEXT = {
  shards:
    'The collection is divided into 3 shards, distributed across 3 peers. Every query reads all 3 shards, so the only copy of each shard serves every read.',
  replicas:
    'With a replication factor of 2, each shard has 2 replicas: 6 in total, 2 on each peer. Each query reads one randomly chosen replica of every shard, so the replicas share the reads.',
};

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

export function mount(node) {
  node.classList.add('qi-rr');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls qi-controls--split">',
    '    <div class="qi-group" role="group" aria-label="Layout">',
    '      <button type="button" class="qi-chip" data-mode="shards" aria-pressed="false">Shards</button>',
    '      <button type="button" class="qi-chip" data-mode="replicas" aria-pressed="false">Replicas</button>',
    '    </div>',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-start>',
    '        <svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20"/></svg>Send queries',
    '      </button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-rr__svg" viewBox="-2 0 764 ${VB_H}" role="img"`,
    '    aria-label="A collection divided into three shards on a cluster with three peers. With a replication factor of two, each shard has two replicas, two on each peer, and reads are spread across the replicas.">',
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
  const modeBtns = [...node.querySelectorAll('[data-mode]')];
  const startBtn = node.querySelector('[data-start]');

  // The collection, divided into its three shards.
  el('rect', { class: 'qi-frame', x: COLL.x, y: COLL.y, width: COLL.w, height: COLL.h, rx: 6 }, collG);
  el('text', { class: 'qi-frame-label', x: COLL.x + 12, y: COLL.y + 27 }, collG).textContent = 'Collection';
  for (let s = 0; s < SHARDS; s++) {
    const cx = COLL.x + COLL.chip.x + s * (COLL.chip.w + COLL.chip.gap);
    const cy = COLL.y + (COLL.h - COLL.chip.h) / 2;
    el('rect', { class: `qi-rr__chip qi-rr__chip--${s}`, x: cx, y: cy, width: COLL.chip.w, height: COLL.chip.h, rx: 4 }, collG);
    el('text', { class: 'qi-rr__chip-text', x: cx + COLL.chip.w / 2, y: cy + 16 }, collG).textContent = `S${s}`;
  }

  // The cluster and its peers.
  el('rect', { class: 'qi-rr__cluster', x: CLUSTER.x, y: CLUSTER.y, width: CLUSTER.w, height: CLUSTER.h, rx: 8 }, nodesG);
  el('text', { class: 'qi-frame-label', x: CLUSTER.x + 16, y: CLUSTER.y + 24 }, nodesG).textContent = 'Cluster';
  for (let n = 0; n < 3; n++) {
    el('rect', { class: 'qi-frame', x: nodeX(n), y: NODE.y, width: NODE.w, height: NODE.h, rx: 6 }, nodesG);
    el('text', { class: 'qi-frame-label', x: nodeX(n) + 14, y: NODE.y + 24 }, nodesG).textContent = `Peer ${n + 1}`;
  }

  // replicas[s][a]: replica a of shard s. The second replica (a = 1) only
  // shows in Replicas mode; in Shards mode it sits, hidden, on top of the
  // first, so switching modes copies it across to its peer.
  const replicas = [];
  for (let s = 0; s < SHARDS; s++) {
    replicas.push([]);
    for (let a = 0; a < 2; a++) {
      const g = el('g', { class: `qi-rr__shard qi-rr__shard--${s}${a ? ' qi-rr__shard--copy' : ''}` }, shardsG);
      g.style.transform = translate(pos(s, 0));
      el('rect', { class: 'qi-rr__box', width: BOX.w, height: BOX.h, rx: 6 }, g);
      el('text', { class: 'qi-label qi-label--strong', x: 12, y: 26 }, g).textContent = `Shard ${s}`;
      for (let i = 0; i < BARS; i++) el('rect', { class: 'qi-rr__bar', x: BAR.x + i * BAR.slot, y: BAR.y, width: BAR.w, height: BAR.h, rx: 1.5 }, g);
      const counter = el('text', { class: 'qi-label qi-label--strong qi-rr__reads', x: BOX.w + 10, y: 26 }, g);
      replicas[s].push({ s, a, g, counter, reads: 0 });
    }
  }
  // Draw the second replicas under the first ones, so the copy slides out
  // from underneath.
  replicas.forEach((reps) => shardsG.insertBefore(reps[1].g, shardsG.firstChild));

  let mode = 'shards';
  let timers = [];
  let gen = 0;
  let sent = 0;
  let running = false;
  const later = (fn, ms) => timers.push(window.setTimeout(fn, reduced ? 0 : ms));
  const factor = () => (mode === 'replicas' ? 2 : 1);
  let plan = []; // plan[s][q]: which replica of shard s query q reads

  // Random replica choices for one run, one sequence per shard. With two
  // replicas, a sequence that sends every read to the same replica is drawn
  // again, so each replica serves at least one read.
  function makePlan() {
    plan = replicas.map(() => {
      let seq;
      do {
        seq = Array.from({ length: QUERIES }, () => Math.floor(Math.random() * factor()));
      } while (factor() > 1 && new Set(seq).size < factor());
      return seq;
    });
  }

  function render() {
    modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    replicas.flat().forEach((r) => (r.counter.textContent = r.reads ? String(r.reads) : ''));
    countEl.textContent = sent ? `queries: ${sent} of ${QUERIES}` : '';
    startBtn.disabled = running;
  }

  function place() {
    replicas.forEach((reps) => {
      const copy = reps[1];
      const on = mode === 'replicas';
      copy.g.classList.toggle('is-on', on);
      copy.g.style.transform = translate(pos(copy.s, on ? 1 : 0));
    });
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
    wire.classList.remove('is-on');
    statusEl.textContent = TEXT[mode];
    render();
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

  // One query: reach the cluster, then read one replica of every shard,
  // chosen at random among that shard's replicas.
  function query(q, myGen) {
    sent = q + 1;
    render();
    travel(myGen).then((ok) => {
      if (!ok) return;
      const picks = replicas.map((reps, s) => reps[plan[s][q]]);
      picks.forEach((r) => {
        r.reads++;
        r.g.classList.add('is-hot');
      });
      later(() => picks.forEach((r) => r.g.classList.remove('is-hot')), HOT_MS);
      render();
    });
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
      if (mode === 'shards') {
        statusEl.textContent = `Each shard has a single copy, so it served all ${QUERIES} reads on its own.`;
      } else {
        const split = replicas.map((reps) => `Shard ${reps[0].s}: ${reps[0].reads} and ${reps[1].reads}`).join(', ');
        statusEl.textContent = `The ${QUERIES} reads of each shard were shared by its 2 replicas (${split}).`;
      }
      render();
    }, (QUERIES - 1) * EVERY_MS + TRAVEL_MS + 400);
  }

  modeBtns.forEach((b) =>
    b.addEventListener('click', () => {
      if (b.dataset.mode === mode) return;
      mode = b.dataset.mode;
      place();
      reset();
    }),
  );
  startBtn.addEventListener('click', start);

  place();
  reset();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
