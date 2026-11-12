/*
 * linear-combination island — theme-aware replacement for linear-combination.png.
 *
 * Two scatterplots on identical axes: dense similarity against BM25 score for
 * the candidates of two queries. The dense scale stays in the same band for
 * both, but Query A's BM25 scores sit below 20 while Query B's spread from
 * about 20 to 80, so no single raw-score weight balances both queries.
 *
 * The points are illustrative, not measured: seeded so the drawing is the
 * same on every load, and generated to keep the property the figure shows.
 *
 * The panels are separate SVGs in a grid, so below ~780px of rendered width
 * they stack instead of shrinking side by side.
 */

const VB_W = 400;
const VB_H = 372;
const PLOT = { x0: 62, x1: 378, y0: 72, y1: 316 };
const DENSE = [0.6, 0.9];
const BM25 = [0, 80];

const QUERIES = [
  { title: 'Query A', n: 30, relevant: 11, bm25: [6, 15], seed: 7 },
  { title: 'Query B', n: 44, relevant: 13, bm25: [23, 77], seed: 11 },
];

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sx = (v) => PLOT.x0 + ((v - DENSE[0]) / (DENSE[1] - DENSE[0])) * (PLOT.x1 - PLOT.x0);
const sy = (v) => PLOT.y1 - ((v - BM25[0]) / (BM25[1] - BM25[0])) * (PLOT.y1 - PLOT.y0);

function points(q) {
  const rnd = mulberry32(q.seed);
  const out = [];
  for (let tries = 0; out.length < q.n && tries < 5000; tries++) {
    const d = 0.635 + rnd() * 0.21;
    const b = q.bm25[0] + rnd() * (q.bm25[1] - q.bm25[0]);
    if (out.some((p) => Math.hypot(sx(p.d) - sx(d), sy(p.b) - sy(b)) < 11)) continue;
    out.push({ d, b, relevant: out.length < q.relevant });
  }
  return out;
}

function axes() {
  const parts = [];
  for (let v = 0; v <= 80; v += 20) {
    const y = sy(v);
    parts.push(`<line class="qi-lc__grid" x1="${PLOT.x0}" y1="${y}" x2="${PLOT.x1}" y2="${y}"/>`);
    parts.push(`<text class="qi-lc__tick" x="${PLOT.x0 - 12}" y="${y}" text-anchor="end" dominant-baseline="central">${v}</text>`);
  }
  for (const v of [0.6, 0.7, 0.8, 0.9]) {
    const x = sx(v);
    parts.push(`<line class="qi-lc__grid" x1="${x}" y1="${PLOT.y0}" x2="${x}" y2="${PLOT.y1}"/>`);
    parts.push(`<text class="qi-lc__tick" x="${x}" y="${PLOT.y1 + 30}" text-anchor="middle">${v.toFixed(1)}</text>`);
  }
  parts.push(`<line class="qi-lc__axis" x1="${PLOT.x0}" y1="${PLOT.y1}" x2="${PLOT.x1}" y2="${PLOT.y1}"/>`);
  parts.push(`<line class="qi-lc__axis" x1="${PLOT.x0}" y1="${PLOT.y0}" x2="${PLOT.x0}" y2="${PLOT.y1}"/>`);
  parts.push(`<text class="qi-lc__axis-label" x="${PLOT.x0 - 4}" y="${PLOT.y0 - 16}">BM25 score</text>`);
  parts.push(`<text class="qi-lc__axis-label" x="${(PLOT.x0 + PLOT.x1) / 2}" y="${VB_H - 4}" text-anchor="middle">Dense similarity</text>`);
  return parts.join('');
}

function panel(q) {
  const pts = points(q);
  const bRange = pts.map((p) => p.b);
  const lo = Math.round(Math.min(...bRange));
  const hi = Math.round(Math.max(...bRange));
  const label = `${q.title}, illustrative candidates: dense similarity from 0.64 to 0.85, BM25 scores from ${lo} to ${hi}. ${q.relevant} of ${pts.length} candidates are relevant.`;
  return [
    '<div class="qi-lc__panel">',
    `<svg class="qi-svg qi-lc__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="${label}">`,
    `<text class="qi-lc__title" x="4" y="24">${q.title}</text>`,
    axes(),
    ...pts.map(
      (p) =>
        `<circle class="qi-lc__dot qi-lc__dot--${p.relevant ? 'rel' : 'non'}" cx="${sx(p.d).toFixed(1)}" cy="${sy(p.b).toFixed(1)}" r="5"/>`,
    ),
    '</svg>',
    '</div>',
  ].join('');
}

export function mount(node) {
  node.classList.add('qi-lc');
  node.innerHTML = [
    '<div class="qi-fig qi-lc__fig">',
    `<div class="qi-lc__panels">${QUERIES.map(panel).join('')}</div>`,
    '<ul class="qi-lc__legend" aria-hidden="true">',
    '<li><span class="qi-lc__swatch qi-lc__dot--non"></span>non-relevant</li>',
    '<li><span class="qi-lc__swatch qi-lc__dot--rel"></span>relevant</li>',
    '</ul>',
    '</div>',
  ].join('');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
