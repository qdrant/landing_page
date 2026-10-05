/*
 * layers island: interactive replacement for data-layer.png, mask-layer.png
 * and architecture.png.
 *
 * Gridstore's three layers on one small, illustrative page of 48 blocks:
 *   Data layer: the tracker holds one pointer per key; a pointer leads to the
 *               key's run of blocks in the data grid.
 *   Mask layer: one bit per block, 1 used and 0 free.
 *   Gaps layer: the mask is cut into regions of 8 blocks. Each region keeps its
 *               largest free run (gap) plus its leading and trailing free runs,
 *               and pairs of regions are merged into a tree. To place a value,
 *               Gridstore descends the tree instead of scanning the mask.
 *
 * The keys, value sizes and free space are illustrative, not measured.
 */

const NS = 'http://www.w3.org/2000/svg';

const N_BLOCKS = 48;
const REGION = 8;
const N_REGIONS = N_BLOCKS / REGION;
const BLOCK_BYTES = 128;

// key -> run of blocks [start, start + len). Everything else is free.
const KEYS = [
  { start: 0, len: 4 },
  { start: 6, len: 7 },
  { start: 15, len: 5 },
  { start: 26, len: 3 },
  { start: 33, len: 4 },
  { start: 38, len: 2 },
];
const TRACKER_CELLS = 9;
const FIND = [2, 6, 10];

const WIDE = { VB_W: 760, VB_H: 470, cols: 16, bx: 20, by: 100, pitch: 36, size: 30, tx: 20, ty: 22 };
const NARROW = { VB_W: 350, VB_H: 520, cols: 8, bx: 16, by: 98, pitch: 38, size: 32, tx: 16, ty: 22 };

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

// --- model ---------------------------------------------------------------
const owner = new Array(N_BLOCKS).fill(-1);
KEYS.forEach((k, i) => {
  for (let b = k.start; b < k.start + k.len; b++) owner[b] = i;
});
const isFree = (b) => owner[b] === -1;

function leafOf(r) {
  const lo = r * REGION;
  const hi = lo + REGION;
  let gap = 0;
  let run = 0;
  for (let b = lo; b < hi; b++) {
    run = isFree(b) ? run + 1 : 0;
    gap = Math.max(gap, run);
  }
  let lead = 0;
  while (lead < REGION && isFree(lo + lead)) lead++;
  let trail = 0;
  while (trail < REGION && isFree(hi - 1 - trail)) trail++;
  return { id: `r${r}`, lo, hi, gap, lead, trail, full: lead === REGION, left: null, right: null, leaf: true };
}

function merge(id, a, b) {
  const lead = a.full ? a.lead + b.lead : a.lead;
  const trail = b.full ? b.trail + a.trail : b.trail;
  return { id, lo: a.lo, hi: b.hi, gap: Math.max(a.gap, b.gap, a.trail + b.lead), lead, trail, full: a.full && b.full, left: a, right: b, leaf: false };
}

const leaves = Array.from({ length: N_REGIONS }, (_, r) => leafOf(r));
const nodeA = merge('A', leaves[0], leaves[1]);
const nodeB = merge('B', leaves[2], leaves[3]);
const nodeC = merge('C', leaves[4], leaves[5]);
const nodeD = merge('D', nodeA, nodeB);
const root = merge('root', nodeD, nodeC);
const NODES = [...leaves, nodeA, nodeB, nodeC, nodeD, root];
const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

// Descend the tree to place n blocks. Returns the visited nodes, narration and start block.
function findFit(n) {
  const path = [root];
  const steps = [];
  if (n > root.gap) {
    steps.push(`The root's largest free run is <b>${root.gap}</b>, smaller than ${n}.`);
    return { path, steps, start: -1 };
  }
  steps.push(`The root's largest free run is <b>${root.gap}</b>, so ${n} fit somewhere.`);
  let node = root;
  while (!node.leaf) {
    const { left, right } = node;
    if (left.gap >= n) {
      steps.push(`The left half has a run of ${left.gap}: go left.`);
      node = left;
    } else if (left.trail + right.lead >= n) {
      const start = left.hi - left.trail;
      path.push(left, right);
      steps.push(`Regions ${regionName(left.hi - 1)} and ${regionName(right.lo)} join across their boundary (${left.trail} trailing + ${right.lead} leading free), so the value starts at block <b>${start}</b>.`);
      return { path, steps, start };
    } else {
      steps.push(`The left half only has ${left.gap}: go right.`);
      node = right;
    }
    path.push(node);
  }
  let run = 0;
  let start = -1;
  for (let b = node.lo; b < node.hi; b++) {
    run = isFree(b) ? run + 1 : 0;
    if (run >= n) {
      start = b - n + 1;
      break;
    }
  }
  steps.push(`Scanning only region ${node.lo / REGION}'s ${REGION} bits finds the run at block <b>${start}</b>.`);
  return { path, steps, start };
}
const regionName = (b) => String(Math.floor(b / REGION));

const freeCount = owner.filter((o) => o === -1).length;
const NODE_NAME = (n) => (n.leaf ? `region ${n.lo / REGION}` : n.id === 'root' ? 'the root' : `the merge of regions ${n.lo / REGION} to ${(n.hi - 1) / REGION | 0}`);

export function mount(node) {
  node.classList.add('gs');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Layers shown">',
    '      <button type="button" class="qi-chip" data-view="data" aria-pressed="false">Data layer</button>',
    '      <button type="button" class="qi-chip" data-view="mask" aria-pressed="false">+ Mask layer</button>',
    '      <button type="button" class="qi-chip" data-view="gaps" aria-pressed="false">+ Gaps layer</button>',
    '    </div>',
    '    <div class="qi-group gs__find" role="group" aria-label="Find space for a value" hidden>',
    FIND.map((n) => `<button type="button" class="qi-chip" data-find="${n}" aria-pressed="false">Find space: ${n} blocks</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 470" role="img" aria-label="Gridstore layers: a tracker of pointers, a grid of fixed-size blocks, a bitmask of used blocks, and a tree of free-space gaps per region.">',
    '    <g class="gs__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 gs__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.gs__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.gs__status');
  const viewChips = [...node.querySelectorAll('[data-view]')];
  const findChips = [...node.querySelectorAll('[data-find]')];
  const findGroup = node.querySelector('.gs__find');

  let view = 'gaps';
  let find = 6;
  let hovered = null;
  let pinned = null;
  let G = WIDE;

  const NARROW_BELOW = 700;
  const isNarrow = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < NARROW_BELOW;
  };
  let narrow = isNarrow();
  node.classList.toggle('gs-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (isNarrow() !== narrow) {
        narrow = isNarrow();
        node.classList.toggle('gs-narrow', narrow);
        render();
      }
    }).observe(node);
  }

  const blockXY = (b) => ({ x: G.bx + (b % G.cols) * G.pitch, y: G.by + Math.floor(b / G.cols) * G.pitch });
  const maskXY = (b) => {
    if (narrow) return { x: G.bx + (b % REGION) * G.pitch, y: 358 + Math.floor(b / REGION) * 20, w: G.size, h: 16 };
    return { x: G.bx + b * 12, y: 244, w: 11, h: 18 };
  };
  const keyCls = (i) => (i < 0 ? 'is-free' : `gs-k${i + 1}`);

  function render() {
    G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    const showMask = view !== 'data';
    const showGaps = view === 'gaps';
    findGroup.hidden = !showGaps;
    const fit = showGaps ? findFit(find) : null;

    // Tracker
    g.appendChild(el('text', { class: 'qi-label', x: G.tx, y: 14 }, narrow ? 'Tracker: pointer per key' : 'Tracker: one pointer per key'));
    for (let i = 0; i < TRACKER_CELLS; i++) {
      const x = G.tx + i * 36;
      const used = i < KEYS.length;
      g.appendChild(el('rect', { class: `gs__tcell ${used ? keyCls(i) : 'is-empty'}`, x, y: G.ty, width: 30, height: 26, rx: 4, 'data-key': used ? i : '' , ...(used ? {} : { 'data-none': 1 }) }));
      g.appendChild(el('text', { class: 'qi-label gs__klabel', x: x + 15, y: G.ty + 44, 'text-anchor': 'middle' }, `${i}`));
    }
    g.appendChild(el('text', { class: 'qi-label', x: G.tx + TRACKER_CELLS * 36 + 6, y: G.ty + 18 }, 'keys'));

    // Data grid
    g.appendChild(el('text', { class: 'qi-label', x: G.bx, y: G.by - 8 }, `Data grid: ${BLOCK_BYTES}-byte blocks`));
    const rows = N_BLOCKS / G.cols;
    g.appendChild(el('rect', { class: 'qi-frame', x: G.bx - 6, y: G.by - 4, width: G.cols * G.pitch + 6, height: rows * G.pitch + 2, rx: 6 }));
    for (let b = 0; b < N_BLOCKS; b++) {
      const { x, y } = blockXY(b);
      g.appendChild(el('rect', { class: `gs__block ${keyCls(owner[b])}`, x, y, width: G.size, height: G.size, rx: 4, 'data-block': b, ...(owner[b] >= 0 ? { 'data-key': owner[b] } : {}) }));
    }
    // Ghost for the value being placed
    if (fit && fit.start >= 0) {
      for (let b = fit.start; b < fit.start + find; b++) {
        const { x, y } = blockXY(b);
        g.appendChild(el('rect', { class: 'gs__ghost', x: x + 2, y: y + 2, width: G.size - 4, height: G.size - 4, rx: 3, 'pointer-events': 'none' }));
      }
    }

    // Mask
    if (showMask) {
      const m0 = maskXY(0);
      g.appendChild(el('text', { class: 'qi-label', x: narrow ? G.bx : G.bx, y: narrow ? 346 : 236 }, narrow ? 'Mask: 1 used, 0 free' : 'Mask layer: one bit per block, 1 used, 0 free'));
      for (let b = 0; b < N_BLOCKS; b++) {
        const { x, y, w, h } = maskXY(b);
        g.appendChild(el('rect', { class: `gs__bit ${isFree(b) ? 'is-free' : 'is-used'}`, x, y, width: w, height: h, rx: 2, 'data-block': b }));
        if (narrow) g.appendChild(el('text', { class: 'qi-label gs__bitnum', x: x + w / 2, y: y + 12, 'text-anchor': 'middle', 'pointer-events': 'none' }, isFree(b) ? '0' : '1'));
      }
      if (fit && fit.start >= 0) {
        for (let b = fit.start; b < fit.start + find; b++) {
          const { x, y, w, h } = maskXY(b);
          g.appendChild(el('rect', { class: 'gs__ghost gs__ghost--bit', x: x - 1, y: y - 1, width: w + 2, height: h + 2, rx: 2, 'pointer-events': 'none' }));
        }
      }
    }

    // Gaps
    if (showGaps) {
      if (narrow) {
        g.appendChild(el('text', { class: 'qi-label', x: G.bx + REGION * G.pitch + 4, y: 346 }, 'gap'));
        leaves.forEach((n, r) => {
          const rowY = 358 + r * 20;
          g.appendChild(el('rect', { class: 'gs__node', x: G.bx + REGION * G.pitch + 2, y: rowY - 1, width: 26, height: 18, rx: 4, 'data-node': n.id }));
          g.appendChild(el('text', { class: 'qi-label qi-label--strong gs__nodenum', x: G.bx + REGION * G.pitch + 15, y: rowY + 12, 'text-anchor': 'middle', 'pointer-events': 'none' }, `${n.gap}`));
        });
      } else {
        g.appendChild(el('text', { class: 'qi-label', x: G.bx, y: 296 }, 'Gaps layer: largest free run per region, merged pairwise'));
        const cx = (n) => G.bx + ((n.lo + n.hi) / 2) * 12;
        const lvlY = { leaf: 306, 1: 352, 2: 398, root: 440 };
        const yOf = (n) => (n.leaf ? lvlY.leaf : n.id === 'root' ? lvlY.root : n.id === 'D' ? lvlY[2] : lvlY[1]);
        // region brackets under the mask
        leaves.forEach((n) => {
          const x1 = G.bx + n.lo * 12;
          const x2 = G.bx + n.hi * 12 - 1;
          g.appendChild(el('path', { class: 'gs__bracket', d: `M${x1} 266 v5 h${x2 - x1} v-5` }));
        });
        // edges
        NODES.filter((n) => !n.leaf).forEach((n) => {
          [n.left, n.right].forEach((c) => {
            const y1 = yOf(c) + 24;
            const y2 = yOf(n);
            const ym = y2 - 10;
            g.appendChild(el('path', { class: 'gs__edge', d: `M${cx(c)} ${y1} V${ym} H${cx(n)} V${y2}`, 'data-edge': `${n.id}` }));
          });
        });
        NODES.forEach((n) => {
          const y = yOf(n);
          g.appendChild(el('rect', { class: 'gs__node', x: cx(n) - 22, y, width: 44, height: 24, rx: 5, 'data-node': n.id }));
          g.appendChild(el('text', { class: 'qi-label qi-label--strong gs__nodenum', x: cx(n), y: y + 17, 'text-anchor': 'middle', 'pointer-events': 'none' }, `${n.gap}`));
        });
        g.appendChild(el('text', { class: 'qi-label', x: 610, y: 322 }, 'region gap'));
        g.appendChild(el('text', { class: 'qi-label', x: 610, y: 456 }, 'whole page'));
      }
    }
    g.appendChild(el('g', { class: 'gs__ptr' }));
    applyPath(fit);
    highlight();
  }

  function applyPath(fit) {
    if (!fit) return;
    fit.path.forEach((n) => g.querySelectorAll(`[data-node="${n.id}"]`).forEach((r) => r.classList.add('is-path')));
  }

  function defaultStatus() {
    if (view === 'data') {
      return `<b>Data layer</b>: the tracker holds one pointer per key, and each pointer leads to that key's run of blocks in the data grid. Hover or click a key.`;
    }
    if (view === 'mask') {
      return `<b>Mask layer</b>: one bit per block, 1 for used and 0 for free. Freeing a value only clears its bits; nothing moves. <b>${freeCount}</b> of ${N_BLOCKS} blocks are free here.`;
    }
    const f = findFit(find);
    return `<b>Gaps layer</b>, looking for <b>${find}</b> free blocks. ${f.steps.join(' ')}${f.start < 0 ? ' No run is long enough on this page, so the value goes elsewhere.' : ''}`;
  }

  function highlight() {
    const hot = pinned || hovered;
    node.querySelectorAll('.is-hot').forEach((n) => n.classList.remove('is-hot'));
    const ptr = g.querySelector('.gs__ptr');
    ptr.replaceChildren();
    if (!hot) {
      statusEl.innerHTML = defaultStatus();
      return;
    }
    if (hot.type === 'key' || hot.type === 'block') {
      const k = hot.type === 'key' ? hot.i : owner[hot.i];
      if (k < 0) {
        node.querySelectorAll(`[data-block="${hot.i}"]`).forEach((n) => n.classList.add('is-hot'));
        statusEl.innerHTML = `Block <b>${hot.i}</b> is free: its mask bit is <b>0</b>, so a new value can be written here.`;
        return;
      }
      node.querySelectorAll(`[data-key="${k}"]`).forEach((n) => n.classList.add('is-hot'));
      const { start, len } = KEYS[k];
      for (let b = start; b < start + len; b++) node.querySelectorAll(`[data-block="${b}"]`).forEach((n) => n.classList.add('is-hot'));
      // pointer from the tracker cell to the first block
      const tx = G.tx + k * 36 + 15;
      const ty = G.ty + 26;
      const { x, y } = blockXY(start);
      ptr.appendChild(el('path', { class: 'gs__ptrline', d: `M${tx} ${ty + 20} V${G.by - 18} H${x + G.size / 2} V${y - 1}` }));
      statusEl.innerHTML = `Key <b>${k}</b>: pointer → block offset <b>${start}</b>, length <b>${len}</b> blocks (up to ${len * BLOCK_BYTES} bytes). ${view !== 'data' ? `In the mask, bits ${start} to ${start + len - 1} are 1.` : ''}`;
      return;
    }
    if (hot.type === 'node') {
      const n = byId[hot.id];
      node.querySelectorAll(`[data-node="${n.id}"]`).forEach((r) => r.classList.add('is-hot'));
      for (let b = n.lo; b < n.hi; b++) node.querySelectorAll(`.gs__bit[data-block="${b}"]`).forEach((r) => r.classList.add('is-hot'));
      statusEl.innerHTML = `For ${NODE_NAME(n)} (blocks ${n.lo} to ${n.hi - 1}): largest free run <b>${n.gap}</b>, leading free <b>${n.lead}</b>, trailing free <b>${n.trail}</b>.`;
    }
  }

  function setView(v) {
    view = v;
    pinned = null;
    hovered = null;
    viewChips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    render();
  }
  function setFind(n) {
    find = n;
    findChips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.find) === find)));
    render();
  }

  function hotFromEvent(e) {
    const t = e.target.closest ? e.target.closest('[data-node], [data-key], [data-block]') : null;
    if (!t || t.hasAttribute('data-none')) return null;
    if (t.hasAttribute('data-node')) return { type: 'node', id: t.getAttribute('data-node') };
    if (t.classList.contains('gs__tcell')) return { type: 'key', i: Number(t.getAttribute('data-key')) };
    if (t.hasAttribute('data-block')) return { type: 'block', i: Number(t.getAttribute('data-block')) };
    return null;
  }
  const same = (a, b) => !!a && !!b && a.type === b.type && a.i === b.i && a.id === b.id;
  svg.addEventListener('pointerover', (e) => {
    const h = hotFromEvent(e);
    if (h && !same(h, hovered)) {
      hovered = h;
      highlight();
    }
  });
  svg.addEventListener('pointerout', (e) => {
    if (hotFromEvent(e)) {
      hovered = null;
      highlight();
    }
  });
  svg.addEventListener('click', (e) => {
    const h = hotFromEvent(e);
    if (!h) return;
    pinned = same(h, pinned) ? null : h;
    highlight();
  });
  viewChips.forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  findChips.forEach((b) => b.addEventListener('click', () => setFind(Number(b.dataset.find))));

  setFind(6);
  setView('gaps');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
