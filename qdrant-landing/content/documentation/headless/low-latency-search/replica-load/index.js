/*
 * replica-load island: per-shard view of read load spreading.
 *
 * One shard on a three-node cluster, with a replication_factor stepper
 * (1 to 3). The shard has one replica per unit of the factor, on Node 1,
 * Node 2 and Node 3 in turn. A client sends 6 reads to the shard; they are
 * spread round-robin over its replicas, and a load bar on each node shows its
 * share: 6 on one node, 3 and 3 on two, 2, 2 and 2 on three (6 divides evenly
 * by every factor). Changing the factor reruns the reads.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Same
 * look as the replica-reads and replication islands.
 */

const NS = 'http://www.w3.org/2000/svg';

// Geometry (viewBox -2 0 764 240).
const NODE = { w: 230, h: 150, y: 86, pitch: 265 };
const BOX = { w: 150, h: 42, dx: 40, dy: 40 };
const BARS = 6;
const BAR = { x: 84, slot: 10, w: 5.5, y: 11, h: 20 };
const LOAD = { dx: 56, dy: 104, w: 134, h: 10 };
const CLIENT = { x: 380, y: 22, w: 120, h: 40 };
const JUNCTION_Y = 64;
const VB_H = 240;

const QUERIES = 6;
const EVERY_MS = 1400;
const TRAVEL_MS = 1200;
const TOKEN = 10;
const MAX_FACTOR = 3;

const nodeX = (n) => n * NODE.pitch;

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

function drop(n) {
  const x = nodeX(n) + NODE.w / 2;
  const start = CLIENT.y + CLIENT.h / 2;
  const end = NODE.y - 6;
  if (x === CLIENT.x) return `M ${x} ${start} V ${end}`;
  const d = x > CLIENT.x ? 1 : -1;
  return `M ${CLIENT.x} ${start} V ${JUNCTION_Y - 10} Q ${CLIENT.x} ${JUNCTION_Y} ${CLIENT.x + d * 10} ${JUNCTION_Y} H ${x - d * 10} Q ${x} ${JUNCTION_Y} ${x} ${JUNCTION_Y + 10} V ${end}`;
}

export function mount(node) {
  node.classList.add('qi-rl');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls qi-controls--split">',
    '    <div class="qi-group" role="group" aria-label="Replication factor">',
    '      <span class="qi-hint">replication_factor:</span>',
    '      <button type="button" class="qi-chip" data-step="-1" aria-label="Decrease the replication factor">−</button>',
    '      <b class="qi-rl__value" aria-live="polite"></b>',
    '      <button type="button" class="qi-chip" data-step="1" aria-label="Increase the replication factor">+</button>',
    '    </div>',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-start>',
    '        <svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20"/></svg>Start queries',
    '      </button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-rl__svg" viewBox="-2 0 764 ${VB_H}" role="img"`,
    '    aria-label="One shard on a three-node cluster. Raising the replication factor adds replicas on more nodes, and the reads of the shard spread evenly across them.">',
    '    <defs>',
    '      <marker id="qi-rl-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">',
    '        <path class="qi-rl__arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    '    <g class="qi-rl__nodes"></g>',
    '    <g class="qi-rl__wires"></g>',
    `    <rect class="qi-rl__client" x="${CLIENT.x - CLIENT.w / 2}" y="${CLIENT.y - CLIENT.h / 2}" width="${CLIENT.w}" height="${CLIENT.h}" rx="6"/>`,
    `    <text class="qi-rl__client-text" x="${CLIENT.x}" y="${CLIENT.y + 4}">Client</text>`,
    `    <text class="qi-label qi-rl__count" x="${CLIENT.x + CLIENT.w / 2 + 16}" y="${CLIENT.y + 4}"></text>`,
    '    <g class="qi-rl__tokens"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-rl__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-rl__svg');
  const nodesG = svg.querySelector('.qi-rl__nodes');
  const wiresG = svg.querySelector('.qi-rl__wires');
  const tokensG = svg.querySelector('.qi-rl__tokens');
  const countEl = svg.querySelector('.qi-rl__count');
  const statusEl = node.querySelector('.qi-rl__status');
  const valueEl = node.querySelector('.qi-rl__value');
  const stepBtns = [...node.querySelectorAll('[data-step]')];
  const startBtn = node.querySelector('[data-start]');

  // One slot per node: the replica (shown when the factor reaches it), an
  // empty placeholder otherwise, and the node's load bar.
  const slots = [0, 1, 2].map((n) => {
    const nx = nodeX(n);
    el('rect', { class: 'qi-frame', x: nx, y: NODE.y, width: NODE.w, height: NODE.h, rx: 6 }, nodesG);
    el('text', { class: 'qi-frame-label', x: nx + 14, y: NODE.y + 24 }, nodesG).textContent = `Node ${n + 1}`;
    const bx = nx + BOX.dx;
    const by = NODE.y + BOX.dy;
    const empty = el('g', { class: 'qi-rl__empty', transform: `translate(${bx} ${by})` }, nodesG);
    el('rect', { class: 'qi-rl__empty-box', width: BOX.w, height: BOX.h, rx: 6 }, empty);
    el('text', { class: 'qi-label', x: BOX.w / 2, y: 26, 'text-anchor': 'middle' }, empty).textContent = 'no replica';
    const g = el('g', { class: 'qi-rl__shard', transform: `translate(${bx} ${by})` }, nodesG);
    el('rect', { class: 'qi-rl__box', width: BOX.w, height: BOX.h, rx: 6 }, g);
    el('text', { class: 'qi-label qi-label--strong', x: 12, y: 26 }, g).textContent = 'Shard 0';
    for (let i = 0; i < BARS; i++) el('rect', { class: 'qi-rl__bar', x: BAR.x + i * BAR.slot, y: BAR.y, width: BAR.w, height: BAR.h, rx: 1.5 }, g);
    const ly = NODE.y + LOAD.dy;
    el('rect', { class: 'qi-rl__track', x: nx + LOAD.dx, y: ly, width: LOAD.w, height: LOAD.h, rx: 3 }, nodesG);
    const fill = el('rect', { class: 'qi-rl__fill', x: nx + LOAD.dx, y: ly, width: 0, height: LOAD.h, rx: 3 }, nodesG);
    const reads = el('text', { class: 'qi-label qi-label--strong qi-rl__reads', x: nx + LOAD.dx + LOAD.w + 10, y: ly + 9 }, nodesG);
    el('text', { class: 'qi-label', x: nx + 14, y: ly + 9 }, nodesG).textContent = 'load';
    const wire = el('path', { class: 'qi-rl__wire', d: drop(n), 'marker-end': 'url(#qi-rl-arrow)' }, wiresG);
    return { n, g, empty, fill, reads, wire, count: 0 };
  });

  let factor = 2;
  let sent = 0;
  let running = false;
  let timers = [];
  let gen = 0;
  const later = (fn, ms) => timers.push(window.setTimeout(fn, reduced ? 0 : ms));

  function render() {
    valueEl.textContent = String(factor);
    stepBtns.forEach((b) => {
      const next = factor + Number(b.dataset.step);
      b.disabled = next < 1 || next > MAX_FACTOR;
    });
    slots.forEach((s) => {
      const on = s.n < factor;
      s.g.classList.toggle('is-off', !on);
      s.empty.classList.toggle('is-off', on);
      s.fill.setAttribute('width', (LOAD.w * s.count) / QUERIES);
      s.reads.textContent = s.count ? String(s.count) : "";
    });
    countEl.textContent = sent ? `reads: ${sent} of ${QUERIES}` : '';
    startBtn.disabled = running;
  }

  function reset() {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
    gen++;
    sent = 0;
    running = false;
    tokensG.innerHTML = '';
    slots.forEach((s) => {
      s.count = 0;
      s.g.classList.remove('is-hot');
      s.wire.classList.remove('is-on');
    });
    statusEl.innerHTML = `With <code>replication_factor=${factor}</code>, the shard has ${factor} replica${factor > 1 ? 's' : ''}. Press Start queries.`;
    render();
  }

  function travel(s, myGen) {
    return new Promise((resolve) => {
      const path = s.wire;
      const len = path.getTotalLength();
      const tok = el('rect', { class: 'qi-rl__token', width: TOKEN, height: TOKEN, rx: 2 }, tokensG);
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

  function start() {
    if (running) return;
    reset();
    running = true;
    render();
    const myGen = gen;
    slots.filter((s) => s.n < factor).forEach((s) => s.wire.classList.add('is-on'));
    // One sentence for the whole run: the load bars show the progress.
    statusEl.innerHTML =
      factor === 1 ? 'Every read of the shard goes to its only replica, on Node 1.' : 'The shard’s reads are spread over its replicas in turn.';
    for (let q = 0; q < QUERIES; q++) {
      later(() => {
        if (myGen !== gen) return;
        sent = q + 1;
        render();
        const s = slots[q % factor];
        travel(s, myGen).then((ok) => {
          if (!ok) return;
          s.count++;
          s.g.classList.add('is-hot');
          later(() => s.g.classList.remove('is-hot'), 800);
          render();
        });
      }, q * EVERY_MS);
    }
    later(() => {
      if (myGen !== gen) return;
      slots.forEach((s) => s.wire.classList.remove('is-on'));
      running = false;
      const each = QUERIES / factor;
      statusEl.innerHTML =
        factor === 1
          ? `Node 1 served all ${QUERIES} reads of the shard. Raise the replication factor to spread them.`
          : `${QUERIES} reads split into ${each} per replica, across ${factor} nodes.` +
            (factor < MAX_FACTOR ? ' Raise the factor to spread them further.' : '');
      render();
    }, (QUERIES - 1) * EVERY_MS + TRAVEL_MS + 400);
  }

  stepBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const next = factor + Number(b.dataset.step);
      if (next < 1 || next > MAX_FACTOR) return;
      factor = next;
      reset();
      later(start, 500);
    }),
  );
  startBtn.addEventListener('click', start);

  reset();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
