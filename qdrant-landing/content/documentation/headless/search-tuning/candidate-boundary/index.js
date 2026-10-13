/*
 * candidate-boundary island — theme-aware replacement for candidate-boundary.png.
 *
 * A collection of documents with two overlapping regions: what the dense
 * prefetch returned and what the sparse prefetch returned. Fusion only sees
 * their union; the pale documents outside both were never retrieved, so no
 * fusion method can rank them. Conceptual, not measured: dot positions are
 * seeded so the drawing is identical on every load.
 *
 * Wide: the original composition, labels inside the drawing and the
 * "candidate union" callout to the side. Narrow: a second SVG cropped to the
 * collection, with the labels moved into an HTML legend where they cannot
 * shrink with the viewBox.
 */

const WIDE_W = 860;
const NARROW_W = 636;
const VB_H = 336;
const FRAME = { x: 8, y: 8, w: 620, h: 320 };
const DENSE = { cx: 235, cy: 188, rx: 165, ry: 118 };
const SPARSE = { cx: 395, cy: 188, rx: 165, ry: 118 };
const COUNTS = { dense: 24, sparse: 24, both: 12, none: 36 };
const DOT_R = 5.5;

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Normalized distance from an ellipse's center: < 1 inside, > 1 outside.
const ell = (e, x, y) => Math.hypot((x - e.cx) / e.rx, (y - e.cy) / e.ry);

function classify(x, y) {
  const d = ell(DENSE, x, y);
  const s = ell(SPARSE, x, y);
  // Keep dots clear of the outlines so each one reads as inside or outside.
  if (Math.abs(d - 1) < 0.07 || Math.abs(s - 1) < 0.07) return null;
  if (d < 1 && s < 1) return 'both';
  if (d < 1) return 'dense';
  if (s < 1) return 'sparse';
  return 'none';
}

function scatter() {
  const rnd = mulberry32(20260930);
  const need = { ...COUNTS };
  const dots = [];
  for (let tries = 0; tries < 20000 && Object.values(need).some((n) => n > 0); tries++) {
    const x = FRAME.x + 18 + rnd() * (FRAME.w - 36);
    const y = FRAME.y + 58 + rnd() * (FRAME.h - 74);
    const kind = classify(x, y);
    if (!kind || need[kind] <= 0) continue;
    if (dots.some((p) => Math.hypot(p.x - x, p.y - y) < 17)) continue;
    need[kind]--;
    dots.push({ x, y, kind });
  }
  return dots;
}

function drawing(vbW, wide, dots) {
  const shapes = [
    `<rect class="qi-cb__frame" x="${FRAME.x}" y="${FRAME.y}" width="${FRAME.w}" height="${FRAME.h}" rx="8"/>`,
    `<ellipse class="qi-cb__region qi-cb__region--dense" cx="${DENSE.cx}" cy="${DENSE.cy}" rx="${DENSE.rx}" ry="${DENSE.ry}"/>`,
    `<ellipse class="qi-cb__region qi-cb__region--sparse" cx="${SPARSE.cx}" cy="${SPARSE.cy}" rx="${SPARSE.rx}" ry="${SPARSE.ry}"/>`,
    ...dots.map((p) => `<circle class="qi-cb__dot qi-cb__dot--${p.kind}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${DOT_R}"/>`),
  ];
  if (wide) {
    shapes.push(
      `<text class="qi-cb__label qi-cb__label--muted" x="26" y="36">collection</text>`,
      `<text class="qi-cb__label qi-cb__label--dense" x="${DENSE.cx - 40}" y="56" text-anchor="middle">dense prefetch</text>`,
      `<text class="qi-cb__label qi-cb__label--sparse" x="${SPARSE.cx + 40}" y="56" text-anchor="middle">sparse prefetch</text>`,
      `<path class="qi-cb__arrow" d="M660 ${SPARSE.cy} H${SPARSE.cx + SPARSE.rx + 8}" marker-end="url(#cb-arrow)"/>`,
      `<text class="qi-cb__label" x="668" y="${SPARSE.cy - 6}">candidate union</text>`,
      `<text class="qi-cb__label" x="668" y="${SPARSE.cy + 16}">passed to fusion</text>`,
    );
  }
  const n = (k) => dots.filter((p) => p.kind === k).length;
  const label =
    `A collection of ${dots.length} documents. The dense prefetch retrieved ${n('dense') + n('both')} and the sparse prefetch retrieved ${n('sparse') + n('both')}; ` +
    `${n('both')} were retrieved by both. Their union is passed to fusion. The other ${n('none')} were never retrieved, so fusion cannot rank them.`;
  return [
    `<svg class="qi-svg qi-cb__svg qi-cb__svg--${wide ? 'wide' : 'narrow'}" viewBox="0 0 ${vbW} ${VB_H}" role="img" aria-label="${label}">`,
    wide
      ? '<defs><marker id="cb-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="qi-cb__arrowhead"/></marker></defs>'
      : '',
    shapes.join(''),
    '</svg>',
  ].join('');
}

const LEGEND = [
  ['dense', 'dense prefetch'],
  ['sparse', 'sparse prefetch'],
  ['both', 'both prefetches'],
  ['none', 'never retrieved'],
];

export function mount(node) {
  node.classList.add('qi-cb');
  const dots = scatter();
  node.innerHTML = [
    '<div class="qi-fig qi-cb__fig">',
    drawing(WIDE_W, true, dots),
    drawing(NARROW_W, false, dots),
    '<ul class="qi-cb__legend" aria-hidden="true">',
    ...LEGEND.map(([k, t]) => `<li><span class="qi-cb__swatch qi-cb__dot--${k}"></span>${t}</li>`),
    '<li class="qi-cb__legend-note">Fusion receives only the union of both prefetches.</li>',
    '</ul>',
    '</div>',
  ].join('');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
