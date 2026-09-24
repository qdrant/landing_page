/*
 * concurrent-writes island: interactive replacement for
 * concurrent-operations-replicas.png.
 *
 * Two clients update the same point at the same moment: Client A writes blue,
 * Client B writes red. The shard has three replicas, each drawn as a box with
 * the point's current value. A reader client below keeps reading the point.
 *
 * Two independent settings, as chips under the diagram:
 *   Write ordering  weak    each client's write lands on the peer it reached
 *                           and is forwarded from there, so replicas can apply
 *                           the two writes in different orders and disagree.
 *                   strong  both writes go through the leader (Peer 2), which
 *                           applies and replicates them in one order.
 *   Read consistency  1         each read asks one replica (cycled).
 *                     majority  each read asks all replicas and returns the
 *                               value most of them hold.
 *
 * "Concurrent writes" plays the race; afterwards the reader makes a few reads
 * on its own and the results fill a strip next to it.
 * Pure SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox 760 x 360).
const VB_W = 760;
const VB_H = 360;
const FRAME = { x: 2, y: 84, w: 756, h: 176 };
const BOX = { y: 122, w: 200, h: 118 };
const BOX_X = [38, 280, 522];
const CX = BOX_X.map((x) => x + BOX.w / 2);
const SQ = 44;
const DIA = { hw: 46, hh: 26 };
const TOP_Y = 34; // writer diamonds
const READER = { x: CX[1], y: 332 };
const JUNCTION_Y = 282;

const NAME = { w: 'white', a: 'blue', b: 'red' };
const word = (k) => `<b class="qi-cw__t--${k}">${NAME[k]}</b>`;

// Write races as moving values. Each move carries one client's value along
// a route; `to` is the replica that applies it on arrival. Routes: w0 / w1
// are Client A's and Client B's write wires, g12 / g23 the links across the
// gaps between neighboring replicas, top the link from Peer 1 to Peer 3 over
// Peer 2. `rev` runs a route backwards.
const RACES = {
  weak: [
    { route: 'w0', k: 'a', start: 0, to: 0 },
    { route: 'w1', k: 'b', start: 0, to: 2 },
    { route: 'g23', rev: true, k: 'b', start: 650, to: 1 },
    { route: 'g12', k: 'a', start: 900, to: 1 },
    { route: 'top', k: 'a', start: 650, to: 2 },
    { route: 'top', rev: true, k: 'b', start: 650, to: 0 },
  ],
  strong: [
    { route: 'w0', k: 'a', start: 0, to: 1 },
    { route: 'w1', k: 'b', start: 200, to: 1 },
    { route: 'g12', rev: true, k: 'a', start: 1150, to: 0 },
    { route: 'g23', k: 'a', start: 1150, to: 2 },
    { route: 'g12', rev: true, k: 'b', start: 1500, to: 0 },
    { route: 'g23', k: 'b', start: 1500, to: 2 },
  ],
};
const moveMs = (len) => 380 + len * 1.4;
const TOKEN = 12;
const LEADER = 1;

// Single-replica reads cycle through the peers in this order.
const READ_SEQ = [0, 1, 0, 2, 1, 0];
const READS = 6;
const READ_EVERY = 1100;
const READ_LIT = 600;

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}
const diamond = (x, y) => `${x},${y - DIA.hh} ${x + DIA.hw},${y} ${x},${y + DIA.hh} ${x - DIA.hw},${y}`;

// Read riser from the junction up to a replica box, with a rounded corner.
function riser(x) {
  const top = BOX.y + BOX.h + 6;
  if (x === READER.x) return `M ${x} ${JUNCTION_Y} V ${top}`;
  const d = x > READER.x ? 1 : -1;
  return `M ${READER.x} ${JUNCTION_Y} H ${x - d * 12} Q ${x} ${JUNCTION_Y} ${x} ${JUNCTION_Y - 12} V ${top}`;
}

export function mount(node) {
  node.classList.add('qi-cw');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-go>',
    '        <svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20"/></svg>Concurrent writes',
    '      </button>',
    '      <button type="button" class="qi-chip" data-reset hidden>',
    '        <svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Reset',
    '      </button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-cw__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"`,
    '    aria-label="Client A writes blue and Client B writes red to the same point, stored on three replicas. A reader client reads the point from one or all replicas.">',
    '    <defs>',
    ['a', 'b', 'r']
      .map(
        (k) =>
          `<marker id="qi-cw-arrow-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">` +
          `<path class="qi-cw__arrowhead qi-cw__arrowhead--${k}" d="M 0 0 L 10 5 L 0 10 z"/></marker>`,
      )
      .join(''),
    '    </defs>',
    `    <rect class="qi-frame" x="${FRAME.x}" y="${FRAME.y}" width="${FRAME.w}" height="${FRAME.h}" rx="6"/>`,
    `    <text class="qi-frame-label" x="${FRAME.x + 16}" y="${FRAME.y + 22}">Shard</text>`,
    '    <g class="qi-cw__boxes"></g>',
    '    <g class="qi-cw__links"></g>',
    '    <g class="qi-cw__wires"></g>',
    '    <g class="qi-cw__risers"></g>',
    `    <path class="qi-cw__wire qi-cw__wire--r is-on" d="M ${READER.x} ${READER.y - DIA.hh} V ${JUNCTION_Y}"/>`,
    `    <text class="qi-cw__wire-text" x="${READER.x - 8}" y="${JUNCTION_Y + 20}" text-anchor="end">Reads</text>`,
    `    <polygon class="qi-cw__client qi-cw__client--a" points="${diamond(CX[0], TOP_Y)}"/>`,
    `    <text class="qi-cw__client-text qi-cw__client-text--a" x="${CX[0]}" y="${TOP_Y + 4}">Client A</text>`,
    `    <polygon class="qi-cw__client qi-cw__client--b" points="${diamond(CX[2], TOP_Y)}"/>`,
    `    <text class="qi-cw__client-text qi-cw__client-text--b" x="${CX[2]}" y="${TOP_Y + 4}">Client B</text>`,
    `    <polygon class="qi-cw__client qi-cw__client--r" points="${diamond(READER.x, READER.y)}"/>`,
    `    <text class="qi-cw__client-text qi-cw__client-text--r" x="${READER.x}" y="${READER.y + 4}">Reader</text>`,
    `    <text class="qi-label" x="${READER.x + 70}" y="${READER.y + 4}">returned</text>`,
    '    <g class="qi-cw__results"></g>',
    '    <g class="qi-cw__tokens"></g>',
    '  </svg>',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Write ordering">',
    '      <span class="qi-hint">Write ordering:</span>',
    '      <button type="button" class="qi-chip" data-ordering="weak" aria-pressed="false">weak</button>',
    '      <button type="button" class="qi-chip" data-ordering="strong" aria-pressed="false">strong</button>',
    '    </div>',
    '    <div class="qi-group" role="group" aria-label="Read consistency">',
    '      <span class="qi-hint">Read consistency:</span>',
    '      <button type="button" class="qi-chip" data-consistency="one" aria-pressed="false">1</button>',
    '      <button type="button" class="qi-chip" data-consistency="majority" aria-pressed="false">majority</button>',
    '    </div>',
    '  </div>',
    '  <p class="qi-status qi-status--2 qi-cw__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-cw__svg');
  const boxesG = svg.querySelector('.qi-cw__boxes');
  const wiresG = svg.querySelector('.qi-cw__wires');
  const risersG = svg.querySelector('.qi-cw__risers');
  const resultsG = svg.querySelector('.qi-cw__results');
  const linksG = svg.querySelector('.qi-cw__links');
  const tokensG = svg.querySelector('.qi-cw__tokens');
  const statusEl = node.querySelector('.qi-cw__status');
  const goBtn = node.querySelector('[data-go]');
  const resetBtn = node.querySelector('[data-reset]');
  const orderBtns = [...node.querySelectorAll('[data-ordering]')];
  const consBtns = [...node.querySelectorAll('[data-consistency]')];

  // Replica boxes.
  const peers = CX.map((cx, i) => {
    const g = el('g', { class: 'qi-cw__peer' }, boxesG);
    const box = el('rect', { class: 'qi-cw__box', x: BOX_X[i], y: BOX.y, width: BOX.w, height: BOX.h, rx: 6 }, g);
    const title = el('text', { class: 'qi-title', x: cx, y: BOX.y + 24, 'text-anchor': 'middle' }, g);
    const sq = el('rect', { class: 'qi-cw__point', x: cx - SQ / 2, y: BOX.y + 36, width: SQ, height: SQ, rx: 4 }, g);
    const log = el('text', { class: 'qi-label', x: cx, y: BOX.y + BOX.h - 12, 'text-anchor': 'middle' }, g);
    return { i, cx, box, title, sq, log, value: 'w', applied: [] };
  });

  // Write wires. Weak: straight down to the peer each client reached.
  // Strong: both bend into the leader.
  const wire = (k, d) => el('path', { class: `qi-cw__wire qi-cw__wire--${k}`, d, 'marker-end': `url(#qi-cw-arrow-${k})` }, wiresG);
  const into = BOX.y - 6;
  const WIRES = {
    weak: [wire('a', `M ${CX[0]} ${TOP_Y + DIA.hh} V ${into}`), wire('b', `M ${CX[2]} ${TOP_Y + DIA.hh} V ${into}`)],
    strong: [
      wire('a', `M ${CX[0] + DIA.hw} ${TOP_Y} H ${CX[1] - 22} Q ${CX[1] - 10} ${TOP_Y} ${CX[1] - 10} ${TOP_Y + 12} V ${into}`),
      wire('b', `M ${CX[2] - DIA.hw} ${TOP_Y} H ${CX[1] + 22} Q ${CX[1] + 10} ${TOP_Y} ${CX[1] + 10} ${TOP_Y + 12} V ${into}`),
    ],
  };
  const risers = CX.map((x) => el('path', { class: 'qi-cw__wire qi-cw__wire--r qi-cw__riser', d: riser(x), 'marker-end': 'url(#qi-cw-arrow-r)' }, risersG));

  // Replication links between replicas, shown only while a value travels.
  const midY = BOX.y + 36 + SQ / 2;
  const topY = FRAME.y + 20;
  const L = (d) => el('path', { class: 'qi-cw__link', d }, linksG);
  const LINKS = {
    g12: L(`M ${BOX_X[0] + BOX.w} ${midY} H ${BOX_X[1]}`),
    g23: L(`M ${BOX_X[1] + BOX.w} ${midY} H ${BOX_X[2]}`),
    top: L(`M ${CX[0] + 34} ${BOX.y} V ${topY + 12} Q ${CX[0] + 34} ${topY} ${CX[0] + 46} ${topY} H ${CX[2] - 46} Q ${CX[2] - 34} ${topY} ${CX[2] - 34} ${topY + 12} V ${BOX.y}`),
  };
  const routeEl = (name) => (name === 'w0' ? WIRES[ordering][0] : name === 'w1' ? WIRES[ordering][1] : LINKS[name]);

  // Read results strip.
  const results = [];
  for (let k = 0; k < READS; k++) {
    results.push(el('rect', { class: 'qi-cw__result', x: READER.x + 140 + k * 22, y: READER.y - 8, width: 16, height: 16, rx: 3 }, resultsG));
  }

  // --- State ----------------------------------------------------------------
  let ordering = 'weak';
  let consistency = 'one';
  let phase = 'idle'; // idle | writing | written
  let timers = [];
  let gen = 0; // bumps on reset; stale token animations stop themselves
  let reads = [];
  const later = (fn, ms) => timers.push(window.setTimeout(fn, reduced ? 0 : ms));
  const clearTimers = () => {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
  };

  function setPoint(p, k) {
    p.value = k;
    p.sq.setAttribute('class', `qi-cw__point qi-cw__point--${k}`);
  }

  function drawLog(p) {
    p.log.textContent = '';
    p.applied.forEach((k, j) => {
      if (j) el('tspan', {}, p.log).textContent = ', then ';
      el('tspan', { class: `qi-cw__log--${k}` }, p.log).textContent = NAME[k];
    });
  }

  function summary() {
    const v = peers.map((p) => p.value);
    const agree = v.every((x) => x === v[0]);
    if (phase !== 'written') return '';
    if (agree) {
      return `Every replica applied ${word('a')}, then ${word('b')}, and holds ${word('b')}. ` +
        (consistency === 'one' ? 'Any single replica gives the same answer.' : 'The majority read returns it too.');
    }
    if (consistency === 'one') {
      return `Peer 1 ends ${word('b')}, Peers 2 and 3 end ${word('a')}. A read from one replica returns red or blue, depending on which peer answers.`;
    }
    return `The replicas still disagree, but a <code>majority</code> read asks all 3 and returns ${word('a')}, the value 2 of them hold.`;
  }

  function render() {
    orderBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ordering === ordering)));
    consBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.consistency === consistency)));
    peers.forEach((p) => {
      p.title.textContent = ordering === 'strong' && p.i === LEADER ? `Peer ${p.i + 1} (leader)` : `Peer ${p.i + 1}`;
    });
    goBtn.disabled = phase === 'writing';
    resetBtn.hidden = phase === 'idle';
    results.forEach((r, k) => r.setAttribute('class', `qi-cw__result${reads[k] ? ` qi-cw__result--${reads[k]}` : ''}`));
  }

  function reset() {
    clearTimers();
    phase = 'idle';
    reads = [];
    peers.forEach((p) => {
      p.value = 'w';
      p.applied = [];
      p.sq.setAttribute('class', 'qi-cw__point qi-cw__point--w');
      p.box.classList.remove('is-hot');
      drawLog(p);
    });
    Object.values(WIRES).flat().forEach((w) => w.classList.remove('is-on'));
    risers.forEach((r) => r.classList.remove('is-on'));
    Object.values(LINKS).forEach((l) => l.classList.remove('is-on'));
    tokensG.innerHTML = '';
    gen++;
    statusEl.innerHTML =
      ordering === 'weak'
        ? `Client A writes ${word('a')} and Client B writes ${word('b')} to the same point at the same time. Press Concurrent writes.`
        : `With <code>ordering=strong</code>, both writes go through the leader, Peer 2. Press Concurrent writes.`;
    render();
  }

  // The reader makes READS reads, one every READ_EVERY ms.
  function startReads() {
    reads = [];
    render();
    for (let n = 0; n < READS; n++) {
      later(() => {
        const targets = consistency === 'majority' ? [0, 1, 2] : [READ_SEQ[n % READ_SEQ.length]];
        targets.forEach((i) => {
          risers[i].classList.add('is-on');
          peers[i].box.classList.add('is-hot');
        });
        let k;
        if (targets.length === 1) {
          k = peers[targets[0]].value;
        } else {
          const counts = {};
          peers.forEach((p) => (counts[p.value] = (counts[p.value] || 0) + 1));
          k = Object.keys(counts).sort((x, y) => counts[y] - counts[x])[0];
        }
        reads.push(k);
        render();
        later(() => {
          risers.forEach((r) => r.classList.remove('is-on'));
          peers.forEach((p) => p.box.classList.remove('is-hot'));
        }, READ_LIT);
      }, 300 + n * READ_EVERY);
    }
  }

  function go() {
    if (phase === 'writing') return;
    reset();
    phase = 'writing';
    render();
    WIRES[ordering].forEach((w) => w.classList.add('is-on'));
    statusEl.innerHTML =
      ordering === 'weak'
        ? 'Each peer applies the write from its own client first, then the one forwarded from the other peer…'
        : `The leader applies ${word('a')} first, then ${word('b')}, and replicates both in that order…`;
    const myGen = gen;
    const active = {};
    let endAt = 0;
    RACES[ordering].forEach((m) => {
      const path = routeEl(m.route);
      const len = path.getTotalLength();
      const dur = reduced ? 0 : moveMs(len);
      endAt = Math.max(endAt, m.start + dur);
      later(() => {
        if (myGen !== gen) return;
        active[m.route] = (active[m.route] || 0) + 1;
        path.classList.add('is-on');
        const tok = el('rect', { class: `qi-cw__token qi-cw__point--${m.k}`, width: TOKEN, height: TOKEN, rx: 2 }, tokensG);
        const t0 = performance.now();
        const place = (f) => {
          const pt = path.getPointAtLength(len * (m.rev ? 1 - f : f));
          tok.setAttribute('x', pt.x - TOKEN / 2);
          tok.setAttribute('y', pt.y - TOKEN / 2);
        };
        const frame = (now) => {
          if (myGen !== gen) return;
          const f = dur ? Math.min(1, (now - t0) / dur) : 1;
          place(f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2);
          if (f < 1) return requestAnimationFrame(frame);
          tok.remove();
          const p = peers[m.to];
          p.applied.push(m.k);
          setPoint(p, m.k);
          drawLog(p);
          if (--active[m.route] === 0 && m.route in LINKS) path.classList.remove('is-on');
        };
        place(0);
        requestAnimationFrame(frame);
      }, m.start);
    });
    later(() => {
      Object.values(WIRES).flat().forEach((w) => w.classList.remove('is-on'));
      phase = 'written';
      statusEl.innerHTML = summary();
      render();
      startReads();
    }, endAt + 250);
  }

  goBtn.addEventListener('click', go);
  resetBtn.addEventListener('click', reset);
  orderBtns.forEach((b) =>
    b.addEventListener('click', () => {
      if (ordering === b.dataset.ordering) return;
      ordering = b.dataset.ordering;
      reset();
    }),
  );
  consBtns.forEach((b) =>
    b.addEventListener('click', () => {
      if (consistency === b.dataset.consistency) return;
      consistency = b.dataset.consistency;
      if (phase === 'written') {
        clearTimers();
        risers.forEach((r) => r.classList.remove('is-on'));
        peers.forEach((p) => p.box.classList.remove('is-hot'));
        statusEl.innerHTML = summary();
        startReads();
      }
      render();
    }),
  );

  reset();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
