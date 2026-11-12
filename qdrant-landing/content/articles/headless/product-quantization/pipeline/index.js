/*
 * pipeline island: interactive replacement for full-process.png.
 *
 * The whole quantization of one vector, in three steps: cut it into chunks, map each
 * chunk to its closest centroid, and store only the centroid ids. The vector, the
 * centroids, and the ids are the illustrative ones used in the article.
 */

const NS = 'http://www.w3.org/2000/svg';
const VECTOR = [-0.25, -0.45, 0.98, -0.62, -0.98, -0.76, 0.08, 0.57];
const IDS = [2, 3];
const ID_COLORS = ['#f59f1b', '#7c4dff'];
const STEPS = [
  { id: 0, label: 'Vector' },
  { id: 1, label: 'Cut into chunks' },
  { id: 2, label: 'Map to centroids' },
  { id: 3, label: 'Store the ids' },
];
const STATUS = [
  'A vector with 8 values takes 32 bytes as float32.',
  'The vector is cut into 2 chunks of 4 values. Every vector in the collection is cut in the same way.',
  'Each chunk is mapped to the closest centroid of its own clustering. Chunk 1 is closest to centroid 2, and chunk 2 to centroid 3.',
  'Only the ids are stored: 2 bytes instead of 32, which is 16x smaller. The centroids are shared by all vectors.',
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
  node.classList.toggle('pq-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('pq-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

export function mount(node) {
  node.classList.add('pq-fp');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step">',
    STEPS.map((s) => `<button type="button" class="qi-chip" data-step="${s.id}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 340" role="img" aria-label="One vector is cut into two chunks, each chunk is mapped to its closest centroid, and only the two centroid ids are stored.">',
    '    <g class="pq-fp__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 pq-fp__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.pq-fp__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.pq-fp__status');
  const chips = [...node.querySelectorAll('[data-step]')];
  let step = 3;
  const isNarrow = watchNarrow(node, () => render());

  function arrow(x, y1, y2) {
    g.appendChild(el('line', { class: 'pq-fp__arrow', x1: x, y1, x2: x, y2: y2 - 8 }));
    g.appendChild(el('polygon', { class: 'pq-fp__head', points: `${x},${y2} ${x - 5},${y2 - 9} ${x + 5},${y2 - 9}` }));
  }
  function valueBox(x, y, w, v, part) {
    g.appendChild(el('rect', { class: `pq-fp__box${part == null ? '' : part ? ' is-b' : ' is-a'}`, x, y, width: w, height: 36, rx: 4 }));
    g.appendChild(el('text', { class: 'pq-fp__val', x: x + w / 2, y: y + 24, 'text-anchor': 'middle' }, v));
  }
  function idBox(x, y, w, h, c, text) {
    g.appendChild(el('rect', { class: 'pq-fp__id', x, y, width: w, height: h, rx: 6, fill: ID_COLORS[c], stroke: ID_COLORS[c] }));
    g.appendChild(el('text', { class: 'pq-fp__val', x: x + w / 2, y: y + h / 2 + 6, 'text-anchor': 'middle' }, text));
  }

  function render() {
    const narrow = isNarrow();
    g.replaceChildren();
    if (!narrow) {
      VECTOR.forEach((v, i) => {
        const x = 40 + i * 80 + (step >= 1 && i >= 4 ? 24 : 0);
        valueBox(x, 28, 70, v.toFixed(2), step >= 1 ? Math.floor(i / 4) : null);
      });
      if (step >= 1) {
        g.appendChild(el('text', { class: 'qi-label', x: 195, y: 92, 'text-anchor': 'middle' }, 'chunk 1'));
        g.appendChild(el('text', { class: 'qi-label', x: 519, y: 92, 'text-anchor': 'middle' }, 'chunk 2'));
      }
      if (step >= 2) {
        [195, 519].forEach((cx, c) => {
          arrow(cx, 102, 160);
          idBox(cx - 70, 164, 140, 44, c, `centroid ${IDS[c]}`);
        });
        g.appendChild(el('text', { class: 'qi-label', x: 357, y: 136, 'text-anchor': 'middle' }, 'closest centroid'));
      }
      if (step >= 3) {
        g.appendChild(el('text', { class: 'qi-label', x: 40, y: 296 }, 'stored vector'));
        IDS.forEach((id, c) => idBox(200 + c * 90, 270, 70, 44, c, String(id)));
        g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: 420, y: 298 }, '2 bytes instead of 32'));
      }
      svg.setAttribute('viewBox', '0 0 760 340');
    } else {
      [0, 1].forEach((c) => {
        const y = 30 + c * 122;
        VECTOR.slice(c * 4, c * 4 + 4).forEach((v, i) => valueBox(20 + i * 70, y, 62, v.toFixed(2), step >= 1 ? c : null));
        if (step >= 1) g.appendChild(el('text', { class: 'qi-label', x: 20, y: y - 8 }, `chunk ${c + 1}`));
        if (step >= 2) {
          arrow(170, y + 44, y + 70);
          idBox(100, y + 70, 140, 36, c, `centroid ${IDS[c]}`);
        }
      });
      if (step >= 3) {
        g.appendChild(el('text', { class: 'qi-label', x: 20, y: 296 }, 'stored vector'));
        IDS.forEach((id, c) => idBox(150 + c * 80, 276, 64, 40, c, String(id)));
        g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: 20, y: 342 }, '2 bytes instead of 32'));
      }
      svg.setAttribute('viewBox', '0 0 340 360');
    }
    statusEl.textContent = STATUS[step];
  }

  function setStep(s) {
    step = s;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === step)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setStep(Number(b.dataset.step))));

  setStep(3);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
