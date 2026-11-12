/*
 * nesting island: interactive replacement for segments.png.
 *
 * Qdrant holds collections, a collection is split into shards, and a shard is
 * split into segments. Pick a level to see what it contains.
 */

const NS = 'http://www.w3.org/2000/svg';
const LEVELS = [
  { id: 'qdrant', title: 'Qdrant', inner: 'Collection', text: 'A Qdrant instance hosts any number of collections.' },
  { id: 'collection', title: 'Collection', inner: 'Shard', text: 'A collection is split into shards, which can live on different nodes.' },
  { id: 'shard', title: 'Shard', inner: 'Segment', text: 'A shard is split into segments. Each segment owns its own vector storage, vector index, payload, and payload index.' },
];

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
  node.classList.add('dv-ns');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Level">',
    LEVELS.map((l) => `<button type="button" class="qi-chip" data-level="${l.id}" aria-pressed="false">${l.title}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 250" role="img" aria-label="Qdrant contains collections, a collection contains shards, and a shard contains segments.">',
    '    <g class="dv-ns__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 dv-ns__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.dv-ns__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.dv-ns__status');
  const chips = [...node.querySelectorAll('[data-level]')];
  let selected = 'collection';
  const isNarrow = watchNarrow(node, () => render());

  function stack(fx, fy, fw, label) {
    const w = 150;
    const h = 74;
    const x = fx + (fw - w) / 2 + 14;
    const y = fy + 72;
    [['dv-ns__card--3', -28], ['dv-ns__card--2', -14], ['dv-ns__card--1', 0]].forEach(([cls, d]) => {
      g.appendChild(el('rect', { class: `dv-ns__card ${cls}`, x: x + d, y: y + d, width: w, height: h, rx: 6 }));
    });
    g.appendChild(el('text', { class: 'qi-label qi-label--strong dv-ns__cardlabel', x: x + w / 2, y: y + h / 2 + 5, 'text-anchor': 'middle' }, label));
  }
  function arrowHead(x, y, dir) {
    const pts = dir === 'down' ? `${x},${y} ${x - 5},${y - 9} ${x + 5},${y - 9}` : `${x},${y} ${x - 9},${y - 5} ${x - 9},${y + 5}`;
    g.appendChild(el('polygon', { class: 'dv-ns__head', points: pts }));
  }

  function render() {
    const narrow = isNarrow();
    g.replaceChildren();
    const fw = narrow ? 300 : 230;
    const fh = 176;
    const W = narrow ? 340 : 760;
    const H = narrow ? 3 * fh + 2 * 44 + 24 : 250;
    LEVELS.forEach((l, i) => {
      const fx = narrow ? 20 : 10 + i * (fw + 25);
      const fy = narrow ? 12 + i * (fh + 44) : 54;
      g.appendChild(el('rect', { class: `dv-ns__frame${l.id === selected ? ' is-sel' : ''}`, x: fx, y: fy, width: fw, height: fh, rx: 8 }));
      g.appendChild(el('text', { class: 'qi-title dv-ns__title', x: fx + 14, y: fy + 28 }, l.title));
      stack(fx, fy, fw, l.inner);
      if (i < LEVELS.length - 1) {
        if (narrow) {
          const ax = fx + fw / 2;
          g.appendChild(el('path', { class: 'dv-ns__link', d: `M${ax} ${fy + fh} V${fy + fh + 35}` }));
          arrowHead(ax, fy + fh + 44, 'down');
        } else {
          const sx = fx + fw / 2 - 14;
          const ex = fx + fw + 25 + fw / 2;
          g.appendChild(el('path', { class: 'dv-ns__link', d: `M${sx} ${fy + 44} V16 H${ex} V${fy - 2}` }));
          arrowHead(ex, fy, 'down');
        }
      }
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    statusEl.textContent = LEVELS.find((l) => l.id === selected).text;
  }

  function setLevel(id) {
    selected = id;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.level === selected)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setLevel(b.dataset.level)));

  setLevel('collection');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
