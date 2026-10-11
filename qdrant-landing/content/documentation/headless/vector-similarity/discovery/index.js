const NS = 'http://www.w3.org/2000/svg';
const DESKTOP = { width: 900, height: 440 };
const MOBILE = { width: 354, height: 760 };
const STACK_AT = 560;
const LABEL_PX = 14;

// Positive sits above the anchor, negative sits below, in both panels: only the
// distance along these fixed directions changes between "before" and "after".
const DIR_POSITIVE = [0.5, -0.866];
const DIR_NEGATIVE = [0.5, 0.866];
const ANCHOR_FRAC = [0.4, 0.48];
const DIST_FRAC = {
  beforePositive: 0.35, // before: negative is the closer one (the problem)
  beforeNegative: 0.162,
  afterPositive: 0.108, // after: positive is closer, negative is farther by a margin
  afterNegative: 0.28,
};
const BAR_Y_FRAC = 0.95;

function svg(name, attrs = {}, text) {
  const element = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  if (text != null) element.textContent = text;
  return element;
}

function distance(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function connector(parent, a, b, className = 'qi-vsd__connector', insetA = 12, insetB = 12) {
  const d = distance(a, b);
  if (d < 1) return;
  const ux = (b[0] - a[0]) / d;
  const uy = (b[1] - a[1]) / d;
  parent.appendChild(svg('line', {
    x1: a[0] + ux * insetA,
    y1: a[1] + uy * insetA,
    x2: b[0] - ux * insetB,
    y2: b[1] - uy * insetB,
    class: className,
    'marker-end': 'url(#qi-vsd-arrow)',
  }));
}

export function mount(node) {
  node.classList.add('qi-vsd');
  node.innerHTML = `<div class="qi-fig">
    <svg class="qi-svg qi-vsd__svg" role="img" aria-label="Triplet loss trains an embedding model from an anchor, a positive example, and a negative example. Before learning, the negative example sits closer to the anchor than the positive one, which is the problem. After learning, the positive is closer to the anchor and the negative is farther away by at least the margin; faint ghost markers and dashed arrows show where the positive and negative moved from. The distance bar marks the anchor-to-positive and anchor-to-negative distances; the gap is the margin.">
      <defs><marker id="qi-vsd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z"/></marker></defs>
      <g class="qi-vsd__drawing"></g>
    </svg>
  </div>`;

  const svgRoot = node.querySelector('.qi-vsd__svg');
  const drawing = node.querySelector('.qi-vsd__drawing');
  let lastWidth = 0;
  let stacked = null;

  const addText = (parent, x, y, text, className = 'qi-label qi-label--strong', anchor = 'middle') => {
    parent.appendChild(svg('text', { x, y, class: className, 'text-anchor': anchor }, text));
  };

  function addPoint(parent, point, kind) {
    const group = svg('g', { class: `qi-vsd__point qi-vsd__point--${kind}` });
    group.appendChild(svg('circle', { cx: point[0], cy: point[1], r: 10 }));
    parent.appendChild(group);
  }

  function addGhost(parent, point, kind) {
    parent.appendChild(svg('circle', { cx: point[0], cy: point[1], r: 8, class: `qi-vsd__ghost qi-vsd__ghost--${kind}` }));
  }

  function drawPanel({ x, y, width, height, title, before }) {
    const group = svg('g');
    group.appendChild(svg('rect', { x, y, width, height, rx: 6, class: 'qi-vsd__panel' }));
    addText(group, x + 16, y + 28, title, 'qi-frame-label', 'start');

    const anchor = [x + ANCHOR_FRAC[0] * width, y + ANCHOR_FRAC[1] * height];
    const along = (dir, frac) => [anchor[0] + dir[0] * frac * height, anchor[1] + dir[1] * frac * height];

    const positive = along(DIR_POSITIVE, before ? DIST_FRAC.beforePositive : DIST_FRAC.afterPositive);
    const negative = along(DIR_NEGATIVE, before ? DIST_FRAC.beforeNegative : DIST_FRAC.afterNegative);

    if (!before) {
      const ghostPositive = along(DIR_POSITIVE, DIST_FRAC.beforePositive);
      const ghostNegative = along(DIR_NEGATIVE, DIST_FRAC.beforeNegative);
      addGhost(group, ghostPositive, 'positive');
      addGhost(group, ghostNegative, 'negative');
      connector(group, ghostPositive, positive, 'qi-vsd__motion', 10, 12);
      connector(group, ghostNegative, negative, 'qi-vsd__motion', 10, 12);
    }

    connector(group, anchor, positive);
    connector(group, anchor, negative);
    addPoint(group, anchor, 'anchor');
    addPoint(group, positive, 'positive');
    addPoint(group, negative, 'negative');
    addText(group, anchor[0] - 14, anchor[1] + 30, 'Anchor', 'qi-label qi-label--strong', 'end');
    addText(group, positive[0], positive[1] - 22, 'Positive', 'qi-label qi-label--strong', 'middle');
    addText(group, negative[0], negative[1] + 26, 'Negative', 'qi-label qi-label--strong', 'middle');

    if (!before) drawDistanceBar(group, anchor, positive, negative, x, width, y + height * BAR_Y_FRAC);
    drawing.appendChild(group);
  }

  function drawDistanceBar(parent, anchor, positive, negative, panelX, panelWidth, y) {
    const positiveDistance = distance(anchor, positive);
    const negativeDistance = distance(anchor, negative);
    const scale = (panelWidth - 52) / negativeDistance;
    const start = panelX + 26;
    const positiveTick = start + positiveDistance * scale;
    const negativeTick = start + negativeDistance * scale;
    const center = (positiveTick + negativeTick) / 2;

    parent.appendChild(svg('line', { x1: start, y1: y, x2: negativeTick, y2: y, class: 'qi-vsd__distance' }));
    [start, positiveTick, negativeTick].forEach((x) => parent.appendChild(svg('line', {
      x1: x, y1: y - 8, x2: x, y2: y + 8, class: 'qi-vsd__distance-tick',
    })));
    parent.appendChild(svg('line', {
      x1: positiveTick, y1: y, x2: negativeTick, y2: y, class: 'qi-vsd__margin',
    }));
    parent.appendChild(svg('line', { x1: positiveTick, y1: y - 12, x2: positiveTick, y2: y + 12, class: 'qi-vsd__guide' }));
    parent.appendChild(svg('line', { x1: negativeTick, y1: y - 12, x2: negativeTick, y2: y + 12, class: 'qi-vsd__guide' }));
    addText(parent, center, y - 17, 'margin', 'qi-label');
  }

  function render(width) {
    const nextStacked = width < STACK_AT;
    const layout = nextStacked ? MOBILE : DESKTOP;
    stacked = nextStacked;
    lastWidth = width;
    svgRoot.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
    const fontSize = Math.max(14, LABEL_PX * layout.width / Math.max(width, 1));
    svgRoot.style.setProperty('--vsd-label-size', `${fontSize}px`);
    drawing.replaceChildren();

    if (stacked) {
      const panelX = 8;
      const panelWidth = 338;
      const panelHeight = 344;
      const firstY = 8;
      const secondY = 408;
      drawPanel({ x: panelX, y: firstY, width: panelWidth, height: panelHeight, title: 'BEFORE LEARNING', before: true });
      drawPanel({ x: panelX, y: secondY, width: panelWidth, height: panelHeight, title: 'AFTER LEARNING', before: false });
      drawing.appendChild(svg('line', { x1: 177, y1: 360, x2: 177, y2: 397, class: 'qi-vsd__learning', 'marker-end': 'url(#qi-vsd-arrow)' }));
      addText(drawing, 192, 384, 'training step', 'qi-label', 'start');
    } else {
      const panelY = 54;
      const panelWidth = 425;
      const panelHeight = 370;
      const leftX = 8;
      const rightX = 467;
      drawPanel({ x: leftX, y: panelY, width: panelWidth, height: panelHeight, title: 'BEFORE LEARNING', before: true });
      drawPanel({ x: rightX, y: panelY, width: panelWidth, height: panelHeight, title: 'AFTER LEARNING', before: false });
      drawing.appendChild(svg('line', { x1: 438, y1: 239, x2: 458, y2: 239, class: 'qi-vsd__learning', 'marker-end': 'url(#qi-vsd-arrow)' }));
    }
  }

  const observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width || node.getBoundingClientRect().width;
    if (width > 0 && (Math.abs(width - lastWidth) > 1 || (width < STACK_AT) !== stacked)) render(width);
  });
  observer.observe(node);
  render(node.getBoundingClientRect().width || DESKTOP.width);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
