/*
 * rocchio island: interactive replacement for Roccio.png.
 *
 * Rocchio's method moves the query vector toward the centroid of the relevant
 * documents and away from the centroid of the non-relevant ones:
 *   Query* = Query + beta * centroid(positive) - gamma * centroid(negative)
 * The plane is a 2D illustration with seeded points; the centroids and the new
 * query are computed from them. Choose the weights to see the query move.
 */

const NS = 'http://www.w3.org/2000/svg';

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
  node.classList.toggle('sf-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('sf-narrow', narrow);
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

// Plane units: the plane spans [-2.2, 2.2] x [-1.5, 1.5].
const rnd = mulberry32(12);
const around = (cx, cy, n, spread) => Array.from({ length: n }, () => [cx + (rnd() - 0.5) * spread, cy + (rnd() - 0.5) * spread]);
const POS = around(-1.5, -0.3, 5, 0.9);
const NEG = around(1.25, 0.8, 5, 0.9);
const OTHER = [[-0.6, 0.9], [0.2, 1.2], [-0.2, -1.1], [0.8, -0.9], [-1.1, 1.1], [1.6, -0.4], [0.3, 0.1], [-0.4, 0.3]];
const Q = [0.55, -0.35];
const mean = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
const CP = mean(POS);
const CN = mean(NEG);

const PRESETS = [
  { id: 'pos', label: 'Positive only', beta: 0.3, gamma: 0 },
  { id: 'both', label: 'Positive and negative', beta: 0.3, gamma: 0.15 },
  { id: 'strong', label: 'Stronger weights', beta: 0.6, gamma: 0.3 },
];

const WIDE = { VB_W: 760, VB_H: 340, px: 20, py: 20, pw: 460, ph: 300, u: 100 };
const NARROW = { VB_W: 340, VB_H: 420, px: 10, py: 10, pw: 320, ph: 250, u: 70 };

export function mount(node) {
  node.classList.add('sf-ro');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Weights">',
    PRESETS.map((p) => `<button type="button" class="qi-chip" data-preset="${p.id}" aria-pressed="false">${p.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 340" role="img" aria-label="A query vector moves toward the centroid of positive feedback documents and away from the centroid of negative ones, giving a new query.">',
    '    <g class="sf-ro__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 sf-ro__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.sf-ro__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.sf-ro__status');
  const chips = [...node.querySelectorAll('[data-preset]')];
  let cur = PRESETS[1];
  const isNarrow = watchNarrow(node, () => render());

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    const cx = G.px + G.pw / 2;
    const cy = G.py + G.ph / 2;
    const X = (p) => cx + p[0] * G.u;
    const Y = (p) => cy + p[1] * G.u;
    // Labels try several offsets and take the first that clears every point and earlier label.
    const boxes = [];
    const dots = [...OTHER, ...POS, ...NEG, Q, CP, CN].map((p) => ({ x: X(p), y: Y(p), r: 11 }));
    const hit = (r) => dots.some((d) => d.x > r.x - d.r && d.x < r.x + r.w + d.r && d.y > r.y - d.r && d.y < r.y + r.h + d.r) || boxes.some((o) => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y);
    const label = (p, t, cls = '') => {
      const w = t.length * 7.9;
      const h = 14;
      const px0 = X(p);
      const py0 = Y(p);
      const cands = [[14, -4], [14, h + 8], [-w - 14, -4], [-w - 14, h + 8], [-w / 2, -16], [-w / 2, h + 14], [14, -22], [-w - 14, -22]];
      let pick = cands[0];
      for (const c of cands) {
        if (!hit({ x: px0 + c[0], y: py0 + c[1] - h, w, h })) {
          pick = c;
          break;
        }
      }
      boxes.push({ x: px0 + pick[0], y: py0 + pick[1] - h, w, h });
      g.appendChild(el('text', { class: `qi-label sf-ro__lab ${cls}`, x: px0 + pick[0], y: py0 + pick[1] }, t));
    };

    g.appendChild(el('rect', { class: 'qi-frame', x: G.px, y: G.py, width: G.pw, height: G.ph, rx: 6 }));
    OTHER.forEach((p) => g.appendChild(el('circle', { class: 'sf-ro__pt is-other', cx: X(p), cy: Y(p), r: 8 })));
    POS.forEach((p) => g.appendChild(el('circle', { class: 'sf-ro__pt is-pos', cx: X(p), cy: Y(p), r: 8 })));
    NEG.forEach((p) => g.appendChild(el('circle', { class: 'sf-ro__pt is-neg', cx: X(p), cy: Y(p), r: 8 })));

    const cross = (p, cls) => {
      const x = X(p);
      const y = Y(p);
      g.appendChild(el('path', { class: `sf-ro__x ${cls}`, d: `M${x - 6} ${y - 6} L${x + 6} ${y + 6} M${x - 6} ${y + 6} L${x + 6} ${y - 6}` }));
    };
    cross(CP, 'is-pos');
    cross(CN, 'is-neg');

    const mid = [Q[0] + cur.beta * CP[0], Q[1] + cur.beta * CP[1]];
    const Qn = [mid[0] - cur.gamma * CN[0], mid[1] - cur.gamma * CN[1]];
    g.appendChild(el('line', { class: 'sf-ro__step is-pos', x1: X(Q), y1: Y(Q), x2: X(mid), y2: Y(mid) }));
    if (cur.gamma > 0) g.appendChild(el('line', { class: 'sf-ro__step is-neg', x1: X(mid), y1: Y(mid), x2: X(Qn), y2: Y(Qn) }));
    g.appendChild(el('circle', { class: 'sf-ro__q', cx: X(Q), cy: Y(Q), r: 7 }));
    g.appendChild(el('circle', { class: 'sf-ro__qn', cx: X(Qn), cy: Y(Qn), r: 8 }));
    label(Q, 'Query', 'qi-label--strong');
    label(Qn, 'Query*', 'sf-ro__qnlab');
    label(CP, 'positive', 'sf-ro__poslab');
    label(CN, 'negative', 'sf-ro__neglab');

    // Weights and formula panel
    const tx = narrow ? G.px : G.px + G.pw + 30;
    const ty = narrow ? G.py + G.ph + 26 : 70;
    const t = (dy, txt, cls = '') => g.appendChild(el('text', { class: `qi-label ${cls}`, x: tx, y: ty + dy }, txt));
    t(0, 'Query* = Query', 'qi-label--strong');
    t(22, `+ β · centroid(positive)`, 'sf-ro__poslab');
    t(44, `− γ · centroid(negative)`, 'sf-ro__neglab');
    t(78, `β = ${cur.beta}`, 'qi-label--strong');
    t(100, `γ = ${cur.gamma}`, 'qi-label--strong');
    if (narrow) svg.setAttribute('viewBox', `0 0 340 ${ty + 118}`);

    statusEl.innerHTML =
      cur.gamma === 0
        ? `With only positive feedback (<b>β = ${cur.beta}</b>), the query moves a fraction of the way toward the centroid of the positive documents.`
        : `With <b>β = ${cur.beta}</b> and <b>γ = ${cur.gamma}</b>, the query moves toward the positive centroid and away from the negative one. The weights ${cur.beta >= 0.6 ? 'are large: a stronger push risks drifting from the original intent.' : 'are small, so the query stays close to the original.'} Points are illustrative.`;
  }

  function setPreset(id) {
    cur = PRESETS.find((p) => p.id === id);
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === cur.id)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setPreset(b.dataset.preset)));

  setPreset('both');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
