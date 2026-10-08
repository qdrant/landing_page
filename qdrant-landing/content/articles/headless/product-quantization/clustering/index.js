/*
 * clustering island: interactive replacement for chunks-clustering.png and vector-of-ids.png.
 *
 * Each group of chunks has its own K-means clustering. A chunk is stored as the id of
 * its closest centroid. Qdrant uses K = 256 centroids per group. This figure shows 4
 * and 6, in a 2D space, to stay readable. Click a panel to move a chunk, or pick a
 * sample vector. The stored vector is the pair of ids.
 */

const NS = 'http://www.w3.org/2000/svg';
const PANELS = [
  {
    title: 'Chunk 1, 4 centroids',
    centroids: [[0.3, -0.55], [0.8, 0.3], [-0.4, 0.62], [-0.8, -0.35]],
    colors: ['#3aa05a', '#f59f1b', '#d6336c', '#2f6ff0'],
  },
  {
    title: 'Chunk 2, 6 centroids',
    centroids: [[-0.3, 0.65], [-0.75, -0.1], [-0.15, -0.6], [0.55, -0.65], [0.75, 0.3], [0.25, 0.65]],
    colors: ['#8b8f9c', '#3aa05a', '#7c4dff', '#e8590c', '#f59f1b', '#00a3b8'],
  },
];
const SAMPLES = [
  { id: 'a', label: 'Example from the article', points: [[0.72, 0.22], [-0.15, -0.45]] },
  { id: 'b', label: 'Another vector', points: [[-0.8, -0.2], [0.7, 0.2]] },
  { id: 'c', label: 'A third vector', points: [[-0.3, 0.4], [-0.6, 0.5]] },
];
const COLS = 30;
const ROWS = 24;

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

function watchNarrow(node, onChange, below = 700) {
  const is = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < below;
  };
  let narrow = is();
  node.classList.toggle('pq-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('pq-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

function nearest(centroids, [u, v]) {
  let best = 0;
  let bestD = Infinity;
  centroids.forEach(([cu, cv], i) => {
    const d = (cu - u) ** 2 + (cv - v) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

export function mount(node) {
  node.classList.add('pq-cl');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Sample vector">',
    SAMPLES.map((s) => `<button type="button" class="qi-chip" data-sample="${s.id}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '    <span class="qi-hint">or click a panel</span>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 330" role="img" aria-label="Two clustered spaces, one per chunk. Each chunk is stored as the id of its closest centroid.">',
    '    <g class="pq-cl__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 pq-cl__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.pq-cl__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.pq-cl__status');
  const chips = [...node.querySelectorAll('[data-sample]')];
  let points = SAMPLES[0].points.map((p) => [...p]);
  let sample = 'a';
  let frames = [];
  const isNarrow = watchNarrow(node, () => render());

  function layout(narrow) {
    return narrow
      ? { W: 340, H: 560, w: 300, h: 190, frame: (i) => ({ ox: 20, oy: 30 + i * 232 }), out: { cx: 170, y: 500 } }
      : { W: 760, H: 330, w: 330, h: 240, frame: (i) => ({ ox: 24 + i * 382, oy: 36 }), out: { cx: 380, y: 292 } };
  }

  function render() {
    const narrow = isNarrow();
    const L = layout(narrow);
    frames = [];
    g.replaceChildren();
    PANELS.forEach((panel, p) => {
      const { ox, oy } = L.frame(p);
      frames.push({ ox, oy, w: L.w, h: L.h });
      const toX = (u) => ox + ((u + 1) / 2) * L.w;
      const toY = (v) => oy + ((1 - v) / 2) * L.h;
      g.appendChild(el('text', { class: 'qi-title', x: ox, y: oy - 12 }, panel.title));
      const cw = L.w / COLS;
      const ch = L.h / ROWS;
      for (let cx = 0; cx < COLS; cx++) {
        for (let cy = 0; cy < ROWS; cy++) {
          const u = ((cx + 0.5) / COLS) * 2 - 1;
          const v = 1 - ((cy + 0.5) / ROWS) * 2;
          g.appendChild(el('rect', { class: 'pq-cl__cell', x: ox + cx * cw, y: oy + cy * ch, width: cw + 0.5, height: ch + 0.5, fill: panel.colors[nearest(panel.centroids, [u, v])] }));
        }
      }
      g.appendChild(el('line', { class: 'pq-cl__axis', x1: ox, y1: toY(0), x2: ox + L.w, y2: toY(0) }));
      g.appendChild(el('line', { class: 'pq-cl__axis', x1: toX(0), y1: oy, x2: toX(0), y2: oy + L.h }));
      panel.centroids.forEach(([u, v], i) => {
        g.appendChild(el('circle', { class: 'pq-cl__centroid', cx: toX(u), cy: toY(v), r: 6, fill: panel.colors[i] }));
        g.appendChild(el('text', { class: 'pq-cl__id', x: toX(u) + 10, y: toY(v) + 5 }, String(i + 1)));
      });
      const target = nearest(panel.centroids, points[p]);
      const [tu, tv] = panel.centroids[target];
      g.appendChild(el('line', { class: 'pq-cl__link', x1: toX(points[p][0]), y1: toY(points[p][1]), x2: toX(tu), y2: toY(tv) }));
      g.appendChild(el('circle', { class: 'pq-cl__point', cx: toX(points[p][0]), cy: toY(points[p][1]), r: 7 }));
    });
    const ids = points.map((pt, p) => nearest(PANELS[p].centroids, pt));
    g.appendChild(el('text', { class: 'qi-label', x: L.out.cx - 120, y: L.out.y + 24, 'text-anchor': 'end' }, 'stored vector'));
    g.appendChild(el('path', { class: 'pq-cl__bracket', d: `M${L.out.cx - 98} ${L.out.y - 2} H${L.out.cx - 106} V${L.out.y + 36} H${L.out.cx - 98}` }));
    g.appendChild(el('path', { class: 'pq-cl__bracket', d: `M${L.out.cx + 98} ${L.out.y - 2} H${L.out.cx + 106} V${L.out.y + 36} H${L.out.cx + 98}` }));
    ids.forEach((id, p) => {
      const x = L.out.cx - 88 + p * 100;
      g.appendChild(el('rect', { class: 'pq-cl__out', x, y: L.out.y, width: 76, height: 34, rx: 6, fill: PANELS[p].colors[id], stroke: PANELS[p].colors[id] }));
      g.appendChild(el('text', { class: 'pq-cl__outval', x: x + 38, y: L.out.y + 24, 'text-anchor': 'middle' }, String(id + 1)));
    });
    svg.setAttribute('viewBox', `0 0 ${L.W} ${L.H}`);
    statusEl.textContent = `Each chunk maps to the closest centroid of its own clustering, and only that id is stored. Here the vector is stored as [${ids.map((i) => i + 1).join(', ')}]. Qdrant uses 256 centroids per group instead of 4 and 6.`;
  }

  function setSample(id) {
    sample = id;
    points = SAMPLES.find((s) => s.id === id).points.map((p) => [...p]);
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sample === sample)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setSample(b.dataset.sample)));

  svg.addEventListener('click', (event) => {
    const box = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const x = ((event.clientX - box.left) / box.width) * vb.width;
    const y = ((event.clientY - box.top) / box.height) * vb.height;
    frames.forEach((f, p) => {
      if (x >= f.ox && x <= f.ox + f.w && y >= f.oy && y <= f.oy + f.h) {
        points[p] = [((x - f.ox) / f.w) * 2 - 1, 1 - ((y - f.oy) / f.h) * 2];
        chips.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        render();
      }
    });
  });

  setSample('a');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
