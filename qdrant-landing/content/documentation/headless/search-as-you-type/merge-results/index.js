/*
 * merge-results island: four prioritized searches merged into one result list.
 *
 * The four searches run in one batch. The service takes their results in
 * priority order, skips points it already has, and stops at five. The points
 * and their order are illustrative, not real search output. Step through the
 * searches to see what each one adds.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

const LIMIT = 5;
const VB_W = 384;
const ROW_H = 50;
const DOT_X = 160;
const DOT_PITCH = 44;
const DOT_R = 15;
const TOP = 12;

// Illustrative result lists, in priority order. Letters are point IDs.
const LANES = [
  { label: '1. Title match', points: ['A'] },
  { label: '2. Body match', points: ['A', 'B'] },
  { label: '3. Title semantic', points: ['A'] },
  { label: '4. Any semantic', points: ['A', 'B', 'C', 'D', 'E'] },
];

const OVERVIEW =
  'The four searches run in one batch. The service takes their results in priority order, skips points it already has, and stops at five. The points shown are illustrative. Step through the searches to see what each adds.';

// Work out what each lane adds to the merged list, and which points are duplicates.
function merge() {
  const seen = [];
  return LANES.map((lane) =>
    lane.points.map((id) => {
      const dup = seen.includes(id) || seen.length >= LIMIT;
      if (!dup) seen.push(id);
      return { id, dup };
    }),
  ).map((items, i) => ({ ...LANES[i], items }));
}

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

export function mount(node) {
  node.classList.add('qi-mr');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step">',
    '      <button type="button" class="qi-chip qi-mr__prev">Previous</button>',
    '      <button type="button" class="qi-chip qi-mr__next">Next</button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-mr__svg" role="img"',
    '    aria-label="Four search result lists, in priority order, merged into one result list of at most five points, with duplicates dropped.">',
    '  </svg>',
    '  <p class="qi-status qi-status--3 qi-mr__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-mr__svg');
  const statusEl = node.querySelector('.qi-mr__status');
  const prevBtn = node.querySelector('.qi-mr__prev');
  const nextBtn = node.querySelector('.qi-mr__next');

  const lanes = merge();
  const resultY = TOP + LANES.length * ROW_H + 18;
  svg.setAttribute('viewBox', `0 0 ${VB_W} ${resultY + ROW_H + 8}`);

  const laneGroups = lanes.map((lane, i) => {
    const y = TOP + i * ROW_H + ROW_H / 2;
    const g = el('g', { class: 'qi-mr__lane', 'data-lane': i, tabindex: '0', role: 'button', 'aria-label': `Search ${i + 1}` });
    g.appendChild(el('rect', { class: 'qi-mr__hit', x: 0, y: y - ROW_H / 2, width: VB_W, height: ROW_H, fill: 'transparent' }));
    g.appendChild(el('text', { class: 'qi-mr__label', x: 0, y: y + 5 }, lane.label));
    lane.items.forEach((p, j) => {
      const cx = DOT_X + DOT_R + j * DOT_PITCH;
      g.appendChild(el('circle', { class: `qi-mr__dot${p.dup ? ' is-dup' : ''}`, cx, cy: y, r: DOT_R }));
      g.appendChild(el('text', { class: 'qi-mr__dot-text', x: cx, y: y + 5, 'text-anchor': 'middle' }, p.id));
    });
    const pick = () => select(step === i ? null : i);
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick();
      }
    });
    svg.appendChild(g);
    return g;
  });

  // The merged result: one slot per point, remembering which search added it.
  const added = [];
  lanes.forEach((lane, i) => lane.items.forEach((p) => !p.dup && added.push({ id: p.id, lane: i })));
  const my = resultY + ROW_H / 2;
  svg.appendChild(el('line', { class: 'qi-mr__rule', x1: 0, y1: resultY - 9, x2: VB_W, y2: resultY - 9 }));
  svg.appendChild(el('text', { class: 'qi-mr__label qi-mr__label--strong', x: 0, y: my + 5 }, 'Result'));
  const slots = added.map((a, j) => {
    const cx = DOT_X + DOT_R + j * DOT_PITCH;
    const g = el('g', { class: 'qi-mr__slot', 'data-lane': a.lane });
    g.appendChild(el('rect', { class: 'qi-mr__slot-box', x: cx - DOT_R - 2, y: my - DOT_R - 2, width: 2 * DOT_R + 4, height: 2 * DOT_R + 4, rx: 6 }));
    g.appendChild(el('text', { class: 'qi-mr__dot-text', x: cx, y: my + 5, 'text-anchor': 'middle' }, a.id));
    svg.appendChild(g);
    return g;
  });

  let step = null;

  function describe(i) {
    const lane = lanes[i];
    const fresh = lane.items.filter((p) => !p.dup).map((p) => p.id);
    const dups = lane.items.filter((p) => p.dup).map((p) => p.id);
    const list = (ids) => ids.join(', ');
    const name = lane.label.replace(/^\d\. /, '');
    let t = `<b>Search ${i + 1} of ${LANES.length}, ${name}.</b> `;
    if (dups.length) t += `Already in the result and skipped as duplicates: ${list(dups)}. `;
    t += fresh.length ? `Added to the result: ${list(fresh)}.` : 'It adds nothing new.';
    return t;
  }

  function render() {
    laneGroups.forEach((g, i) => {
      g.classList.toggle('is-active', step === i);
      g.classList.toggle('is-dim', step !== null && step !== i);
      g.setAttribute('aria-pressed', String(step === i));
    });
    slots.forEach((g) => {
      const on = step !== null && Number(g.getAttribute('data-lane')) === step;
      g.classList.toggle('is-active', on);
      g.classList.toggle('is-dim', step !== null && !on);
    });
    prevBtn.disabled = step === null;
    nextBtn.disabled = step === LANES.length - 1;
    statusEl.innerHTML = step === null ? OVERVIEW : describe(step);
  }

  function select(i) {
    step = i;
    render();
  }

  prevBtn.addEventListener('click', () => select(step <= 0 ? null : step - 1));
  nextBtn.addEventListener('click', () => select(step === null ? 0 : step + 1));

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
