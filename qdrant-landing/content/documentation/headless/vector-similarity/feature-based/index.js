const NS = 'http://www.w3.org/2000/svg';
const DESKTOP = { width: 900, height: 410 };
const MOBILE = { width: 354, height: 430 };
const STACK_AT = 560;
const SCALE = 130;
const DATA = [
  { query: 0.55, positive: 0.72, negative: -0.80 },
  { query: 0.35, positive: 0.48, negative: -0.40 },
  { query: 0.78, positive: 0.90, negative: -0.20 },
  { query: 0.25, positive: 0.40, negative: -0.70 },
  { query: 0.12, positive: 0.20, negative: -0.90 },
  { query: 0.50, positive: 0.55, negative: -0.50 },
  { query: 0.18, positive: 0.30, negative: -0.30 },
  { query: 0.40, positive: 0.68, negative: -0.60 },
];
const LEGEND = [
  { label: 'search query', role: 'query' },
  { label: 'positive examples', role: 'positive' },
  { label: 'negative examples', role: 'negative' },
];

function svg(name, attrs = {}, text) {
  const element = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  if (text != null) element.textContent = text;
  return element;
}

function addBar(parent, role, x, y, width, height) {
  parent.appendChild(svg('rect', {
    class: `qi-feature__bar qi-feature__bar--${role}`,
    x, y, width, height,
  }));
}

function addLegend(parent, narrow) {
  const positions = narrow ? [
    [56, 24, 80, 39], [56, 50, 80, 65], [56, 76, 80, 91],
  ] : [
    [100, 26, 124, 41], [370, 26, 394, 41], [640, 26, 664, 41],
  ];
  LEGEND.forEach(({ label, role }, index) => {
    const [x, y, labelX, labelY] = positions[index];
    addBar(parent, `legend-${role}`, x, y, 16, 16);
    parent.appendChild(svg('text', {
      class: `qi-label qi-feature__legend-label qi-feature__legend-label--${role}`,
      x: labelX, y: labelY,
    }, label));
  });
}

function drawChart(svgRoot, drawing, narrow) {
  const axisY = narrow ? 260 : 220;
  const plotLeft = narrow ? 16 : 100;
  const plotWidth = narrow ? 322 : 700;
  const slot = plotWidth / DATA.length;
  drawing.replaceChildren();
  drawing.appendChild(svg('line', {
    class: 'qi-feature__axis', x1: plotLeft, y1: axisY, x2: plotLeft + plotWidth, y2: axisY,
  }));

  DATA.forEach((value, index) => {
    const center = plotLeft + slot * (index + 0.5);
    const outlineWidth = narrow ? 18 : 38;
    const queryWidth = narrow ? 12 : 26;
    const positiveHeight = value.positive * SCALE;
    const queryHeight = value.query * SCALE;
    const negativeHeight = Math.abs(value.negative) * SCALE;
    addBar(drawing, 'positive', center - outlineWidth / 2, axisY - positiveHeight, outlineWidth, positiveHeight);
    addBar(drawing, 'query', center - queryWidth / 2, axisY - queryHeight, queryWidth, queryHeight);
    addBar(drawing, 'negative', center - outlineWidth / 2, axisY, outlineWidth, negativeHeight);
    drawing.appendChild(svg('text', {
      class: 'qi-label qi-feature__dimension', x: center, y: narrow ? 405 : 365,
    }, `d${index + 1}`));
  });

  addLegend(drawing, narrow);
  const layout = narrow ? MOBILE : DESKTOP;
  svgRoot.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
}

export function mount(node) {
  node.classList.add('qi-feature');
  node.innerHTML = `<div class="qi-fig">
    <svg class="qi-svg qi-feature__svg" role="img" aria-label="Illustrative vector dimensions compare the search query with positive and negative examples.">
      <g class="qi-feature__draw"></g>
    </svg>
  </div>`;

  const svgRoot = node.querySelector('.qi-feature__svg');
  const drawing = node.querySelector('.qi-feature__draw');
  let stacked = null;
  let lastWidth = 0;

  function render(width) {
    stacked = width < STACK_AT;
    drawChart(svgRoot, drawing, stacked);
  }

  const observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width || node.getBoundingClientRect().width;
    if (width > 0 && (Math.abs(width - lastWidth) > 1 || (width < STACK_AT) !== stacked)) {
      lastWidth = width;
      render(width);
    }
  });
  observer.observe(node);
  render(node.getBoundingClientRect().width || DESKTOP.width);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
