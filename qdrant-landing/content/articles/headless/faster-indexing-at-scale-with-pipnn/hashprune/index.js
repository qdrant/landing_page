/*
 * hashprune island: candidates around a point p grouped into cones.
 *
 * Hyperplanes through p split the space into cones. Two candidates in the
 * same cone share a residual hash, so only the better scoring one survives in
 * the reservoir. The hash is a toy: 3 hyperplanes give 3 bits, one per
 * hyperplane, set to 1 when the candidate lies on the counterclockwise side of
 * it. Real builds use 12. Candidate positions and scores are illustrative.
 */

const NS = 'http://www.w3.org/2000/svg';
const CX = 160;
const CY = 205;
const R = 140;

const CANDIDATES = [
  { id: 'c1', angle: 30, r: 98, score: '.92', hash: '100', keep: true, color: 'blue', reason: 'first in its cone' },
  { id: 'c2', angle: 42, r: 128, score: '.88', hash: '100', keep: false, color: 'blue', reason: 'same cone, lower score' },
  { id: 'c3', angle: 205, r: 89, score: '.85', hash: '011', keep: true, color: 'red', reason: 'new cone' },
];

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

// A cross over a dropped candidate.
const cross = (x, y, d) =>
  el('path', { class: 'pn-hp__cross', d: `M${f(x - d / 2)},${f(y - d / 2)} L${f(x + d / 2)},${f(y + d / 2)} M${f(x + d / 2)},${f(y - d / 2)} L${f(x - d / 2)},${f(y + d / 2)}` });

export function mount(node) {
  node.classList.add('pn-hp');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <svg class="qi-svg" viewBox="0 0 760 360" role="img" aria-label="Point p with three candidates. Two candidates fall in the same cone, so the lower scoring one is dropped. The third falls in a different cone and is kept."></svg>',
    '</div>',
  ].join('');

  const svg = node.querySelector('svg');

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
  [[0, 'h1'], [60, 'h2'], [120, 'h3']].forEach(([deg, name]) => {
    const [x, y] = pt(deg, R + (deg === 0 ? 14 : 16));
    svg.appendChild(el('text', { class: 'qi-label', x: f(x), y: f(y + 5), 'text-anchor': 'middle' }, name));
  });

  CANDIDATES.forEach((c) => {
    const [x, y] = pt(c.angle, c.r);
    const g = el('g', { class: `pn-hp__cand pn-hp__cand--${c.color}` });
    g.appendChild(el('line', { x1: CX, y1: CY, x2: f(x), y2: f(y) }));
    g.appendChild(el('circle', { cx: f(x), cy: f(y), r: 7 }));
    g.appendChild(el('text', { x: f(x + 12), y: f(y + 5) }, c.id));
    if (!c.keep) g.appendChild(cross(x, y, 11));
    svg.appendChild(g);
  });
  svg.appendChild(el('circle', { class: 'pn-hp__p', cx: CX, cy: CY, r: 9 }));
  svg.appendChild(el('text', { class: 'pn-hp__pname', x: CX + 14, y: CY + 26 }, 'p'));

  // Reservoir table
  svg.appendChild(el('text', { class: 'qi-title', x: 380, y: 16 }, 'What the reservoir does'));
  [['Candidate', 388], ['Score', 478], ['h1h2h3', 550], ['Decision', 650]].forEach(([t, x]) => svg.appendChild(el('text', { class: 'qi-label', x, y: 58 }, t)));
  CANDIDATES.forEach((c, i) => {
    const top = 72 + i * 76;
    const g = el('g', { class: 'pn-hp__row' });
    g.appendChild(el('rect', { class: 'qi-frame', x: 380, y: top, width: 380, height: 66, rx: 8 }));
    g.appendChild(el('circle', { class: `pn-hp__dot pn-hp__dot--${c.color}`, cx: 398, cy: top + 22, r: 7 }));
    if (!c.keep) g.appendChild(cross(398, top + 22, 11));
    g.appendChild(el('text', { class: 'pn-hp__strong', x: 412, y: top + 27 }, c.id));
    g.appendChild(el('text', { class: 'pn-hp__val', x: 478, y: top + 27 }, c.score));
    g.appendChild(el('text', { class: 'pn-hp__val pn-hp__val--hash', x: 550, y: top + 27 }, c.hash));
    g.appendChild(el('text', { class: `pn-hp__strong pn-hp__decision--${c.keep ? c.color : 'muted'}`, x: 650, y: top + 27 }, c.keep ? 'Keep' : 'Drop'));
    g.appendChild(el('text', { class: 'qi-label', x: 412, y: top + 52 }, c.reason));
    svg.appendChild(g);
  });

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
