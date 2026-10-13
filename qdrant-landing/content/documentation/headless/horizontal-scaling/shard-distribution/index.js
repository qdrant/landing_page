/*
 * shard-distribution island: interactive replacement for cluster-no-replication.png.
 *
 * A collection with three shards on a cluster that grows from one node to
 * four. Each Add node joins the next node and moves shards onto it, so the
 * reader sees the cluster go from everything on one node, to an uneven split
 * over two, to one shard per node over three. The fourth node stays empty,
 * because there are only three shards to place.
 *
 * Shards are boxes of points (bars); each shard has its own hue so it can be
 * followed as it moves. A moving shard carries the neutral `.is-hot` outline.
 * Pure SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

const MAX_NODES = 4;
const SHARDS = 3;

// Geometry (viewBox 760 x 200). Four node slots; nodes that have not joined
// yet are drawn as dashed placeholders so the layout never shifts.
const VB_W = 760;
const VB_H = 200;
const NODE = { w: 178, h: 196, y: 2, pitch: 194 };
const SHARD = { w: 150, h: 42, dx: 14, dy: 40, pitch: 50 };
const BARS = 6;
const BAR = { x: 84, slot: 10, w: 5.5, y: 11, h: 20 };

const JOIN_MS = 350; // node frame turns solid, then shards start moving
const MOVE_MS = 700; // shard slide
const HOT_MS = 1200; // how long a moved shard keeps its outline

// Where each shard sits for a given node count: [node, row]. Every step moves
// as few shards as possible, and the shards left behind close up the gap.
const PLACEMENT = {
  1: [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  2: [
    [0, 0],
    [1, 0],
    [0, 1],
  ],
  3: [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  4: [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
};

const STATUS = {
  1: 'All 3 shards are on Node 1. Add a node to spread them out. Qdrant Cloud rebalances shards automatically; in a self-hosted cluster, you move them yourself.',
  2: 'Shard 1 moves to Node 2. Node 1 still holds two shards and Node 2 only one, so the load is uneven.',
  3: 'Shard 2 moves to Node 3. Each node now holds one shard, so the load is even.',
  4: 'Node 4 joins, but all 3 shards are already placed, so it stays empty. Create more shards than nodes to leave room to grow.',
};

const nodeX = (n) => n * NODE.pitch;

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

export function mount(node) {
  node.classList.add('qi-shd');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls qi-controls--split">',
    '    <div class="qi-group">',
    '      <button type="button" class="qi-chip" data-add>',
    '        <svg class="qi-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>Add node',
    '      </button>',
    '      <span class="qi-hint qi-shd__count"></span>',
    '    </div>',
    '    <button type="button" class="qi-chip" data-reset>',
    '      <svg class="qi-chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Reset',
    '    </button>',
    '  </div>',
    `  <svg class="qi-svg qi-shd__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="A collection with three shards on a cluster of one to four nodes. Adding a node moves shards onto it.">',
    '    <g class="qi-shd__nodes"></g>',
    '    <g class="qi-shd__shards"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-shd__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-shd__svg');
  const nodesG = svg.querySelector('.qi-shd__nodes');
  const shardsG = svg.querySelector('.qi-shd__shards');
  const statusEl = node.querySelector('.qi-shd__status');
  const countEl = node.querySelector('.qi-shd__count');
  const addBtn = node.querySelector('[data-add]');
  const resetBtn = node.querySelector('[data-reset]');

  const nodes = [];
  for (let n = 0; n < MAX_NODES; n++) {
    const g = el('g', { class: 'qi-shd__node' }, nodesG);
    el('rect', { class: 'qi-frame qi-shd__frame', x: nodeX(n), y: NODE.y, width: NODE.w, height: NODE.h, rx: 6 }, g);
    el('text', { class: 'qi-frame-label', x: nodeX(n) + 14, y: NODE.y + 24 }, g).textContent = `Node ${n + 1}`;
    const empty = el('text', { class: 'qi-label qi-shd__empty', x: nodeX(n) + NODE.w / 2, y: NODE.y + NODE.h / 2 + 12, 'text-anchor': 'middle' }, g);
    empty.textContent = 'No shards';
    nodes.push(g);
  }

  // Shards are drawn after the nodes so a shard crossing between two nodes
  // stays on top of both frames.
  const shards = [];
  for (let s = 0; s < SHARDS; s++) {
    const g = el('g', { class: `qi-shd__shard qi-shd__shard--${s}` }, shardsG);
    el('rect', { class: 'qi-shd__box', width: SHARD.w, height: SHARD.h, rx: 6 }, g);
    el('text', { class: 'qi-label qi-label--strong', x: 12, y: 26 }, g).textContent = `Shard ${s}`;
    for (let b = 0; b < BARS; b++) {
      el('rect', { class: 'qi-shd__bar', x: BAR.x + b * BAR.slot, y: BAR.y, width: BAR.w, height: BAR.h, rx: 1.5 }, g);
    }
    shards.push(g);
  }

  let count = 1;
  let timers = [];
  const later = (fn, ms) => timers.push(window.setTimeout(fn, reduced ? 0 : ms));

  function place(n, highlight) {
    const prev = shards.map((g) => g.dataset.at);
    PLACEMENT[n].forEach(([nd, row], s) => {
      const at = `${nd}:${row}`;
      const g = shards[s];
      g.style.transform = `translate(${nodeX(nd) + SHARD.dx}px, ${NODE.y + SHARD.dy + row * SHARD.pitch}px)`;
      // Only a shard that changes node is "moved"; one that closes up a gap
      // inside its node is not highlighted.
      if (highlight && prev[s] && prev[s].split(':')[0] !== String(nd)) {
        g.classList.add('is-hot');
        later(() => g.classList.remove('is-hot'), HOT_MS);
      }
      g.dataset.at = at;
    });
    nodes.forEach((g, i) => {
      const holds = PLACEMENT[n].some(([nd]) => nd === i);
      g.classList.toggle('is-empty', i < n && !holds);
    });
  }

  function render() {
    nodes.forEach((g, i) => g.classList.toggle('is-ghost', i >= count));
    countEl.textContent = `${count} of ${MAX_NODES} nodes`;
    addBtn.disabled = count >= MAX_NODES;
    resetBtn.disabled = count === 1;
    statusEl.textContent = STATUS[count];
  }

  function clearTimers() {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
    shards.forEach((g) => g.classList.remove('is-hot'));
  }

  addBtn.addEventListener('click', () => {
    if (count >= MAX_NODES) return;
    clearTimers();
    count++;
    const n = count;
    // Hide the empty note until the shards have settled, so a node does not
    // read "No shards" while a shard is on its way in.
    nodes[n - 1].classList.remove('is-empty');
    render();
    later(() => place(n, true), JOIN_MS);
  });

  resetBtn.addEventListener('click', () => {
    clearTimers();
    count = 1;
    place(1, false);
    // Let the shards slide home before the other nodes leave.
    later(render, MOVE_MS);
    addBtn.disabled = true;
    resetBtn.disabled = true;
  });

  place(1, false);
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
