/*
 * idle-cost-tradeoff island — replacement for gpu-idle-cost-tradeoff.png.
 *
 * Reproduces the original figure's quadrant layout: a plot of re-indexing
 * frequency (y) against idle time between indexing jobs (x), split by a
 * dashed diagonal into two regions — "GPU pays for itself" (frequent
 * re-indexing, little idle time) and "scale the GPU down between jobs"
 * (infrequent re-indexing, long idle time). This is a conceptual illustration
 * of the tradeoff described in "Cost of Indexing", not measured cost data.
 * Static SVG, framed with margin so the plot and labels never touch the
 * frame edge.
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

export function mount(node) {
  node.classList.add('qi-ic');

  const wrap = document.createElement('div');
  wrap.className = 'qi-fig';
  node.appendChild(wrap);

  const VB_W = 640;
  const VB_H = 400;
  const svg = el('svg', {
    class: 'qi-svg',
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    role: 'img',
    'aria-label':
      'Quadrant diagram: re-indexing frequency vs. idle time between indexing jobs. When re-indexing is frequent and idle time is low, the GPU pays for itself, for example with a continuously growing collection or frequent embedding-model switches. When re-indexing is rare and idle time is high, scale the GPU down between jobs, for example after a one-off model migration or for a static collection indexed once.',
  });
  wrap.appendChild(svg);

  const padL = 90;
  const padT = 24;
  const padR = 24;
  const padB = 64;
  const plotX = padL;
  const plotY = padT;
  const plotW = VB_W - padL - padR;
  const plotH = VB_H - padT - padB;

  // Plot area: two triangles split by the diagonal from bottom-left to top-right.
  svg.appendChild(
    el('polygon', {
      class: 'ic-region ic-region--gpu',
      points: `${plotX},${plotY} ${plotX + plotW},${plotY} ${plotX},${plotY + plotH}`,
    })
  );
  svg.appendChild(
    el('polygon', {
      class: 'ic-region ic-region--scale',
      points: `${plotX + plotW},${plotY} ${plotX + plotW},${plotY + plotH} ${plotX},${plotY + plotH}`,
    })
  );
  svg.appendChild(
    el('rect', {
      class: 'ic-plot-border',
      x: plotX,
      y: plotY,
      width: plotW,
      height: plotH,
      rx: 10,
      fill: 'none',
    })
  );
  svg.appendChild(
    el('line', {
      class: 'ic-diagonal',
      x1: plotX,
      y1: plotY + plotH,
      x2: plotX + plotW,
      y2: plotY,
    })
  );

  // Axis labels: low/high on both axes.
  svg.appendChild(text('text', { class: 'qi-label', x: plotX - 10, y: plotY + 4, 'text-anchor': 'end' }, 'high'));
  svg.appendChild(text('text', { class: 'qi-label', x: plotX - 10, y: plotY + plotH + 4, 'text-anchor': 'end' }, 'low'));
  svg.appendChild(text('text', { class: 'qi-label', x: plotX, y: plotY + plotH + 22, 'text-anchor': 'start' }, 'low'));
  svg.appendChild(text('text', { class: 'qi-label', x: plotX + plotW, y: plotY + plotH + 22, 'text-anchor': 'end' }, 'high'));

  // Axis titles.
  svg.appendChild(
    text(
      'text',
      {
        class: 'qi-label',
        x: plotX - 60,
        y: plotY + plotH / 2,
        'text-anchor': 'middle',
        transform: `rotate(-90 ${plotX - 60} ${plotY + plotH / 2})`,
      },
      're-indexing frequency'
    )
  );
  svg.appendChild(
    text(
      'text',
      { class: 'qi-label', x: plotX + plotW / 2, y: plotY + plotH + 46, 'text-anchor': 'middle' },
      'idle time between indexing jobs'
    )
  );

  // Region copy, positioned inside each triangle.
  const gpuTitle = text('text', { class: 'ic-region-title', x: plotX + 24, y: plotY + 56 }, 'GPU pays for itself');
  svg.appendChild(gpuTitle);
  svg.appendChild(
    text('text', { class: 'qi-label', x: plotX + 24, y: plotY + 84 }, 'continuously growing collection')
  );
  svg.appendChild(
    text('text', { class: 'qi-label', x: plotX + 24, y: plotY + 104 }, 'frequent embedding-model switches')
  );

  const scaleTitle = text(
    'text',
    { class: 'ic-region-title', x: plotX + plotW - 24, y: plotY + plotH - 64, 'text-anchor': 'end' },
    'scale the GPU down between jobs'
  );
  svg.appendChild(scaleTitle);
  svg.appendChild(
    text(
      'text',
      { class: 'qi-label', x: plotX + plotW - 24, y: plotY + plotH - 40, 'text-anchor': 'end' },
      'one-off model migration'
    )
  );
  svg.appendChild(
    text(
      'text',
      { class: 'qi-label', x: plotX + plotW - 24, y: plotY + plotH - 20, 'text-anchor': 'end' },
      'static collection, indexed once'
    )
  );

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
