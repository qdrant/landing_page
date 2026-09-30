const NS = 'http://www.w3.org/2000/svg';
const DESKTOP = { width: 900, height: 470 };
const MOBILE = { width: 600, height: 920 };
const STACK_AT = 560;
let instanceCount = 0;

function svg(name, attrs = {}, text) {
  const element = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  if (text != null) element.textContent = text;
  return element;
}

function addLabel(parent, x, y, text, extra = {}) {
  parent.appendChild(svg('text', { class: 'qi-label', x, y, ...extra }, text));
}

export function mount(node) {
  node.classList.add('qi-venn');
  const clipId = `qi-venn-left-${++instanceCount}`;
  node.innerHTML = `<div class="qi-fig">
    <svg class="qi-svg qi-venn__svg" role="img" aria-label="Full-text search supports synonyms, quick counts, and facets. Vector search supports dissimilarity search, recommendations, diversity search, and multimodality. Both support similarity search and filters.">
      <defs><clipPath id="${clipId}"><ellipse class="qi-venn__clip" /></clipPath></defs>
      <g class="qi-venn__draw"></g>
    </svg>
  </div>`;

  const svgRoot = node.querySelector('.qi-venn__svg');
  const clipEllipse = node.querySelector('.qi-venn__clip');
  const drawing = node.querySelector('.qi-venn__draw');
  let stacked = null;
  let lastWidth = 0;

  function drawDesktop() {
    const left = { cx: 330, cy: 270, rx: 260, ry: 175 };
    const right = { cx: 570, cy: 270, rx: 260, ry: 175 };
    clipEllipse.setAttribute('cx', left.cx);
    clipEllipse.setAttribute('cy', left.cy);
    clipEllipse.setAttribute('rx', left.rx);
    clipEllipse.setAttribute('ry', left.ry);
    drawing.appendChild(svg('ellipse', { ...left, class: 'qi-venn__left' }));
    drawing.appendChild(svg('ellipse', { ...right, class: 'qi-venn__right' }));
    drawing.appendChild(svg('ellipse', { ...right, class: 'qi-venn__overlap', 'clip-path': `url(#${clipId})` }));
    addLabel(drawing, 250, 43, 'Full-text search', { class: 'qi-frame-label' });
    addLabel(drawing, 650, 43, 'Vector search', { class: 'qi-frame-label' });
    [
      [170, 205, 'Synonyms'], [170, 270, 'Quick counts'], [170, 335, 'Facets'],
      [450, 245, 'Similarity search'], [450, 300, 'Filters'],
      [690, 175, 'Dissimilarity search'], [690, 235, 'Recommendations'],
      [690, 295, 'Diversity search'], [690, 355, 'Multimodality'],
    ].forEach(([x, y, label]) => addLabel(drawing, x, y, label));
  }

  // Narrow screens: the two sets stack vertically, labels run down the middle,
  // and the titles sit outside the ellipses.
  function drawMobile() {
    const left = { cx: 300, cy: 290, rx: 285, ry: 230 };
    const right = { cx: 300, cy: 630, rx: 285, ry: 230 };
    clipEllipse.setAttribute('cx', left.cx);
    clipEllipse.setAttribute('cy', left.cy);
    clipEllipse.setAttribute('rx', left.rx);
    clipEllipse.setAttribute('ry', left.ry);
    drawing.appendChild(svg('ellipse', { ...left, class: 'qi-venn__left' }));
    drawing.appendChild(svg('ellipse', { ...right, class: 'qi-venn__right' }));
    drawing.appendChild(svg('ellipse', { ...right, class: 'qi-venn__overlap', 'clip-path': `url(#${clipId})` }));
    addLabel(drawing, 300, 40, 'Full-text search', { class: 'qi-frame-label' });
    addLabel(drawing, 300, 900, 'Vector search', { class: 'qi-frame-label' });
    [
      [300, 170, 'Synonyms'], [300, 235, 'Quick counts'], [300, 300, 'Facets'],
      [300, 450, 'Similarity search'], [300, 492, 'Filters'],
      [300, 600, 'Dissimilarity search'], [300, 660, 'Recommendations'],
      [300, 720, 'Diversity search'], [300, 780, 'Multimodality'],
    ].forEach(([x, y, label]) => addLabel(drawing, x, y, label));
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
