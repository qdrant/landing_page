/*
 * read-consistency island.
 *
 * Picks up where the concurrent-writes island ends: after two concurrent
 * writes with weak ordering, the three replicas of the shard disagree about
 * one point (Peer 1 holds red, Peers 2 and 3 hold blue). A reader reads that
 * point. Each Read sends the request down to the replica(s) it asks; their
 * answers travel back as colored squares and land in the results strip.
 *
 *   consistency=1         each read asks one replica (cycled), so the answer
 *                         depends on which peer it hits.
 *   consistency=majority  each read asks all replicas and returns the value
 *                         most of them hold, so every read gives one answer.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss), same
 * visual language as the concurrent-writes island.
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox 760 x 292), matching the write-consistency-factor island.
const VB_W = 760;
const VB_H = 292;
const BOX = { y: 112, w: 200, h: 172 }; // node frame
const BOX_X = [38, 280, 522];
const CX = BOX_X.map((x) => x + BOX.w / 2);
const SHARD = { dx: 12, dy: 36, w: 176, h: 100 };
const BARS = 12;
const BAR = { pad: 12, dy: 34, h: 44 };
const READER = { x: CX[1], y: 34, w: 120, h: 40 };
const JUNCTION_Y = 80;

const VALUES = ['b', 'a', 'a']; // what each replica holds for the point
const NAME = { a: 'blue', b: 'red' };
const word = (k) => `<b class="qi-rc__t--${k}">${NAME[k]}</b>`;

const READ_SEQ = [0, 1, 0, 2, 1, 2]; // replica asked by successive single reads
const SLOTS = 6;
const REQUEST_MS = 700;
const ANSWER_MS = 1300;
const TOKEN = 12;

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

// Wire from the reader down to a node, with rounded corners.
function drop(x) {
  const start = READER.y + READER.h / 2;
  const end = BOX.y - 6;
  if (x === READER.x) return `M ${x} ${start} V ${end}`;
  const d = x > READER.x ? 1 : -1;
  return `M ${READER.x} ${start} V ${JUNCTION_Y - 12} Q ${READER.x} ${JUNCTION_Y} ${READER.x + d * 12} ${JUNCTION_Y} H ${x - d * 12} Q ${x} ${JUNCTION_Y} ${x} ${JUNCTION_Y + 12} V ${end}`;
}

export function mount(node) {
  node.classList.add('qi-rc');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-read>',
    '        <svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20"/></svg>Read',
    '      </button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-rc__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"`,
    '    aria-label="A reader reads a point from three replicas that disagree: Peer 1 holds red, Peers 2 and 3 hold blue. It asks one replica or all of them, depending on the read consistency.">',
    '    <defs>',
    '      <marker id="qi-rc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">',
    '        <path class="qi-rc__arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    '    <g class="qi-rc__boxes"></g>',
    '    <g class="qi-rc__wires"></g>',
    `    <rect class="qi-rc__reader" x="${READER.x - READER.w / 2}" y="${READER.y - READER.h / 2}" width="${READER.w}" height="${READER.h}" rx="6"/>`,
    `    <text class="qi-rc__reader-text" x="${READER.x}" y="${READER.y + 4}">Reader</text>`,
    `    <text class="qi-label" x="${READER.x + READER.w / 2 + 20}" y="${READER.y + 4}">returned</text>`,
    '    <g class="qi-rc__results"></g>',
    '    <g class="qi-rc__tokens"></g>',
    '  </svg>',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Read consistency">',
    '      <span class="qi-hint">Read consistency:</span>',
    '      <button type="button" class="qi-chip" data-consistency="one" aria-pressed="false">1</button>',
    '      <button type="button" class="qi-chip" data-consistency="majority" aria-pressed="false">majority</button>',
    '    </div>',
    '  </div>',
    '  <p class="qi-status qi-status--2 qi-rc__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-rc__svg');
  const boxesG = svg.querySelector('.qi-rc__boxes');
  const wiresG = svg.querySelector('.qi-rc__wires');
  const resultsG = svg.querySelector('.qi-rc__results');
  const tokensG = svg.querySelector('.qi-rc__tokens');
  const statusEl = node.querySelector('.qi-rc__status');
  const readBtn = node.querySelector('[data-read]');
  const consBtns = [...node.querySelectorAll('[data-consistency]')];

  // Nodes, each holding its shard replica with the disputed point last.
  const peers = CX.map((cx, i) => {
    const g = el('g', { class: 'qi-rc__peer' }, boxesG);
    const frame = el('rect', { class: 'qi-frame qi-rc__node', x: BOX_X[i], y: BOX.y, width: BOX.w, height: BOX.h, rx: 6 }, g);
    el('text', { class: 'qi-frame-label', x: BOX_X[i] + 14, y: BOX.y + 24 }, g).textContent = `Peer ${i + 1}`;
    const sx = BOX_X[i] + SHARD.dx;
    const sy = BOX.y + SHARD.dy;
    el('rect', { class: 'qi-rc__shard', x: sx, y: sy, width: SHARD.w, height: SHARD.h, rx: 6 }, g);
    el('text', { class: 'qi-label qi-label--strong', x: cx, y: sy + 22, 'text-anchor': 'middle' }, g).textContent = 'Shard replica';
    const slot = (SHARD.w - 2 * BAR.pad) / BARS;
    const bw = slot * 0.52;
    for (let j = 0; j < BARS; j++) {
      const last = j === BARS - 1;
      el('rect', { class: `qi-rc__bar${last ? ` qi-rc__point--${VALUES[i]}` : ''}`, x: sx + BAR.pad + j * slot + (slot - bw) / 2, y: sy + BAR.dy, width: bw, height: BAR.h, rx: 2 }, g);
    }
    const note = el('text', { class: 'qi-label', x: cx, y: BOX.y + BOX.h - 16, 'text-anchor': 'middle' }, g);
    el('tspan', {}, note).textContent = 'holds ';
    el('tspan', { class: `qi-rc__log--${VALUES[i]}` }, note).textContent = NAME[VALUES[i]];
    const wire = el('path', { class: 'qi-rc__wire', d: drop(cx), 'marker-end': 'url(#qi-rc-arrow)' }, wiresG);
    return { i, frame, wire };
  });

  const results = [];
  for (let k = 0; k < SLOTS; k++) {
    results.push(el('rect', { class: 'qi-rc__result', x: READER.x + READER.w / 2 + 100 + k * 22, y: READER.y - 8, width: 16, height: 16, rx: 3 }, resultsG));
  }

  let consistency = 'one';
  let reads = [];
  let readN = 0;
  let running = false;
  let timers = [];
  let gen = 0;
  const later = (fn, ms) => timers.push(window.setTimeout(fn, reduced ? 0 : ms));

  function render() {
    consBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.consistency === consistency)));
    readBtn.disabled = running;
    results.forEach((r, k) => r.setAttribute('class', `qi-rc__result${reads[k] ? ` qi-rc__result--${reads[k]}` : ''}`));
  }

  function reset() {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
    gen++;
    running = false;
    reads = [];
    readN = 0;
    tokensG.innerHTML = '';
    peers.forEach((p) => {
      p.wire.classList.remove('is-on');
      p.frame.classList.remove('is-hot');
    });
    statusEl.innerHTML =
      consistency === 'one'
        ? `After two concurrent writes, the replicas disagree: Peer 1 holds ${word('b')}, Peers 2 and 3 hold ${word('a')}. Press Read a few times.`
        : `With <code>consistency=majority</code>, every read asks all 3 replicas. Press Read a few times.`;
    render();
  }

  // Send one answer from a peer back up its wire to the reader.
  function answer(p, myGen, onArrive) {
    const path = p.wire;
    const len = path.getTotalLength();
    const tok = el('rect', { class: `qi-rc__token qi-rc__point--${VALUES[p.i]}`, width: TOKEN, height: TOKEN, rx: 2 }, tokensG);
    const place = (f) => {
      const pt = path.getPointAtLength(len * (1 - f));
      tok.setAttribute('x', pt.x - TOKEN / 2);
      tok.setAttribute('y', pt.y - TOKEN / 2);
    };
    const t0 = performance.now();
    const frame = (now) => {
      if (myGen !== gen) return;
      const f = reduced ? 1 : Math.min(1, (now - t0) / ANSWER_MS);
      place(f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2);
      if (f < 1) return requestAnimationFrame(frame);
      tok.remove();
      onArrive();
    };
    place(0);
    requestAnimationFrame(frame);
  }

  function read() {
    if (running) return;
    running = true;
    render();
    const myGen = gen;
    const asked = consistency === 'majority' ? peers : [peers[READ_SEQ[readN % READ_SEQ.length]]];
    readN++;
    asked.forEach((p) => {
      p.wire.classList.add('is-on');
      p.frame.classList.add('is-hot');
    });
    statusEl.innerHTML =
      asked.length === 1 ? `The read asks Peer ${asked[0].i + 1}…` : 'The read asks all 3 replicas and waits for their answers…';

    later(() => {
      if (myGen !== gen) return;
      let pending = asked.length;
      asked.forEach((p) =>
        answer(p, myGen, () => {
          if (--pending) return;
          const counts = {};
          asked.forEach((q) => (counts[VALUES[q.i]] = (counts[VALUES[q.i]] || 0) + 1));
          const k = Object.keys(counts).sort((x, y) => counts[y] - counts[x])[0];
          reads.push(k);
          if (reads.length > SLOTS) reads.shift();
          statusEl.innerHTML =
            asked.length === 1
              ? `Peer ${asked[0].i + 1} answered ${word(k)}. A read from one replica returns red or blue, depending on which peer it asks.`
              : `2 replicas answered ${word('a')} and 1 answered ${word('b')}, so the read returns ${word(k)}. Every <code>majority</code> read gives the same answer.`;
          peers.forEach((q) => {
            q.wire.classList.remove('is-on');
            q.frame.classList.remove('is-hot');
          });
          running = false;
          render();
        }),
      );
    }, REQUEST_MS);
  }

  readBtn.addEventListener('click', read);
  consBtns.forEach((b) =>
    b.addEventListener('click', () => {
      if (consistency === b.dataset.consistency) return;
      consistency = b.dataset.consistency;
      reset();
    }),
  );

  reset();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
