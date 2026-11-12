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
 *
 * The region titles/bullets are set both inside the SVG (desktop, where the
 * ~640-wide viewBox keeps them legible) and as HTML cards below the plot
 * (index.css shows one or the other by width) — the same two triangles at
 * every width, but text small enough to read on a phone stays out of the
 * plot instead of shrinking with it.
 */

const NS = 'http://www.w3.org/2000/svg';

const REGIONS = [
  {
    id: 'gpu',
    title: 'GPU pays for itself',
    bullets: ['continuously growing collection', 'frequent embedding-model switches'],
  },
  {
    id: 'scale',
    title: 'scale the GPU down between jobs',
    bullets: ['one-off model migration', 'static collection, indexed once'],
  },
];

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

  // Axis labels, axis titles and region copy all live in one group, hidden
  // below the CSS breakpoint: at that width the ~640-viewBox text would
  // shrink under the readable floor along with the rest of the plot. The
  // HTML axis strip and region cards appended after the SVG take over.
  const svgCopy = el('g', { class: 'ic-svg-copy' });
  svg.appendChild(svgCopy);

  // Axis labels: low/high on both axes.
  svgCopy.appendChild(text('text', { class: 'qi-label', x: plotX - 10, y: plotY + 4, 'text-anchor': 'end' }, 'high'));
  svgCopy.appendChild(text('text', { class: 'qi-label', x: plotX - 10, y: plotY + plotH + 4, 'text-anchor': 'end' }, 'low'));
  svgCopy.appendChild(text('text', { class: 'qi-label', x: plotX, y: plotY + plotH + 22, 'text-anchor': 'start' }, 'low'));
  svgCopy.appendChild(text('text', { class: 'qi-label', x: plotX + plotW, y: plotY + plotH + 22, 'text-anchor': 'end' }, 'high'));

  // Axis titles.
  svgCopy.appendChild(
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
  svgCopy.appendChild(
    text(
      'text',
      { class: 'qi-label', x: plotX + plotW / 2, y: plotY + plotH + 46, 'text-anchor': 'middle' },
      'idle time between indexing jobs'
    )
  );

  // Region copy, positioned inside each triangle.
  svgCopy.appendChild(text('text', { class: 'ic-region-title', x: plotX + 24, y: plotY + 56 }, REGIONS[0].title));
  REGIONS[0].bullets.forEach((b, i) => {
    svgCopy.appendChild(text('text', { class: 'qi-label', x: plotX + 24, y: plotY + 84 + i * 20 }, b));
  });

  const scaleBaseY = plotY + plotH - 20 - (REGIONS[1].bullets.length - 1) * 20;
  svgCopy.appendChild(
    text(
      'text',
      { class: 'ic-region-title', x: plotX + plotW - 24, y: scaleBaseY - 24, 'text-anchor': 'end' },
      REGIONS[1].title
    )
  );
  REGIONS[1].bullets.forEach((b, i) => {
    svgCopy.appendChild(
      text('text', { class: 'qi-label', x: plotX + plotW - 24, y: scaleBaseY + i * 20, 'text-anchor': 'end' }, b)
    );
  });

  // HTML axis strip: replaces the SVG's axis titles/low-high labels below the
  // breakpoint, at a font size that does not shrink with the plot.
  const axisStrip = document.createElement('p');
  axisStrip.className = 'ic-axis-strip';
  axisStrip.textContent = 'y: re-indexing frequency (low → high) · x: idle time between indexing jobs (low → high)';
  wrap.appendChild(axisStrip);

  // HTML cards: same copy as the SVG, shown instead of it below the CSS
  // breakpoint so region descriptions stay at a readable font size on a
  // phone regardless of how much the plot itself has to shrink.
  const cards = document.createElement('div');
  cards.className = 'ic-cards';
  REGIONS.forEach((region) => {
    const card = document.createElement('div');
    card.className = `ic-card ic-card--${region.id}`;
    const title = document.createElement('p');
    title.className = 'ic-card__title';
    title.textContent = region.title;
    card.appendChild(title);
    const list = document.createElement('ul');
    list.className = 'ic-card__list';
    region.bullets.forEach((b) => {
      const li = document.createElement('li');
      li.textContent = b;
      list.appendChild(li);
    });
    card.appendChild(list);
    cards.appendChild(card);
  });
  wrap.appendChild(cards);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
