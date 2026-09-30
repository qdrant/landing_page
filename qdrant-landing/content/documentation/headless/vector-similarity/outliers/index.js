const NS = 'http://www.w3.org/2000/svg';
const DESKTOP = { width: 900, height: 570 };
const MOBILE = { width: 354, height: 760 };
const STACK_AT = 560;
const PHOTOS = '/articles_data/vector-similarity-beyond-search/photos/';
const CLOUD = [
  [300, 135], [330, 230], [360, 280], [460, 120], [500, 195], [530, 300],
  [580, 125], [600, 340], [680, 175], [310, 390], [520, 465], [690, 350],
];
const REFERENCES = [
  { image: 'wooden-dining-chair.png', point: [360, 170], label: 'Reference #1' },
  { image: 'oak-dining-chair.png', point: [390, 335], label: 'Reference #2' },
  { image: 'office-chair.png', point: [430, 480], label: 'Reference #3' },
];
const CANDIDATES = [
  { image: 'caster-wheels.png', point: [690, 255], label: 'Anomaly', role: 'bad' },
  { image: 'rattan-egg-chair.png', point: [650, 440], label: 'Review candidate', role: 'review' },
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

function addLink(parent, from, to, endInset = 14, startInset = 0) {
  const length = distance(from, to);
  const ux = (to[0] - from[0]) / length;
  const uy = (to[1] - from[1]) / length;
  parent.appendChild(svg('line', {
    class: 'qi-outlier__link',
    x1: from[0] + ux * startInset,
    y1: from[1] + uy * startInset,
    x2: to[0] - ux * endInset,
    y2: to[1] - uy * endInset,
  }));
}

function addPoint(parent, point, role = 'plain') {
  parent.appendChild(svg('circle', {
    class: `qi-outlier__point qi-outlier__point--${role}`,
    cx: point[0], cy: point[1], r: 7,
  }));
  if (role !== 'plain') {
    parent.appendChild(svg('circle', {
      class: `qi-outlier__ring qi-outlier__ring--${role}`,
      cx: point[0], cy: point[1], r: 15,
    }));
  }
}

function addTile(parent, image, x, y, width, height, role) {
  parent.appendChild(svg('rect', {
    class: `qi-outlier__tile qi-outlier__tile--${role}`,
    x, y, width, height,
  }));
  parent.appendChild(svg('image', {
    href: PHOTOS + image,
    x: x + 6, y: y + 6, width: width - 12, height: height - 12,
    preserveAspectRatio: 'xMidYMid meet',
  }));
}

function addLabel(parent, x, y, value, anchor) {
  // The stylesheet centers labels; an inline style is the only way to override it.
  const attrs = anchor ? { class: 'qi-label', x, y, style: `text-anchor: ${anchor}` } : { class: 'qi-label', x, y };
  parent.appendChild(svg('text', attrs, value));
}

export function mount(node) {
  node.classList.add('qi-outlier');
  node.innerHTML = `<div class="qi-fig">
    <svg class="qi-svg qi-outlier__svg" role="img" aria-label="Three chairs are references; an egg chair is a review candidate and caster wheels are an anomaly.">
      <g class="qi-outlier__draw"></g>
    </svg>
  </div>`;

  const svgRoot = node.querySelector('.qi-outlier__svg');
  const drawing = node.querySelector('.qi-outlier__draw');
  let stacked = null;
  let lastWidth = 0;

  function drawDesktop() {
    const references = [
      { ...REFERENCES[0], x: 20, y: 38, width: 112, height: 112, pointStart: [132, 94] },
      { ...REFERENCES[1], x: 20, y: 205, width: 112, height: 112, pointStart: [132, 261] },
      { ...REFERENCES[2], x: 20, y: 372, width: 86, height: 128, pointStart: [106, 436] },
    ];
    references.forEach((item) => {
      // Left-aligned to the tile edge, so the narrower office-chair tile cannot push its label off the canvas.
      addLabel(drawing, item.x, item.y - 10, item.label, 'start');
      addLink(drawing, item.pointStart, item.point);
      addTile(drawing, item.image, item.x, item.y, item.width, item.height, 'reference');
      addPoint(drawing, item.point, 'reference');
    });

    CLOUD.forEach((point) => addPoint(drawing, point));
    const candidateTiles = [
      { ...CANDIDATES[0], x: 730, y: 205, width: 140, height: 108, labelY: 340 },
      { ...CANDIDATES[1], x: 730, y: 390, width: 118, height: 116, labelY: 535 },
    ];
    candidateTiles.forEach((item) => {
      const tileEdge = [item.x, item.y + item.height / 2];
      addLink(drawing, item.point, tileEdge, 0, 16);
      addPoint(drawing, item.point, item.role);
      addTile(drawing, item.image, item.x, item.y, item.width, item.height, item.role);
      addLabel(drawing, item.x + item.width / 2, item.labelY, item.label);
    });
  }

  function drawMobile() {
    REFERENCES.forEach((item, index) => {
      const x = [8, 126, 276][index];
      const width = index === 2 ? 70 : 92;
      const labelX = index === 2 ? 300 : x + width / 2;
      addLabel(drawing, labelX, 30, `Reference #${index + 1}`);
      addTile(drawing, item.image, x, 42, width, 92, 'reference');
    });

    const mobilePoints = [
      [65, 250], [120, 295], [180, 240], [240, 270], [290, 320], [75, 355],
      [155, 390], [275, 410], [100, 455], [225, 455], [120, 500], [240, 500],
    ];
    mobilePoints.forEach((point) => addPoint(drawing, point));
    const referenceTargets = [[90, 250], [155, 390], [225, 455]];
    referenceTargets.forEach((point, index) => {
      addLink(drawing, [54 + index * 116, 134], point);
      addPoint(drawing, point, 'reference');
    });

    const mobileCandidates = [
      { ...CANDIDATES[0], point: [112, 520], x: 26, y: 565, width: 150, height: 112, labelY: 710 },
      { ...CANDIDATES[1], point: [242, 520], x: 210, y: 565, width: 118, height: 116, labelY: 710 },
    ];
    mobileCandidates.forEach((item) => {
      addLink(drawing, item.point, [item.x + item.width / 2, item.y], 0, 16);
      addPoint(drawing, item.point, item.role);
      addTile(drawing, item.image, item.x, item.y, item.width, item.height, item.role);
      addLabel(drawing, item.x + item.width / 2, item.labelY, item.label);
    });
  }

  function render(width) {
    stacked = width < STACK_AT;
    const layout = stacked ? MOBILE : DESKTOP;
    svgRoot.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
    drawing.replaceChildren();
    if (stacked) drawMobile();
    else drawDesktop();
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
