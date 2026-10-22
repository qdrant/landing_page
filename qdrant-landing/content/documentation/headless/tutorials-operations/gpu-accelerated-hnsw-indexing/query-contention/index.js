/*
 * query-contention island — replacement for gpu-cpu-query-contention.png.
 *
 * Illustrates why query latency is steadier on a GPU-accelerated cluster: on
 * a CPU-only cluster, indexing and query serving take turns on the same
 * cores. On a GPU-accelerated cluster, the GPU builds the index on its own
 * hardware while the CPU is left free to serve queries. Static SVG timelines,
 * framed with margin so the tracks never touch the frame edge. Illustrative
 * scheduling, not a trace of measured CPU cycles.
 *
 * Each panel is its own <svg> in a flex row, so a narrow-screen media query
 * (index.css) can stack them into a column instead of shrinking both panels'
 * text below the readable floor.
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

function track(parent, { x, y, w, h, segments }) {
  let cx = x;
  const totalUnits = segments.reduce((a, s) => a + s.w, 0);
  segments.forEach((s) => {
    const sw = (s.w / totalUnits) * w;
    parent.appendChild(
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

  const panels = document.createElement('div');
  panels.className = 'qc-panels';
  wrap.appendChild(panels);

  const pad = 18;
  const panelW = 300;
  const panelH = 220;

  [0, 1].forEach((i) => {
    const gpuPanel = i === 1;
    const svg = el('svg', {
      class: 'qi-svg qc-panel-svg',
      viewBox: `0 0 ${panelW} ${panelH}`,
      role: 'img',
      'aria-label': gpuPanel
        ? 'GPU-accelerated cluster: indexing runs on the GPU while the CPU track is dedicated to queries.'
        : 'CPU-only cluster: indexing and query serving share the same CPU track.',
    });
    panels.appendChild(svg);

    svg.appendChild(
      el('rect', { class: 'qi-frame', x: 0, y: 0, width: panelW, height: panelH, rx: 10 })
    );
    svg.appendChild(
      text('text', { class: 'qi-title', x: pad, y: 28 }, gpuPanel ? 'GPU-accelerated cluster' : 'CPU-only cluster')
    );

    const trackW = panelW - pad * 2;
    if (!gpuPanel) {
      svg.appendChild(text('text', { class: 'qi-label', x: pad, y: 62 }, 'CPU'));
      track(svg, { x: pad, y: 72, w: trackW, h: 28, segments: CPU_SEGMENTS });
    } else {
      svg.appendChild(text('text', { class: 'qi-label', x: pad, y: 62 }, 'GPU'));
      svg.appendChild(
        el('rect', { class: 'qc-seg qc-seg--index', x: pad, y: 72, width: trackW, height: 28, rx: 3 })
      );
      svg.appendChild(text('text', { class: 'qi-label', x: pad, y: 130 }, 'CPU'));
      svg.appendChild(
        el('rect', { class: 'qc-seg qc-seg--query', x: pad, y: 140, width: trackW, height: 28, rx: 3 })
      );
    }

    const legendY = panelH - 30;
    svg.appendChild(el('rect', { class: 'qc-seg qc-seg--index', x: pad, y: legendY, width: 14, height: 14, rx: 3 }));
    svg.appendChild(text('text', { class: 'qi-label', x: pad + 20, y: legendY + 12 }, 'indexing'));
    svg.appendChild(el('rect', { class: 'qc-seg qc-seg--query', x: pad + 100, y: legendY, width: 14, height: 14, rx: 3 }));
    svg.appendChild(text('text', { class: 'qi-label', x: pad + 120, y: legendY + 12 }, 'query'));
  });

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
