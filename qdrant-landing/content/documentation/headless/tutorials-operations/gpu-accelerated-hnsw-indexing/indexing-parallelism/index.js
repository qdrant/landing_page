/*
 * indexing-parallelism island — replacement for cpu-vs-gpu-indexing.png.
 *
 * Illustrates why GPUs speed up HNSW graph construction: both panels place
 * nodes into the same small graph, but the CPU panel places one node (and its
 * edges) at a time, while the GPU panel places a whole batch of nodes in the
 * same pass. Both traverse the identical graph and finish it in the same
 * number of visual "steps" available, so progress is directly comparable:
 * the GPU panel is visibly further into the graph at any given step. Static
 * layout, framed with margin so nodes/edges never touch the frame edge. This
 * is a schematic illustration of the mechanism, not measured data — the
 * graph, node count and batch size are illustrative.
 *
 * Each panel is its own <svg> (rather than one wide svg with two side-by-side
 * groups) inside a flex row, so a narrow-screen media query (index.css) can
 * stack them into a column without shrinking either graph's text below the
 * readable floor.
 */

const NS = 'http://www.w3.org/2000/svg';

// A small fixed HNSW-like graph shared by both panels. Coordinates are in a
// 0..300 x 0..120 local space, placed inside each panel at draw time.
const NODES = [
  { id: 0, x: 20, y: 60 },
  { id: 1, x: 55, y: 20 },
  { id: 2, x: 55, y: 100 },
  { id: 3, x: 95, y: 55 },
  { id: 4, x: 130, y: 15 },
  { id: 5, x: 130, y: 95 },
  { id: 6, x: 165, y: 60 },
  { id: 7, x: 200, y: 25 },
  { id: 8, x: 200, y: 95 },
  { id: 9, x: 235, y: 60 },
  { id: 10, x: 270, y: 30 },
  { id: 11, x: 270, y: 90 },
];

const EDGES = [
  [0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6],
  [6, 7], [6, 8], [7, 9], [8, 9], [9, 10], [9, 11], [4, 7], [5, 8],
];

// Build order: nodes are placed in this sequence (roughly left-to-right, as
// a graph build would extend the index). GPU batches consume several build
// steps at once.
const BUILD_ORDER = NODES.map((n) => n.id);
const GPU_BATCH = 3;
const GPU_STEPS = Math.ceil(BUILD_ORDER.length / GPU_BATCH);

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}
function text(name, attrs, str) {
  const node = el(name, attrs);
  node.textContent = str;
  return node;
}

function buildPanel({ w, h, title, cls, ariaLabel }) {
  const svg = el('svg', {
    class: 'qi-svg ip-panel-svg',
    viewBox: `0 0 ${w} ${h}`,
    role: 'img',
    'aria-label': ariaLabel,
  });

  const pad = 18;
  svg.appendChild(el('rect', { class: 'qi-frame', x: 0, y: 0, width: w, height: h, rx: 10 }));
  svg.appendChild(text('text', { class: 'qi-title', x: pad, y: 26 }, title));

  const graphX = pad;
  const graphY = 40;
  const graphW = w - pad * 2;
  const graphH = h - graphY - 30;
  const scaleX = graphW / 300;
  const scaleY = graphH / 120;

  const gg = el('g', { transform: `translate(${graphX}, ${graphY})` });
  svg.appendChild(gg);

  const pos = {};
  NODES.forEach((n) => {
    pos[n.id] = { x: n.x * scaleX, y: n.y * scaleY };
  });

  const edgeEls = {};
  EDGES.forEach(([a, b]) => {
    const line = el('line', {
      class: `ip-edge ${cls}`,
      x1: pos[a].x,
      y1: pos[a].y,
      x2: pos[b].x,
      y2: pos[b].y,
    });
    gg.appendChild(line);
    edgeEls[`${a}-${b}`] = line;
  });

  const nodeEls = {};
  NODES.forEach((n) => {
    const circle = el('circle', {
      class: `ip-node ${cls}`,
      cx: pos[n.id].x,
      cy: pos[n.id].y,
      r: 8,
    });
    gg.appendChild(circle);
    nodeEls[n.id] = circle;
  });

  const status = el('text', { class: 'qi-label ip-status', x: pad, y: h - 12 });
  svg.appendChild(status);

  return { svg, nodeEls, edgeEls, status };
}

export function mount(node) {
  node.classList.add('qi-ip');

  const wrap = document.createElement('div');
  wrap.className = 'qi-fig';
  node.appendChild(wrap);

  const panels = document.createElement('div');
  panels.className = 'ip-panels';
  wrap.appendChild(panels);

  const PANEL_W = 320;
  const PANEL_H = 200;
  const cpu = buildPanel({
    w: PANEL_W,
    h: PANEL_H,
    title: 'CPU: one node per step',
    cls: 'ip--cpu',
    ariaLabel: 'CPU panel: places one graph node at a time while building the HNSW index.',
  });
  const gpu = buildPanel({
    w: PANEL_W,
    h: PANEL_H,
    title: 'GPU: a batch per step',
    cls: 'ip--gpu',
    ariaLabel: 'GPU panel: places a batch of nodes in the same pass, reaching further into the same graph at each step.',
  });
  panels.appendChild(cpu.svg);
  panels.appendChild(gpu.svg);

  const total = BUILD_ORDER.length;

  function paint(panel, placedCount, statusText) {
    const placed = new Set(BUILD_ORDER.slice(0, placedCount));
    const current = new Set(BUILD_ORDER.slice(Math.max(0, placedCount - 1), placedCount));
    NODES.forEach((n) => {
      const el2 = panel.nodeEls[n.id];
      el2.classList.toggle('is-placed', placed.has(n.id));
      el2.classList.toggle('is-current', current.has(n.id));
    });
    Object.entries(panel.edgeEls).forEach(([key, lineEl]) => {
      const [a, b] = key.split('-').map(Number);
      lineEl.classList.toggle('is-placed', placed.has(a) && placed.has(b));
    });
    panel.status.textContent = statusText;
  }

  let step = 0;

  // Both panels advance on the same visual clock (one step per tick), so the
  // GPU panel — which places GPU_BATCH nodes per step — visibly finishes
  // sooner and then holds at "done" while the CPU panel keeps going.
  function render() {
    const cpuPlaced = Math.min(step, total);
    paint(cpu, cpuPlaced, `placed ${cpuPlaced} of ${total} nodes`);

    const gpuPlaced = Math.min(step * GPU_BATCH, total);
    paint(
      gpu,
      gpuPlaced,
      gpuPlaced >= total
        ? `done in ${GPU_STEPS} steps`
        : `placed ${gpuPlaced} of ${total} nodes (batch of ${GPU_BATCH})`
    );
  }

  render();

  let timer = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduceMotion.matches) {
    timer = window.setInterval(() => {
      step += 1;
      if (step > total + 2) step = 0; // brief pause at completion, then restart
      render();
    }, 700);
  }
  node.addEventListener('island:teardown', () => timer && window.clearInterval(timer), { once: true });

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
