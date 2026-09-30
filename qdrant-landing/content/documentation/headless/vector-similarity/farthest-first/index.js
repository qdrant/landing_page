const NS = 'http://www.w3.org/2000/svg';
const DESKTOP = { width: 900, height: 620 };
const MOBILE = { width: 354, height: 760 };
const STACK_AT = 560;
const MOBILE_SCALE = 0.55;
const LABEL_GAP = 38;
const POINTS = [
  { name: 'wooden dining chair', x: 170, y: 188 },
  { name: 'bedside reading lamp', x: 680, y: 188 },
  { name: 'metal filing cabinet', x: 170, y: 560 },
  { name: 'set of five rubber caster wheels', x: 462, y: 452 },
  { name: 'velvet armchair', x: 206, y: 90 },
  { name: 'oak dining table', x: 267, y: 180 },
  { name: 'brass floor lamp', x: 376, y: 168 },
  { name: 'walnut bookshelf', x: 304, y: 237 },
  { name: 'leather sofa', x: 510, y: 237 },
  { name: 'ergonomic office chair', x: 243, y: 325 },
  { name: 'rattan hanging egg chair', x: 340, y: 335 },
];
const EXPECTED_PICK_ORDER = [0, 1, 2, 3];
const MOBILE_LABELS = [
  ['1. wooden dining chair'],
  ['2. bedside reading lamp'],
  ['3. metal filing cabinet'],
  ['4. set of five rubber', '   caster wheels'],
];

function svg(name, attrs = {}, text) {
  const element = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  if (text != null) element.textContent = text;
  return element;
}

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function chooseNext(picked) {
  return POINTS
    .map((point, index) => ({
      index,
      nearestPicked: Math.min(...picked.map((pickedIndex) => distance(point, POINTS[pickedIndex]))),
    }))
    .filter(({ index }) => !picked.includes(index))
    .sort((a, b) => b.nearestPicked - a.nearestPicked)[0].index;
}

function computePickOrder() {
  const order = [0];
  while (order.length < 4) order.push(chooseNext(order));
  if (order.some((index, step) => index !== EXPECTED_PICK_ORDER[step])) {
    throw new Error(`farthest-first order assertion failed: ${order}`);
  }
  return order;
}

// Small preview scatter used in the narrow stacked layout; the legend below it
// carries the real labels, so this only has to stay proportionate and legible.
function mobilePoint(point) {
  return { x: 20 + (point.x - 170) * MOBILE_SCALE, y: 20 + (point.y - 90) * MOBILE_SCALE };
}

export function mount(node) {
  node.classList.add('qi-ff');
  node.innerHTML = `<div class="qi-fig">
    <div class="qi-controls">
      <button type="button" class="qi-chip" data-next>Next pick</button>
      <button type="button" class="qi-chip" data-reset>Reset</button>
    </div>
    <svg class="qi-svg qi-ff__svg" role="img" aria-label="Farthest-first selection adds the point with the largest minimum distance to all previously picked points.">
      <g class="qi-ff__links"></g>
      <g class="qi-ff__points"></g>
      <g class="qi-ff__labels"></g>
    </svg>
    <p class="qi-status qi-ff__status" role="status" aria-live="polite"></p>
  </div>`;

  const svgRoot = node.querySelector('.qi-ff__svg');
  const links = node.querySelector('.qi-ff__links');
  const points = node.querySelector('.qi-ff__points');
  const labels = node.querySelector('.qi-ff__labels');
  const status = node.querySelector('.qi-ff__status');
  const nextButton = node.querySelector('[data-next]');
  const fullOrder = computePickOrder();
  let picked = [fullOrder[0]];
  let stacked = null;
  let lastWidth = 0;

  // Every pick pair gets a dashed link, recomputed from scratch each render so
  // links from earlier steps stay on screen instead of being replaced by the
  // newest pick's links only.
  function drawConnections() {
    links.replaceChildren();
    for (let i = 0; i < picked.length; i++) {
      for (let j = i + 1; j < picked.length; j++) {
        const a = stacked ? mobilePoint(POINTS[picked[i]]) : POINTS[picked[i]];
        const b = stacked ? mobilePoint(POINTS[picked[j]]) : POINTS[picked[j]];
        links.appendChild(svg('line', { class: 'qi-ff__link', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
      }
    }
  }

  function drawPoints() {
    points.replaceChildren();
    POINTS.forEach((point, index) => {
      const position = stacked ? mobilePoint(point) : point;
      points.appendChild(svg('circle', {
        class: picked.includes(index) ? 'qi-ff__point qi-ff__point--picked' : 'qi-ff__point',
        cx: position.x,
        cy: position.y,
        r: picked.includes(index) ? (stacked ? 7 : 11) : (stacked ? 4 : 7),
      }));
    });
  }

  function drawLabels() {
    labels.replaceChildren();
    if (stacked) {
      picked.forEach((index, step) => {
        const point = mobilePoint(POINTS[index]);
        labels.appendChild(svg('text', {
          class: 'qi-ff__number', x: point.x + 13, y: point.y - 12,
        }, String(step + 1)));
      });
      MOBILE_LABELS.slice(0, picked.length).forEach((lines, index) => {
        lines.forEach((line, lineIndex) => {
          labels.appendChild(svg('text', {
            class: 'qi-label qi-ff__mobile-label', x: 177, y: 390 + index * 82 + lineIndex * 20,
          }, line));
        });
      });
      return;
    }

    picked.forEach((index) => {
      const point = POINTS[index];
      labels.appendChild(svg('text', {
        class: 'qi-label', x: point.x, y: point.y - LABEL_GAP, 'text-anchor': 'middle',
      }, point.name));
    });
  }

  function render() {
    drawConnections();
    drawPoints();
    drawLabels();
    const step = picked.length - 1;
    if (step === 0) {
      status.textContent = 'Pick 1 of 4: start from a random point, here the wooden dining chair.';
    } else {
      status.textContent = `Pick ${step + 1} of 4: ${POINTS[picked[step]].name}, the point farthest from everything picked so far.`;
    }
    nextButton.disabled = picked.length === 4;
  }

  function setLayout(width) {
    stacked = width < STACK_AT;
    const layout = stacked ? MOBILE : DESKTOP;
    svgRoot.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
    render();
  }

  nextButton.addEventListener('click', () => {
    if (picked.length < 4) {
      picked.push(chooseNext(picked));
      render();
    }
  });
  node.querySelector('[data-reset]').addEventListener('click', () => {
    picked = [fullOrder[0]];
    render();
  });

  const observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width || node.getBoundingClientRect().width;
    if (width > 0 && (Math.abs(width - lastWidth) > 1 || (width < STACK_AT) !== stacked)) {
      lastWidth = width;
      setLayout(width);
    }
  });
  observer.observe(node);
  setLayout(node.getBoundingClientRect().width || DESKTOP.width);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
