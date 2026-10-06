/*
 * triplet island: interactive replacement for triplet-loss.png.
 *
 * Triplet loss trains a model so that an anchor ends up closer to its positive
 * than to its negative, by at least a margin. Discovery's context score reuses
 * that idea at search time: it measures how much closer a candidate is to a
 * negative than to a positive.
 *   Learning:  the anchor, positive, and negative before and after training.
 *   Searching: two candidates scored against a positive and a negative.
 * Positions are illustrative; the distances are computed from them.
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
  node.classList.toggle('ds-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('ds-narrow', narrow);
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

const MARGIN = 0.4;
// Unit coordinates: x to the right, y downwards, in a 1.6 x 1 panel.
const BEFORE = { a: [0.25, 0.55], p: [0.95, 0.7], n: [0.6, 0.2] };
const AFTER = { a: [0.3, 0.5], p: [0.62, 0.62], n: [1.1, 0.25] };
const SEARCH = { p: [0.65, 0.7], n: [0.55, 0.2], worse: [0.2, 0.3], better: [1.2, 0.72] };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const WIDE = { VB_W: 760, VB_H: 340, pw: 360, ph: 240 };
const NARROW = { VB_W: 340, VB_H: 400, pw: 300, ph: 170 };

export function mount(node) {
  node.classList.add('ds-tr');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Stage">',
    '      <button type="button" class="qi-chip" data-stage="learning" aria-pressed="false">Learning</button>',
    '      <button type="button" class="qi-chip" data-stage="searching" aria-pressed="false">Searching</button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 340" role="img" aria-label="Triplet loss in training and in search: an anchor with a positive and a negative before and after training, and two candidates scored against a positive and a negative.">',
    '    <g class="ds-tr__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ds-tr__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ds-tr__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.ds-tr__status');
  const chips = [...node.querySelectorAll('[data-stage]')];
  let stage = 'learning';
  const isNarrow = watchNarrow(node, () => render());
  const f2 = (v) => v.toFixed(2);

  function panel(ox, oy, G, pts, title, kind) {
    const s = G.pw / 1.6;
    const P = (u) => [ox + u[0] * s, oy + u[1] * s];
    g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: ox, y: oy - 10 }, title));
    g.appendChild(el('rect', { class: 'qi-frame', x: ox, y: oy, width: G.pw, height: G.ph, rx: 6 }));
    const segs = [];
    const arrow = (a, b, cls) => {
      const pa = P(a);
      const pb = P(b);
      const L = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) || 1;
      const ux = (pb[0] - pa[0]) / L;
      const uy = (pb[1] - pa[1]) / L;
      const ex = pb[0] - ux * 14;
      const ey = pb[1] - uy * 14;
      g.appendChild(el('line', { class: `ds-tr__arrow ${cls}`, x1: pa[0] + ux * 12, y1: pa[1] + uy * 12, x2: ex, y2: ey }));
      g.appendChild(el('polygon', { class: `ds-tr__head ${cls}`, points: `${ex + ux * 9},${ey + uy * 9} ${ex - uy * 4.5},${ey + ux * 4.5} ${ex + uy * 4.5},${ey - ux * 4.5}` }));
      segs.push({ s: true, x1: pa[0], y1: pa[1], x2: pb[0], y2: pb[1] });
    };
    const pending = [];
    // Rings are drawn now; labels are placed afterwards, once every point and arrow is known.
    const ring = (u, cls, label) => {
      const p = P(u);
      g.appendChild(el('circle', { class: `ds-tr__ring ${cls}`, cx: p[0], cy: p[1], r: 9 }));
      g.appendChild(el('circle', { class: 'ds-tr__dot', cx: p[0], cy: p[1], r: 3.5 }));
      pending.push({ p, cls, label });
    };
    if (kind === 'learn') {
      arrow(pts.a, pts.p, 'is-pos');
      arrow(pts.a, pts.n, 'is-neg');
      ring(pts.a, 'is-anchor', 'Anchor');
      ring(pts.p, 'is-pos', 'Positive');
      ring(pts.n, 'is-neg', 'Negative');
    } else {
      arrow(pts.c, pts.p, 'is-pos');
      arrow(pts.c, pts.n, 'is-neg');
      ring(pts.p, 'is-pos', 'Positive');
      ring(pts.n, 'is-neg', 'Negative');
      ring(pts.c, pts.good ? 'is-good' : 'is-bad', pts.good ? 'Better candidate' : 'Worse candidate');
    }
    const obstacles = [...segs, ...pending.map((q) => ({ x: q.p[0], y: q.p[1], r: 13 }))];
    const placer = makePlacer({ x0: ox + 4, y0: oy + 4, x1: ox + G.pw - 4, y1: oy + G.ph - 4 }, obstacles);
    pending.forEach((q) => {
      const pl = placer(q.p, q.label, 12);
      g.appendChild(el('text', { class: `qi-label ds-tr__lab ${q.cls}`, x: pl.x, y: pl.y }, q.label));
    });
  }

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    g.replaceChildren();
    if (stage === 'learning') {
      if (!narrow) {
        panel(10, 40, G, BEFORE, 'Before training', 'learn');
        panel(390, 40, G, AFTER, 'After training', 'learn');
      } else {
        panel(20, 28, G, BEFORE, 'Before training', 'learn');
        panel(20, 232, G, AFTER, 'After training', 'learn');
      }
      const b = [dist(BEFORE.a, BEFORE.p), dist(BEFORE.a, BEFORE.n)];
      const a = [dist(AFTER.a, AFTER.p), dist(AFTER.a, AFTER.n)];
      statusEl.innerHTML = `Before training, the anchor is closer to the negative (${f2(b[1])}) than to the positive (${f2(b[0])}). Training moves the points until <b>d(anchor, positive) + margin < d(anchor, negative)</b>: ${f2(a[0])} + ${MARGIN} < ${f2(a[1])}. Positions are illustrative.`;
    } else {
      const worse = { ...SEARCH, c: SEARCH.worse, good: false };
      const better = { ...SEARCH, c: SEARCH.better, good: true };
      if (!narrow) {
        panel(10, 40, G, worse, 'Worse candidate', 'search');
        panel(390, 40, G, better, 'Better candidate', 'search');
      } else {
        panel(20, 28, G, worse, 'Worse candidate', 'search');
        panel(20, 232, G, better, 'Better candidate', 'search');
      }
      const sc = (pt) => Math.min(0, dist(pt, SEARCH.n) - dist(pt, SEARCH.p));
      statusEl.innerHTML = `At search time the same idea scores a candidate by how much <b>closer it is to a negative than to a positive</b>. The worse candidate is closer to the negative (${f2(dist(SEARCH.worse, SEARCH.n))} vs ${f2(dist(SEARCH.worse, SEARCH.p))}): score <b>${f2(sc(SEARCH.worse))}</b>. The better one is closer to the positive: score <b>${f2(sc(SEARCH.better))}</b>.`;
    }
  }

  function setStage(s) {
    stage = s;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.stage === stage)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setStage(b.dataset.stage)));

  setStage('learning');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
