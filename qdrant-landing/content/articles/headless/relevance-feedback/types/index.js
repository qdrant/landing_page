/*
 * types island: interactive replacement for relevance_feedback_types.png and
 * relevance-feedback.png (shared by both relevance feedback articles).
 *
 * The same ranked list goes through one of three feedback sources:
 *   Pseudo-relevance: the top-K results are treated as relevant.
 *   Binary feedback:  a user or a classifier marks results relevant or not.
 *   Re-scored:        a feedback model gives every result a relevance score.
 * Choose a source to see the labels it puts on the list. The scores shown are
 * illustrative.
 */

const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

// Compact layout when the figure is narrower than the desktop composition, so
// labels stay readable instead of scaling down with the SVG.
function watchNarrow(node, onChange, below = 700) {
  const is = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < below;
  };
  let narrow = is();
  node.classList.toggle('rf-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('rf-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TYPES = [
  {
    id: 'prf',
    label: 'Pseudo-relevance',
    source: 'Top-K',
    sub: 'the top results',
    labels: [{ k: 'pos', t: 'relevant' }, { k: 'pos', t: 'relevant' }, { k: 'pos', t: 'relevant' }, { k: 'none', t: '' }, { k: 'none', t: '' }],
    text: '<b>Pseudo-relevance feedback</b> takes the top results of the first retrieval and treats them as relevant. No one has to look at the documents.',
  },
  {
    id: 'binary',
    label: 'Binary feedback',
    source: 'User or classifier',
    sub: 'relevant or not',
    labels: [{ k: 'none', t: '' }, { k: 'neg', t: 'not relevant' }, { k: 'none', t: '' }, { k: 'pos', t: 'relevant' }, { k: 'none', t: '' }],
    text: '<b>Binary feedback</b>: a user or a classifier marks some of the results as relevant or not relevant, and leaves the rest unlabeled.',
  },
  {
    id: 'scored',
    label: 'Re-scored feedback',
    source: 'Feedback model',
    sub: 'a score per result',
    labels: [{ k: 'pos', t: '+0.3', o: 0.35 }, { k: 'pos', t: '+0.9', o: 1 }, { k: 'neg', t: '-0.8', o: 1 }, { k: 'neg', t: '-0.3', o: 0.4 }, { k: 'none', t: '0.0' }],
    text: '<b>Re-scored feedback</b>: a feedback model scores every result, so each one gets a graded relevance instead of a yes or no. Scores shown are illustrative.',
  },
];

const ROWS = 5;
const WIDE = { VB_W: 760, VB_H: 280 };
const NARROW = { VB_W: 340, VB_H: 580 };

export function mount(node) {
  node.classList.add('rf-ty');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Feedback type">',
    TYPES.map((t) => `<button type="button" class="qi-chip" data-type="${t.id}" aria-pressed="false">${t.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 280" role="img" aria-label="A ranked list of results passes through a feedback source, which labels the results as relevant or not relevant.">',
    '    <g class="rf-ty__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 rf-ty__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.rf-ty__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.rf-ty__status');
  const chips = [...node.querySelectorAll('[data-type]')];
  let cur = TYPES[1];
  const isNarrow = watchNarrow(node, () => render());

  function box(x, y, w, h, title, sub, cls = '') {
    g.appendChild(el('rect', { class: `rf-ty__box ${cls}`, x, y, width: w, height: h, rx: 6 }));
    g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: x + w / 2, y: y + (sub ? h / 2 - 2 : h / 2 + 5), 'text-anchor': 'middle' }, title));
    if (sub) g.appendChild(el('text', { class: 'qi-label', x: x + w / 2, y: y + h / 2 + 16, 'text-anchor': 'middle' }, sub));
  }
  function arrow(x1, y1, x2, y2) {
    g.appendChild(el('line', { class: 'rf-ty__arrow', x1, y1, x2: x2 - (x2 > x1 ? 7 : 0), y2: y2 - (y2 > y1 ? 7 : 0) }));
    const p = x2 > x1 ? `${x2},${y2} ${x2 - 8},${y2 - 4.5} ${x2 - 8},${y2 + 4.5}` : `${x2},${y2} ${x2 - 4.5},${y2 - 8} ${x2 + 4.5},${y2 - 8}`;
    g.appendChild(el('polygon', { class: 'rf-ty__head', points: p }));
  }
  function list(x, y, w, labels, title) {
    g.appendChild(el('text', { class: 'qi-label qi-label--strong', x, y: y - 10 }, title));
    for (let i = 0; i < ROWS; i++) {
      const yy = y + i * 34;
      const lab = labels ? labels[i] : { k: 'plain', t: '' };
      g.appendChild(el('rect', { class: `rf-ty__row is-${lab.k}`, x, y: yy, width: w, height: 24, rx: 4, ...(lab.o != null ? { style: `fill-opacity:${lab.o}` } : {}) }));
      g.appendChild(el('text', { class: 'qi-label rf-ty__rowt', x: x + 8, y: yy + 17 }, `Doc ${i + 1}`));
      if (lab.t) g.appendChild(el('text', { class: 'qi-label rf-ty__rowt', x: x + w - 8, y: yy + 17, 'text-anchor': 'end' }, lab.t));
    }
  }

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    if (!narrow) {
      box(10, 100, 80, 44, 'Query', '');
      arrow(90, 122, 116, 122);
      box(118, 100, 90, 44, 'Retriever', '');
      arrow(208, 122, 234, 122);
      list(236, 56, 130, null, 'Ranked results');
      arrow(366, 122, 392, 122);
      box(394, 90, 150, 64, cur.source, cur.sub, 'is-source');
      arrow(544, 122, 566, 122);
      list(568, 56, 182, cur.labels, 'Feedback');
    } else {
      box(20, 10, 130, 40, 'Query', '');
      arrow(150, 30, 188, 30);
      box(190, 10, 130, 40, 'Retriever', '');
      arrow(255, 50, 255, 78);
      list(70, 100, 200, null, 'Ranked results');
      arrow(170, 270, 170, 304);
      box(70, 308, 200, 56, cur.source, cur.sub, 'is-source');
      arrow(170, 364, 170, 398);
      list(70, 420, 200, cur.labels, 'Feedback');
    }
    statusEl.innerHTML = cur.text;
  }

  function setType(id) {
    cur = TYPES.find((t) => t.id === id);
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.type === cur.id)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setType(b.dataset.type)));

  setType('binary');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
