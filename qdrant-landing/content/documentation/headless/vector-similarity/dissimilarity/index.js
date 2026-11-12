const NS = 'http://www.w3.org/2000/svg';
const DESKTOP = { width: 900, height: 560 };
const MOBILE = { width: 354, height: 205 };
const STACK_AT = 560;
const QUERY = { x: 450, y: 280 };
const POINTS = [
  [120, 100], [210, 170], [300, 90], [380, 240], [455, 130], [535, 320], [620, 110],
  [700, 250], [780, 170], [165, 340], [295, 420], [440, 390], [590, 450], [760, 390],
  [820, 80], [90, 250], [345, 330], [660, 200], [515, 70], [230, 280], [715, 320],
];

function svg(name, attrs = {}, text) {
  const element = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  if (text != null) element.textContent = text;
  return element;
}

function distance(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function farthestPoints() {
  return POINTS
    .map((point, index) => ({ point, index, distance: distance(point, [QUERY.x, QUERY.y]) }))
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 6)
    .map(({ point }) => point);
}

function assertFarthest(points) {
  const expected = [[820, 80], [120, 100], [90, 250], [780, 170], [760, 390], [165, 340]];
  if (points.some((point, index) => point.join(',') !== expected[index].join(','))) {
    throw new Error(`dissimilarity farthest-point assertion failed: ${points.map((p) => p.join(',')).join('|')}`);
  }
}

export function mount(node) {
  node.classList.add('qi-dissimilarity');
  node.innerHTML = `<div class="qi-fig">
    <svg class="qi-svg qi-dissimilarity__svg" role="img" aria-label="A query point connects to the six points farthest from it, ringed as results.">
      <g class="qi-dissimilarity__geometry"></g>
      <rect class="qi-dissimilarity__query-label-bg" rx="3" />
      <text class="qi-label qi-dissimilarity__query">Query</text>
    </svg>
  </div>`;

  const svgRoot = node.querySelector('.qi-dissimilarity__svg');
  const geometry = node.querySelector('.qi-dissimilarity__geometry');
  const queryLabel = node.querySelector('.qi-dissimilarity__query');
  const queryLabelBackground = node.querySelector('.qi-dissimilarity__query-label-bg');
  const ranked = farthestPoints();
  assertFarthest(ranked);
  let stacked = null;
  let lastWidth = 0;

  function drawGeometry() {
    geometry.replaceChildren();
    ranked.forEach((point) => {
      geometry.appendChild(svg('line', {
        class: 'qi-dissimilarity__link',
        x1: QUERY.x,
        y1: QUERY.y,
        x2: point[0],
        y2: point[1],
      }));
    });
    POINTS.forEach(([x, y]) => geometry.appendChild(svg('circle', { class: 'qi-dissimilarity__point', cx: x, cy: y, r: 8 })));
    ranked.forEach(([x, y]) => geometry.appendChild(svg('circle', { class: 'qi-dissimilarity__result', cx: x, cy: y, r: 16 })));
    geometry.appendChild(svg('circle', { class: 'qi-dissimilarity__query-point', cx: QUERY.x, cy: QUERY.y, r: 13 }));
  }

  function render(width) {
    stacked = width < STACK_AT;
    if (stacked) {
      svgRoot.setAttribute('viewBox', `0 0 ${MOBILE.width} ${MOBILE.height}`);
      geometry.setAttribute('transform', 'translate(16 18) scale(0.36)');
      queryLabelBackground.setAttribute('x', '190');
      queryLabelBackground.setAttribute('y', '103');
      queryLabelBackground.setAttribute('width', '48');
      queryLabelBackground.setAttribute('height', '26');
      queryLabel.setAttribute('x', '194');
      queryLabel.setAttribute('y', '122');
    } else {
      svgRoot.setAttribute('viewBox', `0 0 ${DESKTOP.width} ${DESKTOP.height}`);
      geometry.removeAttribute('transform');
      queryLabelBackground.setAttribute('x', '470');
      queryLabelBackground.setAttribute('y', '238');
      queryLabelBackground.setAttribute('width', '64');
      queryLabelBackground.setAttribute('height', '28');
      queryLabel.setAttribute('x', '476');
      queryLabel.setAttribute('y', '260');
    }
    drawGeometry();
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
