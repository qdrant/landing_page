/*
 * query-contention island — replacement for gpu-cpu-query-contention.png.
 *
 * Illustrates why query latency is steadier on a GPU-accelerated cluster: on
 * a CPU-only cluster, indexing and query serving take turns on the same
 * cores. On a GPU-accelerated cluster, the GPU builds the index on its own
 * hardware while the CPU is left free to serve queries. Static SVG timelines,
 * framed with margin so the tracks never touch the frame edge. Illustrative
 * scheduling, not a trace of measured CPU cycles.
 */

const NS = 'http://www.w3.org/2000/svg';

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

// Alternating index/query segments sharing one CPU track (illustrative).
const CPU_SEGMENTS = [
  { kind: 'index', w: 2 },
  { kind: 'query', w: 1 },
  { kind: 'index', w: 1.5 },
  { kind: 'query', w: 1 },
  { kind: 'index', w: 2 },
  { kind: 'query', w: 1.2 },
  { kind: 'index', w: 1.3 },
];

function track(g, { x, y, w, h, segments }) {
  let cx = x;
  const totalUnits = segments.reduce((a, s) => a + s.w, 0);
  segments.forEach((s) => {
    const sw = (s.w / totalUnits) * w;
    g.appendChild(
      el('rect', {
        class: `qc-seg qc-seg--${s.kind}`,
        x: cx,
        y,
        width: Math.max(sw - 2, 1),
        height: h,
        rx: 3,
      })
    );
    cx += sw;
  });
}

export function mount(node) {
  node.classList.add('qi-qc');

  const wrap = document.createElement('div');
  wrap.className = 'qi-fig';
  node.appendChild(wrap);

  const VB_W = 640;
  const VB_H = 220;
  const svg = el('svg', {
    class: 'qi-svg',
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    role: 'img',
    'aria-label':
      'On a CPU-only cluster, indexing and query serving share the same CPU track. On a GPU-accelerated cluster, indexing runs on the GPU while the CPU track is dedicated to queries.',
  });
  wrap.appendChild(svg);

  const pad = 18;
  const panelW = (VB_W - 24) / 2;
  const panelH = VB_H;

  [0, 1].forEach((i) => {
    const gpuPanel = i === 1;
    const gx = i * (panelW + 24);
    const g = el('g', { transform: `translate(${gx}, 0)` });
    svg.appendChild(g);

    g.appendChild(
      el('rect', { class: 'qi-frame', x: 0, y: 0, width: panelW, height: panelH, rx: 10 })
    );
    g.appendChild(
      text('text', { class: 'qi-title', x: pad, y: 28 }, gpuPanel ? 'GPU-accelerated cluster' : 'CPU-only cluster')
    );

    const trackW = panelW - pad * 2;
    if (!gpuPanel) {
      g.appendChild(text('text', { class: 'qi-label', x: pad, y: 62 }, 'CPU'));
      track(g, { x: pad, y: 72, w: trackW, h: 28, segments: CPU_SEGMENTS });
    } else {
      g.appendChild(text('text', { class: 'qi-label', x: pad, y: 62 }, 'GPU'));
      g.appendChild(
        el('rect', { class: 'qc-seg qc-seg--index', x: pad, y: 72, width: trackW, height: 28, rx: 3 })
      );
      g.appendChild(text('text', { class: 'qi-label', x: pad, y: 130 }, 'CPU'));
      g.appendChild(
        el('rect', { class: 'qc-seg qc-seg--query', x: pad, y: 140, width: trackW, height: 28, rx: 3 })
      );
    }

    const legendY = panelH - 30;
    g.appendChild(el('rect', { class: 'qc-seg qc-seg--index', x: pad, y: legendY, width: 14, height: 14, rx: 3 }));
    g.appendChild(text('text', { class: 'qi-label', x: pad + 20, y: legendY + 12 }, 'indexing'));
    g.appendChild(el('rect', { class: 'qc-seg qc-seg--query', x: pad + 100, y: legendY, width: 14, height: 14, rx: 3 }));
    g.appendChild(text('text', { class: 'qi-label', x: pad + 120, y: legendY + 12 }, 'query'));
  });

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
