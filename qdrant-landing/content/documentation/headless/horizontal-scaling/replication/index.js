/*
 * replication island: interactive replacement for cluster-with-replication.png.
 *
 * A three-node cluster with a three-shard collection. Raising the replication
 * factor copies every shard to one more node: each new replica slides out of
 * the shard's first replica onto its new node. Lowering it removes the newest
 * replicas again. A node holds at most one replica of a shard, so beyond a
 * factor of 3 the extra replicas are left outside the cluster, dashed.
 *
 * Replica r of shard s lives on node (s + r) % 3, in row r, so every node
 * fills up evenly and the rows read as "first copy", "second copy", and so on.
 * Shards are boxes of points (bars) with a constant hue per shard, as in the
 * shard-distribution island. Pure SVG + CSS on the shared island design system.
 */

const NS = 'http://www.w3.org/2000/svg';

const NODES = 3;
const SHARDS = 3;
const MIN_RF = 1;
const MAX_RF = 4;

// Geometry (viewBox 760 x 282). Three nodes, then a row for the replicas that
// have no node to go to; it stays reserved so the page never reflows.
const VB_W = 760;
const VB_H = 282;
const NODE = { w: 230, h: 196, y: 2, pitch: 265 };
const SHARD = { w: 150, h: 42, dx: 40, dy: 40, pitch: 50 };
const BARS = 6;
const BAR = { x: 84, slot: 10, w: 5.5, y: 11, h: 20 };
const UNPLACED_Y = 236;

const STAGGER_MS = 120; // between shards, so the copies read one by one
const MOVE_MS = 700;
const HOT_MS = 1200;

const STATUS = {
  1: 'With a replication factor of 1, each shard exists once. If a node fails, its shard is unavailable.',
  2: 'Each shard is copied to a second node. If any one node fails, every shard still has a replica on another node. Storage doubles.',
  3: 'Each shard is copied to a third node, so every node now holds a replica of every shard. Storage triples.',
  4: 'A node can hold only one replica of a shard. With 3 nodes, the fourth replica of each shard has nowhere to go, so add a node first.',
};

const nodeX = (n) => n * NODE.pitch;

function slot(s, r) {
  if (r >= NODES) return { x: nodeX(s) + SHARD.dx, y: UNPLACED_Y };
  return { x: nodeX((s + r) % NODES) + SHARD.dx, y: NODE.y + SHARD.dy + r * SHARD.pitch };
}
const translate = ({ x, y }) => `translate(${x}px, ${y}px)`;

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

export function mount(node) {
  node.classList.add('qi-rep');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Replication factor">',
    '      <span class="qi-hint">replication_factor:</span>',
    '      <button type="button" class="qi-chip" data-step="-1" aria-label="Decrease the replication factor">−</button>',
    '      <b class="qi-rep__value" aria-live="polite"></b>',
    '      <button type="button" class="qi-chip" data-step="1" aria-label="Increase the replication factor">+</button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-rep__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="A three-node cluster with three shards. Raising the replication factor copies each shard to more nodes.">',
    '    <g class="qi-rep__nodes"></g>',
    `    <text class="qi-label qi-rep__unplaced" x="${VB_W / 2}" y="${UNPLACED_Y - 10}" text-anchor="middle">No node left for these replicas</text>`,
    '    <g class="qi-rep__shards"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-rep__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-rep__svg');
  const nodesG = svg.querySelector('.qi-rep__nodes');
  const shardsG = svg.querySelector('.qi-rep__shards');
  const unplacedEl = svg.querySelector('.qi-rep__unplaced');
  const statusEl = node.querySelector('.qi-rep__status');
  const valueEl = node.querySelector('.qi-rep__value');
  const stepBtns = [...node.querySelectorAll('[data-step]')];

  for (let n = 0; n < NODES; n++) {
    el('rect', { class: 'qi-frame', x: nodeX(n), y: NODE.y, width: NODE.w, height: NODE.h, rx: 6 }, nodesG);
    el('text', { class: 'qi-frame-label', x: nodeX(n) + 14, y: NODE.y + 24 }, nodesG).textContent = `Node ${n + 1}`;
  }

  function makeReplica(s, r) {
    const g = el('g', { class: `qi-rep__shard qi-rep__shard--${s}` }, shardsG);
    g.classList.toggle('is-unplaced', r >= NODES);
    el('rect', { class: 'qi-rep__box', width: SHARD.w, height: SHARD.h, rx: 6 }, g);
    el('text', { class: 'qi-label qi-label--strong', x: 12, y: 26 }, g).textContent = `Shard ${s}`;
    for (let b = 0; b < BARS; b++) {
      el('rect', { class: 'qi-rep__bar', x: BAR.x + b * BAR.slot, y: BAR.y, width: BAR.w, height: BAR.h, rx: 1.5 }, g);
    }
    return g;
  }

  // replicas[r][s]: the element for replica r of shard s.
  const replicas = [];
  let rf = MIN_RF;
  let timers = [];
  const later = (fn, ms) => timers.push(window.setTimeout(fn, reduced ? 0 : ms));

  function addRow(r) {
    const row = [];
    for (let s = 0; s < SHARDS; s++) {
      const g = makeReplica(s, r);
      // Start on top of the shard's first replica, then slide to the new node.
      g.style.transform = translate(slot(s, 0));
      row.push(g);
      if (r === 0) continue;
      later(() => {
        if (g.classList.contains('is-leaving')) return; // removed before it got to move
        g.getBoundingClientRect(); // commit the start position before moving
        g.style.transform = translate(slot(s, r));
        g.classList.add('is-hot');
        later(() => g.classList.remove('is-hot'), HOT_MS);
      }, s * STAGGER_MS);
    }
    replicas.push(row);
  }

  function removeRow() {
    const row = replicas.pop();
    row.forEach((g, s) => {
      g.classList.remove('is-hot');
      g.classList.add('is-leaving');
      g.style.transform = translate(slot(s, 0));
      window.setTimeout(() => g.remove(), reduced ? 0 : MOVE_MS);
    });
  }

  function render() {
    valueEl.textContent = String(rf);
    stepBtns.forEach((b) => {
      const next = rf + Number(b.dataset.step);
      b.disabled = next < MIN_RF || next > MAX_RF;
    });
    unplacedEl.classList.toggle('is-on', rf > NODES);
    statusEl.textContent = STATUS[rf];
  }

  stepBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const next = rf + Number(b.dataset.step);
      if (next < MIN_RF || next > MAX_RF) return;
      if (next > rf) addRow(rf);
      else removeRow();
      rf = next;
      render();
    }),
  );

  addRow(0);
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
