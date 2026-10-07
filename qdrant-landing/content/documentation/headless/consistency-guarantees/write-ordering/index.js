/*
 * write-ordering island.
 *
 * The same race as the concurrent-writes island (Client A writes blue, Client
 * B writes red, to the same point on three nodes), with a write `ordering`
 * switch to compare the outcomes:
 *
 *   weak    each client's write lands on the peer it reached and is forwarded
 *           from there, so replicas can apply the two writes in different
 *           orders and disagree.
 *   strong  both writes go through the leader (Peer 2), which applies them in
 *           one order and replicates them in that order, so every replica
 *           ends the same.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox 760 x 292).
const VB_W = 760;
const VB_H = 292;
const BOX = { y: 84, w: 200, h: 176 }; // node frame
const BOX_X = [38, 280, 522];
const CX = BOX_X.map((x) => x + BOX.w / 2);
const SHARD = { dx: 12, dy: 36, w: 176, h: 100 };
const BARS = 12;
const BAR = { pad: 12, dy: 34, h: 44 };
const CLIENT = { w: 120, h: 40, y: 34 }; // client rectangles, centered on y
const LEADER = 1;

const NAME = { a: 'blue', b: 'red' };
const word = (k) => `<b class="qi-wo__t--${k}">${NAME[k]}</b>`;

// Each race is a list of moves: one value (k) carried along a route, applied
// by peer `to` on arrival. Routes: w0 / w1 are Client A's and Client B's
// write wires, g12 / g23 the links across the gaps between neighboring
// nodes, far the link from Peer 1 to Peer 3 under Peer 2. `rev` runs a route
// backwards. `say` lines narrate the race as it unfolds.
const RACES = {
  weak: {
    moves: [
      { route: 'w0', k: 'a', start: 0, to: 0 },
      { route: 'w1', k: 'b', start: 0, to: 2 },
      { route: 'g23', rev: true, k: 'b', start: 1700, to: 1 },
      { route: 'g12', k: 'a', start: 2200, to: 1 },
      { route: 'far', k: 'a', start: 1700, to: 2 },
      { route: 'far', rev: true, k: 'b', start: 1700, to: 0 },
    ],
    say: [
      { at: 0, msg: `Client A's ${word('a')} reaches Peer 1 and Client B's ${word('b')} reaches Peer 3 at the same time.` },
      { at: 1700, msg: `Each peer forwards the write it received to the other two. They arrive in a different order on each peer…` },
    ],
    done: `Peer 1 applied ${word('a')}, then ${word('b')}. Peers 2 and 3 applied ${word('b')}, then ${word('a')}. The replicas now disagree.`,
  },
  strong: {
    moves: [
      { route: 'w0', k: 'a', start: 0, to: 1 },
      { route: 'w1', k: 'b', start: 450, to: 1 },
      { route: 'g12', rev: true, k: 'a', start: 2900, to: 0 },
      { route: 'g23', k: 'a', start: 2900, to: 2 },
      { route: 'g12', rev: true, k: 'b', start: 3900, to: 0 },
      { route: 'g23', k: 'b', start: 3900, to: 2 },
    ],
    say: [
      { at: 0, msg: `With <code>ordering=strong</code>, both writes go to the leader, Peer 2. ${word('a')} arrives first, then ${word('b')}.` },
      { at: 2900, msg: `The leader replicates the writes to Peers 1 and 3 in the order it applied them: ${word('a')}, then ${word('b')}…` },
    ],
    done: `Every replica applied ${word('a')}, then ${word('b')}, and holds ${word('b')}. The replicas agree.`,
  },
};
const moveMs = (len) => 800 + len * 2.6;
const TOKEN = 12;

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

export function mount(node) {
  node.classList.add('qi-wo');
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
    `  <svg class="qi-svg qi-wo__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"`,
    '    aria-label="Client A writes blue and Client B writes red to the same point, which is stored on three nodes. With strong ordering, both writes go through the leader, which replicates them in one order.">',
    '    <defs>',
    ['a', 'b']
      .map(
        (k) =>
          `<marker id="qi-wo-arrow-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">` +
          `<path class="qi-wo__arrowhead qi-wo__arrowhead--${k}" d="M 0 0 L 10 5 L 0 10 z"/></marker>`,
      )
      .join(''),
    '    </defs>',
    '    <g class="qi-wo__boxes"></g>',
    '    <g class="qi-wo__links"></g>',
    '    <g class="qi-wo__wires"></g>',
    ...['a', 'b'].map((k, j) => {
      const cx = CX[j * 2];
      return (
        `    <rect class="qi-wo__client qi-wo__client--${k}" x="${cx - CLIENT.w / 2}" y="${CLIENT.y - CLIENT.h / 2}" width="${CLIENT.w}" height="${CLIENT.h}" rx="6"/>` +
        `<text class="qi-wo__client-text qi-wo__client-text--${k}" x="${cx}" y="${CLIENT.y + 4}">Client ${k.toUpperCase()}</text>`
      );
    }),
    '    <g class="qi-wo__tokens"></g>',
    '  </svg>',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Write ordering">',
    '      <span class="qi-hint">Write ordering:</span>',
    '      <button type="button" class="qi-chip" data-ordering="weak" aria-pressed="false">weak</button>',
    '      <button type="button" class="qi-chip" data-ordering="strong" aria-pressed="false">strong</button>',
    '    </div>',
    '  </div>',
    '  <p class="qi-status qi-status--2 qi-wo__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-wo__svg');
  const boxesG = svg.querySelector('.qi-wo__boxes');
  const wiresG = svg.querySelector('.qi-wo__wires');
  const linksG = svg.querySelector('.qi-wo__links');
  const tokensG = svg.querySelector('.qi-wo__tokens');
  const statusEl = node.querySelector('.qi-wo__status');
  const goBtn = node.querySelector('[data-go]');
  const resetBtn = node.querySelector('[data-reset]');
  const orderBtns = [...node.querySelectorAll('[data-ordering]')];

  // Nodes, each holding its shard replica.
  const peers = CX.map((cx, i) => {
    const g = el('g', { class: 'qi-wo__peer' }, boxesG);
    el('rect', { class: 'qi-frame qi-wo__node', x: BOX_X[i], y: BOX.y, width: BOX.w, height: BOX.h, rx: 6 }, g);
    const title = el('text', { class: 'qi-frame-label', x: BOX_X[i] + 14, y: BOX.y + 24 }, g);
    const sx = BOX_X[i] + SHARD.dx;
    const sy = BOX.y + SHARD.dy;
    el('rect', { class: 'qi-wo__shard', x: sx, y: sy, width: SHARD.w, height: SHARD.h, rx: 6 }, g);
    el('text', { class: 'qi-label qi-label--strong', x: cx, y: sy + 22, 'text-anchor': 'middle' }, g).textContent = 'Shard replica';
    const slot = (SHARD.w - 2 * BAR.pad) / BARS;
    const bw = slot * 0.52;
    let point;
    for (let j = 0; j < BARS; j++) {
      const bar = el('rect', { class: 'qi-wo__bar', x: sx + BAR.pad + j * slot + (slot - bw) / 2, y: sy + BAR.dy, width: bw, height: BAR.h, rx: 2 }, g);
      if (j === BARS - 1) point = bar;
    }
    const log = el('text', { class: 'qi-label', x: cx, y: BOX.y + BOX.h - 16, 'text-anchor': 'middle' }, g);
    return { i, cx, title, point, log, applied: [] };
  });

  // Write wires. Weak: straight down to the peer each client reached.
  // Strong: both bend into the leader.
  const wire = (k, d) => el('path', { class: `qi-wo__wire qi-wo__wire--${k}`, d, 'marker-end': `url(#qi-wo-arrow-${k})` }, wiresG);
  const into = BOX.y - 6;
  const below = CLIENT.y + CLIENT.h / 2;
  const WIRES = {
    weak: [wire('a', `M ${CX[0]} ${below} V ${into}`), wire('b', `M ${CX[2]} ${below} V ${into}`)],
    strong: [
      wire('a', `M ${CX[0] + CLIENT.w / 2} ${CLIENT.y} H ${CX[1] - 22} Q ${CX[1] - 10} ${CLIENT.y} ${CX[1] - 10} ${CLIENT.y + 12} V ${into}`),
      wire('b', `M ${CX[2] - CLIENT.w / 2} ${CLIENT.y} H ${CX[1] + 22} Q ${CX[1] + 10} ${CLIENT.y} ${CX[1] + 10} ${CLIENT.y + 12} V ${into}`),
    ],
  };

  // Replication links between nodes, shown only while a value travels.
  const midY = BOX.y + SHARD.dy + BAR.dy + BAR.h / 2;
  const nodeBot = BOX.y + BOX.h;
  const farY = nodeBot + 18;
  const L = (d) => el('path', { class: 'qi-wo__link', d }, linksG);
  const LINKS = {
    g12: L(`M ${BOX_X[0] + BOX.w} ${midY} H ${BOX_X[1]}`),
    g23: L(`M ${BOX_X[1] + BOX.w} ${midY} H ${BOX_X[2]}`),
    far: L(`M ${CX[0] + 40} ${nodeBot} V ${farY - 8} Q ${CX[0] + 40} ${farY} ${CX[0] + 48} ${farY} H ${CX[2] - 48} Q ${CX[2] - 40} ${farY} ${CX[2] - 40} ${farY - 8} V ${nodeBot}`),
  };
  let ordering = 'strong';
  const routeEl = (name) => (name === 'w0' ? WIRES[ordering][0] : name === 'w1' ? WIRES[ordering][1] : LINKS[name]);

  // --- State ----------------------------------------------------------------
  let phase = 'idle'; // idle | writing | written
  let timers = [];
  let gen = 0; // bumps on reset; stale token animations stop themselves
  const later = (fn, ms) => timers.push(window.setTimeout(fn, reduced ? 0 : ms));

  function drawLog(p) {
    p.log.textContent = '';
    p.applied.forEach((k, j) => {
      if (j) el('tspan', {}, p.log).textContent = ', then ';
      el('tspan', { class: `qi-wo__log--${k}` }, p.log).textContent = NAME[k];
    });
  }

  function render() {
    orderBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ordering === ordering)));
    peers.forEach((p) => {
      p.title.textContent = ordering === 'strong' && p.i === LEADER ? `Peer ${p.i + 1} (leader)` : `Peer ${p.i + 1}`;
    });
    goBtn.disabled = phase === 'writing';
    resetBtn.hidden = phase === 'idle';
  }

  function reset() {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
    gen++;
    phase = 'idle';
    peers.forEach((p) => {
      p.applied = [];
      p.point.setAttribute('class', 'qi-wo__bar');
      drawLog(p);
    });
    Object.values(WIRES).flat().forEach((w) => w.classList.remove('is-on'));
    Object.values(LINKS).forEach((l) => l.classList.remove('is-on'));
    tokensG.innerHTML = '';
    statusEl.innerHTML =
      ordering === 'weak'
        ? `With the default <code>ordering=weak</code>, the writes can reach the replicas in different orders. Press Concurrent writes.`
        : `With <code>ordering=strong</code>, both writes go through the leader, Peer 2. Press Concurrent writes.`;
    render();
  }

  // Carry one value along a route; the target peer applies it on arrival.
  function runMove(m, myGen, active) {
    const path = routeEl(m.route);
    const len = path.getTotalLength();
    const dur = reduced ? 0 : moveMs(len);
    later(() => {
      if (myGen !== gen) return;
      active[m.route] = (active[m.route] || 0) + 1;
      path.classList.add('is-on');
      const tok = el('rect', { class: `qi-wo__token qi-wo__point--${m.k}`, width: TOKEN, height: TOKEN, rx: 2 }, tokensG);
      const place = (f) => {
        const pt = path.getPointAtLength(len * (m.rev ? 1 - f : f));
        tok.setAttribute('x', pt.x - TOKEN / 2);
        tok.setAttribute('y', pt.y - TOKEN / 2);
      };
      const t0 = performance.now();
      const frame = (now) => {
        if (myGen !== gen) return;
        const f = dur ? Math.min(1, (now - t0) / dur) : 1;
        place(f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2);
        if (f < 1) return requestAnimationFrame(frame);
        tok.remove();
        const p = peers[m.to];
        p.applied.push(m.k);
        p.point.setAttribute('class', `qi-wo__bar qi-wo__point--${m.k}`);
        drawLog(p);
        if (--active[m.route] === 0 && m.route in LINKS) path.classList.remove('is-on');
      };
      place(0);
      requestAnimationFrame(frame);
    }, m.start);
    return m.start + dur;
  }

  function go() {
    if (phase === 'writing') return;
    reset();
    phase = 'writing';
    render();
    const race = RACES[ordering];
    const myGen = gen;
    const active = {};
    WIRES[ordering].forEach((w) => w.classList.add('is-on'));
    race.say.forEach((s) => later(() => (statusEl.innerHTML = s.msg), s.at));
    const endAt = Math.max(...race.moves.map((m) => runMove(m, myGen, active)));
    later(() => {
      Object.values(WIRES).flat().forEach((w) => w.classList.remove('is-on'));
      phase = 'written';
      statusEl.innerHTML = race.done;
      render();
    }, endAt + 300);
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

  reset();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
