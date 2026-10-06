/*
 * exclusion island: interactive replacement for the "Exclusion rules" figure.
 *
 * A neural exclusion rule is two anchors encoded in vector space. If the query
 * falls inside the first anchor's radius, the rule fires and every reference
 * inside the second anchor's effect radius is excluded from the results. Drag
 * the query, or use the chips, to move it in and out of the anchor radius.
 * Points are illustrative; the exclusion and the nearest references are computed.
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
  node.classList.toggle('ml-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('ml-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

// Label placement: try several spots around a point and take the first that stays inside the
// bounds and clears every obstacle (points as circles, lines as segments) and earlier labels.
function makePlacer(bounds, obstacles) {
  const placed = [];
  const H = 14;
  const segHits = (o, r) => {
    const len = Math.hypot(o.x2 - o.x1, o.y2 - o.y1);
    const n = Math.max(2, Math.ceil(len / 5));
    for (let i = 0; i <= n; i++) {
      const x = o.x1 + ((o.x2 - o.x1) * i) / n;
      const y = o.y1 + ((o.y2 - o.y1) * i) / n;
      if (x > r.x - 2 && x < r.x + r.w + 2 && y > r.y - 2 && y < r.y + r.h + 2) return true;
    }
    return false;
  };
  const hits = (r) =>
    obstacles.some((o) => (o.s ? segHits(o, r) : o.x > r.x - o.r && o.x < r.x + r.w + o.r && o.y > r.y - o.r && o.y < r.y + r.h + o.r)) ||
    placed.some((o) => r.x < o.x + o.w + 3 && r.x + r.w + 3 > o.x && r.y < o.y + o.h + 2 && r.y + r.h + 2 > o.y);
  return function place(p, text, rad = 14) {
    const w = text.length * 7.9;
    const rings = [0, 14, 30];
    let best = null;
    for (const extra of rings) {
      const r = rad + extra;
      const cands = [
        [p[0] + r + 2, p[1] - H / 2],
        [p[0] - r - 2 - w, p[1] - H / 2],
        [p[0] + 6, p[1] - r - H],
        [p[0] + 6, p[1] + r],
        [p[0] - 6 - w, p[1] - r - H],
        [p[0] - 6 - w, p[1] + r],
        [p[0] - w / 2, p[1] - r - H],
        [p[0] - w / 2, p[1] + r],
      ];
      for (const [x, y] of cands) {
        const box = { x, y, w, h: H };
        if (x < bounds.x0 || x + w > bounds.x1 || y < bounds.y0 || y + H > bounds.y1) continue;
        if (!hits(box)) {
          best = { box, extra };
          break;
        }
      }
      if (best) break;
    }
    if (!best) {
      const x = Math.min(Math.max(p[0] + rad + 2, bounds.x0), bounds.x1 - w);
      best = { box: { x, y: Math.min(Math.max(p[1] - H / 2, bounds.y0), bounds.y1 - H), w, h: H }, extra: 0 };
    }
    placed.push(best.box);
    return { x: best.box.x, y: best.box.y + H - 3, leader: best.extra > 0, box: best.box };
  };
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

// Frame fractions (x, y); the frame is W x 1 in height units, so circles stay round.
const FA = [0.2, 0.36];
const FE = [0.72, 0.68];
const R_ANCHOR = 0.2;
const R_EFFECT = 0.19;
const F_INSIDE = [0.17, 0.42];
const F_OUTSIDE = [0.45, 0.2];
const F_EXCLUDED = [[0.66, 0.74], [0.78, 0.62]]; // references inside the effect radius
const rnd = mulberry32(6);
const F_OTHERS = [];
let guard = 0;
while (F_OTHERS.length < 8 && guard++ < 8000) {
  const p = [0.05 + rnd() * 0.9, 0.08 + rnd() * 0.84];
  const near = (c, r) => Math.hypot((p[0] - c[0]) * 2, p[1] - c[1]) < r;
  if (near(FA, R_ANCHOR + 0.1) || near(FE, R_EFFECT + 0.1) || near(F_INSIDE, 0.14) || near(F_OUTSIDE, 0.14)) continue;
  if (F_OTHERS.some((q) => Math.hypot((q[0] - p[0]) * 2, q[1] - p[1]) < 0.2)) continue;
  F_OTHERS.push(p);
}
const F_REFS = [...F_EXCLUDED, ...F_OTHERS];
const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const WIDE = { VB_W: 760, VB_H: 330, fw: 740, fh: 300, fx: 10, fy: 10 };
const NARROW = { VB_W: 340, VB_H: 270, fw: 320, fh: 230, fx: 10, fy: 10 };

export function mount(node) {
  node.classList.add('ml-ex');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Query position">',
    '      <button type="button" class="qi-chip" data-pos="in" aria-pressed="false">Query inside the anchor radius</button>',
    '      <button type="button" class="qi-chip" data-pos="out" aria-pressed="false">Query outside</button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 350" role="img" aria-label="An exclusion rule: a query, a rule anchor with a radius, and a second anchor whose effect radius contains references that are excluded when the rule fires. The query can be dragged.">',
    '    <g class="ml-ex__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ml-ex__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ml-ex__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.ml-ex__status');
  const chips = [...node.querySelectorAll('[data-pos]')];
  let G = WIDE;
  const isNarrow = watchNarrow(node, () => render());

  let q = null;

  function render() {
    const narrow = isNarrow();
    G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    const W = G.fw / G.fh;
    const s = G.fh;
    const U = (f) => [f[0] * W, f[1]];
    const P = (u) => [G.fx + u[0] * s, G.fy + u[1] * s];
    const ANCHOR = U(FA);
    const EFFECT = U(FE);
    const REFS = F_REFS.map(U);
    if (!q) q = U(F_INSIDE);
    q = [Math.min(q[0], W - 0.05), q[1]];
    g.appendChild(el('rect', { class: 'qi-frame', x: G.fx, y: G.fy, width: G.fw, height: G.fh, rx: 8 }));

    const fired = d(q, ANCHOR) <= R_ANCHOR;
    const excluded = (r) => fired && d(r, EFFECT) <= R_EFFECT;
    const pa = P(ANCHOR);
    const pe = P(EFFECT);
    g.appendChild(el('circle', { class: 'ml-ex__radius', cx: pa[0], cy: pa[1], r: R_ANCHOR * s }));
    g.appendChild(el('circle', { class: 'ml-ex__radius', cx: pe[0], cy: pe[1], r: R_EFFECT * s }));
    g.appendChild(el('line', { class: `ml-ex__rule${fired ? ' is-on' : ''}`, x1: pa[0], y1: pa[1], x2: pe[0], y2: pe[1] }));

    const ranked = REFS.map((r, i) => ({ i, r })).sort((a, b) => d(a.r, q) - d(b.r, q));
    const top = ranked.filter((x) => !excluded(x.r)).slice(0, 3).map((x) => x.i);

    REFS.forEach((r, i) => {
      const p = P(r);
      const ex = excluded(r);
      g.appendChild(el('circle', { class: `ml-ex__ref${ex ? ' is-excluded' : ''}`, cx: p[0], cy: p[1], r: 7 }));
      if (top.includes(i)) g.appendChild(el('circle', { class: 'ml-ex__ring', cx: p[0], cy: p[1], r: 12 }));
      if (ex) g.appendChild(el('path', { class: 'ml-ex__x', d: `M${p[0] - 5} ${p[1] - 5} L${p[0] + 5} ${p[1] + 5} M${p[0] - 5} ${p[1] + 5} L${p[0] + 5} ${p[1] - 5}` }));
    });
    [pa, pe].forEach((p) => g.appendChild(el('circle', { class: 'ml-ex__anchor', cx: p[0], cy: p[1], r: 8 })));
    const pq = P(q);
    g.appendChild(el('circle', { class: 'ml-ex__q', cx: pq[0], cy: pq[1], r: 9 }));
    g.appendChild(el('circle', { class: 'ml-ex__qhit', cx: pq[0], cy: pq[1], r: 22 }));

    // Labels avoid points, rings, and the rule line.
    const obstacles = [...REFS.map(P), pa, pe, pq].map((p) => ({ x: p[0], y: p[1], r: 14 }));
    obstacles.push({ s: true, x1: pa[0], y1: pa[1], x2: pe[0], y2: pe[1] });
    const place = makePlacer({ x0: G.fx + 4, y0: G.fy + 4, x1: G.fx + G.fw - 4, y1: G.fy + G.fh - 4 }, obstacles);
    [[[pa[0], pa[1] - R_ANCHOR * s], 'Rule anchor radius', '', 4], [[pe[0], pe[1] + R_EFFECT * s], 'Rule effect radius', '', 4], [pq, 'Query', 'is-q', 12]].forEach(([pt, text, cls, rad]) => {
      const pl = place(pt, text, rad);
      g.appendChild(el('text', { class: `qi-label ml-ex__lab ${cls}`, x: pl.x, y: pl.y }, text));
    });

    const nEx = REFS.filter((r) => excluded(r)).length;
    statusEl.innerHTML = fired
      ? `The query is inside the rule's anchor radius, so the <b>rule fires</b> and the <b>${nEx} references</b> inside the effect radius are excluded (crossed out). The ringed references are the nearest three that remain.`
      : `The query is outside the rule's anchor radius, so the <b>rule does not fire</b>. All references stay in play, and the ringed ones are the nearest three. Drag the query into the anchor radius to trigger the rule.`;
    chips.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.pos === 'in') === fired)));
  }

  // Dragging the query.
  let dragging = false;
  const toUnit = (e) => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    const local = m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
    const s = G.fh;
    const W = G.fw / G.fh;
    return [Math.min(W - 0.02, Math.max(0.02, (local.x - G.fx) / s)), Math.min(0.97, Math.max(0.03, (local.y - G.fy) / s))];
  };
  svg.addEventListener('pointerdown', (e) => {
    if (!(e.target.closest && e.target.closest('.ml-ex__qhit, .ml-ex__q'))) return;
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    q = toUnit(e);
    render();
  });
  const stop = () => {
    dragging = false;
  };
  svg.addEventListener('pointerup', stop);
  svg.addEventListener('pointercancel', stop);
  chips.forEach((b) => b.addEventListener('click', () => {
    const Wd = G.fw / G.fh;
    q = b.dataset.pos === 'in' ? [F_INSIDE[0] * Wd, F_INSIDE[1]] : [F_OUTSIDE[0] * Wd, F_OUTSIDE[1]];
    render();
  }));

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
