/*
 * replica-reads island: interactive replacement for replication.png on the
 * low-latency search page.
 *
 * A collection on a cluster with three peers, with two independent steppers:
 *
 *   shards              1 to 3. The collection is divided into this many
 *                       shards; shard s lives on peer s.
 *   replication_factor  1 to 3. Each shard has this many replicas; replica a
 *                       of shard s lives on peer (s + a) % 3, in row a (as in
 *                       the replication island on the horizontal scaling
 *                       page). At 3 shards and a factor of 2 this is the
 *                       page's example: 6 replicas, 2 on each peer.
 *
 * It starts with a single shard and a single replica. "Send queries" sends 6
 * queries to the cluster. Each query reads one replica of every shard, chosen
 * at random (but never all on one replica of a shard, so a short run still
 * shows the replicas sharing the reads); a counter next to each replica shows
 * how many reads it served. More shards: each query reads more shards, on
 * more peers. More replicas: each shard's reads are spread over more copies.
 * How a peer receives a query and fans it out is left out.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Shard
 * colors match the replication island.
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox -2 0 764 324).
const COLL = { x: 0, y: 2, w: 258, h: 44, chip: { x: 106, w: 44, h: 24, gap: 6 } };
const CLIENT = { x: 380, y: 24, w: 120, h: 40 };
const CLUSTER = { x: 0, y: 72, w: 760, h: 246 };
const NODE = { w: 228, h: 196, y: 108, pitch: 252, x0: 14 };
const BOX = { w: 150, h: 42, dx: 39, dy: 40, pitch: 50 };
const BARS = 6;
const BAR = { x: 84, slot: 10, w: 5.5, y: 11, h: 20 };
const VB_H = 324;

const MAX = 3; // shards and replicas: 1 to 3 on 3 peers
const QUERIES = 6;
const EVERY_MS = 1600; // between queries
const TRAVEL_MS = 800; // client to cluster
const HOT_MS = 1100;
const TOKEN = 10;

const nodeX = (n) => NODE.x0 + n * NODE.pitch;
// Replica a of shard s lives on peer (s + a) % 3, in row a.
const pos = (s, a) => ({ x: nodeX((s + a) % 3) + BOX.dx, y: NODE.y + BOX.dy + a * BOX.pitch });
const translate = ({ x, y }) => `translate(${x}px, ${y}px)`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

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

  // The collection, divided into its shards.
  el('rect', { class: 'qi-frame', x: COLL.x, y: COLL.y, width: COLL.w, height: COLL.h, rx: 6 }, collG);
  el('text', { class: 'qi-frame-label', x: COLL.x + 12, y: COLL.y + 27 }, collG).textContent = 'Collection';
  const chips = [];
  for (let s = 0; s < MAX; s++) {
    const cx = COLL.x + COLL.chip.x + s * (COLL.chip.w + COLL.chip.gap);
    const cy = COLL.y + (COLL.h - COLL.chip.h) / 2;
    const g = el('g', { class: 'qi-rr__chip-g' }, collG);
    el('rect', { class: `qi-rr__chip qi-rr__chip--${s}`, x: cx, y: cy, width: COLL.chip.w, height: COLL.chip.h, rx: 4 }, g);
    el('text', { class: 'qi-rr__chip-text', x: cx + COLL.chip.w / 2, y: cy + 16 }, g).textContent = `S${s}`;
    chips.push(g);
  }

  // The cluster and its peers.
  el('rect', { class: 'qi-rr__cluster', x: CLUSTER.x, y: CLUSTER.y, width: CLUSTER.w, height: CLUSTER.h, rx: 8 }, nodesG);
  el('text', { class: 'qi-frame-label', x: CLUSTER.x + 16, y: CLUSTER.y + 24 }, nodesG).textContent = 'Cluster';
  for (let n = 0; n < MAX; n++) {
    el('rect', { class: 'qi-frame', x: nodeX(n), y: NODE.y, width: NODE.w, height: NODE.h, rx: 6 }, nodesG);
    el('text', { class: 'qi-frame-label', x: nodeX(n) + 14, y: NODE.y + 24 }, nodesG).textContent = `Peer ${n + 1}`;
  }

  // replicas[s][a]: replica a of shard s. Hidden replicas wait, invisible, on
  // top of the shard's first replica, so adding one slides it out to its peer
  // and removing one slides it back. Later replicas are drawn underneath.
  const replicas = [];
  for (let s = 0; s < MAX; s++) {
    replicas.push([]);
    for (let a = 0; a < MAX; a++) {
      const g = el('g', { class: `qi-rr__shard qi-rr__shard--${s}` });
      g.style.transform = translate(pos(s, 0));
      el('rect', { class: 'qi-rr__box', width: BOX.w, height: BOX.h, rx: 6 }, g);
      el('text', { class: 'qi-label qi-label--strong', x: 12, y: 26 }, g).textContent = `Shard ${s}`;
      for (let i = 0; i < BARS; i++) el('rect', { class: 'qi-rr__bar', x: BAR.x + i * BAR.slot, y: BAR.y, width: BAR.w, height: BAR.h, rx: 1.5 }, g);
      const counter = el('text', { class: 'qi-label qi-label--strong qi-rr__reads', x: BOX.w + 10, y: 26 }, g);
      replicas[s].push({ s, a, g, counter, reads: 0 });
    }
  }
  for (let a = MAX - 1; a >= 0; a--) for (let s = 0; s < MAX; s++) shardsG.appendChild(replicas[s][a].g);

  let shards = 1;
  let rf = 1;
  let timers = [];
  let gen = 0;
  let sent = 0;
  let running = false;
  let plan = []; // plan[s][q]: which replica of shard s query q reads
  const later = (fn, ms) => timers.push(window.setTimeout(fn, reduced ? 0 : ms));
  const live = () => replicas.slice(0, shards).map((reps) => reps.slice(0, rf));

  function intro() {
    const peers = Math.min(3, shards + rf - 1);
    const what = `${plural(shards, 'shard')} with a replication factor of ${rf}: ${plural(shards * rf, 'replica')} on ${plural(peers, 'peer')}.`;
    const reads = shards === 1 ? 'Each query reads the shard' : `Each query reads all ${shards} shards`;
    const from =
      rf === 1
        ? shards === 1 ? ', from its only replica.' : ', each from its only replica.'
        : shards === 1 ? `, from one of its ${rf} replicas, chosen at random.` : `, each from one of its ${rf} replicas, chosen at random.`;
    return `${what} ${reads}${from}`;
  }

  function render() {
    shardVal.textContent = String(shards);
    rfVal.textContent = String(rf);
    shardBtns.forEach((b) => {
      const next = shards + Number(b.dataset.shards);
      b.disabled = next < 1 || next > MAX;
    });
    rfBtns.forEach((b) => {
      const next = rf + Number(b.dataset.rf);
      b.disabled = next < 1 || next > MAX;
    });
    chips.forEach((g, s) => g.classList.toggle('is-off', s >= shards));
    replicas.flat().forEach((r) => {
      r.counter.textContent = r.reads ? String(r.reads) : '';
    });
    countEl.textContent = sent ? `queries: ${sent} of ${QUERIES}` : '';
    startBtn.disabled = running;
  }

  // Show the replicas the current settings call for, sliding new ones out
  // from their shard's first replica and retired ones back into it.
  function place() {
    replicas.flat().forEach((r) => {
      const on = r.s < shards && r.a < rf;
      r.g.classList.toggle('is-on', on);
      r.g.style.transform = translate(pos(r.s, on ? r.a : 0));
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
      if (next >= 1 && next <= MAX) change(() => (shards = next));
    }),
  );
  rfBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const next = rf + Number(b.dataset.rf);
      if (next >= 1 && next <= MAX) change(() => (rf = next));
    }),
  );
  startBtn.addEventListener('click', start);

  place();
  reset();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
