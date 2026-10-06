/*
 * plane island: interactive replacement for discovery-search.png,
 * context-search.png and complex-context-search.png.
 *
 * A context is a list of pairs, each a positive and a negative point. Each pair
 * defines a hyperplane halfway between them, and a point scores 0 for that pair
 * when it is at least as close to the positive, and a negative score (how much
 * closer it is to the negative) otherwise. Points that score 0 for every pair
 * form the zone the search is confined to.
 *   Discovery search: a target ranks the points inside the zone by similarity.
 *   Context search:   there is no target, so the zone itself is the result.
 *   Recommendation:   for comparison, results simply stay close to the positive.
 * Add context pairs and switch modes. The points are seeded and illustrative.
 * The starting mode follows the caption: "Recommendation..." or "Context search...".
 */

const NS = 'http://www.w3.org/2000/svg';
let uid = 0;

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

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pairs and target in fractions of the plane, so they fit both layouts.
const PAIRS = [
  { pos: [0.4, 0.3], neg: [0.38, 0.8] },
  { pos: [0.66, 0.3], neg: [0.26, 0.2] },
  { pos: [0.6, 0.55], neg: [0.93, 0.16] },
];
const TARGET = [0.56, 0.4];
const N_RESULTS = 4;

const WIDE = { VB_W: 760, VB_H: 380, px: 10, py: 10, pw: 740, ph: 320 };
const NARROW = { VB_W: 340, VB_H: 420, px: 10, py: 10, pw: 320, ph: 300 };

export function mount(node) {
  const id = `ds-clip-${uid++}`;
  node.classList.add('ds-pl');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Mode">',
    '      <button type="button" class="qi-chip" data-mode="discovery" aria-pressed="false">Discovery (target + context)</button>',
    '      <button type="button" class="qi-chip" data-mode="context" aria-pressed="false">Context search</button>',
    '      <button type="button" class="qi-chip" data-mode="recommendation" aria-pressed="false">Recommendation</button>',
    '    </div>',
    '    <div class="qi-group" role="group" aria-label="Number of context pairs">',
    [1, 2, 3].map((n) => `<button type="button" class="qi-chip" data-pairs="${n}" aria-pressed="false">${n} pair${n > 1 ? 's' : ''}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 380" role="img" aria-label="Points in a plane, context pairs of positive and negative points with the hyperplanes between them, and the zone where the search is confined.">',
    `    <defs><clipPath id="${id}"><rect class="ds-pl__clip" x="0" y="0" width="10" height="10"/></clipPath></defs>`,
    '    <g class="ds-pl__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ds-pl__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ds-pl__g');
  const svg = node.querySelector('svg');
  const clipRect = node.querySelector('.ds-pl__clip');
  const statusEl = node.querySelector('.ds-pl__status');
  const modeChips = [...node.querySelectorAll('[data-mode]')];
  const pairChips = [...node.querySelectorAll('[data-pairs]')];

  // The caption sets the starting view.
  const fig = node.closest('.island');
  const cap = fig && fig.querySelector('.island__caption');
  const capText = cap ? cap.textContent : '';
  let mode = /^recommendation/i.test(capText) ? 'recommendation' : /^context search/i.test(capText) ? 'context' : 'discovery';
  let nPairs = mode === 'context' ? 3 : 1;
  let hovered = null;
  let pinned = null;
  let last = null;
  const isNarrow = watchNarrow(node, () => render());

  // Seeded points in unit coordinates, away from the context points.
  const rnd = mulberry32(31);
  const fixed = [...PAIRS.flatMap((p) => [p.pos, p.neg]), TARGET];
  const pts = [];
  let guard = 0;
  while (pts.length < 36 && guard++ < 20000) {
    const p = [0.03 + rnd() * 0.94, 0.04 + rnd() * 0.92];
    if (fixed.some((f) => Math.hypot((f[0] - p[0]) * 2.2, f[1] - p[1]) < 0.09)) continue;
    if (pts.some((q) => Math.hypot((q[0] - p[0]) * 2.2, q[1] - p[1]) < 0.075)) continue;
    pts.push(p);
  }

  function render() {
    const narrow = isNarrow();
    const G = narrow ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${G.VB_W} ${G.VB_H}`);
    clipRect.setAttribute('x', G.px);
    clipRect.setAttribute('y', G.py);
    clipRect.setAttribute('width', G.pw);
    clipRect.setAttribute('height', G.ph);
    g.replaceChildren();
    const P = (f) => [G.px + f[0] * G.pw, G.py + f[1] * G.ph];
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const usedPairs = mode === 'recommendation' ? 1 : nPairs;
    // Distances use a fixed model plane; resizing changes only its projection.
    const M = (f) => [f[0] * WIDE.pw, f[1] * WIDE.ph];
    const pairs = PAIRS.slice(0, usedPairs).map((p) => ({ pos: P(p.pos), neg: P(p.neg), modelPos: M(p.pos), modelNeg: M(p.neg) }));
    const target = P(TARGET);

    // Context score of a point: sum over pairs of min(0, closer-to-negative amount).
    const score = (pt) => pairs.reduce((s, pr) => s + Math.min(0, dist(pt, pr.modelNeg) - dist(pt, pr.modelPos)), 0);
    const scored = pts.map((f, i) => {
      const pt = P(f);
      return { i, pt, model: M(f), s: score(M(f)), dt: dist(M(f), M(TARGET)) };
    });
    const inZone = scored.filter((p) => p.s === 0);
    const ranked = mode === 'discovery'
      ? [...scored].sort((a, b) => (b.s === 0) - (a.s === 0) || (a.s === 0 ? a.dt - b.dt : b.s - a.s)).slice(0, N_RESULTS)
      : mode === 'recommendation'
        ? [...scored].sort((a, b) => dist(a.model, pairs[0].modelPos) - dist(b.model, pairs[0].modelPos)).slice(0, N_RESULTS)
        : [];
    const resultSet = new Set(ranked.map((r) => r.i));

    g.appendChild(el('rect', { class: 'qi-frame', x: G.px, y: G.py, width: G.pw, height: G.ph, rx: 6 }));

    // Zone polygon: the frame clipped by every pair's half-plane.
    let poly = [[G.px, G.py], [G.px + G.pw, G.py], [G.px + G.pw, G.py + G.ph], [G.px, G.py + G.ph]];
    pairs.forEach((pr) => {
      const m = [(pr.pos[0] + pr.neg[0]) / 2, (pr.pos[1] + pr.neg[1]) / 2];
      const n = [(pr.modelPos[0] - pr.modelNeg[0]) * WIDE.pw / G.pw, (pr.modelPos[1] - pr.modelNeg[1]) * WIDE.ph / G.ph];
      const out = [];
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k];
        const b = poly[(k + 1) % poly.length];
        const da = (a[0] - m[0]) * n[0] + (a[1] - m[1]) * n[1];
        const db = (b[0] - m[0]) * n[0] + (b[1] - m[1]) * n[1];
        if (da >= 0) out.push(a);
        if (da >= 0 !== db >= 0) {
          const t = da / (da - db);
          out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
        }
      }
      poly = out;
    });
    if (poly.length >= 3) g.appendChild(el('path', { class: 'ds-pl__zone', d: poly.map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('') + 'Z' }));

    // Hyperplanes and pair links.
    pairs.forEach((pr) => {
      const m = [(pr.pos[0] + pr.neg[0]) / 2, (pr.pos[1] + pr.neg[1]) / 2];
      const d = [-(pr.modelPos[1] - pr.modelNeg[1]) * WIDE.ph / G.ph, (pr.modelPos[0] - pr.modelNeg[0]) * WIDE.pw / G.pw];
      const L = Math.hypot(d[0], d[1]) || 1;
      const u = [(d[0] / L) * 2000, (d[1] / L) * 2000];
      g.appendChild(el('line', { class: 'ds-pl__plane', x1: m[0] - u[0], y1: m[1] - u[1], x2: m[0] + u[0], y2: m[1] + u[1], 'clip-path': `url(#${id})` }));
      g.appendChild(el('line', { class: 'ds-pl__link', x1: pr.pos[0], y1: pr.pos[1], x2: pr.neg[0], y2: pr.neg[1] }));
    });

    if (mode === 'recommendation') {
      ranked.forEach((r) => g.appendChild(el('line', { class: 'ds-pl__tline', x1: pairs[0].pos[0], y1: pairs[0].pos[1], x2: r.pt[0], y2: r.pt[1] })));
    }
    if (mode === 'discovery') {
      ranked.filter((r) => r.s === 0).forEach((r) => g.appendChild(el('line', { class: 'ds-pl__tline', x1: target[0], y1: target[1], x2: r.pt[0], y2: r.pt[1] })));
    }

    const minS = Math.min(...scored.map((p) => p.s), -1);
    scored.forEach((p) => {
      const o = p.s === 0 ? 1 : Math.max(0.2, 1 - (p.s / minS) * 0.8);
      g.appendChild(el('circle', { class: `ds-pl__pt${resultSet.has(p.i) ? ' is-result' : ''}`, cx: p.pt[0], cy: p.pt[1], r: 6, style: `opacity:${o.toFixed(2)}`, 'data-i': p.i }));
      if (resultSet.has(p.i)) g.appendChild(el('circle', { class: 'ds-pl__ring is-result', cx: p.pt[0], cy: p.pt[1], r: 11, 'pointer-events': 'none' }));
    });
    pairs.forEach((pr) => {
      g.appendChild(el('circle', { class: 'ds-pl__ctx is-pos', cx: pr.pos[0], cy: pr.pos[1], r: 11 }));
      g.appendChild(el('circle', { class: 'ds-pl__ctx is-neg', cx: pr.neg[0], cy: pr.neg[1], r: 11 }));
      g.appendChild(el('circle', { class: 'ds-pl__dot', cx: pr.pos[0], cy: pr.pos[1], r: 5 }));
      g.appendChild(el('circle', { class: 'ds-pl__dot', cx: pr.neg[0], cy: pr.neg[1], r: 5 }));
    });
    if (mode === 'discovery') {
      g.appendChild(el('circle', { class: 'ds-pl__ctx is-target', cx: target[0], cy: target[1], r: 11 }));
      g.appendChild(el('circle', { class: 'ds-pl__dot', cx: target[0], cy: target[1], r: 5 }));
    }

    // Legend
    let ly = G.py + G.ph + 28;
    const items = [['is-pos', 'positive'], ['is-neg', 'negative']];
    if (mode === 'discovery') items.push(['is-target', 'target'], ['is-result', 'top results']);
    if (mode === 'recommendation') items.push(['is-result', 'top results']);
    let lx = G.px;
    items.forEach(([cls, t]) => {
      const width = 34 + t.length * 8 + (narrow ? 0 : 20);
      if (lx + width > G.px + G.pw) { lx = G.px; ly += 28; }
      g.appendChild(el('circle', { class: `ds-pl__ctx ${cls}`, cx: lx + 8, cy: ly - 4, r: 8 }));
      g.appendChild(el('text', { class: 'qi-label', x: lx + 22, y: ly }, t));
      lx += 34 + t.length * 8 + (narrow ? 0 : 20);
    });
    if (lx + 110 > G.px + G.pw) { lx = G.px; ly += 28; }
    g.appendChild(el('line', { class: 'ds-pl__plane', x1: lx, y1: ly - 4, x2: lx + 22, y2: ly - 4 }));
    g.appendChild(el('text', { class: 'qi-label', x: lx + 30, y: ly }, 'hyperplane'));

    // Status
    const base = mode === 'recommendation'
      ? `<b>Recommendation</b>: the results are simply the points closest to the positive example, so they pile up around it. Any point in the shaded zone is a valid <b>context</b> result, including ones far from the positive.`
      : mode === 'discovery'
      ? `<b>Discovery search</b>: ${nPairs} context pair${nPairs > 1 ? 's' : ''} confine${nPairs > 1 ? '' : 's'} the search to the shaded zone, and the <b>target</b> ranks the ${inZone.length} point${inZone.length === 1 ? '' : 's'} inside it. The ringed points are the top ${Math.min(N_RESULTS, inZone.length)}.`
      : `<b>Context search</b>: no target, so every point in the shaded zone (${inZone.length}) is an equally good result, and points outside score lower the farther they are on the negative side. ${nPairs === 3 ? 'More pairs narrow the zone further.' : 'Add pairs to narrow the zone.'}`;
    last = { scored, base };
    updateHot();
  }

  function updateHot() {
    if (!last) return;
    const hot = pinned != null ? pinned : hovered;
    node.querySelectorAll('.ds-pl__pt').forEach((c) => c.classList.toggle('is-hot', hot != null && Number(c.getAttribute('data-i')) === hot));
    if (hot != null) {
      const p = last.scored[hot];
      statusEl.innerHTML = p.s === 0 ? `Point ${hot + 1} is on the positive side of every pair: context score <b>0</b>, so it is inside the zone.` : `Point ${hot + 1} is closer to a negative than to its positive: context score <b>${p.s.toFixed(0)}</b> (in fixed model units), so it is outside the zone.`;
    } else {
      statusEl.innerHTML = last.base + ' Hover a point for its score.';
    }
  }

  function sync() {
    modeChips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    pairChips.forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.pairs) === (mode === 'recommendation' ? 1 : nPairs)));
      b.disabled = mode === 'recommendation' && Number(b.dataset.pairs) !== 1;
    });
    render();
  }
  modeChips.forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    sync();
  }));
  pairChips.forEach((b) => b.addEventListener('click', () => {
    nPairs = Number(b.dataset.pairs);
    sync();
  }));
  const idx = (e) => {
    const t = e.target.closest ? e.target.closest('.ds-pl__pt') : null;
    return t ? Number(t.getAttribute('data-i')) : null;
  };
  svg.addEventListener('pointerover', (e) => {
    const i = idx(e);
    if (i != null && i !== hovered) {
      hovered = i;
      updateHot();
    }
  });
  svg.addEventListener('pointerout', (e) => {
    if (idx(e) != null) {
      hovered = null;
      updateHot();
    }
  });
  svg.addEventListener('click', (e) => {
    const i = idx(e);
    if (i == null) return;
    pinned = pinned === i ? null : i;
    updateHot();
  });

  sync();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
