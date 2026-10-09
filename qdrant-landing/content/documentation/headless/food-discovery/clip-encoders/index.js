/*
 * clip-encoders island: one model, two encoders, one vector space.
 *
 * CLIP turns an image and a text description into vectors in the same latent
 * space, so the two can be compared directly. Select the image, the text, or
 * the comparison to see what each part does. The vectors are shortened
 * examples, not real model output.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Wide
 * containers lay each lane out in a row; narrow ones place the lanes side by
 * side as columns.
 */

const NS = 'http://www.w3.org/2000/svg';

const NARROW_PX = 560;
const BOX_H = 52;

const LANES = [
  {
    id: 'image',
    input: 'Dish photo',
    encoder: 'Image encoder',
    vector: '[0.1, -1.4, ..., 0.75]',
  },
  {
    id: 'text',
    input: 'Image description',
    encoder: 'Text encoder',
    vector: '[0.09, -1.37, ..., 0.74]',
  },
];

const STATUS = {
  none: 'CLIP has two encoders, one for images and one for texts. Both write into the same vector space. Select a part to see what it does.',
  image: '<b>Image</b>: the image encoder turns a dish photo into a vector. The demo precomputed these for the whole dataset and stored them in Qdrant.',
  text: '<b>Text</b>: the text encoder turns a description, such as a search query, into a vector in the same space as the images.',
  compare:
    '<b>Compare</b>: because both vectors live in the same space, they can be compared directly. A query like "flat bread with toppings" lands near photos of pizza, whatever the wording.',
};

const CHIPS = [
  { id: 'image', label: 'Image' },
  { id: 'text', label: 'Text' },
  { id: 'compare', label: 'Compare' },
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

export function mount(node) {
  node.classList.add('qi-cl');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Part of the model">',
    CHIPS.map((c) => `<button type="button" class="qi-chip qi-cl__chip" data-part="${c.id}" aria-pressed="false">${c.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-cl__svg" role="img"',
    '    aria-label="The CLIP model has an image encoder and a text encoder. A dish photo and an image description each go through their encoder and become vectors in the same space.">',
    '  </svg>',
    '  <p class="qi-status qi-status--3 qi-cl__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-cl__svg');
  const statusEl = node.querySelector('.qi-cl__status');
  const chips = [...node.querySelectorAll('.qi-cl__chip')];

  let part = null;
  let narrow = null;

  function box(g, cls, x, y, w, text, small) {
    g.appendChild(el('rect', { class: `qi-cl__box ${cls}`, x, y, width: w, height: BOX_H, rx: 6 }));
    g.appendChild(el('text', { class: `qi-cl__text${small ? ' qi-cl__text--small' : ''}`, x: x + w / 2, y: y + BOX_H / 2 + 5, 'text-anchor': 'middle' }, text));
  }

  function build() {
    svg.replaceChildren();
    node.dataset.layout = narrow ? 'column' : 'row';
    const lanes = {};

    if (narrow) {
      const W = 340;
      const colW = 160;
      svg.setAttribute('viewBox', `0 0 ${W} 330`);
      LANES.forEach((l, i) => {
        const x = i * (colW + 20);
        const g = el('g', { class: `qi-cl__lane qi-cl__lane--${l.id}`, 'data-part': l.id });
        box(g, 'qi-cl__box--input', x, 0, colW, l.input);
        g.appendChild(el('path', { class: 'qi-cl__arrow', d: `M${x + colW / 2} ${BOX_H + 4}V${BOX_H + 40}`, 'marker-end': 'url(#qi-cl-head)' }));
        box(g, 'qi-cl__box--encoder', x, BOX_H + 44, colW, l.encoder);
        g.appendChild(el('path', { class: 'qi-cl__arrow', d: `M${x + colW / 2} ${2 * BOX_H + 48}V${2 * BOX_H + 84}`, 'marker-end': 'url(#qi-cl-head)' }));
        box(g, 'qi-cl__box--vector', x, 2 * BOX_H + 88, colW, l.vector.replace(', ...,', ', …,'), true);
        svg.appendChild(g);
        lanes[l.id] = g;
      });
      svg.appendChild(el('text', { class: 'qi-cl__space', x: W / 2, y: 3 * BOX_H + 120, 'text-anchor': 'middle' }, 'same vector space'));
      svg.appendChild(el('path', { class: 'qi-cl__bracket', d: `M${colW / 2} ${3 * BOX_H + 96}V${3 * BOX_H + 104}H${colW + 20 + colW / 2}V${3 * BOX_H + 96}` }));
    } else {
      const W = 760;
      svg.setAttribute('viewBox', `0 0 ${W} 260`);
      const wIn = 190;
      const wEnc = 180;
      const wVec = 230;
      LANES.forEach((l, i) => {
        const y = i * 100;
        const g = el('g', { class: `qi-cl__lane qi-cl__lane--${l.id}`, 'data-part': l.id });
        box(g, 'qi-cl__box--input', 0, y, wIn, l.input);
        g.appendChild(el('path', { class: 'qi-cl__arrow', d: `M${wIn + 4} ${y + BOX_H / 2}H${wIn + 56}`, 'marker-end': 'url(#qi-cl-head)' }));
        box(g, 'qi-cl__box--encoder', wIn + 60, y, wEnc, l.encoder);
        g.appendChild(el('path', { class: 'qi-cl__arrow', d: `M${wIn + 60 + wEnc + 4} ${y + BOX_H / 2}H${wIn + 60 + wEnc + 56}`, 'marker-end': 'url(#qi-cl-head)' }));
        box(g, 'qi-cl__box--vector', wIn + 120 + wEnc, y, wVec, l.vector, true);
        svg.appendChild(g);
        lanes[l.id] = g;
      });
      const bx = wIn + 120 + wEnc + wVec / 2;
      svg.appendChild(el('path', { class: 'qi-cl__bracket', d: `M${bx - 20} ${BOX_H + 6}H${bx - 20}V${100 - 6}` }));
      svg.appendChild(el('text', { class: 'qi-cl__space', x: bx, y: 232, 'text-anchor': 'middle' }, 'same vector space'));
    }

    const defs = el('defs');
    const marker = el('marker', { id: 'qi-cl-head', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' });
    marker.appendChild(el('path', { class: 'qi-cl__head', d: 'M0 0L9 5L0 10Z' }));
    defs.appendChild(marker);
    svg.prepend(defs);

    Object.entries(lanes).forEach(([id, g]) => g.addEventListener('click', () => select(id)));
    node.__lanes = lanes;
    render();
  }

  function render() {
    const lanes = node.__lanes || {};
    Object.entries(lanes).forEach(([id, g]) => {
      const on = part === id || part === 'compare';
      g.classList.toggle('is-active', part !== null && on);
      g.classList.toggle('is-dim', part !== null && !on);
    });
    svg.classList.toggle('is-compare', part === 'compare');
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.part === part)));
    statusEl.innerHTML = STATUS[part || 'none'];
  }

  function select(id) {
    part = part === id ? null : id;
    render();
  }

  chips.forEach((c) => c.addEventListener('click', () => select(c.dataset.part)));

  function layout() {
    const isNarrow = node.clientWidth > 0 && node.clientWidth < NARROW_PX;
    if (isNarrow === narrow) return;
    narrow = isNarrow;
    build();
  }

  layout();
  if (narrow === null) {
    narrow = false;
    build();
  }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(layout).observe(node);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
