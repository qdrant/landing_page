/*
 * resource-tradeoffs island: the speed / precision / memory triangle.
 *
 * Qdrant can be configured for high speed, high precision, or low memory, but
 * not all three at once. Pick two corners to see which one gives way and the
 * kind of configuration that gets there. The guidance follows the
 * "Optimizing Qdrant Performance: Three Scenarios" documentation page and is
 * a rule of thumb, not a measurement.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

const VB_W = 360;
const VB_H = 300;
const PILL_H = 32;

const CORNERS = [
  { id: 'speed', label: 'High speed', x: 180, y: 34, w: 108 },
  { id: 'memory', label: 'Low memory', x: 72, y: 250, w: 108 },
  { id: 'precision', label: 'High precision', x: 288, y: 250, w: 140 },
];

// Each pair of corners is an edge; the corner left out is what the pair costs.
const PAIRS = [
  {
    key: 'memory+speed',
    gives: 'precision',
    cost: ['costs', 'precision'],
    label: { x: 112, y: 134, anchor: 'end' },
    status:
      '<b>High speed and low memory</b> cost some precision. Keep compressed (quantized) vectors in RAM and the original vectors on disk, and optionally disable rescoring to cut disk reads. Recall drops slightly.',
  },
  {
    key: 'precision+speed',
    gives: 'memory',
    cost: ['costs', 'memory'],
    label: { x: 248, y: 134, anchor: 'start' },
    status:
      '<b>High speed and high precision</b> cost memory. Keep the vectors and the HNSW index in RAM so queries rarely touch the disk.',
  },
  {
    key: 'memory+precision',
    gives: 'speed',
    cost: ['costs speed'],
    label: { x: 180, y: 286, anchor: 'middle' },
    status:
      '<b>Low memory and high precision</b> cost speed. Move the vectors and the HNSW index to disk: precision is kept, but queries wait on disk reads.',
  },
];

const OVERVIEW =
  'Qdrant can be tuned for speed, precision, or resource use, but not all three at once. Select two corners to see what the third costs.';

const pairKey = (a, b) => [a, b].sort().join('+');

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

export function mount(node) {
  node.classList.add('qi-rt');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Pick two goals">',
    CORNERS.map(
      (c) => `<button type="button" class="qi-chip qi-rt__chip" data-corner="${c.id}" aria-pressed="false">${c.label}</button>`,
    ).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-rt__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"`,
    '    aria-label="A triangle with high speed, low memory, and high precision at its corners. Qdrant can be tuned for any two; the third has to give way.">',
    '  </svg>',
    '  <p class="qi-status qi-status--3 qi-rt__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-rt__svg');
  const statusEl = node.querySelector('.qi-rt__status');
  const chips = [...node.querySelectorAll('.qi-rt__chip')];
  const byId = Object.fromEntries(CORNERS.map((c) => [c.id, c]));

  // Triangle, edges, labels, then the corner pills on top.
  svg.appendChild(el('polygon', { class: 'qi-rt__tri', points: CORNERS.map((c) => `${c.x},${c.y}`).join(' ') }));

  const edges = {};
  const costs = {};
  PAIRS.forEach((p) => {
    const [a, b] = p.key.split('+').map((id) => byId[id]);
    const edge = el('line', { class: 'qi-rt__edge', x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    svg.appendChild(edge);
    edges[p.key] = edge;
    const t = el('text', { class: 'qi-rt__cost', x: p.label.x, y: p.label.y, 'text-anchor': p.label.anchor });
    p.cost.forEach((line, i) => t.appendChild(el('tspan', { x: p.label.x, dy: i === 0 ? 0 : 17 }, line)));
    svg.appendChild(t);
    costs[p.key] = t;
  });
  svg.appendChild(el('text', { class: 'qi-rt__center', x: 180, y: 176, 'text-anchor': 'middle' }, 'Pick two'));

  const pills = {};
  CORNERS.forEach((c) => {
    const g = el('g', { class: 'qi-rt__corner', 'data-corner': c.id, tabindex: '-1' });
    g.appendChild(el('rect', { class: 'qi-rt__pill', x: c.x - c.w / 2, y: c.y - PILL_H / 2, width: c.w, height: PILL_H, rx: 6 }));
    g.appendChild(el('text', { class: 'qi-rt__pill-text', x: c.x, y: c.y + 5, 'text-anchor': 'middle' }, c.label));
    g.addEventListener('click', () => toggle(c.id));
    svg.appendChild(g);
    pills[c.id] = g;
  });

  let picked = [];

  function toggle(id) {
    if (picked.includes(id)) picked = picked.filter((p) => p !== id);
    else picked = [...picked, id].slice(-2);
    render();
  }

  function render() {
    const pair = picked.length === 2 ? PAIRS.find((p) => p.key === pairKey(picked[0], picked[1])) : null;
    CORNERS.forEach((c) => {
      pills[c.id].classList.toggle('is-picked', picked.includes(c.id));
      pills[c.id].classList.toggle('is-out', !!pair && pair.gives === c.id);
    });
    PAIRS.forEach((p) => {
      const on = pair === p;
      edges[p.key].classList.toggle('is-on', on);
      costs[p.key].classList.toggle('is-on', on);
      costs[p.key].classList.toggle('is-off', !!pair && !on);
    });
    chips.forEach((ch) => ch.setAttribute('aria-pressed', String(picked.includes(ch.dataset.corner))));
    if (pair) statusEl.innerHTML = pair.status;
    else if (picked.length === 1) statusEl.innerHTML = `<b>${byId[picked[0]].label}</b> selected. Pick one more.`;
    else statusEl.innerHTML = OVERVIEW;
  }

  chips.forEach((ch) => ch.addEventListener('click', () => toggle(ch.dataset.corner)));

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
