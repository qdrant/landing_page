/*
 * venn island: interactive replacement for venn-diagram.png.
 *
 * Capabilities usually associated with full-text search, with vector search, and
 * with both. The grouping comes from the original figure. Pick a region to
 * highlight it.
 */

const NS = 'http://www.w3.org/2000/svg';
const REGIONS = [
  { id: 'all', chip: 'All' },
  { id: 'text', chip: 'Full-text only', text: 'Typical of full-text search: synonyms, quick counts, and facets.' },
  { id: 'both', chip: 'Both', text: 'Shared by both: similarity search and filters.' },
  { id: 'vector', chip: 'Vector only', text: 'Specific to vector search: dissimilarity search, recommendations, diverse search, and multimodality.' },
];
const ITEMS = {
  text: ['Synonyms', 'Quick counts', 'Facets'],
  both: ['Similarity search', 'Filters'],
  vector: ['Dissimilarity search', 'Recommend', 'Diverse search', 'Multimodality'],
};

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

function watchNarrow(node, onChange, below = 700) {
  const is = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < below;
  };
  let narrow = is();
  node.classList.toggle('dv-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('dv-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

export function mount(node) {
  node.classList.add('dv-vn');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Region">',
    REGIONS.map((r) => `<button type="button" class="qi-chip" data-region="${r.id}" aria-pressed="false">${r.chip}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 430" role="img" aria-label="Overlapping sets for full-text search and vector search. Full-text only: synonyms, quick counts, facets. Both: similarity search, filters. Vector only: dissimilarity search, recommend, diverse search, multimodality.">',
    '    <g class="dv-vn__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 dv-vn__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.dv-vn__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.dv-vn__status');
  const chips = [...node.querySelectorAll('[data-region]')];
  let selected = 'all';
  const isNarrow = watchNarrow(node, () => render());

  function render() {
    const narrow = isNarrow();
    g.replaceChildren();
    const dim = (id) => (selected !== 'all' && selected !== id ? ' is-dim' : '');
    let W;
    let H;
    let pos;
    if (!narrow) {
      W = 760;
      H = 430;
      g.appendChild(el('ellipse', { class: 'dv-vn__set dv-vn__set--text', cx: 280, cy: 240, rx: 250, ry: 175 }));
      g.appendChild(el('ellipse', { class: 'dv-vn__set dv-vn__set--vector', cx: 480, cy: 240, rx: 250, ry: 175 }));
      g.appendChild(el('text', { class: 'qi-title', x: 150, y: 30, 'text-anchor': 'middle' }, 'Full-text search'));
      g.appendChild(el('text', { class: 'qi-title', x: 596, y: 30, 'text-anchor': 'middle' }, 'Vector search'));
      pos = {
        text: [[150, 160], [130, 240], [150, 320]],
        both: [[380, 205], [380, 285]],
        vector: [[596, 155], [596, 210], [596, 265], [596, 320]],
      };
    } else {
      W = 340;
      H = 570;
      g.appendChild(el('ellipse', { class: 'dv-vn__set dv-vn__set--text', cx: 170, cy: 175, rx: 160, ry: 165 }));
      g.appendChild(el('ellipse', { class: 'dv-vn__set dv-vn__set--vector', cx: 170, cy: 395, rx: 160, ry: 165 }));
      g.appendChild(el('text', { class: 'qi-title', x: 170, y: 36, 'text-anchor': 'middle' }, 'Full-text search'));
      g.appendChild(el('text', { class: 'qi-title', x: 170, y: 548, 'text-anchor': 'middle' }, 'Vector search'));
      pos = {
        text: [[170, 90], [170, 130], [170, 170]],
        both: [[170, 255], [170, 295]],
        vector: [[170, 355], [170, 395], [170, 435], [170, 475]],
      };
    }
    Object.keys(ITEMS).forEach((region) => {
      ITEMS[region].forEach((label, i) => {
        const [x, y] = pos[region][i];
        g.appendChild(el('text', { class: `dv-vn__item${dim(region)}`, x, y, 'text-anchor': 'middle' }, label));
      });
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const r = REGIONS.find((x) => x.id === selected);
    statusEl.textContent = r.text || 'Pick a region to highlight what belongs to full-text search, to vector search, or to both.';
    g.classList.toggle('has-focus', selected !== 'all');
    g.dataset.focus = selected;
  }

  function setRegion(id) {
    selected = id;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.region === selected)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setRegion(b.dataset.region)));

  setRegion('all');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
