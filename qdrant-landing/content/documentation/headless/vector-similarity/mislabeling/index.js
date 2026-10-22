const NS = 'http://www.w3.org/2000/svg';
const DESKTOP = { width: 900, height: 310 };
const MOBILE = { width: 354, height: 470 };
const STACK_AT = 560;
const PHOTOS = '/articles_data/vector-similarity-beyond-search/photos/';
const ITEMS = [
  { image: 'wooden-dining-chair.png', role: 'good', label: '' },
  { image: 'oak-dining-chair.png', role: 'good', label: '' },
  { image: 'office-chair.png', role: 'good', label: '' },
  { image: 'rattan-egg-chair.png', role: 'review', label: 'review' },
  { image: 'caster-wheels.png', role: 'bad', label: 'mislabeled' },
];

function svg(name, attrs = {}, text) {
  const element = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  if (text != null) element.textContent = text;
  return element;
}

function addTile(parent, item, x, y, width, height, role, labelY) {
  parent.appendChild(svg('rect', {
    class: `qi-mislabel__tile qi-mislabel__tile--${role}`,
    x, y, width, height, rx: 5,
  }));
  parent.appendChild(svg('image', {
    href: PHOTOS + item.image,
    x: x + 6,
    y: y + 6,
    width: width - 12,
    height: height - 12,
    preserveAspectRatio: 'xMidYMid meet',
  }));
  if (item.label) {
    parent.appendChild(svg('text', {
      class: 'qi-label qi-mislabel__tile-label',
      x: x + width / 2,
      y: labelY,
    }, item.label));
  }
}

export function mount(node) {
  node.classList.add('qi-mislabel');
  node.innerHTML = `<div class="qi-fig">
    <svg class="qi-svg qi-mislabel__svg" role="img" aria-label="Items ordered by dissimilarity to the query Chair: three chairs, an egg chair for review, and caster wheels mislabeled.">
      <g class="qi-mislabel__draw"></g>
    </svg>
  </div>`;

  const svgRoot = node.querySelector('.qi-mislabel__svg');
  const drawing = node.querySelector('.qi-mislabel__draw');
  let stacked = null;
  let lastWidth = 0;

  function drawDesktop() {
    drawing.appendChild(svg('text', {
      class: 'qi-label qi-mislabel__query', x: 145, y: 153,
    }, 'Query: chair'));
    addTile(drawing, ITEMS[0], 155, 90, 112, 112, 'good', 245);
    addTile(drawing, ITEMS[1], 277, 90, 112, 112, 'good', 245);
    addTile(drawing, ITEMS[2], 399, 90, 86, 128, 'good', 245);
    drawing.appendChild(svg('text', { class: 'qi-label', x: 515, y: 155 }, '…'));
    addTile(drawing, ITEMS[3], 545, 90, 112, 112, 'review', 245);
    addTile(drawing, ITEMS[4], 673, 90, 140, 108, 'bad', 245);
  }

  function drawMobile() {
    drawing.appendChild(svg('text', {
      class: 'qi-label qi-mislabel__mobile-query', x: 177, y: 32,
    }, 'Query: chair'));
    addTile(drawing, ITEMS[0], 12, 65, 100, 110, 'good', 0);
    addTile(drawing, ITEMS[1], 127, 65, 100, 110, 'good', 0);
    addTile(drawing, ITEMS[2], 242, 65, 100, 110, 'good', 0);
    drawing.appendChild(svg('text', { class: 'qi-label', x: 177, y: 218 }, '…'));
    addTile(drawing, ITEMS[3], 18, 250, 146, 128, 'review', 430);
    addTile(drawing, ITEMS[4], 190, 250, 146, 128, 'bad', 430);
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
