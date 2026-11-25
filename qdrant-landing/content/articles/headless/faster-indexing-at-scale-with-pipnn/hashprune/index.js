/*
 * hashprune island: candidates around a point p grouped into cones.
 *
 * Hyperplanes through p split the space into cones. Two candidates in the
 * same cone share a residual hash, so only the better scoring one survives in
 * the reservoir. Candidate positions, scores and hash bits are illustrative.
 * Select a candidate to see what the reservoir does with it.
 */

const NS = 'http://www.w3.org/2000/svg';
const CX = 160;
const CY = 205;
const R = 140;

const CANDIDATES = [
  { id: 'c1', angle: 30, r: 98, score: '.92', hash: '0110', keep: true, color: 'blue', reason: 'first in its cone' },
  { id: 'c2', angle: 42, r: 128, score: '.88', hash: '0110', keep: false, color: 'muted', reason: 'same cone, lower score' },
  { id: 'c3', angle: 205, r: 89, score: '.85', hash: '1010', keep: true, color: 'red', reason: 'new cone' },
];

const STATUS = {
  none: 'Hyperplanes through p split the space into cones (3 of the 12 are drawn). The reservoir keeps one candidate per cone, so candidates with the same hash compete. Only 4 of the 12 hash bits are shown.',
  c1: 'c1 (score .92, hash 0110) is the first candidate in its cone, so the reservoir keeps it.',
  c2: 'c2 (score .88) has the same hash as c1, so it falls in the same cone. Its score is lower than c1, so it is dropped.',
  c3: 'c3 (score .85, hash 1010) falls in a different cone, so it is kept even though its score is the lowest.',
};

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

const pt = (deg, r) => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
};
const f = (n) => n.toFixed(1);

export function mount(node) {
  node.classList.add('pn-hp');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Candidate">',
    CANDIDATES.map((c) => `<button type="button" class="qi-chip" data-id="${c.id}" aria-pressed="false"><span class="qi-chip__swatch pn-hp__sw pn-hp__sw--${c.color}"></span>${c.id}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 360" role="img" aria-label="Point p with three candidates. Two candidates fall in the same cone, so the lower scoring one is dropped. The third falls in a different cone and is kept."></svg>',
    '  <p class="qi-status qi-status--2" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.qi-status');
  const chips = [...node.querySelectorAll('[data-id]')];

  svg.appendChild(el('text', { class: 'qi-title', x: 0, y: 16 }, 'Candidates around p, grouped into cones'));

  // Cones, then hyperplanes.
  const [a0x, a0y] = pt(0, R);
  const [a60x, a60y] = pt(60, R);
  const [b180x, b180y] = pt(180, R);
  const [b240x, b240y] = pt(240, R);
  svg.appendChild(el('path', { class: 'pn-hp__cone pn-hp__cone--blue', d: `M${CX},${CY} L${f(a0x)},${f(a0y)} A${R},${R} 0 0 0 ${f(a60x)},${f(a60y)} Z` }));
  svg.appendChild(el('path', { class: 'pn-hp__cone pn-hp__cone--red', d: `M${CX},${CY} L${f(b180x)},${f(b180y)} A${R},${R} 0 0 0 ${f(b240x)},${f(b240y)} Z` }));
  [0, 60, 120].forEach((deg) => {
    const [x1, y1] = pt(deg, R);
    const [x2, y2] = pt(deg + 180, R);
    svg.appendChild(el('line', { class: 'pn-hp__plane', x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2) }));
  });

  // Candidates
  const candEls = CANDIDATES.map((c) => {
    const [x, y] = pt(c.angle, c.r);
    const g = el('g', { class: `pn-hp__cand pn-hp__cand--${c.color}` });
    g.appendChild(el('line', { x1: CX, y1: CY, x2: f(x), y2: f(y) }));
    g.appendChild(el('circle', { cx: f(x), cy: f(y), r: 7 }));
    g.appendChild(el('text', { x: f(x + 12), y: f(y + 5) }, c.id));
    svg.appendChild(g);
    return g;
  });
  svg.appendChild(el('circle', { class: 'pn-hp__p', cx: CX, cy: CY, r: 9 }));
  svg.appendChild(el('text', { class: 'pn-hp__pname', x: CX + 14, y: CY + 26 }, 'p'));

  // Reservoir table
  svg.appendChild(el('text', { class: 'qi-title', x: 380, y: 16 }, 'What the reservoir does'));
  [['Candidate', 388], ['Score', 478], ['Hash', 550], ['Decision', 650]].forEach(([t, x]) => svg.appendChild(el('text', { class: 'qi-label', x, y: 58 }, t)));
  const rowEls = CANDIDATES.map((c, i) => {
    const top = 72 + i * 76;
    const g = el('g', { class: 'pn-hp__row' });
    g.appendChild(el('rect', { class: 'qi-frame', x: 380, y: top, width: 380, height: 66, rx: 8 }));
    g.appendChild(el('circle', { class: `pn-hp__dot pn-hp__dot--${c.color}`, cx: 398, cy: top + 22, r: 7 }));
    g.appendChild(el('text', { class: 'pn-hp__strong', x: 412, y: top + 27 }, c.id));
    g.appendChild(el('text', { class: 'pn-hp__val', x: 478, y: top + 27 }, c.score));
    g.appendChild(el('text', { class: 'pn-hp__val pn-hp__val--hash', x: 550, y: top + 27 }, c.hash));
    g.appendChild(el('text', { class: `pn-hp__strong pn-hp__decision--${c.keep ? c.color : 'muted'}`, x: 650, y: top + 27 }, c.keep ? 'Keep' : 'Drop'));
    g.appendChild(el('text', { class: 'qi-label', x: 412, y: top + 52 }, c.reason));
    svg.appendChild(g);
    return g;
  });

  let sel = null;
  function render() {
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === sel)));
    CANDIDATES.forEach((c, i) => {
      const dim = sel !== null && sel !== c.id;
      candEls[i].classList.toggle('is-dim', dim);
      rowEls[i].classList.toggle('is-dim', dim);
      rowEls[i].classList.toggle('is-sel', sel === c.id);
    });
    statusEl.textContent = STATUS[sel || 'none'];
  }
  chips.forEach((b) =>
    b.addEventListener('click', () => {
      sel = sel === b.dataset.id ? null : b.dataset.id;
      render();
    }),
  );

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
