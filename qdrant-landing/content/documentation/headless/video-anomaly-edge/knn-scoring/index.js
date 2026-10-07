/*
 * knn-scoring island: interactive illustration that replaces umap-scatter.png
 * in the "Video Anomaly Detection Part 3" tutorial.
 *
 * A scatter of synthetic points stands in for a 2D projection of clip
 * embeddings: three clusters of normal footage (the baseline), a few
 * borderline clips between clusters, and a few anomalous clips far from
 * everything. Select a point, or one of the example chips, to see the three
 * nearest baseline clips and the resulting anomaly score: the mean distance to
 * them, which is the kNN scoring the tutorial uses with k=3.
 *
 * ILLUSTRATIVE ONLY: the coordinates are generated from a fixed seed and the
 * scores are in arbitrary units. Nothing here is measured data.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Two
 * layouts: a wide landscape one and a narrow portrait one, each with its own
 * point positions, so labels stay readable on phones.
 */

const NS = 'http://www.w3.org/2000/svg';
const WIDE_MIN = 560; // container px at which the wide layout keeps text >= 12px
const K = 3;

// Geometry of the two layouts (viewBox units). `unit` converts distances to
// score units so both layouts give similar scores.
const LAYOUTS = {
  wide: {
    w: 640,
    plotH: 350,
    unit: 25,
    clusters: [
      { cx: 150, cy: 120, sd: 36, n: 40, c: '--qi-cat-1', label: 'scene A' },
      { cx: 330, cy: 215, sd: 32, n: 32, c: '--qi-cat-2', label: 'scene B' },
      { cx: 170, cy: 285, sd: 30, n: 32, c: '--qi-cat-3', label: 'scene C' },
    ],
    border: { cx: 400, cy: 120, sd: 26 },
    outliers: [
      [575, 60],
      [600, 160],
      [500, 300],
      [455, 38],
      [600, 275],
    ],
  },
  narrow: {
    w: 360,
    plotH: 430,
    unit: 14,
    clusters: [
      { cx: 105, cy: 92, sd: 22, n: 40, c: '--qi-cat-1', label: 'scene A' },
      { cx: 235, cy: 215, sd: 20, n: 32, c: '--qi-cat-2', label: 'scene B' },
      { cx: 105, cy: 335, sd: 19, n: 32, c: '--qi-cat-3', label: 'scene C' },
    ],
    border: { cx: 190, cy: 155, sd: 12 },
    outliers: [
      [322, 36],
      [335, 150],
      [310, 365],
      [215, 405],
      [338, 290],
    ],
  },
};

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makePoints(layout = 'wide') {
  const L = LAYOUTS[layout];
  const rnd = mulberry32(11);
  const gauss = () => {
    const u = Math.max(rnd(), 1e-9);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pts = [];
  L.clusters.forEach((cl, ci) => {
    for (let i = 0; i < cl.n; i++) {
      pts.push({ kind: 'normal', cluster: ci, x: clamp(cl.cx + gauss() * cl.sd, 14, L.w - 14), y: clamp(cl.cy + gauss() * cl.sd, 14, L.plotH - 14) });
    }
  });
  for (let i = 0; i < 12; i++) {
    pts.push({ kind: 'borderline', x: clamp(L.border.cx + gauss() * L.border.sd, 14, L.w - 14), y: clamp(L.border.cy + gauss() * L.border.sd, 14, L.plotH - 14) });
  }
  L.outliers.forEach(([x, y]) => pts.push({ kind: 'anomaly', x, y }));
  pts.forEach((p, i) => (p.id = i));

  // Anomaly score: mean distance to the K nearest baseline (normal) points.
  const baseline = pts.filter((p) => p.kind === 'normal');
  pts.forEach((p) => {
    const near = baseline
      .filter((q) => q !== p)
      .map((q) => ({ q, d: Math.hypot(p.x - q.x, p.y - q.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, K);
    p.near = near.map((n) => n.q.id);
    p.score = near.reduce((s, n) => s + n.d, 0) / K / L.unit;
  });
  return pts;
}

// Find a spot for a label where it does not cover any point. `candidates` are
// tried in order; each is { x, y, anchor } with y as the text baseline. Labels
// are 14px monospace, about 8.6 units per character.
export function placeLabel(pts, text, candidates, layout = 'wide', taken = []) {
  const L = LAYOUTS[layout];
  const w = text.length * 8.6 + 8;
  const rectOf = (c) => {
    const x0 = c.anchor === 'middle' ? c.x - w / 2 : c.anchor === 'end' ? c.x - w : c.x;
    return [x0, c.y - 14, x0 + w, c.y + 5];
  };
  const fits = (c) => {
    const [x0, y0, x1, y1] = rectOf(c);
    if (x0 < 6 || x1 > L.w - 6 || y0 < 6 || y1 > L.plotH - 6) return false;
    // Keep clear of other labels (with a small margin) and of every point.
    if (taken.some(([a, b, c2, d]) => !(x1 + 4 < a || x0 - 4 > c2 || y1 + 4 < b || y0 - 4 > d))) return false;
    return pts.every((p) => {
      const r = (p.kind === 'anomaly' ? 7 : 4.5) + 3;
      return p.x + r < x0 || p.x - r > x1 || p.y + r < y0 || p.y - r > y1;
    });
  };
  const pos = candidates.find(fits) || candidates[0];
  return { ...pos, rect: rectOf(pos) };
}

// Cluster labels: above, below, right of or left of the cluster, whichever is free.
export function clusterLabels(pts, layout = 'wide') {
  const taken = [];
  return LAYOUTS[layout].clusters.map((cl, ci) => {
    const own = pts.filter((p) => p.kind === 'normal' && p.cluster === ci);
    const top = Math.min(...own.map((p) => p.y));
    const bottom = Math.max(...own.map((p) => p.y));
    const left = Math.min(...own.map((p) => p.x));
    const right = Math.max(...own.map((p) => p.x));
    const mx = own.reduce((a, p) => a + p.x, 0) / own.length;
    const my = own.reduce((a, p) => a + p.y, 0) / own.length;
    const pos = placeLabel(pts, cl.label, [
      { x: mx, y: top - 17, anchor: 'middle' },
      { x: mx, y: bottom + 30, anchor: 'middle' },
      { x: right + 16, y: my + 5, anchor: 'start' },
      { x: left - 16, y: my + 5, anchor: 'end' },
    ], layout, taken);
    taken.push(pos.rect);
    return { text: cl.label, x: pos.x, y: pos.y, anchor: pos.anchor };
  });
}

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

const KIND_TEXT = {
  normal: (s) =>
    `<b>Normal clip, score ${s}.</b> It belongs to a cluster of baseline clips. A clip in the middle of a cluster has very close neighbors and a low score; one at the edge scores higher.`,
  borderline: (s) =>
    `<b>Borderline clip, score ${s}.</b> It lies between clusters: closer to the baseline than an anomaly, but further than normal footage. Where the thresholds sit decides whether it becomes an incident.`,
  anomaly: (s) =>
    `<b>Anomalous clip, score ${s}.</b> Its three nearest baseline clips are far away, so its anomaly score is high. No label or training example of this anomaly was needed.`,
};

const DEFAULT =
  'Each dot is one clip, placed so that similar clips are close together. The anomaly score is the mean distance to the <b>3 nearest baseline clips</b>. Select a dot to see them. The positions and scores are synthetic: this is an illustration, not data.';

export function mount(node) {
  node.classList.add('qi-kn');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Example clip">',
    ['Normal clip', 'Borderline clip', 'Anomalous clip'].map((l, i) => `<button type="button" class="qi-chip qi-kn__ex" data-ex="${i}" aria-pressed="false">${l}</button>`).join(''),
    '    </div>',
    '    <span class="qi-hint">or select any dot</span>',
    '  </div>',
    '  <svg class="qi-svg qi-kn__svg" role="img" aria-label="Illustration of kNN anomaly scoring. Normal clips form three clusters, the baseline. Borderline clips lie between clusters and anomalous clips lie far from all of them. The anomaly score of a clip is the mean distance to its three nearest baseline clips. The positions and scores are synthetic."></svg>',
    '  <p class="qi-status qi-kn__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-kn__svg');
  const statusEl = node.querySelector('.qi-kn__status');
  const exBtns = [...node.querySelectorAll('.qi-kn__ex')];

  let layout = '';
  let pts = [];
  let examples = [];
  let dotEls = new Map();
  let lines = null;
  let sel = null;

  const colorOf = (p) => (p.kind === 'normal' ? `var(${LAYOUTS[layout].clusters[p.cluster].c})` : p.kind === 'borderline' ? 'var(--qi-muted)' : 'var(--qi-cat-4)');

  function build() {
    const L = LAYOUTS[layout];
    const wide = layout === 'wide';
    pts = makePoints(layout);
    sel = null;

    // Representative examples for the chips (keyboard and touch friendly): the
    // most typical normal clip, a borderline one, and the most distant anomaly.
    const normals = pts.filter((p) => p.kind === 'normal');
    examples = [
      normals.reduce((a, b) => (Math.abs(a.score - 0.25) < Math.abs(b.score - 0.25) ? a : b)),
      pts.filter((p) => p.kind === 'borderline').sort((a, b) => b.score - a.score)[3],
      pts.filter((p) => p.kind === 'anomaly').sort((a, b) => b.score - a.score)[0],
    ];

    svg.replaceChildren();
    svg.appendChild(el('rect', { class: 'qi-kn__plot', x: 0.5, y: 0.5, width: L.w - 1, height: L.plotH - 1, rx: 10 }));
    lines = el('g', { class: 'qi-kn__lines' });
    svg.appendChild(lines);
    dotEls = new Map();
    pts.forEach((p) => {
      const c = el('circle', { class: `qi-kn__dot qi-kn__dot--${p.kind}`, cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: p.kind === 'anomaly' ? 7 : 4.5, 'data-id': p.id, style: `fill:${colorOf(p)}` });
      dotEls.set(p.id, c);
      svg.appendChild(c);
    });
    clusterLabels(pts, layout).forEach((l) => svg.appendChild(el('text', { class: 'qi-label qi-kn__tag', x: l.x.toFixed(1), y: l.y.toFixed(1), 'text-anchor': l.anchor }, l.text)));

    // Legend: one row on wide screens, stacked rows on narrow ones.
    const items = [
      ['var(--qi-cat-1)', 'Normal clips (the baseline)'],
      ['var(--qi-muted)', 'Borderline'],
      ['var(--qi-cat-4)', 'Anomalous'],
    ];
    let height;
    if (wide) {
      [16, 270, 400].forEach((x, i) => {
        svg.appendChild(el('circle', { cx: x, cy: 378, r: 5, style: `fill:${items[i][0]}` }));
        svg.appendChild(el('text', { class: 'qi-label', x: x + 12, y: 383 }, items[i][1]));
      });
      svg.appendChild(el('text', { class: 'qi-label qi-kn__note', x: L.w, y: 383, 'text-anchor': 'end' }, 'illustrative'));
      height = 400;
    } else {
      items.forEach(([col, text], i) => {
        const y = L.plotH + 28 + i * 26;
        svg.appendChild(el('circle', { cx: 16, cy: y - 5, r: 5, style: `fill:${col}` }));
        svg.appendChild(el('text', { class: 'qi-label', x: 28, y }, text));
      });
      svg.appendChild(el('text', { class: 'qi-label qi-kn__note', x: L.w, y: L.plotH + 28, 'text-anchor': 'end' }, 'illustrative'));
      height = L.plotH + 28 + 2 * 26 + 12;
    }
    svg.setAttribute('viewBox', `0 0 ${L.w} ${height}`);
    svg.classList.toggle('is-narrow', !wide);
    render();
  }

  function render() {
    lines.replaceChildren();
    dotEls.forEach((c) => c.classList.remove('is-sel', 'is-near'));
    exBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(sel != null && examples[i] === sel)));
    if (!sel) {
      statusEl.innerHTML = DEFAULT;
      return;
    }
    sel.near.forEach((id) => {
      const q = pts[id];
      lines.appendChild(el('line', { class: 'qi-kn__link', x1: sel.x, y1: sel.y, x2: q.x, y2: q.y }));
      dotEls.get(id).classList.add('is-near');
    });
    dotEls.get(sel.id).classList.add('is-sel');
    statusEl.innerHTML = KIND_TEXT[sel.kind](sel.score.toFixed(1)) + ' <span class="qi-kn__units">(arbitrary units)</span>';
  }

  function relayout(force) {
    // Measure the container: the narrow drawing is capped in width, so its own
    // width could never grow back past the threshold.
    const fig = node.querySelector('.qi-fig');
    const w = fig && fig.clientWidth ? fig.clientWidth - 28 : WIDE_MIN;
    const next = w >= WIDE_MIN ? 'wide' : 'narrow';
    if (!force && next === layout) return;
    layout = next;
    build();
  }

  exBtns.forEach((b, i) =>
    b.addEventListener('click', () => {
      sel = sel === examples[i] ? null : examples[i];
      render();
    }),
  );
  svg.addEventListener('click', (e) => {
    const t = e.target.closest ? e.target.closest('[data-id]') : null;
    if (!t) return;
    const p = pts[Number(t.getAttribute('data-id'))];
    sel = sel === p ? null : p;
    render();
  });
  svg.addEventListener('pointerover', (e) => {
    const t = e.target.closest ? e.target.closest('[data-id]') : null;
    if (t) t.classList.add('is-hover');
  });
  svg.addEventListener('pointerout', (e) => {
    const t = e.target.closest ? e.target.closest('[data-id]') : null;
    if (t) t.classList.remove('is-hover');
  });

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => relayout(false)).observe(node);
  }

  relayout(true);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
