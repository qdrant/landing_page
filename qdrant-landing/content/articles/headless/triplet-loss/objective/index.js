// Inline the editable fallback so its light colors can inherit the page tokens.
let instance = 0;

function figureUrl(source) {
  const url = new URL(source, window.location.href);
  if (url.origin !== window.location.origin || !url.pathname.startsWith('/articles_data/triplet-loss/')) {
    throw new Error('Unexpected figure URL');
  }
  return url;
}

function prefixIds(svg) {
  // Descriptions and arrow markers must remain independent across instances.
  const prefix = `triplet-objective-${++instance}-`;
  const ids = new Map();
  for (const element of svg.querySelectorAll('[id]')) {
    ids.set(element.id, prefix + element.id);
    element.id = prefix + element.id;
  }
  for (const element of [svg, ...svg.querySelectorAll('*')]) {
    for (const attribute of [...element.attributes]) {
      let value = attribute.value;
      for (const [oldId, newId] of ids) {
        value = value.replaceAll(`url(#${oldId})`, `url(#${newId})`);
        if ((attribute.localName === 'href') && value === `#${oldId}`) value = `#${newId}`;
      }
      if (attribute.name === 'aria-labelledby' || attribute.name === 'aria-describedby') {
        value = value.split(/\s+/).map((id) => ids.get(id) || id).join(' ');
      }
      if (value !== attribute.value) element.setAttribute(attribute.name, value);
    }
  }
}

function watchLayout(node, svg) {
  const before = svg.querySelector('.objective-before');
  const after = svg.querySelector('.objective-after');
  const card = svg.querySelector('.objective-card');
  const arrow = svg.querySelector('.objective-training-arrow');
  const trainingLabel = svg.querySelector('.objective-training text');
  if (!before || !after || !card || !arrow || !trainingLabel) throw new Error('Incomplete objective SVG');
  let stacked;

  function layout() {
    const width = node.getBoundingClientRect().width;
    // At 540px, 20-unit labels in the wide 880-unit view still exceed 12px.
    const narrow = width > 0 && width < 540;
    if (narrow === stacked) return;
    stacked = narrow;
    svg.setAttribute('viewBox', narrow ? '0 0 420 650' : '0 0 880 280');
    card.setAttribute('width', narrow ? '420' : '880');
    card.setAttribute('height', narrow ? '650' : '280');
    before.setAttribute('transform', 'translate(0 0)');
    after.setAttribute('transform', narrow ? 'translate(0 360)' : 'translate(460 0)');
    // Only the Training arrow changes shape. The triplet geometry stays intact.
    arrow.setAttribute('d', narrow
      ? 'M260 273 C310 273 310 295 310 337'
      : 'M365 60 C365 16 505 16 505 60');
    trainingLabel.setAttribute('x', narrow ? '205' : '435');
    trainingLabel.setAttribute('y', narrow ? '307' : '65');
  }

  layout();
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(layout);
    observer.observe(node);
  }
}

export async function mount(node) {
  try {
    const image = node.closest('.island').querySelector('.island__fallback img');
    if (!image) throw new Error('Missing objective fallback');
    const response = await fetch(figureUrl(image.src));
    if (!response.ok) throw new Error(`Figure request failed: ${response.status}`);
    // Also reject redirects outside the allowed local asset directory.
    figureUrl(response.url);
    const document = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    const svg = document.documentElement;
    if (svg.localName !== 'svg' || svg.namespaceURI !== 'http://www.w3.org/2000/svg' || document.querySelector('parsererror')) {
      throw new Error('Invalid figure SVG');
    }
    prefixIds(svg);
    svg.setAttribute('aria-label', image.alt);
    svg.classList.add('qi-svg');
    node.classList.add('triplet-objective');
    node.append(svg);
    watchLayout(node, svg);
    node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
  } catch (error) {
    node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
    console.error('Triplet loss objective figure:', error);
  }
}
